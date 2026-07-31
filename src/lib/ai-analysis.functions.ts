import { createServerFn } from '@tanstack/react-start';
import { generateText, Output, NoObjectGeneratedError } from 'ai';
import { z } from 'zod';
import { createLovableAiGatewayProvider } from './ai-gateway.server';

const InputSchema = z.object({
  activity: z.string(),
  topImage: z.string().min(20), // data URL
  sideImage: z.string().min(20),
  manual: z
    .object({
      footLengthCm: z.number(),
      footWidthCm: z.number(),
    })
    .nullable(),
});

const FootTypeEnum = z.enum(['normal_arch', 'high_arch', 'flat_foot', 'overpronation', 'supination']);

const AiFootSchema = z.object({
  footType: FootTypeEnum,
  archHeightPercent: z.number(),
  archIndex: z.number(),
  pronation: z.string(),
  pronationDegree: z.enum(['neutral', 'mild_over', 'severe_over', 'mild_under', 'severe_under']),
  imageQuality: z.number(),
  confidence: z.number(),
  widthCategory: z.enum(['narrow', 'medium', 'wide']),
  toeShape: z.enum(['egyptian', 'greek', 'roman', 'unclear']),
  observations: z.array(z.string()),
  reasoning: z.string(),
});

export type AiFootAnalysis = z.infer<typeof AiFootSchema>;

const SYSTEM_PROMPT = `You are a podiatry-grade foot-morphology classifier. You receive two photographs of ONE foot: a TOP (dorsal/plantar-facing) view and a SIDE (medial) view. Classify the foot for footwear fitting and return ONLY JSON matching the schema.

BASE RATES — respect them. In the general adult population roughly:
- 60% normal_arch, 15% overpronation, 12% high_arch, 8% flat_foot, 5% supination.
"flat_foot" (pes planus) is UNCOMMON and clinically specific. Do NOT default to it. A photo that is
dim, shadowed, low-angle, or taken with the foot partly occluded is NOT evidence of a flat foot — it is
evidence of a poor photo. When the arch is not clearly visible, answer normal_arch with lower confidence.

STEP 1 — Read the side view (medial arch):
- Locate the heel pad, the medial arch gap and the ball of the foot.
- Measure the arch gap RELATIVE to the ground contact line under the heel and the ball, not against the
  background. Shadow under the arch still counts as a gap.
- Bands (gap apex height as a fraction of foot height at the ankle):
  * no visible gap, midfoot skin/sole in contact with the surface across its whole length -> flat
  * shallow but continuous gap -> low-normal
  * clear, well-defined curve -> normal
  * tall gap, midfoot lifted well off the surface -> high
- Estimate the navicular (highest arch point) height relative to heel height.

STEP 2 — Read the top view (midfoot width / footprint):
- Compare midfoot width to forefoot (ball) width. This is the arch index proxy:
  archIndex = midfoot width / forefoot width, roughly 0.00–1.00.
  * archIndex > 0.34 -> flat / collapsed arch
  * 0.22–0.34 -> normal
  * < 0.22 -> high arch / cavus
- Note toe splay, hallux (big toe) angle, forefoot spread, heel width.

STEP 3 — Alignment (pronation):
- Look at the heel/Achilles line in the side view and the medial bulge in the top view.
- Inward collapse of the ankle + medial bulge -> overpronation.
- Outward tilt + weight on the lateral edge + narrow midfoot -> supination.

STEP 4 — Reconcile before classifying. BOTH views must support the call:
- flat_foot: REQUIRES archHeightPercent <= 20 AND archIndex >= 0.34 AND you can state, in observations,
  that the midfoot visibly touches the ground in the side view. If any one of these is missing, do NOT
  return flat_foot — return overpronation (if inward roll is visible) or normal_arch.
- overpronation: low-to-moderate arch PLUS visible inward ankle/heel roll or medial bulge.
- normal_arch: archHeightPercent 21–62 and archIndex 0.22–0.34. This is the default when evidence is mixed.
- high_arch: archHeightPercent >= 63 AND archIndex <= 0.21, heel/ankle roughly vertical.
- supination: high arch PLUS outward roll / lateral weight bearing.
If the two views disagree, trust the SIDE view for arch height and the TOP view for width, then lower confidence.

FIELD RULES:
- archHeightPercent: 0 (fully flat) to 100 (extreme cavus). Must be numerically consistent with footType per the bands above. Only use values below 15 for a genuinely collapsed arch.
- archIndex: the midfoot/forefoot width ratio you measured (0–1, two decimals).
- pronation: one short phrase, e.g. "Neutral", "Mild inward roll", "Excessive inward roll", "Outward roll (underpronation)".
- pronationDegree: neutral | mild_over | severe_over | mild_under | severe_under, matching the phrase.
- imageQuality: 0–100 (lighting, focus, whether the whole foot and the arch are visible).
- confidence: 0–100. Be honest: below 60 when a view is cropped, blurry, angled or the arch is hidden.
- widthCategory: narrow | medium | wide, using width/length ratio (<0.36 narrow, 0.36–0.41 medium, >0.41 wide).
- toeShape: egyptian (big toe longest), greek (2nd toe longest), roman (first three even), unclear.
- observations: 2–4 short factual visual notes, each citing something you actually see. If you return flat_foot, one observation MUST describe the midfoot ground contact.
- reasoning: 1–2 sentences tying the side-view arch and the top-view width to the final class.

Be decisive and quantitative, but never let a bad photo become a flat-foot diagnosis.`;


