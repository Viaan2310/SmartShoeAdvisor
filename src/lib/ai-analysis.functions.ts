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

const AiFootSchema = z.object({
  footType: z.enum(['normal_arch', 'high_arch', 'flat_foot', 'overpronation', 'supination']),
  archHeightPercent: z.number(),
  pronation: z.string(),
  imageQuality: z.number(),
  confidence: z.number(),
  widthCategory: z.enum(['narrow', 'medium', 'wide']),
  reasoning: z.string(),
});

export type AiFootAnalysis = z.infer<typeof AiFootSchema>;

export const analyzeFootWithAI = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AiFootAnalysis | null> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return null;

    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway('openai/gpt-5.6-sol');

    const manualLine = data.manual
      ? `The user calibrated the ruler by hand: foot length = ${data.manual.footLengthCm.toFixed(1)} cm, foot width = ${data.manual.footWidthCm.toFixed(1)} cm. Treat these as ground truth for size.`
      : 'No manual calibration provided; estimate visually.';

    const systemPrompt = `You are a certified podiatrist AI assessing a user's foot from two photographs (top view and side view) for shoe fitting.
Return ONLY structured JSON matching the provided schema.

Definitions:
- footType: one of normal_arch, high_arch, flat_foot, overpronation, supination.
  * flat_foot: no visible arch, full sole contact.
  * overpronation: foot rolls inward, low arch, wide midfoot.
  * normal_arch: balanced medial arch.
  * high_arch: pronounced arch gap on side view.
  * supination: foot rolls outward, very high arch, narrow contact.
- archHeightPercent: 0 (fully flat) to 100 (very high arch), estimated from the side view gap under the midfoot.
- pronation: one short phrase (e.g. "Neutral", "Slight inward roll", "Excessive inward roll", "Outward roll (underpronation)").
- imageQuality: 0-100 based on lighting, focus, foot visibility.
- confidence: 0-100 of your overall classification.
- widthCategory: narrow / medium / wide relative to typical adult feet.
- reasoning: 1-2 short sentences citing what you see (e.g. arch gap, toe splay, heel width).

Be decisive. If images are poor, still make your best call and lower confidence/imageQuality accordingly.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: AiFootSchema }),
        providerOptions: { lovable: { reasoningEffort: 'none' } },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Activity intent: ${data.activity}. ${manualLine}\nAnalyze both images and return the JSON.`,
              },
              { type: 'image', image: data.topImage },
              { type: 'image', image: data.sideImage },
            ],
          },
        ],
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return null;
      }
      console.error('AI foot analysis failed:', error);
      return null;
    }
  });
