import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import HomeButton from '@/components/HomeButton';
import Button from '@/components/AdvisorButton';

export default function AdvisorHeader({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  return (
    <header className="sticky top-0 z-40 advisor-header">
      <div className="advisor-header-inner">
        <Button onClick={onBack} aria-label="Go back" title="Go back" className="icon-button"><ArrowLeft size={20} /></Button>
        <Logo size="sm" />
        <HomeButton onClick={onHome} />
      </div>
    </header>
  );
}