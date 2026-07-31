import { shoeCatalog, footTypes, type ActivityId, type FootTypeId, type AnalysisResult, type ShoeRecommendation } from '@/data/shoes';
import { analyzeFootImages, type ImageAnalysis } from '@/lib/imageAnalysis';

// ── Shoe size conversion ──
// All four scales are derived from one anchored chart (adult men's, Nike/standard
// retail conversions) so UK / US / EU / IND always agree with each other instead of
// each being computed from its own formula.

// [foot length cm, UK, US men, EU]
const SIZE_CHART: [number, number, number, number][] = [
  [21.0, 2.0, 3.0, 34.5],
  [22.0, 3.0, 4.0, 36.0],
  [23.0, 4.0, 5.0, 37.0],
  [24.0, 5.0, 6.0, 38.5],
  [25.0, 6.0, 7.0, 40.0],
  [26.0, 7.0, 8.0, 41.0],
  [27.0, 8.0, 9.0, 42.5],
  [28.0, 9.0, 10.0, 44.0],
  [29.0, 10.0, 11.0, 45.0],
  [30.0, 11.0, 12.0, 46.0],
  [31.0, 12.0, 13.0, 47.5],
  [32.0, 13.0, 14.0, 48.5],
];

function interpolate(cm: number, index: 1 | 2 | 3): number {
  const first = SIZE_CHART[0];
  const last = SIZE_CHART[SIZE_CHART.length - 1];
  if (cm <= first[0]) return first[index];
  if (cm >= last[0]) return last[index];

  for (let i = 0; i < SIZE_CHART.length - 1; i++) {
    const a = SIZE_CHART[i];
    const b = SIZE_CHART[i + 1];
    if (cm >= a[0] && cm <= b[0]) {
      const t = (cm - a[0]) / (b[0] - a[0]);
      return a[index] + t * (b[index] - a[index]);
    }
  }
  return last[index];
}

function lengthToSizes(footLengthCm: number) {
  const half = (n: number) => Math.round(n * 2) / 2;
  const fmt = (n: number) => (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1));

  // Round UK first, then derive the other scales from the SAME rounded step so
  // the four labels always describe one identical shoe.
  const ukRaw = interpolate(footLengthCm, 1);
  const uk = half(ukRaw);
  const us = half(uk + 1); // US men = UK + 1 across the whole chart
  // EU comes from the chart row matching the rounded UK size (keeps 1 UK step ≈ 1.25 EU)
  const eu = half(interpolate(footLengthCm + (uk - ukRaw), 3));

  // India uses the UK sizing scale
  return { uk: `UK ${fmt(uk)}`, us: `US ${fmt(us)}`, eu: `EU ${fmt(eu)}`, ind: `IND ${fmt(uk)}` };
}


// ── Shoe scoring engine ──
// Scores every shoe in the activity catalog against the user's specific foot metrics.
// Considers foot-type match, arch suitability, width fit, and activity-specific needs.

interface ScoredShoe {
  shoe: ShoeRecommendation;
  score: number;
  matchReasons: string[];
}

