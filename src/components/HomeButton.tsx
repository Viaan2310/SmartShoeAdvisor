import Button from '@/components/AdvisorButton';
import { Home } from 'lucide-react';

interface HomeButtonProps {
  onClick: () => void;
  className?: string;
  label?: boolean;
}

export default function HomeButton({ onClick, className = '', label = false }: HomeButtonProps) {
  return (
    <Button
      onClick={onClick}
      aria-label="Back to home"
      title="Back to home"
      className={`glass-card p-2.5  transition-transform flex items-center gap-2 ${className}`}
    >
      <Home size={20} className="text-primary dark:text-primary" />
      {label && <span className="text-sm font-medium text-primary dark:text-primary pr-1">Home</span>}
    </Button>
  );
}
