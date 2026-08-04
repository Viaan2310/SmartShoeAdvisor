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
      <button
        onClick={handleClick}
        className="btn-ghost group w-fit flex items-center gap-2 text-base"
        aria-label="Download the Smart Shoe Advisor app"
      >
        <Download size={20} className="text-cyan-500 group-hover:translate-y-0.5 transition-transform" />
        Download App
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowHelp(false)}>
          <div className="glass-card w-full max-w-sm p-6 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-bold text-lg">Install Smart Shoe Advisor</h3>
              <button onClick={() => setShowHelp(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300 list-decimal list-inside">
              <li className="flex items-start gap-2">
                <Share2 size={16} className="mt-0.5 text-blue-500 shrink-0" />
                <span>On iPhone/iPad: tap the <strong>Share</strong> icon in Safari.</span>
              </li>
              <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
              <li>On Android/desktop Chrome: open the browser menu and pick <strong>Install app</strong>.</li>
            </ol>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              The app then opens full screen from your home screen, just like a native app.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
