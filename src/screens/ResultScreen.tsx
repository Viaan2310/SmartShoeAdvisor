import Button from '@/components/AdvisorButton';
import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Download, RefreshCw, Share2, Ruler, Footprints, Activity as ActivityIcon, Sparkles, Star, Shield, Wrench, Check, TrendingUp, TrendingDown, RotateCw, RotateCcw, Send, X, Heart, AlertTriangle, type LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import Logo from '@/components/Logo';
import HomeButton from '@/components/HomeButton';
import FootDiagram from '@/components/FootDiagram';
import { activities, footTypes } from '@/data/shoes';
import type { AnalysisResult } from '@/data/shoes';
import { updateAnalysisRating, getAnalysisRating } from '@/lib/history';

interface ResultScreenProps {
  result: AnalysisResult;
  analysisId: string | null;
  onBack: () => void;
  onHome: () => void;
  onAnalyzeAgain: () => void;
}

function RatingBar({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  const pct = (value / 10) * 100;
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-8 w-8 rounded-md ${color} flex items-center justify-center`}>
          <Icon size={16} className="text-primary-foreground" />
        </div>
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-auto text-lg font-bold gradient-text">{value.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></span>
      </div>
      <div className="h-2 bg-muted dark:bg-card/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0 ${accent ? 'bg-primary' : 'bg-muted dark:bg-card/10'}`}>
        <Icon size={18} className={accent ? 'text-primary-foreground' : 'text-primary'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-normal">{label}</p>
        <p className="font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

const footTypeIcons: Record<string, LucideIcon> = {
  Activity: ActivityIcon,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  RotateCw: RotateCw,
  RotateCcw: RotateCcw,
};

export default function ResultScreen({ result, analysisId, onBack, onHome, onAnalyzeAgain }: ResultScreenProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [existingAnalysisRating, setExistingAnalysisRating] = useState<number | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const activity = activities.find((a) => a.id === result.activity);
  const ftInfo = footTypes[result.foot_type];
  const FootTypeIcon = footTypeIcons[ftInfo.icon] ?? ActivityIcon;

  useEffect(() => {
    if (analysisId) {
      getAnalysisRating(analysisId).then((r) => {
        if (r.rating) {
          setExistingAnalysisRating(r.rating);
          setSelectedRating(r.rating);
          setRatingFeedback(r.feedback ?? '');
        }
      });
    }
  }, [analysisId]);

  const handleOpenRatingModal = () => {
    setRatingSubmitted(false);
    setRatingError(null);
    setShowRatingModal(true);
  };

  const handleSubmitAnalysisRating = async () => {
    if (selectedRating < 1 || selectedRating > 5) return;
    if (!analysisId) {
      setRatingError("Your analysis is still saving — please wait a moment and try again.");
      return;
    }
    setRatingError(null);
    setSubmittingRating(true);
    const ok = await updateAnalysisRating(analysisId, selectedRating, ratingFeedback.trim() || undefined);
    setSubmittingRating(false);
    if (ok) {
      setRatingSubmitted(true);
      setExistingAnalysisRating(selectedRating);
    } else {
      setRatingError("Could not save your rating. Please check your connection and try again.");
    }
  };

  const handleDownload = () => {
    const report = generateReportText(result);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartShoeAdvisor-Report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `Smart Shoe Advisor Recommendation:\n\nShoe: ${result.recommended_shoe}\nFoot Length: ${result.foot_length}\nFoot Type: ${result.foot_type_label}\nSize: ${result.shoe_size.uk} / ${result.shoe_size.us} / ${result.shoe_size.eu} / ${result.shoe_size.ind}\nConfidence: ${result.confidence}%`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Smart Shoe Advisor Result', text: shareText }); } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(shareText); alert('Result copied to clipboard!'); } catch { /* ignore */ }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">


      <header className="sticky top-0 z-40 glass border-b border-border/60 dark:border-card/5">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Button onClick={onBack} className="glass-card p-2.5  transition-transform">
            <ArrowLeft size={20} className="text-primary dark:text-primary" />
          </Button>
          <Logo size="sm" />
          <HomeButton onClick={onHome} />
        </div>
      </header>

      <div ref={reportRef} className="max-w-4xl mx-auto px-5 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Upload', 'Activity', 'Analysis', 'Result'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${i <= 3 ? 'w-8 bg-primary' : 'w-2 bg-muted dark:bg-card/10'}`} />
              <span className={`text-xs font-medium hidden sm:inline ${i <= 3 ? 'text-primary dark:text-primary' : 'text-muted-foreground'}`}>{step}</span>
            </div>
          ))}
        </div>

        {/* Hero result */}
        <div className="glass-card p-6 md:p-8 mb-6 relative overflow-hidden">

          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-shrink-0">

              <img src={result.image} alt={result.recommended_shoe} className="relative h-44 w-44 md:h-52 md:w-52 object-cover rounded-lg shadow-xl " />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 mb-3">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-semibold text-primary dark:text-primary">AI Recommended</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">{result.recommended_shoe}</h2>
              <p className="text-muted-foreground dark:text-muted-foreground mb-3">by {result.brand}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className="flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-md">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm font-semibold text-success dark:text-success">{result.confidence}% Confidence</span>
                </div>
                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm font-medium">{result.priceRange}</span>
              </div>
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center md:justify-start">
                  {result.tags.map((tag) => (
                    <span key={tag} className="glass px-2.5 py-1 rounded-lg text-xs font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Foot Type Classification */}
        <div className="glass-card p-5 mb-6 relative overflow-hidden">
          <div className={`absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-primary to-primary opacity-10 blur-3xl`} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg`}>
                <FootTypeIcon size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{result.foot_type_label}</h3>
                <p className="text-xs text-muted-foreground">{ftInfo.prevalence} · Arch height: {result.arch_height}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed mb-3">{result.foot_type_description}</p>
            <div className="flex items-start gap-2 glass p-3 rounded-lg">
              <Sparkles size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">{result.foot_type_recommendation}</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="glass px-3 py-1.5 rounded-md text-xs">
                <span className="text-muted-foreground">Pronation: </span>
                <span className="font-semibold">{result.pronation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <InfoCard icon={Ruler} label="Foot Length" value={result.foot_length} accent />
          <InfoCard icon={Footprints} label="Foot Type" value={result.foot_type_label} />
          <InfoCard icon={ActivityIcon} label="Selected Activity" value={activity?.label ?? result.activity_label} />
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <Ruler size={18} className="text-primary-foreground" />
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-normal">Shoe Size</p>
              {result.ruler_detected && (
                <span className="ml-auto text-[10px] font-semibold text-success dark:text-success flex items-center gap-1">
                  <Check size={10} /> Ruler detected
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="glass px-3 py-1.5 rounded-lg text-sm font-semibold">{result.shoe_size.uk}</span>
              <span className="glass px-3 py-1.5 rounded-lg text-sm font-semibold">{result.shoe_size.us}</span>
              <span className="glass px-3 py-1.5 rounded-lg text-sm font-semibold">{result.shoe_size.eu}</span>
              <span className="glass px-3 py-1.5 rounded-lg text-sm font-semibold text-primary dark:text-primary">{result.shoe_size.ind} (India)</span>
            </div>
          </div>
        </div>

        {/* Visual measurement diagram */}
        <div className="mb-6">
          <FootDiagram
            footLengthCm={parseFloat(result.foot_length.replace(/[^\d.]/g, '')) || 0}
            footWidthCm={(parseFloat(result.foot_length.replace(/[^\d.]/g, '')) || 0) * 0.38}
            footType={result.foot_type}
          />
        </div>

        {/* Reason */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" />
            <h3 className="font-semibold">Why this shoe?</h3>
          </div>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">{result.reason}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {result.features.map((f) => (
              <span key={f} className="glass px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1">
                <Check size={12} className="text-success" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Ratings */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <RatingBar label="Comfort Rating" value={result.comfort} icon={Star} color="bg-warning" />
          <RatingBar label="Support Rating" value={result.support} icon={Shield} color="bg-primary" />
          <RatingBar label="Durability Rating" value={result.durability} icon={Wrench} color="bg-success" />
        </div>

        {/* Alternative recommendations */}
        {result.alternatives.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              More great options for you
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {result.alternatives.map((alt, i) => (
                <Button
                  key={alt.shoeName}
                  onClick={() => setSelectedAlt(selectedAlt === i ? null : i)}
                  className={`glass-card p-4 text-left transition-all duration-300 hover:-translate-y-1
                    ${selectedAlt === i ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}`}
                >
                  <div className="flex gap-4">
                    <img src={alt.image} alt={alt.shoeName} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{alt.shoeName}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{alt.brand} · {alt.priceRange}</p>
                      <div className="flex flex-wrap gap-1">
                        {alt.tags.map((t) => (
                          <span key={t} className="glass px-2 py-0.5 rounded-md text-[10px] font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {selectedAlt === i && (
                    <div className="mt-3 animate-fade-in">
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed mb-3">{alt.reason}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="glass p-2 rounded-md">
                          <p className="text-[10px] text-muted-foreground">Comfort</p>
                          <p className="text-sm font-bold gradient-text">{alt.comfort}</p>
                        </div>
                        <div className="glass p-2 rounded-md">
                          <p className="text-[10px] text-muted-foreground">Support</p>
                          <p className="text-sm font-bold gradient-text">{alt.support}</p>
                        </div>
                        <div className="glass p-2 rounded-md">
                          <p className="text-[10px] text-muted-foreground">Durability</p>
                          <p className="text-sm font-bold gradient-text">{alt.durability}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Button>
              ))}
            </div>
        </div>
      )}

      {/* Foot health tips & wrong-shoe hazards */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div className="glass-card p-5 md:p-6 relative overflow-hidden">

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-success flex items-center justify-center shadow-lg">
                <Heart size={20} className="text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Healthy Foot Tips</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Measure your feet every 6–12 months — foot size changes with age and activity.',
                'Rotate between 2–3 pairs of shoes so each can fully dry and decompress.',
                'Replace worn shoes after 300–500 miles or when the tread/midsole feels flat.',
                'Wear moisture-wicking socks to reduce blisters, fungus, and odor.',
                'Trim toenails straight across to prevent painful ingrown nails.',
                'Stretch calves and plantar fascia daily, especially after sports or long walks.',
                'Choose shoes designed for your specific activity and surface.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                  <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 relative overflow-hidden">

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-destructive to-destructive flex items-center justify-center shadow-lg">
                <AlertTriangle size={20} className="text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Hazards of Wrong Shoes</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Blisters, corns, and calluses from friction and pressure points.',
                'Bunions and hammertoes caused by narrow toe boxes over time.',
                'Plantar fasciitis and chronic heel pain from poor arch support.',
                'Knee, hip, and lower-back pain due to misaligned gait.',
                'Higher risk of ankle sprains when shoes lack stability or grip.',
                'Ingrown toenails and bruised nails from tight or short footwear.',
                'Reduced athletic performance and faster fatigue during activity.',
              ].map((hazard, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                  <AlertTriangle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                  {hazard}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Rate this analysis */}
        <div className="mb-6 glass-card p-6 text-center relative overflow-hidden">

          <div className="relative z-10">
            {existingAnalysisRating !== null && !showRatingModal ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={24} className={`transition-all duration-300 ${s <= existingAnalysisRating ? 'text-warning fill-warning scale-110' : 'text-muted-foreground dark:text-muted-foreground'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground">You rated this analysis</span>
                  <span className="text-muted-foreground dark:text-muted-foreground">·</span>
                  <Button onClick={handleOpenRatingModal} className="text-sm text-primary hover:text-primary dark:text-primary dark:hover:text-primary font-semibold transition-colors">Edit rating</Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleOpenRatingModal} className="group inline-flex flex-col items-center gap-2 py-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={22} className="text-muted-foreground dark:text-muted-foreground group-hover:text-warning dark:group-hover:text-warning transition-colors duration-300" style={{ transitionDelay: `${s * 40}ms` }} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors">Rate this analysis</span>
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <Button onClick={handleDownload} className="btn-primary ripple group flex items-center justify-center gap-2">
            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
            Download Report
          </Button>
          <Button onClick={handleShare} className="btn-ghost flex items-center justify-center gap-2">
            <Share2 size={20} className="text-primary" />
            Share Result
          </Button>
          <Button onClick={onAnalyzeAgain} className="btn-ghost flex items-center justify-center gap-2">
            <RefreshCw size={20} className="text-primary" />
            Analyze Again
          </Button>
        </div>
      </div>

      {/* Analysis Rating Modal — outside screen-enter so position:fixed works */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-overlay/60 dark:bg-overlay/70 backdrop-blur-md animate-fade-in" onClick={() => setShowRatingModal(false)}>
          <div className="bg-card dark:bg-foreground border border-border dark:border-border rounded-lg shadow-2xl p-8 max-w-md w-full animate-bounce-in relative" onClick={(e) => e.stopPropagation()}>
            <Button onClick={() => setShowRatingModal(false)} className="absolute top-4 right-4 p-2 rounded-md hover:bg-muted dark:hover:bg-foreground transition-colors">
              <X size={20} className="text-muted-foreground dark:text-muted-foreground" />
            </Button>
            {ratingSubmitted ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-success dark:bg-success/20 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                  <Star size={32} className="text-success fill-success" />
                </div>
                <p className="font-semibold text-xl mb-1 text-foreground dark:text-muted-foreground">Thank you for your feedback!</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Your rating for this analysis has been saved.</p>
                <Button onClick={() => setShowRatingModal(false)} className="btn-ghost mt-6 inline-flex items-center gap-2">
                  <Check size={16} className="text-success" />
                  Done
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-warning dark:bg-warning/10 border border-warning dark:border-warning/20 px-3 py-1.5 rounded-full mb-4">
                  <Star size={14} className="text-warning fill-warning" />
                  <span className="text-xs font-semibold text-warning dark:text-warning">{existingAnalysisRating ? 'Update Rating' : 'Rate This Analysis'}</span>
                </div>
                <h3 className="font-bold text-xl mb-1 text-foreground dark:text-muted-foreground">How accurate was this recommendation?</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">Rate this analysis to help improve future recommendations.</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Button key={s} onClick={() => setSelectedRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} className="p-1 transition-transform hover:scale-105 active:scale-110" aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}>
                      <Star size={40} className={`transition-colors duration-200 ${s <= (hoverRating || selectedRating) ? 'text-warning fill-warning' : 'text-muted-foreground dark:text-muted-foreground hover:text-warning'}`} />
                    </Button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <div className="animate-fade-in space-y-4 text-left">
                    <textarea value={ratingFeedback} onChange={(e) => setRatingFeedback(e.target.value)} placeholder="Optional: tell us about the recommendation..." maxLength={300} className="w-full bg-muted dark:bg-foreground border border-border dark:border-border rounded-lg px-4 py-3 text-sm text-foreground dark:text-muted-foreground placeholder-muted-foreground dark:placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" rows={3} />
                    {ratingError && (
                      <p className="text-sm text-destructive dark:text-destructive text-center bg-destructive dark:bg-destructive/10 rounded-md px-3 py-2">{ratingError}</p>
                    )}
                    <Button onClick={handleSubmitAnalysisRating} disabled={submittingRating} className="btn-primary ripple group w-full inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      {submittingRating ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                      {submittingRating ? 'Submitting...' : existingAnalysisRating ? 'Update Rating' : 'Submit Rating'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function generateReportText(r: AnalysisResult): string {
  return `
==================================================
        Smart Shoe Advisor
              AI Analysis Report
==================================================

Date: ${new Date().toLocaleString()}

------------- FOOT ANALYSIS -------------

Foot Length:     ${r.foot_length}
Ruler Detected:  ${r.ruler_detected ? 'Yes (measured)' : 'No (estimated)'}
Foot Type:       ${r.foot_type_label}
Arch Height:     ${r.arch_height}
Pronation:       ${r.pronation}

Description:     ${r.foot_type_description}
Recommendation:  ${r.foot_type_recommendation}

------------- SHOE SIZE -------------

UK Size:         ${r.shoe_size.uk}
US Size:         ${r.shoe_size.us}
EU Size:         ${r.shoe_size.eu}
Indian Size:     ${r.shoe_size.ind}

------------- RECOMMENDATION -------------

Activity:        ${r.activity_label}
Recommended:     ${r.recommended_shoe}
Brand:           ${r.brand}
Price Range:     ${r.priceRange}
Confidence:      ${r.confidence}%
Tags:            ${r.tags.join(', ')}

------------- RATINGS -------------

Comfort:         ${r.comfort}/10
Support:         ${r.support}/10
Durability:      ${r.durability}/10

------------- REASON -------------

${r.reason}

Key Features: ${r.features.join(', ')}

------------- ALTERNATIVES -------------

${r.alternatives.map((a, i) => `${i + 1}. ${a.shoeName} (${a.brand})
   Comfort: ${a.comfort}/10 | Support: ${a.support}/10 | Durability: ${a.durability}/10
   Price: ${a.priceRange}
   Tags: ${a.tags.join(', ')}`).join('\n\n')}

--------------------------------------------------
Generated by Smart Shoe Advisor — AI Powered Foot Analysis
`;
}
