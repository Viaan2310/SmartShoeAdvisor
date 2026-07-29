import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Ruler, Move, Check, RotateCcw } from 'lucide-react';

export interface ManualMeasurement {
  footLengthCm: number;
  footWidthCm: number;
  pixelsPerCm: number;
}

interface CalibrationScreenProps {
  topImage: string;
  onBack: () => void;
  onNext: (measurement: ManualMeasurement) => void;
}

type LineId = 'ruler' | 'length' | 'width';
type Point = { x: number; y: number }; // normalized 0..1

interface LineState {
  a: Point;
  b: Point;
}

const initialLines: Record<LineId, LineState> = {
  ruler: { a: { x: 0.15, y: 0.9 }, b: { x: 0.85, y: 0.9 } },
  length: { a: { x: 0.5, y: 0.15 }, b: { x: 0.5, y: 0.75 } },
  width: { a: { x: 0.3, y: 0.45 }, b: { x: 0.7, y: 0.45 } },
};

const stepInfo: Record<LineId, { title: string; hint: string; color: string; ring: string }> = {
  ruler: {
    title: 'Mark the 30 cm ruler',
    hint: 'Drag the two handles onto the 0 cm and 30 cm marks on your ruler.',
    color: '#22d3ee',
    ring: 'ring-cyan-400',
  },
  length: {
    title: 'Mark your foot length',
    hint: 'Place one handle at the back of your heel and the other at the tip of your longest toe.',
    color: '#60a5fa',
    ring: 'ring-blue-400',
  },
  width: {
    title: 'Mark your foot width',
    hint: 'Place the handles across the widest part of your foot (the ball).',
    color: '#f472b6',
    ring: 'ring-pink-400',
  },
};

const steps: LineId[] = ['ruler', 'length', 'width'];

