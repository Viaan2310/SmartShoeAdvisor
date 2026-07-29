import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 800);
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-cyan-100 dark:from-blue-600 dark:via-blue-700 dark:to-cyan-600 overflow-hidden transition-colors duration-500">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl animate-float-slow" />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-bounce-in">
        <div className="scale-150 mb-8">
          <Logo size="md" />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Stride AI</h1>
          <p className="mt-2 text-blue-700 dark:text-blue-100 font-medium">AI Powered Foot Analysis</p>
          <p className="mt-1 text-sm font-mono text-cyan-700 dark:text-cyan-200/90 tracking-wider uppercase">Scan. Measure. Match.</p>
        </div>

        {/* Progress bar */}
        <div className="w-56 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-white rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-blue-700 dark:text-blue-100 text-sm font-medium">{progress}%</p>
      </div>
    </div>
  );
}
