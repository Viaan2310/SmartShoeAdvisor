import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Logo from '@/components/Logo';
import { activities, type ActivityId } from '@/data/shoes';

interface ActivityScreenProps {
  onBack: () => void;
  onNext: (activity: ActivityId) => void;
}

export default function ActivityScreen({ onBack, onNext }: ActivityScreenProps) {
  const [selected, setSelected] = useState<ActivityId | null>(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl -z-10" />

      <header className="sticky top-0 z-40 glass border-b border-gray-200/60 dark:border-white/5">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={onBack} className="glass-card p-2.5 hover:scale-110 transition-transform">
            <ArrowLeft size={20} className="text-blue-600 dark:text-blue-400" />
          </button>
          <Logo size="sm" />
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Upload', 'Activity', 'Analysis', 'Result'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${i <= 1 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-white/10'}`} />
              <span className={`text-xs font-medium hidden sm:inline ${i <= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{step}</span>
            </div>
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-2">Select Your Activity</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Choose your primary use case for a tailored recommendation</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {activities.map((activity, i) => {
            const Icon = (Icons[activity.icon as keyof typeof Icons] ?? Icons.Sparkles) as LucideIcon;
            const isSelected = selected === activity.id;
            return (
              <button
                key={activity.id}
                onClick={() => setSelected(activity.id)}
                className={`glass-card p-5 text-left transition-all duration-300 hover:-translate-y-1
                  ${isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : 'hover:shadow-lg'}
                `}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${activity.gradient} flex items-center justify-center shadow-lg ${activity.glow} transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activity.emoji}</span>
                      <h3 className="font-semibold text-lg">{activity.label}</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
                  </div>
                  {isSelected && (
                    <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center animate-bounce-in">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-0 mt-8 pb-6 pt-4 bg-gradient-to-t from-slate-50 dark:from-[#0a0e1a] to-transparent">
          <button
            onClick={() => selected && onNext(selected)}
            disabled={!selected}
            className="btn-primary ripple group w-full flex items-center justify-center gap-2 text-lg"
          >
            Continue
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
