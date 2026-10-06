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

      <header className="sticky top-0 z-40 glass border-b border-border/60 dark:border-card/5">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Button onClick={onBack} className="glass-card p-2.5  transition-transform">
            <ArrowLeft size={20} className="text-primary dark:text-primary" />
          </Button>
          <Logo size="sm" />
          <HomeButton onClick={onHome} />
        </div>
      </header>

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

        <h2 className="text-2xl md:text-3xl font-bold mb-2">Select Your Activity</h2>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">Choose your primary use case for a tailored recommendation</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {activities.map((activity, i) => {
            const Icon = (Icons[activity.icon as keyof typeof Icons] ?? Icons.Sparkles) as LucideIcon;
            const isSelected = selected === activity.id;
            return (
              <Button
                key={activity.id}
                onClick={() => setSelected(activity.id)}
                className={`glass-card p-5 text-left transition-all duration-300 hover:-translate-y-1
                  ${isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:shadow-lg'}
                `}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg  transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                    <Icon size={26} className="text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activity.emoji}</span>
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

        <div className="sticky bottom-0 mt-8 pb-6 pt-4 bg-gradient-to-t from-muted dark:from-background to-transparent">
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
