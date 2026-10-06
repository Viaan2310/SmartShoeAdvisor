import Button from '@/components/AdvisorButton';
import { useEffect, useState, useRef } from 'react';
import { analysisSteps } from '@/lib/analysis';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityId, AnalysisResult } from '@/data/shoes';
import { runAnalysis, type AiOverride } from '@/lib/analysis';
import { analyzeFootWithAI } from '@/lib/ai-analysis.functions';
import HomeButton from '@/components/HomeButton';

interface AnalysisScreenProps {
  activity: ActivityId;
  topImage: string;
  sideImage: string;
  manualMeasurement?: { footLengthCm: number; footWidthCm: number; pixelsPerCm: number } | null;
  onHome: () => void;
  onComplete: (result: AnalysisResult) => void;
}

// Downscale a data-URL image to keep AI payloads small (≈768px max, JPEG q0.8).
async function shrinkDataUrl(src: string, max = 768): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(src);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export default function AnalysisScreen({ activity, topImage, sideImage, manualMeasurement, onHome, onComplete }: AnalysisScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<AnalysisResult | null>(null);
  const completedRef = useRef(false);
  const firedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Fire AI vision analysis (silent fallback to local if it fails).
      let ai: AiOverride | null = null;
      try {
        const [tinyTop, tinySide] = await Promise.all([
          shrinkDataUrl(topImage),
          shrinkDataUrl(sideImage),
        ]);
        const aiResult = await analyzeFootWithAI({
          data: {
            activity,
            topImage: tinyTop,
            sideImage: tinySide,
            manual: manualMeasurement
              ? { footLengthCm: manualMeasurement.footLengthCm, footWidthCm: manualMeasurement.footWidthCm }
              : null,
          },
        });
        if (aiResult) {
          ai = {
            footType: aiResult.footType,
            archHeightPercent: aiResult.archHeightPercent,
            pronation: aiResult.pronation,
            imageQuality: aiResult.imageQuality,
            confidence: aiResult.confidence,
            reasoning: aiResult.reasoning,
          };
        }
      } catch (err) {
        // Silent fallback — local analysis still runs below.
        console.warn('AI analysis unavailable, using local model.', err);
      }

      try {
        const result = await runAnalysis(activity, topImage, sideImage, manualMeasurement ?? undefined, ai);
        if (cancelled) return;
        resultRef.current = result;
        if (completedRef.current && !firedRef.current) {
          firedRef.current = true;
          onComplete(result);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      }
    })();


    const stepDuration = 500;
    const totalSteps = analysisSteps.length;
    const interval = 20;
    const increment = 100 / (totalSteps * (stepDuration / interval));

    const timer = setInterval(() => {
      if (cancelled) return;
      setProgress((p) => {
        const next = Math.min(p + increment, 100);
        const stepIndex = Math.min(Math.floor(next / (100 / totalSteps)), totalSteps - 1);
        setCurrentStep(stepIndex);
        if (next >= 100) {
          clearInterval(timer);
          completedRef.current = true;
          if (resultRef.current && !firedRef.current) {
            firedRef.current = true;
            onComplete(resultRef.current);
          }
        }
        return next;
      });
    }, interval);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activity, topImage, sideImage, manualMeasurement, onComplete]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <div className="glass-card p-8 text-center max-w-sm">
          <div className="h-16 w-16 rounded-lg bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Icons.AlertCircle size={32} className="text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-primary ripple">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isFinalizing = progress >= 100 && !resultRef.current;
  const scanY = (progress / 100) * 100;

  // Live readout values that tick up with progress
  const liveLength = ((progress / 100) * 26.5).toFixed(1);
  const liveWidth = ((progress / 100) * 10.2).toFixed(1);
  const liveArch = Math.round((progress / 100) * 58);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5 py-8">
      <div className="absolute top-5 left-5 z-20">
        <HomeButton onClick={onHome} />
      </div>


      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Scan viewport — the cinematic foot scan */}
        <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden glass-card p-2">
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-foreground">
            {/* The actual foot image */}
            <img
              src={topImage}
              alt="Foot scan"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />

            {/* Dark scan overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary/40" />

            {/* Scan line */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_2px_rgba(34,211,238,0.8)] transition-all duration-75 ease-linear"
              style={{ top: `${scanY}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
            {/* Scan glow trail */}
            <div
              className="absolute left-0 right-0 h-16 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0 transition-all duration-75 ease-linear pointer-events-none"
              style={{ top: `calc(${scanY}% - 32px)` }}
            />

            {/* Detection corner brackets */}
            <div className="absolute top-3 left-3 h-6 w-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-3 right-3 h-6 w-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-primary rounded-br-lg" />

            {/* HUD readouts */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-overlay/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary tracking-normalr">SCANNING</span>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 text-[10px] font-mono">
              <div className="bg-overlay/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-muted-foreground">L:</span>{' '}
                <span className="text-primary font-semibold">{liveLength}cm</span>
              </div>
              <div className="bg-overlay/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-muted-foreground">W:</span>{' '}
                <span className="text-primary font-semibold">{liveWidth}cm</span>
              </div>
              <div className="bg-overlay/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-muted-foreground">A:</span>{' '}
                <span className="text-primary font-semibold">{liveArch}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress circle */}
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" strokeWidth="8" className="stroke-muted dark:stroke-card/10" />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className="stroke-primary transition-all duration-75"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold gradient-text">{Math.round(progress)}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{isFinalizing ? 'Finalizing' : 'Analyzing'}</span>
          </div>
        </div>

        {/* Current step label */}
        <div className="text-center min-h-[2rem]">
          <h2 className="text-lg font-semibold animate-fade-in" key={isFinalizing ? 'finalizing' : currentStep}>
            {isFinalizing ? 'Finalizing Recommendation...' : analysisSteps[currentStep].label}
          </h2>
        </div>

        {/* Compact step list */}
        <div className="w-full max-w-xs space-y-1.5">
          {analysisSteps.map((step, i) => {
            const Icon = (Icons[step.icon as keyof typeof Icons] ?? Icons.Sparkles) as LucideIcon;
            const done = i < currentStep || (isFinalizing && i === analysisSteps.length - 1);
            const active = i === currentStep && !isFinalizing;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300
                  ${active ? 'glass-card scale-[1.02]' : done ? 'opacity-60' : 'opacity-30'}`}
              >
                <div className={`h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-300
                  ${done ? 'bg-success' : active ? 'bg-primary' : 'bg-muted dark:bg-card/10'}`}>
                  {done ? (
                    <Icons.Check size={16} className="text-primary-foreground" />
                  ) : (
                    <Icon size={16} className="text-primary-foreground" />
                  )}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-primary dark:text-primary' : ''}`}>{step.label}</span>
                {active && (
                  <div className="ml-auto flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">{isFinalizing ? 'Processing AI model output...' : 'Estimated time: 3–5 seconds'}</p>
      </div>
    </div>
  );
}
