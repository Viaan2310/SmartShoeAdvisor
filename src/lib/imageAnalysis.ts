// Advanced canvas-based image analysis for foot type classification and size measurement.
// Examines actual pixel data from top-down and side-on foot photos with multi-feature scoring.

interface ImageAnalysis {
  archRatio: number;       // 0 = flat, 1 = very high arch
  widthRatio: number;      // foot width relative to foot length
  darknessRatio: number;   // how much of the foot is dark
  brightness: number;      // average brightness of foot region
  footType: 'normal_arch' | 'high_arch' | 'flat_foot' | 'overpronation' | 'supination';
  archHeightPercent: number;
  pronation: string;
  footLengthCm: number;    // measured foot length in cm (real, from ruler)
  footWidthCm: number;     // measured foot width at ball in cm
  rulerDetected: boolean;
  pixelsPerCm: number;
  imageQuality: number;    // 0-100, confidence in the image itself
  heelWidthRatio: number;  // heel width / ball width (shape indicator)
  toeShapeRatio: number;   // toe region shape (0 = pointed, 1 = square)
  measurementConfidence: number; // 0-100, how reliable the length measurement is
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function getImageData(img: HTMLImageElement, maxWidth = 500): ImageData {
  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

type RGB = { r: number; g: number; b: number };

function pixelAt(data: ImageData, x: number, y: number): RGB {
  const i = (y * data.width + x) * 4;
  return { r: data.data[i], g: data.data[i + 1], b: data.data[i + 2] };
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function brightness(px: RGB): number {
  return (px.r * 0.299 + px.g * 0.587 + px.b * 0.114);
}

// Estimate background color using a border ring + corner sampling with outlier rejection
function detectBackgroundColor(data: ImageData): RGB {
  const { width, height } = data;
  const samples: RGB[] = [];
  const margin = Math.max(2, Math.floor(Math.min(width, height) * 0.05));

  for (let x = margin; x < width - margin; x += Math.max(1, Math.floor((width - 2 * margin) / 40))) {
    samples.push(pixelAt(data, x, margin));
    samples.push(pixelAt(data, x, height - margin - 1));
  }
  for (let y = margin; y < height - margin; y += Math.max(1, Math.floor((height - 2 * margin) / 40))) {
    samples.push(pixelAt(data, margin, y));
    samples.push(pixelAt(data, width - margin - 1, y));
  }

  // Compute mean, then keep only samples close to the mean (rejects outliers like the foot touching an edge)
  const mean: RGB = samples.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
    { r: 0, g: 0, b: 0 },
  );
  const avg: RGB = { r: mean.r / samples.length, g: mean.g / samples.length, b: mean.b / samples.length };

  const close = samples.filter((c) => colorDistance(c, avg) < 60);
  const base = close.length > 0 ? close : samples;
  const sum = base.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
    { r: 0, g: 0, b: 0 },
  );
  return { r: sum.r / base.length, g: sum.g / base.length, b: sum.b / base.length };
}

interface Component {
  pixels: number;
  minX: number; maxX: number;
  minY: number; maxY: number;
  centroidX: number; centroidY: number;
  fillRatio: number;
}

// Connected components via iterative flood fill (stack-based, avoids queue shift overhead)
function findConnectedComponents(data: ImageData, bgColor: RGB, threshold = 45): Component[] {
  const { data: pixels, width, height } = data;
  const visited = new Uint8Array(width * height);
  const components: Component[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      const i = idx * 4;
      const px: RGB = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
      if (colorDistance(px, bgColor) < threshold) {
        visited[idx] = 1;
        continue;
      }

      const stack: number[] = [idx];
      visited[idx] = 1;
      let count = 0;
      let minX = x, maxX = x, minY = y, maxY = y;
      let sumX = 0, sumY = 0;

      while (stack.length > 0) {
        const cur = stack.pop()!;
        const cx = cur % width;
        const cy = Math.floor(cur / width);
        count++;
        sumX += cx;
        sumY += cy;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          cx > 0 ? cur - 1 : -1,
          cx < width - 1 ? cur + 1 : -1,
          cy > 0 ? cur - width : -1,
          cy < height - 1 ? cur + width : -1,
        ];
        for (const n of neighbors) {
          if (n < 0 || visited[n]) continue;
          const ni = n * 4;
          const npx: RGB = { r: pixels[ni], g: pixels[ni + 1], b: pixels[ni + 2] };
          if (colorDistance(npx, bgColor) >= threshold) {
            visited[n] = 1;
            stack.push(n);
          } else {
            visited[n] = 1;
          }
        }
      }

      if (count > 30) {
        const bbW = maxX - minX + 1;
        const bbH = maxY - minY + 1;
        components.push({
          pixels: count,
          minX, maxX, minY, maxY,
          centroidX: sumX / count,
          centroidY: sumY / count,
          fillRatio: count / (bbW * bbH),
        });
      }
    }
  }

  return components;
}

