import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Download, RefreshCw, Share2, Ruler, Footprints, Activity as ActivityIcon, Sparkles, Star, Shield, Wrench, Check, TrendingUp, TrendingDown, RotateCw, RotateCcw, Send, X, Heart, AlertTriangle, type LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import Logo from '@/components/Logo';
import FootDiagram from '@/components/FootDiagram';
import { activities, footTypes } from '@/data/shoes';
import type { AnalysisResult } from '@/data/shoes';
import { updateAnalysisRating, getAnalysisRating } from '@/lib/history';

interface ResultScreenProps {
  result: AnalysisResult;
  analysisId: string | null;
  onBack: () => void;
  onAnalyzeAgain: () => void;
}

function RatingBar({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  const pct = (value / 10) * 100;
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-8 w-8 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-auto text-lg font-bold gradient-text">{value.toFixed(1)}<span className="text-sm text-gray-400">/10</span></span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gray-200 dark:bg-white/10'}`}>
        <Icon size={18} className={accent ? 'text-white' : 'text-blue-500'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
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

export default function ResultScreen({ result, analysisId, onBack, onAnalyzeAgain }: ResultScreenProps) {
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
    a.download = `StrideAI-Report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `Stride AI Recommendation:\n\nShoe: ${result.recommended_shoe}\nFoot Length: ${result.foot_length}\nFoot Type: ${result.foot_type_label}\nSize: ${result.shoe_size.uk} / ${result.shoe_size.us} / ${result.shoe_size.eu}\nConfidence: ${result.confidence}%`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Stride AI Result', text: shareText }); } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(shareText); alert('Result copied to clipboard!'); } catch { /* ignore */ }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl -z-10" />

      <header className="sticky top-0 z-40 glass border-b border-gray-200/60 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={onBack} className="glass-card p-2.5 hover:scale-110 transition-transform">
            <ArrowLeft size={20} className="text-blue-600 dark:text-blue-400" />
          </button>
          <Logo size="sm" />
          <div className="w-10" />
        </div>
      </header>

      <div ref={reportRef} className="max-w-4xl mx-auto px-5 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Upload', 'Activity', 'Analysis', 'Result'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${i <= 3 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-white/10'}`} />
              <span className={`text-xs font-medium hidden sm:inline ${i <= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{step}</span>
            </div>
          ))}
        </div>

        {/* Hero result */}
        <div className="glass-card p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-2xl rounded-3xl" />
              <img src={result.image} alt={result.recommended_shoe} className="relative h-44 w-44 md:h-52 md:w-52 object-cover rounded-3xl shadow-xl animate-float" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 mb-3">
                <Sparkles size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">AI Recommended</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">{result.recommended_shoe}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-3">by {result.brand}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className="flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-xl">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">{result.confidence}% Confidence</span>
                </div>
                <span className="text-sm text-gray-400">·</span>
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
          <div className={`absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${ftInfo.color} opacity-10 blur-3xl`} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${ftInfo.color} flex items-center justify-center shadow-lg`}>
                <FootTypeIcon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{result.foot_type_label}</h3>
                <p className="text-xs text-gray-400">{ftInfo.prevalence} · Arch height: {result.arch_height}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{result.foot_type_description}</p>
            <div className="flex items-start gap-2 glass p-3 rounded-2xl">
              <Sparkles size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-300">{result.foot_type_recommendation}</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="glass px-3 py-1.5 rounded-xl text-xs">
                <span className="text-gray-400">Pronation: </span>
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Ruler size={18} className="text-white" />
              </div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Shoe Size</p>
              {result.ruler_detected && (
                <span className="ml-auto text-[10px] font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check size={10} /> Ruler detected
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="glass px-3 py-1.5 rounded-lg text-sm font-semibold">{result.shoe_size.uk}</span>
              <span className="glass px-3 py-1.5 rounded-lg text-sm font-semibold">{result.shoe_size.us}</span>
              <span className="glass px-3 py-1.5 rounded-lg text-sm font-semibold">{result.shoe_size.eu}</span>
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
            <Sparkles size={18} className="text-blue-500" />
            <h3 className="font-semibold">Why this shoe?</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{result.reason}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {result.features.map((f) => (
              <span key={f} className="glass px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1">
                <Check size={12} className="text-green-500" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Ratings */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <RatingBar label="Comfort Rating" value={result.comfort} icon={Star} color="bg-gradient-to-r from-yellow-400 to-orange-400" />
          <RatingBar label="Support Rating" value={result.support} icon={Shield} color="bg-gradient-to-r from-blue-500 to-cyan-500" />
          <RatingBar label="Durability Rating" value={result.durability} icon={Wrench} color="bg-gradient-to-r from-green-500 to-emerald-500" />
        </div>

        {/* Alternative recommendations */}
        {result.alternatives.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-500" />
              More great options for you
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {result.alternatives.map((alt, i) => (
                <button
                  key={alt.shoeName}
                  onClick={() => setSelectedAlt(selectedAlt === i ? null : i)}
                  className={`glass-card p-4 text-left transition-all duration-300 hover:-translate-y-1
                    ${selectedAlt === i ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''}`}
                >
                  <div className="flex gap-4">
                    <img src={alt.image} alt={alt.shoeName} className="h-20 w-20 rounded-2xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{alt.shoeName}</h4>
                      <p className="text-xs text-gray-400 mb-1">{alt.brand} · {alt.priceRange}</p>
                      <div className="flex flex-wrap gap-1">
                        {alt.tags.map((t) => (
                          <span key={t} className="glass px-2 py-0.5 rounded-md text-[10px] font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {selectedAlt === i && (
                    <div className="mt-3 animate-fade-in">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{alt.reason}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="glass p-2 rounded-xl">
                          <p className="text-[10px] text-gray-400">Comfort</p>
                          <p className="text-sm font-bold gradient-text">{alt.comfort}</p>
                        </div>
                        <div className="glass p-2 rounded-xl">
                          <p className="text-[10px] text-gray-400">Support</p>
                          <p className="text-sm font-bold gradient-text">{alt.support}</p>
                        </div>
                        <div className="glass p-2 rounded-xl">
                          <p className="text-[10px] text-gray-400">Durability</p>
                          <p className="text-sm font-bold gradient-text">{alt.durability}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
        </div>
      )}

      {/* Foot health tips & wrong-shoe hazards */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div className="glass-card p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-green-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Heart size={20} className="text-white" />
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
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle size={20} className="text-white" />
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
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  {hazard}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Rate this analysis */}
        <div className="mb-6 glass-card p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative z-10">
            {existingAnalysisRating !== null && !showRatingModal ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={24} className={`transition-all duration-300 ${s <= existingAnalysisRating ? 'text-amber-500 fill-amber-500 scale-110' : 'text-gray-300 dark:text-gray-600'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">You rated this analysis</span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <button onClick={handleOpenRatingModal} className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors">Edit rating</button>
                </div>
              </div>
            ) : (
              <button onClick={handleOpenRatingModal} className="group inline-flex flex-col items-center gap-2 py-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={22} className="text-gray-300 dark:text-gray-600 group-hover:text-amber-400 dark:group-hover:text-amber-500 transition-colors duration-300" style={{ transitionDelay: `${s * 40}ms` }} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Rate this analysis</span>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <button onClick={handleDownload} className="btn-primary ripple group flex items-center justify-center gap-2">
            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
            Download Report
          </button>
          <button onClick={handleShare} className="btn-ghost flex items-center justify-center gap-2">
            <Share2 size={20} className="text-blue-500" />
            Share Result
          </button>
          <button onClick={onAnalyzeAgain} className="btn-ghost flex items-center justify-center gap-2">
            <RefreshCw size={20} className="text-blue-500" />
            Analyze Again
          </button>
        </div>
      </div>

      {/* Analysis Rating Modal — outside screen-enter so position:fixed works */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-bounce-in relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowRatingModal(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
            {ratingSubmitted ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                  <Star size={32} className="text-green-500 fill-green-500" />
                </div>
                <p className="font-semibold text-xl mb-1 text-gray-900 dark:text-gray-100">Thank you for your feedback!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your rating for this analysis has been saved.</p>
                <button onClick={() => setShowRatingModal(false)} className="btn-ghost mt-6 inline-flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Done
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-full mb-4">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{existingAnalysisRating ? 'Update Rating' : 'Rate This Analysis'}</span>
                </div>
                <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-gray-100">How accurate was this recommendation?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Rate this analysis to help improve future recommendations.</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setSelectedRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} className="p-1 transition-transform hover:scale-125 active:scale-110" aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}>
                      <Star size={40} className={`transition-colors duration-200 ${s <= (hoverRating || selectedRating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'}`} />
                    </button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <div className="animate-fade-in space-y-4 text-left">
                    <textarea value={ratingFeedback} onChange={(e) => setRatingFeedback(e.target.value)} placeholder="Optional: tell us about the recommendation..." maxLength={300} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all" rows={3} />
                    {ratingError && (
                      <p className="text-sm text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{ratingError}</p>
                    )}
                    <button onClick={handleSubmitAnalysisRating} disabled={submittingRating} className="btn-primary ripple group w-full inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      {submittingRating ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                      {submittingRating ? 'Submitting...' : existingAnalysisRating ? 'Update Rating' : 'Submit Rating'}
                    </button>
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
        Stride AI
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
Generated by Stride AI — AI Powered Foot Analysis
`;
}
