import { useEffect, useRef } from 'react';

interface FootDiagramProps {
  footLengthCm: number;
  footWidthCm: number;
  footType: string;
}

export default function FootDiagram({ footLengthCm, footWidthCm, footType }: FootDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ footLengthCm, footWidthCm, footType });
  propsRef.current = { footLengthCm, footWidthCm, footType };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let start: number | null = null;
    const duration = 1400;

    const draw = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(elapsed / duration, 1);
      const t = 1 - Math.pow(1 - raw, 3); // easeOutCubic

      const { footLengthCm: flc, footWidthCm: fwc, footType: ft } = propsRef.current;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      const maxFootLen = 28;
      const maxFootWid = 11;
      const lenPx = Math.min((flc / maxFootLen) * (h * 0.65), h * 0.65);
      const widPx = Math.min((fwc / maxFootWid) * (w * 0.4), w * 0.4);

      const footPath = buildFootPath(lenPx, widPx);

      // Grid background
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Measurement guides
      const guideT = Math.max(0, (t - 0.4) / 0.6);
      if (guideT > 0) {
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 * guideT})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(cx - widPx / 2 - 30, cy - lenPx / 2);
        ctx.lineTo(cx - widPx / 2 - 30, cy + lenPx / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - widPx / 2, cy + lenPx / 2 + 25);
        ctx.lineTo(cx + widPx / 2, cy + lenPx / 2 + 25);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Foot shape
      ctx.save();
      ctx.translate(cx, cy);

      const gradient = ctx.createLinearGradient(0, -lenPx / 2, 0, lenPx / 2);
      gradient.addColorStop(0, `rgba(59, 130, 246, ${0.25 * t})`);
      gradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.2 * t})`);
      gradient.addColorStop(1, `rgba(59, 130, 246, ${0.25 * t})`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      footPath(ctx);
      ctx.fill();

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([500]);
      ctx.lineDashOffset = 500 * (1 - t);
      ctx.beginPath();
      footPath(ctx);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arch indicator
      const archColor = getArchColor(ft);
      const archT = Math.max(0, (t - 0.6) / 0.4);
      if (archT > 0) {
        ctx.globalAlpha = archT;
        ctx.strokeStyle = archColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        if (ft === 'flat_foot' || ft === 'overpronation') {
          ctx.moveTo(-widPx * 0.3, lenPx * 0.1);
          ctx.lineTo(widPx * 0.3, lenPx * 0.1);
        } else if (ft === 'high_arch' || ft === 'supination') {
          ctx.moveTo(-widPx * 0.35, lenPx * 0.15);
          ctx.quadraticCurveTo(0, -lenPx * 0.05, widPx * 0.35, lenPx * 0.15);
        } else {
          ctx.moveTo(-widPx * 0.35, lenPx * 0.15);
          ctx.quadraticCurveTo(0, lenPx * 0.03, widPx * 0.35, lenPx * 0.15);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Pulsing landmark points — continuously animated
      const drawLandmark = (lx: number, ly: number, color: string) => {
        const pulse = 0.5 + 0.5 * Math.sin(ts / 400);
        const baseR = 4 * archT;
        ctx.fillStyle = color;
        ctx.globalAlpha = archT * (0.6 + 0.4 * pulse);
        ctx.beginPath();
        ctx.arc(lx, ly, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = archT * 0.4 * (1 - pulse);
        ctx.beginPath();
        ctx.arc(lx, ly, baseR + 6 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      if (archT > 0.5) {
        drawLandmark(0, -lenPx / 2, '#06b6d4');
        drawLandmark(0, lenPx / 2, '#3b82f6');
        drawLandmark(-widPx / 2, 0, '#10b981');
        drawLandmark(widPx / 2, 0, '#10b981');
      }

      ctx.restore();

      // Dimension labels
      const labelT = Math.max(0, (t - 0.7) / 0.3);
      if (labelT > 0) {
        ctx.globalAlpha = labelT;
        ctx.fillStyle = '#1e40af';
        ctx.font = '600 13px Poppins, sans-serif';
        ctx.textAlign = 'center';

        ctx.save();
        ctx.translate(cx - widPx / 2 - 42, cy);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${flc.toFixed(1)} cm`, 0, 0);
        ctx.restore();

        drawArrows(ctx, cx - widPx / 2 - 30, cy - lenPx / 2, cx - widPx / 2 - 30, cy + lenPx / 2, '#3b82f6');

        ctx.fillText(`${fwc.toFixed(1)} cm`, cx, cy + lenPx / 2 + 45);
        drawArrows(ctx, cx - widPx / 2, cy + lenPx / 2 + 25, cx + widPx / 2, cy + lenPx / 2 + 25, '#3b82f6');

        ctx.fillStyle = '#64748b';
        ctx.font = '500 10px Poppins, sans-serif';
        ctx.fillText('Toes', cx, cy - lenPx / 2 - 8);
        ctx.fillText('Heel', cx, cy + lenPx / 2 + 12);

        ctx.fillStyle = archColor;
        ctx.font = '600 10px Poppins, sans-serif';
        ctx.fillText('Arch', cx + widPx * 0.15, cy + lenPx * 0.08);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">CV</span>
        </div>
        <div>
          <h3 className="font-semibold text-sm">Visual Measurement Map</h3>
          <p className="text-[10px] text-gray-400">Computer-vision detected dimensions</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-mono text-green-600 dark:text-green-400">LIVE</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-72" />
    </div>
  );
}

function buildFootPath(lenPx: number, widPx: number) {
  return (ctx: CanvasRenderingContext2D) => {
    const halfL = lenPx / 2;
    const halfW = widPx / 2;
    ctx.moveTo(-halfW * 0.7, halfL);
    ctx.bezierCurveTo(-halfW, halfL * 0.5, -halfW, 0, -halfW * 0.85, -halfL * 0.2);
    ctx.bezierCurveTo(-halfW * 0.8, -halfL * 0.5, -halfW * 0.5, -halfL * 0.75, 0, -halfL);
    ctx.bezierCurveTo(halfW * 0.5, -halfL * 0.75, halfW * 0.8, -halfL * 0.5, halfW, -halfL * 0.2);
    ctx.bezierCurveTo(halfW, 0, halfW * 0.6, halfL * 0.5, halfW * 0.5, halfL * 0.8);
    ctx.bezierCurveTo(halfW * 0.4, halfL * 0.9, -halfW * 0.3, halfL * 0.95, -halfW * 0.7, halfL);
  };
}

function drawArrows(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  const arrowSize = 5;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle1 = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + arrowSize * Math.cos(angle1 - Math.PI / 6), y1 + arrowSize * Math.sin(angle1 - Math.PI / 6));
  ctx.lineTo(x1 + arrowSize * Math.cos(angle1 + Math.PI / 6), y1 + arrowSize * Math.sin(angle1 + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  const angle2 = Math.atan2(y1 - y2, x1 - x2);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 + arrowSize * Math.cos(angle2 - Math.PI / 6), y2 + arrowSize * Math.sin(angle2 - Math.PI / 6));
  ctx.lineTo(x2 + arrowSize * Math.cos(angle2 + Math.PI / 6), y2 + arrowSize * Math.sin(angle2 + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function getArchColor(footType: string): string {
  switch (footType) {
    case 'flat_foot':
    case 'overpronation':
      return '#f97316';
    case 'high_arch':
    case 'supination':
      return '#06b6d4';
    default:
      return '#10b981';
  }
}
