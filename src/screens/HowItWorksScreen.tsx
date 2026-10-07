import AdvisorHeader from '@/components/AdvisorHeader';
import AdvisorProgress from '@/components/AdvisorProgress';
import Button from '@/components/AdvisorButton';
import { ArrowLeft, Scan, Brain, Ruler, Footprints, Sparkles, Cpu, Image as ImageIcon, Layers, Zap, Check, BarChart3 } from 'lucide-react';
import Logo from '@/components/Logo';
import HomeButton from '@/components/HomeButton';

interface HowItWorksScreenProps {
  onBack: () => void;
  onHome: () => void;
}

const pipeline = [
  {
    icon: ImageIcon,
    title: 'Image Acquisition',
    desc: 'Top-down and side-on photos are captured and downscaled to a fixed resolution for consistent processing.',
    tech: 'Canvas API · 800px max dimension',
  },
  {
    icon: Scan,
    title: 'Background Segmentation',
    desc: 'The dominant background color is sampled from the image corners. Every pixel is compared against this color using Euclidean distance in RGB space to separate the foot from the surface.',
    tech: 'Color distance · Threshold: 45',
  },
  {
    icon: Cpu,
    title: 'Connected Component Analysis',
    desc: 'A flood-fill algorithm groups adjacent foreground pixels into connected components. The largest component is identified as the foot, filtering out noise and small artifacts.',
    tech: '4-connectivity flood fill',
  },
  {
    icon: Layers,
    title: 'Ankle Isolation',
    desc: 'The width profile along the long axis is sampled. The ankle — where the leg narrows to under 45% of the ball width — is detected and trimmed, isolating only the foot.',
    tech: 'Width profile · 40 cross-sections',
  },
  {
    icon: Ruler,
    title: 'Metric Measurement',
    desc: 'The full photo length is treated as a 30 cm reference. Foot dimensions in pixels are converted to centimeters, then mapped to UK, US, and EU shoe sizes.',
    tech: '30 cm reference · Brannock mapping',
  },
  {
    icon: Brain,
    title: 'Foot Type Classification',
    desc: 'The aspect ratio of the foot bounding box classifies the arch type: flat, normal, or high arch. This determines pronation type and guides shoe recommendations.',
    tech: 'Aspect ratio analysis',
  },
  {
    icon: Sparkles,
    title: 'AI Recommendation Engine',
    desc: 'A scoring algorithm matches the foot type and selected activity against a curated shoe catalog, ranking by comfort, support, and durability fit scores.',
    tech: 'Weighted multi-factor scoring',
  },
];

const techStack = [
  { icon: Scan, label: 'Computer Vision', desc: 'Real-time pixel-level image processing' },
  { icon: Zap, label: 'Edge Processing', desc: 'All analysis runs in your browser — no server needed' },
  { icon: BarChart3, label: 'Size Standards', desc: 'UK, US & EU shoe size conversion' },
  { icon: Footprints, label: 'Biomechanics', desc: 'Arch type and pronation classification' },
];

export default function HowItWorksScreen({ onBack, onHome }: HowItWorksScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">


      <AdvisorHeader onBack={onBack} onHome={onHome} />

      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-4">
            <Brain size={16} className="text-primary" />
            <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Under the Hood</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">How <span className="gradient-text">FootFit AI</span> Works</h1>
          <p className="text-muted-foreground dark:text-muted-foreground max-w-xl mx-auto">
            Seven computer-vision stages transform a simple photo into a precise foot measurement and personalized shoe recommendation — all in your browser.
          </p>
        </div>

        {/* Pipeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/30 to-transparent" />

          <div className="space-y-5">
            {pipeline.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative flex gap-5"
                >
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <Icon size={22} className="text-primary-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full glass-card flex items-center justify-center text-[10px] font-bold text-primary dark:text-primary">
                      {i + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="glass-card p-5 flex-1 group hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-base">{step.title}</h3>
                      <span className="text-[10px] font-mono text-primary dark:text-primary glass px-2 py-1 rounded-lg whitespace-nowrap">
                        {step.tech}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech highlights */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-5 text-center">Technology Highlights</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {techStack.map((t, i) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className="glass-card p-5 flex items-center gap-4"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                    <Icon size={24} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{t.label}</h3>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key advantages */}
        <div className="mt-10 glass-card p-6 md:p-8">
          <h2 className="text-lg font-bold mb-4">Why It Stands Out</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              '100% client-side — no data leaves the device',
              'No ML model download — pure algorithmic CV',
              'Works offline once the page loads',
              'Instant results in under 5 seconds',
              'Privacy-first — photos never uploaded',
              'Multi-standard size output (UK/US/EU)',
            ].map((point) => (
              <div key={point} className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-success dark:text-success" />
                </div>
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={onBack} className="btn-primary ripple group inline-flex items-center gap-2">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
