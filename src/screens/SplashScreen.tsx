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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Animated background orbs */}


      <div className="relative z-10 flex flex-col items-center gap-8 animate-bounce-in">
        <div className="mb-8">
          <Logo size="md" />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground dark:text-primary-foreground tracking-normal">FootFit AI</h1>
          <p className="mt-2 text-primary dark:text-primary font-medium">AI Powered Foot Analysis</p>
          <p className="mt-1 text-sm font-mono text-primary dark:text-primary/90 tracking-normalr uppercase">Scan. Measure. Match.</p>
        </div>

        {/* Progress bar */}
        <div className="w-56 h-1.5 bg-muted dark:bg-card/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary dark:bg-card rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-primary dark:text-primary text-sm font-medium">{progress}%</p>
      </div>
    </div>
  );
}
