import AdvisorHeader from '@/components/AdvisorHeader';
import AdvisorProgress from '@/components/AdvisorProgress';
import Button from '@/components/AdvisorButton';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Logo from '@/components/Logo';
import HomeButton from '@/components/HomeButton';
import { activities, type ActivityId } from '@/data/shoes';

interface ActivityScreenProps {
  onBack: () => void;
  onHome: () => void;
  onNext: (activity: ActivityId) => void;
}

export default function ActivityScreen({ onBack, onHome, onNext }: ActivityScreenProps) {
  const [selected, setSelected] = useState<ActivityId | null>(null);

  return (
    <div className="min-h-screen relative overflow-hidden">

      <AdvisorHeader onBack={onBack} onHome={onHome} />

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Upload', 'Activity', 'Analysis', 'Result'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${i <= 1 ? 'w-8 bg-primary' : 'w-2 bg-muted dark:bg-card/10'}`} />
              <span className={`text-xs font-medium hidden sm:inline ${i <= 1 ? 'text-primary dark:text-primary' : 'text-muted-foreground'}`}>{step}</span>
            </div>
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-2">What moves you?</h2>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">Choose your primary use case for a tailored recommendation</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {activities.map((activity, i) => {
            const Icon = (Icons[activity.icon as keyof typeof Icons] ?? Icons.Sparkles) as LucideIcon;
            const isSelected = selected === activity.id;
            return (
              <Button
                key={activity.id}
                onClick={() => setSelected(activity.id)}
                className="activity-card" aria-pressed={isSelected}
              >
                <div className="flex items-center gap-4">
                  <div className="activity-icon">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      
                      <h3 className="font-semibold text-lg">{activity.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">{activity.description}</p>
                  </div>
                  {isSelected && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center animate-bounce-in">
                      <Check size={16} className="text-primary-foreground" />
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        <div className="sticky bottom-0 flow-actions">
          <Button
            onClick={() => selected && onNext(selected)}
            disabled={!selected}
            className="btn-primary ripple group w-full flex items-center justify-center gap-2 text-lg"
          >
            Continue
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
