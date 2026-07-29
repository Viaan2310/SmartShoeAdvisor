import { useEffect, useState, useRef } from 'react';
import { analysisSteps } from '@/lib/analysis';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityId, AnalysisResult } from '@/data/shoes';
import { runAnalysis } from '@/lib/analysis';

interface AnalysisScreenProps {
  activity: ActivityId;
  topImage: string;
  sideImage: string;
  manualMeasurement?: { footLengthCm: number; footWidthCm: number; pixelsPerCm: number } | null;
  onComplete: (result: AnalysisResult) => void;
}

export default function AnalysisScreen({ activity, topImage, sideImage, manualMeasurement, onComplete }: AnalysisScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<AnalysisResult | null>(null);
  const completedRef = useRef(false);
  const firedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    runAnalysis(activity, topImage, sideImage, manualMeasurement ?? undefined)

      .then((result) => {
        if (cancelled) return;
        resultRef.current = result;
        if (completedRef.current && !firedRef.current) {
          firedRef.current = true;
          onComplete(result);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      });

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
          <div className="h-16 w-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Icons.AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary ripple">
            Try Again
          </button>
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
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-float-slow" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Scan viewport — the cinematic foot scan */}
        <div className="relative w-full max-w-xs aspect-square rounded-3xl overflow-hidden glass-card p-2">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-900">
            {/* The actual foot image */}
            <img
              src={topImage}
              alt="Foot scan"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />

            {/* Dark scan overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-transparent to-cyan-950/40" />

            {/* Scan line */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.8)] transition-all duration-75 ease-linear"
              style={{ top: `${scanY}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
            </div>
            {/* Scan glow trail */}
            <div
              className="absolute left-0 right-0 h-16 bg-gradient-to-b from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 transition-all duration-75 ease-linear pointer-events-none"
              style={{ top: `calc(${scanY}% - 32px)` }}
            />

            {/* Detection corner brackets */}
            <div className="absolute top-3 left-3 h-6 w-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
            <div className="absolute top-3 right-3 h-6 w-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />

            {/* HUD readouts */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-300 tracking-wider">SCANNING</span>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 text-[10px] font-mono">
              <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-gray-400">L:</span>{' '}
                <span className="text-cyan-300 font-semibold">{liveLength}cm</span>
              </div>
              <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-gray-400">W:</span>{' '}
                <span className="text-cyan-300 font-semibold">{liveWidth}cm</span>
              </div>
              <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-gray-400">A:</span>{' '}
                <span className="text-cyan-300 font-semibold">{liveArch}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress circle */}
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-white/10" />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className="stroke-blue-500 transition-all duration-75"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold gradient-text">{Math.round(progress)}%</span>
            <span className="text-[10px] text-gray-400 mt-0.5">{isFinalizing ? 'Finalizing' : 'Analyzing'}</span>
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
                className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300
                  ${active ? 'glass-card scale-[1.02]' : done ? 'opacity-60' : 'opacity-30'}`}
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300
                  ${done ? 'bg-green-500' : active ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gray-300 dark:bg-white/10'}`}>
                  {done ? (
                    <Icons.Check size={16} className="text-white" />
                  ) : (
                    <Icon size={16} className="text-white" />
                  )}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-blue-600 dark:text-blue-400' : ''}`}>{step.label}</span>
                {active && (
                  <div className="ml-auto flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400">{isFinalizing ? 'Processing AI model output...' : 'Estimated time: 3–5 seconds'}</p>
      </div>
    </div>
  );
}
