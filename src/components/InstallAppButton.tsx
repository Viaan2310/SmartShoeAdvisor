import Button from '@/components/AdvisorButton';
import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setPromptEvent(null);
    } else {
      setShowHelp(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className="btn-ghost group w-fit flex items-center gap-2 text-xs"
        aria-label="Download the Smart Shoe Advisor app"
      >
        <Download size={20} className="text-primary group-hover:translate-y-0.5 transition-transform" />
        <span className="hidden sm:inline">Download App</span>
      </Button>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay/50 p-4" onClick={() => setShowHelp(false)}>
          <div className="glass-card w-full max-w-sm p-6 rounded-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-bold text-lg">Install Smart Shoe Advisor</h3>
              <Button onClick={() => setShowHelp(false)} aria-label="Close"><X size={20} /></Button>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground dark:text-muted-foreground list-decimal list-inside">
              <li>
                <strong>Android (Chrome):</strong> open the ⋮ menu → tap{' '}
                <strong>Install app</strong> or <strong>Add to Home screen</strong>.
              </li>
              <li className="flex items-start gap-2">
                <Share2 size={16} className="mt-0.5 text-primary shrink-0" />
                <span><strong>iPhone/iPad (Safari):</strong> tap the <strong>Share</strong> icon, then <strong>Add to Home Screen</strong>.</span>
              </li>
              <li><strong>Desktop Chrome/Edge:</strong> click the install icon in the address bar.</li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground dark:text-muted-foreground">
              The app then opens full screen from your home screen, just like a native app.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