function dist(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function CalibrationScreen({ topImage, onBack, onNext }: CalibrationScreenProps) {
  const [lines, setLines] = useState<Record<LineId, LineState>>(initialLines);
  const [stepIdx, setStepIdx] = useState(0);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ line: LineId; end: 'a' | 'b' } | null>(null);

  const currentLine = steps[stepIdx];

  // Compute pixel-space geometry for measurement using the actual image aspect ratio
  const geom = useMemo(() => {
    if (!imgDims) return null;
    const rulerA = lines.ruler.a;
    const rulerB = lines.ruler.b;
    // Normalized dist scaled by image aspect (we treat container as image box)
    const rw = (rulerB.x - rulerA.x) * imgDims.w;
    const rh = (rulerB.y - rulerA.y) * imgDims.h;
    const rulerPx = Math.sqrt(rw * rw + rh * rh);
    const pixelsPerCm = rulerPx / 30;

    const lw = (lines.length.b.x - lines.length.a.x) * imgDims.w;
    const lh = (lines.length.b.y - lines.length.a.y) * imgDims.h;
    const lengthPx = Math.sqrt(lw * lw + lh * lh);

    const ww = (lines.width.b.x - lines.width.a.x) * imgDims.w;
    const wh = (lines.width.b.y - lines.width.a.y) * imgDims.h;
    const widthPx = Math.sqrt(ww * ww + wh * wh);

    return {
      pixelsPerCm,
      lengthCm: pixelsPerCm > 0 ? lengthPx / pixelsPerCm : 0,
      widthCm: pixelsPerCm > 0 ? widthPx / pixelsPerCm : 0,
    };
  }, [lines, imgDims]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  }, []);

  const pointFromEvent = useCallback((clientX: number, clientY: number): Point | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) };
  }, []);

  const startDrag = (line: LineId, end: 'a' | 'b') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragging.current = { line, end };
    // If user grabs a handle from another step, switch to that step
    const idx = steps.indexOf(line);
    if (idx !== -1) setStepIdx(idx);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const p = pointFromEvent(e.clientX, e.clientY);
    if (!p) return;
    const { line, end } = dragging.current;
    setLines((prev) => ({ ...prev, [line]: { ...prev[line], [end]: p } }));
  };

  const endDrag = () => {
    dragging.current = null;
  };

  // Tap on empty area of the image sets the nearest endpoint of the current line
  const onContainerPointerDown = (e: React.PointerEvent) => {
    if (dragging.current) return;
    const p = pointFromEvent(e.clientX, e.clientY);
    if (!p) return;
    setLines((prev) => {
      const cur = prev[currentLine];
      const useA = dist(p, cur.a) <= dist(p, cur.b);
      return { ...prev, [currentLine]: { ...cur, [useA ? 'a' : 'b']: p } };
    });
  };

  const reset = () => setLines((prev) => ({ ...prev, [currentLine]: initialLines[currentLine] }));

  const next = () => {
    if (stepIdx < steps.length - 1) {
      setStepIdx(stepIdx + 1);
    } else if (geom) {
      onNext({
        footLengthCm: Math.max(5, Math.min(40, geom.lengthCm)),
        footWidthCm: Math.max(3, Math.min(20, geom.widthCm)),
        pixelsPerCm: geom.pixelsPerCm,
      });
    }
  };

  const back = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
    else onBack();
  };

  useEffect(() => {
    const up = () => endDrag();
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const info = stepInfo[currentLine];

  return (
    <div className="min-h-screen flex flex-col px-5 py-6 gap-5">
      <header className="flex items-center gap-3">
        <button onClick={back} className="h-10 w-10 rounded-full glass-card flex items-center justify-center ripple" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold">Calibrate measurements</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Step {stepIdx + 1} of {steps.length}</p>
        </div>
        <button onClick={reset} className="ml-auto h-10 w-10 rounded-full glass-card flex items-center justify-center ripple" aria-label="Reset line">
          <RotateCcw size={16} />
        </button>
      </header>

      {/* Step chips */}
      <div className="flex gap-2">
        {steps.map((s, i) => {
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <button
              key={s}
              onClick={() => setStepIdx(i)}
              className={`flex-1 rounded-2xl px-3 py-2 text-xs font-semibold transition-all
                ${active ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg' : done ? 'glass-card' : 'glass-card opacity-60'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {done ? <Check size={14} /> : s === 'ruler' ? <Ruler size={14} /> : <Move size={14} />}
                <span className="capitalize">{s}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Image + overlay */}
      <div
        ref={containerRef}
        onPointerDown={onContainerPointerDown}
        onPointerMove={onPointerMove}
        className="relative w-full mx-auto max-w-md aspect-[3/4] rounded-3xl overflow-hidden glass-card touch-none select-none"
        style={{ touchAction: 'none' }}
      >
        <img
          src={topImage}
          alt="Top view of foot"
          onLoad={onImgLoad}
          className="absolute inset-0 w-full h-full object-contain bg-gray-900"
          draggable={false}
        />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {steps.map((id) => {
            const l = lines[id];
            const isActive = id === currentLine;
            const c = stepInfo[id].color;
            return (
              <g key={id} opacity={isActive ? 1 : 0.45}>
                <line
                  x1={l.a.x * 100}
                  y1={l.a.y * 100}
                  x2={l.b.x * 100}
                  y2={l.b.y * 100}
                  stroke={c}
                  strokeWidth={isActive ? 0.6 : 0.4}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: `drop-shadow(0 0 4px ${c})` }}
                />
              </g>
            );
          })}
        </svg>

        {/* Handles (HTML for easy pointer capture on mobile) */}
        {steps.map((id) => {
          const l = lines[id];
          const isActive = id === currentLine;
          const c = stepInfo[id].color;
          return (['a', 'b'] as const).map((end) => {
            const p = l[end];
            return (
              <button
                key={`${id}-${end}`}
                onPointerDown={startDrag(id, end)}
                aria-label={`${id} ${end === 'a' ? 'start' : 'end'} handle`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full border-2 shadow-lg transition-transform ${isActive ? 'ring-2 ' + stepInfo[id].ring : ''}`}
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                  borderColor: c,
                  background: `radial-gradient(circle, ${c} 0%, ${c}55 55%, transparent 70%)`,
                  opacity: isActive ? 1 : 0.6,
                  zIndex: isActive ? 20 : 10,
                  touchAction: 'none',
                }}
              >
                <span className="absolute inset-1.5 rounded-full bg-white/95 dark:bg-gray-900/95 flex items-center justify-center text-[10px] font-bold" style={{ color: c }}>
                  {end === 'a' ? '1' : '2'}
                </span>
              </button>
            );
          });
        })}

        {/* Live readout */}
        {geom && (
          <div className="absolute top-3 left-3 right-3 flex justify-between gap-2 text-[10px] font-mono pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
              <span className="text-gray-400">Scale:</span>{' '}
              <span className="text-cyan-300 font-semibold">{geom.pixelsPerCm.toFixed(1)} px/cm</span>
            </div>
            <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
              <span className="text-gray-400">L:</span>{' '}
              <span className="text-blue-300 font-semibold">{geom.lengthCm.toFixed(1)} cm</span>
              <span className="text-gray-400 ml-2">W:</span>{' '}
              <span className="text-pink-300 font-semibold">{geom.widthCm.toFixed(1)} cm</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full" style={{ background: info.color }} />
          <h2 className="text-sm font-bold">{info.title}</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{info.hint}</p>
      </div>

      {/* Actions */}
      <div className="mt-auto flex gap-3">
        <button onClick={back} className="flex-1 btn-secondary ripple">Back</button>
        <button onClick={next} className="flex-[1.5] btn-primary ripple" disabled={!geom || geom.pixelsPerCm <= 0}>
          {stepIdx < steps.length - 1 ? 'Next' : 'Confirm & Analyze'}
        </button>
      </div>
    </div>
  );
}