// Measure the foreground width at a given position along the long axis.
// Returns the count of non-background pixels in that cross-section.
function measureCrossSection(data: ImageData, bgColor: RGB, pos: number, isHorizontal: boolean): number {
  const { data: pixels, width, height } = data;
  let count = 0;

  if (isHorizontal) {
    const y = pos;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const px: RGB = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
      if (colorDistance(px, bgColor) > 45) count++;
    }
  } else {
    const x = pos;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4;
      const px: RGB = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
      if (colorDistance(px, bgColor) > 45) count++;
    }
  }

  return count;
}

// Isolate just the foot from a component that may include the leg/ankle.
// Scans the width profile along the long axis and finds the ankle (narrowest point
// where the leg connects to the foot), then trims the bounding box to exclude the leg.
function isolateFoot(data: ImageData, comp: Component, bgColor: RGB): Component {
  const isHorizontal = (comp.maxX - comp.minX) > (comp.maxY - comp.minY);
  const start = isHorizontal ? comp.minX : comp.minY;
  const end = isHorizontal ? comp.maxX : comp.maxY;
  const length = end - start;

  if (length < 20) return comp;

  // Sample width at regular intervals along the long axis
  const numSamples = Math.min(length, 40);
  const step = length / numSamples;
  const widths: { pos: number; width: number }[] = [];

  for (let s = 0; s < numSamples; s++) {
    const pos = Math.round(start + s * step);
    const w = measureCrossSection(data, bgColor, pos, isHorizontal);
    widths.push({ pos, width: w });
  }

  // Find the widest cross-section (the ball of the foot)
  const maxW = Math.max(...widths.map((w) => w.width));
  if (maxW < 5) return comp;

  // The ankle is where the leg narrows significantly relative to the ball.
  // Scan from each end toward the center to find which end is the leg.
  // The leg end has a narrow region (ankle) between the foot and the edge.
  const ankleThreshold = maxW * 0.45;

  // Check from the start end: find the first position where width exceeds ankleThreshold
  // (entering the foot from the leg side)
  let legStart = -1;
  for (let i = 0; i < widths.length; i++) {
    if (widths[i].width > ankleThreshold) {
      legStart = i;
      break;
    }
  }

  // Check from the end: find the last position where width exceeds ankleThreshold
  let legEnd = -1;
  for (let i = widths.length - 1; i >= 0; i--) {
    if (widths[i].width > ankleThreshold) {
      legEnd = i;
      break;
    }
  }

  // Determine which end has the leg by comparing how much narrow region is on each side
  let trimStart = start;
  let trimEnd = end;

  if (legStart > 2 && legStart < widths.length - 2) {
    // There's a narrow region at the start — leg is on the start side
    trimStart = widths[legStart].pos;
  }
  if (legEnd > 2 && legEnd < widths.length - 2) {
    // There's a narrow region at the end — leg is on the end side
    trimEnd = widths[legEnd].pos;
  }

  // If we trimmed, update the bounding box
  if (trimStart > start || trimEnd < end) {
    if (isHorizontal) {
      return {
        ...comp,
        minX: trimStart,
        maxX: trimEnd,
      };
    } else {
      return {
        ...comp,
        minY: trimStart,
        maxY: trimEnd,
      };
    }
  }

  return comp;
}

// Measure foot dimensions using the whole photo as a 30 cm scale reference.
// The user places their foot on a 30 cm ruler/sheet, so the full image length equals 30 cm.
function measureFoot(data: ImageData): {
  lengthCm: number;
  widthCm: number;
  rulerDetected: boolean;
  pixelsPerCm: number;
  footComponent: Component | null;
} {
  const bgColor = detectBackgroundColor(data);
  const components = findConnectedComponents(data, bgColor);
  const sorted = [...components].sort((a, b) => b.pixels - a.pixels);
  const raw = sorted[0] ?? null;

  if (!raw) {
    return { lengthCm: 0, widthCm: 0, rulerDetected: false, pixelsPerCm: 0, footComponent: null };
  }

  // Trim the leg/ankle so only the foot is measured
  const foot = isolateFoot(data, raw, bgColor);

  const footW = foot.maxX - foot.minX;
  const footH = foot.maxY - foot.minY;

  // Determine orientation: foot length is the longer axis, width is the shorter
  const footLengthPx = Math.max(footW, footH);
  const footWidthPx = Math.min(footW, footH);

  // The entire photo length represents 30 cm.
  const photoLengthPx = Math.max(data.width, data.height);
  const pixelsPerCm = photoLengthPx / 30;

  return {
    lengthCm: footLengthPx / pixelsPerCm,
    widthCm: footWidthPx / pixelsPerCm,
    rulerDetected: true,
    pixelsPerCm,
    footComponent: foot,
  };
}

