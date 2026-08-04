import { useEffect, useState } from 'react';
import { Motion } from '@/components/Animation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, Scan, Ruler, Footprints, Sparkles, Star, Activity as ActivityIcon, Zap, ArrowRight, LogOut, History, Trash2, Calendar, Brain, GitCompare, X, TrendingUp, TrendingDown, Minus, MessageSquare, Send, Shield, Check } from 'lucide-react';
import Logo from '@/components/Logo';
import { loadHistory, deleteAnalysis, type SavedAnalysis } from '@/lib/history';
import { getUserRating, saveUserRating, getRatingStats, type AppRating } from '@/lib/ratings';
import { isCreator } from '@/lib/admin';
import AdminPanel from '@/screens/AdminPanel';
import InstallAppButton from '@/components/InstallAppButton';

const features = [
  { icon: Scan, title: 'AI Foot Analysis', desc: 'Advanced computer vision scans your foot in seconds', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Ruler, title: 'Accurate Shoe Size Prediction', desc: 'Precise measurements across UK, US & EU standards', gradient: 'from-cyan-500 to-teal-500' },
  { icon: Footprints, title: 'Foot Type & Arch Detection', desc: 'Classifies flat foot, arch type & pronation', gradient: 'from-teal-500 to-emerald-500' },
  { icon: Sparkles, title: 'Personalized Shoe Recommendation', desc: 'AI matches the perfect shoe to your lifestyle', gradient: 'from-emerald-500 to-green-500' },
];



interface HomeScreenProps {
  onGetStarted: () => void;
  onHowItWorks: () => void;
  historyTick: number;
  justFinishedFirstAnalysis: boolean;
  onAppRatingDismissed: () => void;
}