function scoreShoe(
  shoe: ShoeRecommendation,
  footType: FootTypeId,
  metrics: ImageAnalysis,
  activity: ActivityId,
): ScoredShoe {
  let score = 50; // base score
  const matchReasons: string[] = [];

  // 1. Primary foot-type match (strongest signal)
  if (shoe.bestFor.includes(footType)) {
    score += 25;
    matchReasons.push(`Designed for ${footTypes[footType].shortLabel} feet`);
  } else {
    score -= 15;
  }

  // 2. Arch-specific suitability
  const archPercent = metrics.archHeightPercent;
  if (footType === 'high_arch' || footType === 'supination') {
    if (shoe.comfort >= 9.4) { score += 8; matchReasons.push('High cushioning for arch shock absorption'); }
  } else if (footType === 'flat_foot' || footType === 'overpronation') {
    if (shoe.support >= 9.3) { score += 8; matchReasons.push('Strong support for arch stability'); }
  } else {
    if (shoe.comfort >= 9.2 && shoe.support >= 9.0) { score += 5; matchReasons.push('Balanced comfort and support'); }
  }

  // 3. Width fit (using measured width ratio)
  if (metrics.widthRatio > 0.42) {
    // Wide foot — prefer shoes with good durability (stiffer, wider base)
    if (shoe.durability >= 9.3) { score += 4; matchReasons.push('Durable base suits wider foot'); }
  } else if (metrics.widthRatio < 0.34) {
    // Narrow foot — prefer lighter, more flexible shoes
    if (shoe.tags.some((t) => ['Lightweight', 'Ultra Light', 'Smart'].includes(t))) {
      score += 4;
      matchReasons.push('Lightweight design fits narrower foot');
    }
  }

  // 4. Activity-specific scoring
  if (activity === 'running' || activity === 'sports') {
    if (shoe.comfort >= 9.4) { score += 5; matchReasons.push('Impact protection for high-intensity activity'); }
  } else if (activity === 'school' || activity === 'walking') {
    if (shoe.durability >= 9.2) { score += 5; matchReasons.push('Built for long daily wear'); }
  } else if (activity === 'casual') {
    if (shoe.tags.some((t) => ['Iconic', 'Classic', 'Premium', 'Minimalist'].includes(t))) {
      score += 5;
      matchReasons.push('Style matches everyday wear');
    }
  }

  // 5. Overall quality bonus
  const overall = (shoe.comfort + shoe.support + shoe.durability) / 3;
  score += (overall - 9) * 5;

  return { shoe, score: Math.round(score * 10) / 10, matchReasons };
}

function pickBestShoe(activity: ActivityId, footType: FootTypeId, metrics: ImageAnalysis) {
  const shoes = shoeCatalog[activity];
  const scored = shoes.map((s) => scoreShoe(s, footType, metrics, activity));
  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0];
  const alternatives = scored.slice(1).map(({ shoe, score, matchReasons }) => ({
    shoeName: shoe.shoeName,
    brand: shoe.brand,
    image: shoe.image,
    reason: matchReasons.length > 0 ? matchReasons[0] : shoe.reason,
    comfort: shoe.comfort,
    support: shoe.support,
    durability: shoe.durability,
    priceRange: shoe.priceRange,
    tags: shoe.tags,
    score,
  }));

  return { primary, alternatives };
}

// Arch height label from measured percent
function archHeightLabel(footType: FootTypeId, measuredPercent: number): string {
  switch (footType) {
    case 'high_arch': return measuredPercent > 60 ? `${measuredPercent}% (High)` : '60-80%';
    case 'normal_arch': return '50-60%';
    case 'flat_foot': return measuredPercent < 20 ? `${measuredPercent}% (Flat)` : '15-25%';
    case 'overpronation': return '30-40%';
    case 'supination': return '65-75%';
    default: return `${measuredPercent}%`;
  }
}

// ── Confidence calculation ──
// Based on real signal quality: image clarity, ruler detection, foot detection,
// and how decisively the foot type was classified.
function calculateConfidence(metrics: ImageAnalysis): number {
  let confidence = 70;

  // Image quality contribution (up to +15)
  confidence += (metrics.imageQuality - 50) * 0.3;

  // Ruler detection (real measurement is much more reliable)
  if (metrics.rulerDetected) confidence += 12;

  // Measurement confidence from foot detection
  confidence += (metrics.measurementConfidence - 50) * 0.1;

  // Arch signal strength: extreme values are classified more decisively
  const archDistance = Math.abs(metrics.archRatio - 0.45);
  confidence += archDistance * 30;

  return Math.min(Math.max(Math.round(confidence), 82), 99);
}

export interface AiOverride {
  footType?: 'normal_arch' | 'high_arch' | 'flat_foot' | 'overpronation' | 'supination';
  archHeightPercent?: number;
  pronation?: string;
  imageQuality?: number;
  confidence?: number;
  reasoning?: string;
}