const RANK: Record<z.infer<typeof FootTypeEnum>, number> = {
  flat_foot: 0,
  overpronation: 1,
  normal_arch: 2,
  high_arch: 3,
  supination: 4,
};

// Reconcile two independent passes into one answer.
function reconcile(a: AiFootAnalysis, b: AiFootAnalysis): AiFootAnalysis {
  const agree = a.footType === b.footType;
  const primary = a.confidence >= b.confidence ? a : b;
  const other = primary === a ? b : a;

  if (agree) {
    return {
      ...primary,
      archHeightPercent: Math.round((a.archHeightPercent + b.archHeightPercent) / 2),
      archIndex: Number(((a.archIndex + b.archIndex) / 2).toFixed(2)),
      imageQuality: Math.round((a.imageQuality + b.imageQuality) / 2),
      // Agreement across independent passes justifies a modest confidence boost.
      confidence: Math.min(99, Math.round((a.confidence + b.confidence) / 2) + 8),
      observations: Array.from(new Set([...a.observations, ...b.observations])).slice(0, 4),
    };
  }

  // Disagreement: keep the more confident class, but damp confidence.
  // Adjacent classes (e.g. flat_foot vs overpronation) are a smaller disagreement than opposite ends.
  const distance = Math.abs(RANK[a.footType] - RANK[b.footType]);
  const penalty = distance <= 1 ? 12 : 25;
  return {
    ...primary,
    archHeightPercent: Math.round((a.archHeightPercent + b.archHeightPercent) / 2),
    archIndex: Number(((a.archIndex + b.archIndex) / 2).toFixed(2)),
    imageQuality: Math.min(a.imageQuality, b.imageQuality),
    confidence: Math.max(35, primary.confidence - penalty),
    reasoning: `${primary.reasoning} (Second pass suggested ${other.footType.replace('_', ' ')}; confidence reduced.)`,
    observations: primary.observations.slice(0, 4),
  };
}

// Enforce the rubric server-side so a model that reflexively answers "flat_foot"
// still has to produce measurements that support it.
function enforceConsistency(r: AiFootAnalysis): AiFootAnalysis {
  const out = { ...r };

  if (out.footType === 'flat_foot') {
    const supported = out.archHeightPercent <= 20 && out.archIndex >= 0.34;
    const lowQuality = out.imageQuality < 55 || out.confidence < 55;
    if (!supported || lowQuality) {
      const rolls = out.pronationDegree === 'mild_over' || out.pronationDegree === 'severe_over';
      out.footType = rolls ? 'overpronation' : 'normal_arch';
      out.archHeightPercent = Math.max(out.archHeightPercent, rolls ? 30 : 45);
      out.pronation = rolls ? 'Excessive inward roll' : 'Balanced neutral roll';
      out.reasoning = `${out.reasoning} Arch measurements did not meet the collapsed-arch threshold, so the classification was reduced to ${out.footType.replace('_', ' ')}.`;
      out.confidence = Math.max(35, out.confidence - 8);
    }
  }

  // Keep the reported arch percentage inside the band of the final class.
  const bands: Record<AiFootAnalysis['footType'], [number, number]> = {
    flat_foot: [0, 20],
    overpronation: [21, 45],
    normal_arch: [40, 62],
    high_arch: [63, 85],
    supination: [65, 95],
  };
  const [lo, hi] = bands[out.footType];
  out.archHeightPercent = Math.min(hi, Math.max(lo, Math.round(out.archHeightPercent)));

  return out;
}


export const analyzeFootWithAI = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AiFootAnalysis | null> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return null;

    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway('openai/gpt-5.6-sol');

    const manualLine = data.manual
      ? `Verified manual calibration: foot length = ${data.manual.footLengthCm.toFixed(1)} cm, foot width = ${data.manual.footWidthCm.toFixed(
          1,
        )} cm (width/length ratio ${(data.manual.footWidthCm / Math.max(1, data.manual.footLengthCm)).toFixed(
          2,
        )}). Treat these as ground truth for size and widthCategory.`
      : 'No manual calibration provided; estimate width category visually from the top view.';

    const runPass = async (temperature: number) => {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: AiFootSchema }),
        temperature,
        providerOptions: { lovable: { reasoningEffort: 'medium' } },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Activity intent: ${data.activity}. ${manualLine}\nImage 1 = TOP view. Image 2 = SIDE view.\nWork through steps 1–4 internally, then return the JSON.`,
              },
              { type: 'image', image: data.topImage },
              { type: 'image', image: data.sideImage },
            ],
          },
        ],
      });
      return output;
    };

    try {
      // Two independent passes → self-consistency check, which markedly reduces
      // borderline flat_foot / overpronation and high_arch / supination mistakes.
      const [first, second] = await Promise.allSettled([runPass(0.1), runPass(0.6)]);
      const a = first.status === 'fulfilled' ? first.value : null;
      const b = second.status === 'fulfilled' ? second.value : null;
      if (a && b) return reconcile(a, b);
      return a ?? b;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return null;
      }
      console.error('AI foot analysis failed:', error);
      return null;
    }
  });
