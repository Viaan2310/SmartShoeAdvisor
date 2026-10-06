import { Check } from 'lucide-react';

const steps = ['Photos', 'Measure', 'Activity', 'Analysis', 'Results'];
export default function AdvisorProgress({ current }: { current: number }) {
  return (
    <nav aria-label="Analysis progress" className="advisor-progress">
      <ol>
        {steps.map((label, index) => (
          <li key={label} aria-current={index === current ? 'step' : undefined} data-state={index < current ? 'done' : index === current ? 'active' : 'upcoming'}>
            <span className="progress-number">{index < current ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}