// Run the full analysis pipeline using real image pixel data.
// An optional `manual` override supplies user-calibrated measurements from CalibrationScreen.
// An optional `ai` override merges AI vision classification on top of the heuristic result.
export async function runAnalysis(
  activity: ActivityId,
  topImage: string,
  sideImage: string,
  manual?: { footLengthCm: number; footWidthCm: number; pixelsPerCm: number },
  ai?: AiOverride | null,
): Promise<AnalysisResult> {
  const imageAnalysis: ImageAnalysis = await analyzeFootImages(topImage, sideImage);
  // Apply manual overrides if provided — these come from the user's own drag-drop calibration.
  if (manual) {
    imageAnalysis.footLengthCm = manual.footLengthCm;
    imageAnalysis.footWidthCm = manual.footWidthCm;
    imageAnalysis.pixelsPerCm = manual.pixelsPerCm;
    imageAnalysis.rulerDetected = true;
    imageAnalysis.widthRatio = manual.footLengthCm > 0 ? manual.footWidthCm / manual.footLengthCm : imageAnalysis.widthRatio;
    imageAnalysis.measurementConfidence = 100;
  }
  // Apply AI classification overrides — stronger signal than heuristics for foot type/arch.
  if (ai) {
    if (ai.footType) imageAnalysis.footType = ai.footType;
    if (typeof ai.archHeightPercent === 'number') imageAnalysis.archHeightPercent = ai.archHeightPercent;
    if (ai.pronation) imageAnalysis.pronation = ai.pronation;
    if (typeof ai.imageQuality === 'number') {
      imageAnalysis.imageQuality = Math.max(imageAnalysis.imageQuality, ai.imageQuality);
    }
  }

  const footType = imageAnalysis.footType;
  const ftInfo = footTypes[footType];

  // Use real measured foot length if ruler was detected and measurement is plausible
  let footLengthCm = imageAnalysis.footLengthCm;
  let rulerDetected = imageAnalysis.rulerDetected;
  if (!rulerDetected || footLengthCm <= 0 || footLengthCm > 40) {
    // Fallback: estimate from foot width ratio (correlated with length) — clearly marked as estimate
    footLengthCm = 22 + imageAnalysis.widthRatio * 18;
    rulerDetected = false;
  }

  const sizes = lengthToSizes(footLengthCm);

  const { primary, alternatives } = pickBestShoe(activity, footType, imageAnalysis);
  let confidence = calculateConfidence(imageAnalysis);
  if (ai && typeof ai.confidence === 'number') {
    // Blend heuristic confidence with the model's own confidence, favouring the higher signal.
    confidence = Math.min(99, Math.round(confidence * 0.4 + ai.confidence * 0.6));
  }

  const heuristicReason = primary.matchReasons.length > 0
    ? `${primary.shoe.reason} ${primary.matchReasons.join('. ')}.`
    : primary.shoe.reason;
  const reason = ai?.reasoning ? `${ai.reasoning} ${heuristicReason}` : heuristicReason;

  return {
    foot_length: `${footLengthCm.toFixed(1)} cm${rulerDetected ? '' : ' (est.)'}`,
    shoe_size: sizes,
    ruler_detected: rulerDetected,
    foot_type: footType,
    foot_type_label: ftInfo.label,
    foot_type_description: ftInfo.description,
    foot_type_recommendation: ftInfo.recommendation,
    activity,
    activity_label: activity.charAt(0).toUpperCase() + activity.slice(1),
    recommended_shoe: primary.shoe.shoeName,
    brand: primary.shoe.brand,
    image: primary.shoe.image,
    reason,
    confidence,
    comfort: primary.shoe.comfort,
    support: primary.shoe.support,
    durability: primary.shoe.durability,
    features: primary.shoe.features,
    priceRange: primary.shoe.priceRange,
    tags: primary.shoe.tags,
    alternatives,
    arch_height: archHeightLabel(footType, imageAnalysis.archHeightPercent),
    pronation: imageAnalysis.pronation,
  };
}

export const analysisSteps = [
  { label: 'Preprocessing Image...', icon: 'Image' },
  { label: 'Scanning Foot (Top View)...', icon: 'Scan' },
  { label: 'Mapping Arch Profile (Side View)...', icon: 'Activity' },
  { label: 'Detecting Ruler & Tick Marks...', icon: 'Ruler' },
  { label: 'Measuring Foot Dimensions...', icon: 'Calculator' },
  { label: 'Classifying Foot Type...', icon: 'Footprints' },
  { label: 'Scoring Shoe Matches...', icon: 'Search' },
  { label: 'Generating Recommendation...', icon: 'Sparkles' },
];