// Find foreground (foot) pixels and their bounding box with adaptive thresholding.
function findFootBounds(data: ImageData) {
  const { data: pixels, width, height } = data;
  const bgColor = detectBackgroundColor(data);
  const bgBrightness = brightness(bgColor);

  let minX = width, maxX = 0, minY = height, maxY = 0;
  let footPixelCount = 0;
  let totalBrightness = 0;

  // Adaptive threshold: foot differs from background by at least 40 brightness levels
  const threshold = bgBrightness > 128 ? 200 : 60;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const px: RGB = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
      const b = brightness(px);
      const isFoot = bgBrightness > 128 ? b < threshold : b > threshold;

      if (isFoot) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        footPixelCount++;
        totalBrightness += b;
      }
    }
  }

  if (footPixelCount === 0) {
    return { minX: 0, maxX: width, minY: 0, maxY: height, footPixelCount: 0, avgBrightness: 128 };
  }

  return {
    minX, maxX, minY, maxY,
    footPixelCount,
    avgBrightness: totalBrightness / footPixelCount,
  };
}

// Measure the arch profile from the side image.
// The arch is measured RELATIVE to the ground line (the lowest contact points at the
// heel and the ball), which is far more robust than absolute pixel brightness: it works
// on dark or busy backgrounds and survives shadows.
function analyzeSideImage(img: HTMLImageElement): {
  archRatio: number;
  archProfile: number[];
  archConfidence: number; // 0-1, how much we should trust archRatio
} {
  const imageData = getImageData(img, 500);
  const { width, height } = imageData;
  const bgColor = detectBackgroundColor(imageData);

  const isFootPx = (x: number, y: number) => colorDistance(pixelAt(imageData, x, y), bgColor) > 45;

  // Bounding box of the foreground using background-distance (adaptive to any background).
  let minX = width, maxX = 0, minY = height, maxY = 0, count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isFootPx(x, y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      count++;
    }
  }

  const footWidth = maxX - minX;
  const footHeight = maxY - minY;
  if (count < 200 || footWidth < 20 || footHeight < 10) {
    // Not enough signal — stay neutral instead of defaulting to "flat".
    return { archRatio: 0.45, archProfile: [], archConfidence: 0 };
  }

  // Sample the bottom contour of the foot across its length.
  const numSamples = 24;
  const bottom: number[] = [];
  for (let s = 0; s < numSamples; s++) {
    const x = minX + Math.round((footWidth * (s + 0.5)) / numSamples);
    let lowest = -1;
    for (let y = minY; y <= maxY; y++) {
      if (isFootPx(x, y)) lowest = y;
    }
    bottom.push(lowest);
  }

  const valid = bottom.filter((y) => y >= 0);
  if (valid.length < numSamples * 0.6) {
    return { archRatio: 0.45, archProfile: [], archConfidence: 0.15 };
  }

  // Ground line = the contact plane (robust: 90th percentile of the bottom contour).
  const sortedBottom = [...valid].sort((a, b) => a - b);
  const groundY = sortedBottom[Math.floor(sortedBottom.length * 0.9)];

  // Lift of each sample above the ground line, normalised by foot height.
  const profile = bottom.map((y) => (y < 0 ? 0 : Math.max(0, groundY - y) / footHeight));

  // The arch lives in the middle 30–70% of the foot length.
  const midStart = Math.floor(numSamples * 0.3);
  const midEnd = Math.ceil(numSamples * 0.7);
  const mid = profile.slice(midStart, midEnd);
  const midLift = mid.reduce((a, b) => a + b, 0) / Math.max(1, mid.length);
  const peakLift = Math.max(...mid, 0);

  // Blend average and peak lift: a true arch has a sustained gap with a clear apex.
  // A fully flat foot sits on the ground across the midfoot (lift ≈ 0).
  // A high arch lifts roughly 25%+ of foot height off the ground at the apex.
  const lift = midLift * 0.6 + peakLift * 0.4;
  const archRatio = Math.min(Math.max(lift / 0.22, 0), 1);

  // Confidence: a side view should be clearly longer than tall, well filled and
  // have a contour that actually varies (a straight contour means we failed to segment).
  const aspect = footWidth / Math.max(1, footHeight);
  const contourRange = Math.max(...profile) - Math.min(...profile);
  let archConfidence = 0.35;
  if (aspect > 1.2) archConfidence += 0.25;
  if (count > width * height * 0.05) archConfidence += 0.2;
  if (contourRange > 0.04) archConfidence += 0.2;
  archConfidence = Math.min(archConfidence, 1);

  return { archRatio, archProfile: profile, archConfidence };
}