export default function HomeScreen({ onGetStarted, onHowItWorks, historyTick, justFinishedFirstAnalysis, onAppRatingDismissed }: HomeScreenProps) {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [userRating, setUserRating] = useState<AppRating | null>(null);
  const [ratingStats, setRatingStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showAppRatingModal, setShowAppRatingModal] = useState(false);
  const [creator, setCreator] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    loadHistory().then((items) => {
      if (!cancelled) {
        setHistory(items);
        setLoadingHistory(false);
      }
    });
    getUserRating().then((r) => {
      if (!cancelled) {
        setUserRating(r);
        if (r) setSelectedRating(r.rating);
      }
    });
    getRatingStats().then((s) => {
      if (!cancelled) setRatingStats(s);
    });
    isCreator().then((c) => {
      if (!cancelled) setCreator(c);
    });
    return () => { cancelled = true; };
  }, [historyTick]);

  useEffect(() => {
    if (justFinishedFirstAnalysis && !userRating) {
      setShowAppRatingModal(true);
      setRatingSubmitted(false);
    }
  }, [justFinishedFirstAnalysis, userRating]);

  const handleDelete = async (id: string) => {
    const ok = await deleteAnalysis(id);
    if (ok) setHistory((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  const handleSubmitRating = async () => {
    if (selectedRating < 1 || selectedRating > 5) return;
    setSubmittingRating(true);
    const ok = await saveUserRating(selectedRating, ratingFeedback.trim() || undefined);
    setSubmittingRating(false);
    if (ok) {
      setRatingSubmitted(true);
      setUserRating({ id: 'temp', rating: selectedRating, feedback: ratingFeedback || null, created_at: new Date().toISOString() });
      const stats = await getRatingStats();
      setRatingStats(stats);
      onAppRatingDismissed();
    }
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      setShowCompareModal(true);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedForCompare([]);
    setShowCompareModal(false);
  };

  const compareItems = selectedForCompare
    .map((id) => history.find((h) => h.id === id))
    .filter((a): a is SavedAnalysis => a !== undefined);

  const userEmail = user?.email ?? '';
  const initials = userEmail.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-gray-200/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggle}
              className="glass-card p-2.5 hover:scale-110 transition-transform duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} className="text-blue-600" /> : <Sun size={20} className="text-yellow-400" />}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="glass-card h-10 w-10 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform duration-300"
                aria-label="Account menu"
              >
                {initials}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 glass-card p-4 z-50 animate-fade-in">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Signed in as</p>
                    <p className="text-sm font-semibold truncate mb-3">{userEmail}</p>
                    {creator && (
                      <button
                        onClick={() => { setMenuOpen(false); setShowAdminPanel(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors mb-2"
                      >
                        <Shield size={16} />
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-12 pb-8 md:pt-20 md:pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 w-fit">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">AI Engine Online</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Smart Shoe <span className="gradient-text">Advisor</span>
            </h1>

            <p className="text-xl font-bold text-black dark:text-white max-w-md leading-relaxed">
              AI Powered Foot Analysis & Intelligent Shoe Recommendation
            </p>

            <p className="text-sm font-mono text-blue-600 dark:text-cyan-400 tracking-wide uppercase">
              Scan. Measure. Match. — Computer Vision in Your Browser.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onGetStarted} className="btn-primary ripple group w-fit flex items-center gap-2 text-lg">
                Get Started
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onHowItWorks} className="btn-ghost group w-fit flex items-center gap-2 text-base">
                <Brain size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                How It Works
              </button>
              <InstallAppButton />
            </div>
          </div>

          {/* Hero sneaker */}
          <Motion className="relative flex items-center justify-center">
            <div className="absolute h-72 w-72 md:h-96 md:w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/20 blur-2xl" />
            <div className="absolute h-60 w-60 md:h-80 md:w-80 rounded-full border-2 border-blue-400/20 animate-spin-slow" />
            <img
              src="https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Premium sneaker"
              className="relative z-10 max-w-full h-auto animate-float drop-shadow-2xl rounded-3xl"
            />
            <div className="absolute top-8 right-4 glass-card px-3 py-2 rounded-2xl animate-float-slow">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">AI Scanned ✓</span>
            </div>
          </Motion>
        </div>
      </section>

      {/* Analysis history */}
      <section className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex items-center gap-2.5 mb-5">
          <History size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold">Your Analysis History</h2>
          {history.length > 0 && (
            <span className="glass px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400">
              {history.length}
            </span>
          )}
          {history.length >= 2 && (
            <div className="ml-auto flex items-center gap-2">
              {compareMode && (
                <>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedForCompare.length}/2 selected
                  </span>
                  <button
                    onClick={handleCompare}
                    disabled={selectedForCompare.length !== 2}
                    className="glass-card px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <GitCompare size={14} className="text-blue-500" />
                    Compare
                  </button>
                  <button
                    onClick={exitCompareMode}
                    className="glass-card px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    <X size={14} className="text-red-500" />
                    Cancel
                  </button>
                </>
              )}
              {!compareMode && (
                <button
                  onClick={() => setCompareMode(true)}
                  className="glass-card px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
                >
                  <GitCompare size={14} className="text-blue-500" />
                  Compare
                </button>
              )}
            </div>
          )}
        </div>

        {loadingHistory ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card p-4">
                <div className="h-32 skeleton rounded-2xl mb-3" />
                <div className="h-4 skeleton rounded w-2/3 mb-2" />
                <div className="h-3 skeleton rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Footprints size={26} className="text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No analyses yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
              Run your first foot analysis and it will be saved here for you to revisit anytime.
            </p>
            <button onClick={onGetStarted} className="btn-primary ripple group inline-flex items-center gap-2">
              Start Your First Analysis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item, i) => {
              const isSelected = selectedForCompare.includes(item.id);
              return (
              <Motion
                key={item.id}
                transition={{ delay: Math.min(i * 0.06, 0.4) }}
                className={`glass-card p-4 group hover:-translate-y-1 transition-all duration-300 relative ${isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''} ${compareMode ? 'cursor-pointer' : ''}`}
                onClick={compareMode ? () => toggleCompareSelection(item.id) : undefined}
              >
                {compareMode && (
                  <div className={`absolute top-3 right-3 z-10 h-6 w-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600' : 'glass-card'}`}>
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                )}
                <div className="relative rounded-2xl overflow-hidden mb-3">
                  <img src={item.image} alt={item.recommended_shoe} className="w-full h-32 object-cover" />
                  <div className="absolute top-2 right-2 glass-card px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">{item.confidence}%</span>
                  </div>
                  {!compareMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="absolute top-2 left-2 glass-card p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                      aria-label="Delete analysis"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  )}
                </div>
                <h3 className="font-semibold text-sm truncate">{item.recommended_shoe}</h3>
                <p className="text-xs text-gray-400 mb-2">{item.brand} · {item.activity_label}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="glass px-2 py-0.5 rounded-md text-[10px] font-medium">{item.shoe_size_uk}</span>
                  <span className="glass px-2 py-0.5 rounded-md text-[10px] font-medium">{item.foot_type_label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Calendar size={11} />
                  {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </Motion>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <Motion
              key={f.title}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 group hover:-translate-y-1.5 transition-all duration-300 cursor-default"
            >
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={26} className="text-white" />
              </div>
              <h3 className="font-semibold text-base mb-1.5 leading-snug">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </Motion>
          ))}
        </div>
      </section>

      {/* Community Rating & Rate the App */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="glass-card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-4">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Community Ratings</span>
            </div>
            {ratingStats.count > 0 ? (
              <>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={28}
                      className={s <= Math.round(ratingStats.average) ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}
                    />
                  ))}
                </div>
                <p className="text-3xl font-bold gradient-text">{ratingStats.average.toFixed(1)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Based on {ratingStats.count} {ratingStats.count === 1 ? 'rating' : 'ratings'}</p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No ratings yet — be the first to rate Smart Shoe Advisor!</p>
            )}
            <button
              onClick={() => { setShowAppRatingModal(true); setRatingSubmitted(false); }}
              className="mt-6 btn-primary ripple group inline-flex items-center gap-2"
            >
              <Star size={18} className="group-hover:scale-110 transition-transform" />
              {userRating ? 'Update Your Rating' : 'Rate Smart Shoe Advisor'}
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-12 pb-20">
        <Motion className="glass-card p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to find your perfect shoe?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
              Take a photo of your foot and let our AI analyze it to recommend the ideal shoe for your lifestyle.
            </p>
            <button onClick={onGetStarted} className="btn-primary ripple group inline-flex items-center gap-2 text-lg">
              Start Analysis
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Motion>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-sm text-gray-400">Smart Shoe Advisor. Built for innovation.</p>
        </div>
      </footer>

      {/* Comparison Modal */}
      {showCompareModal && compareItems.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={exitCompareMode}>
          <div className="glass-card p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <GitCompare size={22} className="text-blue-500" />
                <h2 className="text-xl font-bold">Side-by-Side Comparison</h2>
              </div>
              <button onClick={exitCompareMode} className="glass-card p-2 rounded-xl hover:scale-110 transition-transform">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {compareItems.map((item, idx) => (
                <div key={item.id} className="space-y-3">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 glass px-2 py-0.5 rounded-md">
                      Analysis {idx === 0 ? 'A' : 'B'}
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img src={item.image} alt={item.recommended_shoe} className="w-full h-32 object-cover" />
                  </div>
                  <h3 className="font-semibold text-sm text-center">{item.recommended_shoe}</h3>
                  <p className="text-xs text-gray-400 text-center">{item.brand}</p>
                </div>
              ))}
            </div>

            {/* Comparison rows */}
            <div className="mt-6 space-y-2">
              {[
                { label: 'Foot Length', getVal: (a: SavedAnalysis) => a.foot_length },
                { label: 'Shoe Size (UK)', getVal: (a: SavedAnalysis) => a.shoe_size_uk },
                { label: 'Shoe Size (EU)', getVal: (a: SavedAnalysis) => a.shoe_size_eu },
                { label: 'Foot Type', getVal: (a: SavedAnalysis) => a.foot_type_label },
                { label: 'Activity', getVal: (a: SavedAnalysis) => a.activity_label },
                { label: 'Confidence', getVal: (a: SavedAnalysis) => `${a.confidence}%` },
                { label: 'Comfort', getVal: (a: SavedAnalysis) => `${a.comfort}/10` },
                { label: 'Support', getVal: (a: SavedAnalysis) => `${a.support}/10` },
                { label: 'Durability', getVal: (a: SavedAnalysis) => `${a.durability}/10` },
                { label: 'Price Range', getVal: (a: SavedAnalysis) => a.price_range },
                { label: 'Date', getVal: (a: SavedAnalysis) => new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) },
              ].map((row) => {
                const valA = row.getVal(compareItems[0]);
                const valB = row.getVal(compareItems[1]);
                const isNumeric = row.label === 'Confidence' || row.label === 'Comfort' || row.label === 'Support' || row.label === 'Durability';
                const numA = parseFloat(valA);
                const numB = parseFloat(valB);
                const diff = isNumeric && !isNaN(numA) && !isNaN(numB) ? numB - numA : 0;
                const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
                const diffColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400';

                return (
                  <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 glass-card p-2.5">
                    <span className="text-xs text-gray-600 dark:text-gray-300 text-center font-medium">{valA}</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-gray-400 font-medium">{row.label}</span>
                      {isNumeric && diff !== 0 && (
                        <div className={`flex items-center gap-0.5 text-[10px] ${diffColor}`}>
                          <DiffIcon size={10} />
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-300 text-center font-medium">{valB}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* App Rating Modal */}
      {showAppRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { setShowAppRatingModal(false); onAppRatingDismissed(); }}>
          <div className="glass-card p-8 max-w-md w-full animate-bounce-in relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowAppRatingModal(false); onAppRatingDismissed(); }} className="absolute top-4 right-4 p-2 hover:scale-110 transition-transform">
              <X size={20} className="text-gray-500" />
            </button>
            {ratingSubmitted ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="text-green-500 fill-green-500" />
                </div>
                <p className="font-semibold text-xl mb-1">Thank you for your feedback!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your rating helps us improve Smart Shoe Advisor.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full mb-4">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{userRating ? 'Update Your Rating' : 'Rate Smart Shoe Advisor'}</span>
                </div>
                <h3 className="font-bold text-xl mb-1">{userRating ? 'Update your rating' : 'How would you rate Smart Shoe Advisor?'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your honest feedback helps us improve.</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-125 active:scale-110"
                      aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={40}
                        className={s <= (hoverRating || selectedRating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}
                      />
                    </button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <div className="animate-fade-in space-y-4">
                    <div className="relative">
                      <MessageSquare size={16} className="absolute left-3 top-3.5 text-gray-400" />
                      <textarea
                        value={ratingFeedback}
                        onChange={(e) => setRatingFeedback(e.target.value)}
                        placeholder="Optional: tell us what you think..."
                        maxLength={300}
                        className="w-full glass rounded-2xl pl-10 pr-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleSubmitRating}
                      disabled={submittingRating || selectedRating < 1}
                      className="btn-primary ripple group w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                      {submittingRating ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => { setShowAppRatingModal(false); onAppRatingDismissed(); }}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
}