// Analyze the top-down image for width, shape, and ruler-based length.
function analyzeTopImage(img: HTMLImageElement): {
  widthRatio: number;
  brightness: number;
  footLengthCm: number;
  footWidthCm: number;
  rulerDetected: boolean;
  pixelsPerCm: number;
  heelWidthRatio: number;
  toeShapeRatio: number;
  measurementConfidence: number;
} {
  const imageData = getImageData(img, 500);
  const bounds = findFootBounds(imageData);

  if (bounds.footPixelCount === 0) {
    return { widthRatio: 0.5, brightness: 128, footLengthCm: 0, footWidthCm: 0, rulerDetected: false, pixelsPerCm: 0, heelWidthRatio: 0.5, toeShapeRatio: 0.5, measurementConfidence: 0 };
  }

  const footWidth = bounds.maxX - bounds.minX;
  const footLength = bounds.maxY - bounds.minY;

  if (footLength < 10) {
    return { widthRatio: 0.5, brightness: 128, footLengthCm: 0, footWidthCm: 0, rulerDetected: false, pixelsPerCm: 0, heelWidthRatio: 0.5, toeShapeRatio: 0.5, measurementConfidence: 0 };
  }

  const widthRatio = footWidth / footLength;

  // Measure width at ball (30% from toe end) vs heel (90% from toe end)
  const { data: pixels, width } = imageData;
  const measureWidthAt = (frac: number): number => {
    const y = bounds.minY + Math.round(footLength * frac);
    let minX = width, maxX = 0;
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const i = (y * width + x) * 4;
      const b = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      if (b < 200) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    return maxX - minX;
  };

  const ballWidth = measureWidthAt(0.3) || footWidth;
  const heelWidth = measureWidthAt(0.85) || footWidth * 0.4;
  const heelWidthRatio = heelWidth / ballWidth;

  // Toe shape: compare width at 5% (toe tip) vs 30% (ball)
  const toeTipWidth = measureWidthAt(0.05) || ballWidth * 0.7;
  const toeShapeRatio = toeTipWidth / ballWidth;

  // Measure real dimensions using ruler detection
  const measurement = measureFoot(imageData);

  // Measurement confidence: based on foot detection quality and ruler presence
  let conf = 50;
  if (measurement.rulerDetected) conf += 35;
  if (measurement.pixelsPerCm > 5 && measurement.pixelsPerCm < 200) conf += 10;
  if (bounds.footPixelCount > 1000) conf += 5;
  const measurementConfidence = Math.min(conf, 100);

  return {
    widthRatio,
    brightness: bounds.avgBrightness,
    footLengthCm: measurement.lengthCm,
    footWidthCm: measurement.widthCm,
    rulerDetected: measurement.rulerDetected,
    pixelsPerCm: measurement.pixelsPerCm,
    heelWidthRatio,
    toeShapeRatio,
    measurementConfidence,
  };
}

// Assess image quality by measuring local contrast (sharpness proxy) and exposure.
function assessImageQuality(img: HTMLImageElement): number {
  const data = getImageData(img, 200);
  const { data: pixels, width, height } = data;
  let contrastSum = 0;
  let count = 0;

  // Sample contrast at a grid of points (difference between adjacent pixels)
  const step = 4;
  for (let y = 0; y < height - step; y += step) {
    for (let x = 0; x < width - step; x += step) {
      const i = (y * width + x) * 4;
      const i2 = (y * width + x + step) * 4;
      const b1 = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      const b2 = (pixels[i2] + pixels[i2 + 1] + pixels[i2 + 2]) / 3;
      contrastSum += Math.abs(b1 - b2);
      count++;
    }
  }

  const avgContrast = count > 0 ? contrastSum / count : 0;
  // Good contrast is ~20-60; too low = blurry, too high = noisy
  let quality = 50;
  if (avgContrast > 10) quality += 20;
  if (avgContrast > 20) quality += 15;
  if (avgContrast > 35) quality += 10;
  if (avgContrast > 60) quality -= 10; // too noisy

  return Math.min(Math.max(quality, 20), 100);
}

// Multi-feature foot type classification using weighted scoring across all measured features.
function classifyFootType(
  archRatio: number,
  widthRatio: number,
  heelWidthRatio: number,
  toeShapeRatio: number,
): {
  footType: ImageAnalysis['footType'];
  archHeightPercent: number;
  pronation: string;
} {
  const archPercent = Math.round(archRatio * 100);

  // Score each foot type based on how well the features match
  const scores: Record<ImageAnalysis['footType'], number> = {
    flat_foot: 0,
    overpronation: 0,
    normal_arch: 0,
    high_arch: 0,
    supination: 0,
  };

  // Arch ratio scoring (primary signal)
  // flat: <0.15, overpronation: 0.15-0.30 + wide, normal: 0.30-0.55, high: 0.55-0.75, supination: >0.75
  if (archRatio < 0.15) scores.flat_foot += 3;
  else if (archRatio < 0.22) { scores.flat_foot += 1.5; scores.overpronation += 1.5; }
  else if (archRatio < 0.30) { scores.overpronation += 2.5; scores.flat_foot += 0.5; }
  else if (archRatio < 0.40) { scores.normal_arch += 2; scores.overpronation += 1; }
  else if (archRatio < 0.55) scores.normal_arch += 3;
  else if (archRatio < 0.70) { scores.high_arch += 2.5; scores.supination += 0.5; }
  else { scores.supination += 2.5; scores.high_arch += 1; }

  // Width ratio scoring (secondary signal)
  // Wide foot (>0.42) suggests overpronation/flat; narrow (<0.35) suggests supination/high arch
  if (widthRatio > 0.45) { scores.overpronation += 1.5; scores.flat_foot += 1; }
  else if (widthRatio > 0.40) { scores.overpronation += 0.8; scores.flat_foot += 0.5; }
  else if (widthRatio > 0.35) scores.normal_arch += 1;
  else if (widthRatio > 0.30) { scores.high_arch += 0.8; scores.normal_arch += 0.5; }
  else { scores.supination += 1.5; scores.high_arch += 1; }

  // Heel width ratio (wide heel relative to ball = flatter foot)
  if (heelWidthRatio > 0.65) { scores.flat_foot += 0.5; scores.overpronation += 0.5; }
  else if (heelWidthRatio < 0.45) { scores.high_arch += 0.5; scores.supination += 0.5; }

  // Toe shape (square toes = wider forefoot = flatter)
  if (toeShapeRatio > 0.85) { scores.flat_foot += 0.3; scores.overpronation += 0.3; }
  else if (toeShapeRatio < 0.6) { scores.high_arch += 0.3; scores.supination += 0.3; }

  // Pick the highest-scoring type
  let footType: ImageAnalysis['footType'] = 'normal_arch';
  let bestScore = -1;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      footType = type as ImageAnalysis['footType'];
    }
  }

  const pronationMap: Record<string, string> = {
    flat_foot: 'Moderate inward roll',
    overpronation: 'Excessive inward roll',
    normal_arch: 'Balanced neutral roll',
    high_arch: 'Minimal roll (rigid)',
    supination: 'Outward roll (underpronation)',
  };

  return {
    footType,
    archHeightPercent: archPercent,
    pronation: pronationMap[footType] ?? 'Neutral',
  };
}

export async function analyzeFootImages(topImageSrc: string, sideImageSrc: string): Promise<ImageAnalysis> {
  const [topImg, sideImg] = await Promise.all([loadImage(topImageSrc), loadImage(sideImageSrc)]);

  const { archRatio } = analyzeSideImage(sideImg);
  const top = analyzeTopImage(topImg);
  const topQuality = assessImageQuality(topImg);
  const sideQuality = assessImageQuality(sideImg);
  const imageQuality = Math.round((topQuality + sideQuality) / 2);

  const { footType, archHeightPercent, pronation } = classifyFootType(
    archRatio,
    top.widthRatio,
    top.heelWidthRatio,
    top.toeShapeRatio,
  );

  return {
    archRatio,
    widthRatio: top.widthRatio,
    darknessRatio: 1 - top.brightness / 255,
    brightness: top.brightness,
    footType,
    archHeightPercent,
    pronation,
    footLengthCm: top.footLengthCm,
    footWidthCm: top.footWidthCm,
    rulerDetected: top.rulerDetected,
    pixelsPerCm: top.pixelsPerCm,
    imageQuality,
    heelWidthRatio: top.heelWidthRatio,
    toeShapeRatio: top.toeShapeRatio,
    measurementConfidence: top.measurementConfidence,
  };
}

export type { ImageAnalysis };
