import advisorShoe from '@/assets/advisor-shoe.jpg';
import Button from '@/components/AdvisorButton';
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
  { icon: Scan, title: 'AI Foot Analysis', desc: 'Advanced computer vision scans your foot in seconds', gradient: 'from-primary to-primary' },
  { icon: Ruler, title: 'Accurate Shoe Size Prediction', desc: 'Precise measurements across UK, US & EU standards', gradient: 'from-primary to-primary' },
  { icon: Footprints, title: 'Foot Type & Arch Detection', desc: 'Classifies flat foot, arch type & pronation', gradient: 'from-primary to-success' },
  { icon: Sparkles, title: 'Personalized Shoe Recommendation', desc: 'AI matches the perfect shoe to your lifestyle', gradient: 'from-success to-success' },
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


      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/60 dark:border-card/5">
        <div className="home-nav">
          <Logo size="sm" />
          <div className="home-nav-links"><Button onClick={onGetStarted} className="nav-link">Find my fit</Button><Button onClick={onHowItWorks} className="nav-link">How it works</Button><InstallAppButton />
            <Button
              onClick={toggle}
              className="glass-card p-2.5  transition-transform duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-warning" />}
            </Button>

            {/* User menu */}
            <div className="relative">
              <Button
                onClick={() => setMenuOpen((o) => !o)}
                className="glass-card h-10 w-10 rounded-full flex items-center justify-center font-bold text-primary dark:text-primary  transition-transform duration-300"
                aria-label="Account menu"
              >
                {initials}
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 glass-card p-4 z-50 animate-fade-in">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-normal mb-1">Signed in as</p>
                    <p className="text-sm font-semibold truncate mb-3">{userEmail}</p>
                    {creator && (
                      <Button
                        onClick={() => { setMenuOpen(false); setShowAdminPanel(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary/10 transition-colors mb-2"
                      >
                        <Shield size={16} />
                        Admin Panel
                      </Button>
                    )}
                    <Button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-destructive dark:text-destructive hover:bg-destructive dark:hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="home-hero">
        <img src={advisorShoe} alt="White technical running shoe with green accents" width={1600} height={1024} className="home-hero-image" />
        <div className="home-hero-inner"><div className="home-hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL AI SHOE ADVISOR</span>
          <h1>FootFit <span>AI</span></h1>
          <p>A better fit starts with you. Discover shoes matched to your feet, your movement, and your everyday life.</p>
          <div className="hero-actions"><Button onClick={onGetStarted} className="btn-primary">Find my fit <ArrowRight size={18} /></Button><Button onClick={onHowItWorks} className="btn-ghost">How it works <Brain size={17} /></Button></div>
          <div className="hero-detail"><span><Ruler size={15} /> UK · US · EU · India</span><span><Footprints size={15} /> Made for your feet</span></div>
        </div></div>
      </section>
      <div className="journey-strip">
        {[['01', 'Capture your feet', 'Two photos. One clear picture.'], ['02', 'Measure & understand', 'Your dimensions, arch, and activity.'], ['03', 'Meet your match', 'Personalized shoes. Confident steps.']].map(([n,title,desc]) => <div className="journey-item" key={n}><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div></div>)}
      </div>

      {/* Analysis history */}
      <section className="home-section">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <History size={20} className="text-primary dark:text-primary" />
          <h2 className="text-xl font-bold">Your Analysis History</h2>
          {history.length > 0 && (
            <span className="glass px-2.5 py-1 rounded-lg text-xs font-semibold text-primary dark:text-primary">
              {history.length}
            </span>
          )}
          {history.length >= 2 && (
            <div className="ml-auto flex items-center gap-2">
              {compareMode && (
                <>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {selectedForCompare.length}/2 selected
                  </span>
                  <Button
                    onClick={handleCompare}
                    disabled={selectedForCompare.length !== 2}
                    className="glass-card px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <GitCompare size={14} className="text-primary" />
                    Compare
                  </Button>
                  <Button
                    onClick={exitCompareMode}
                    className="glass-card px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    <X size={14} className="text-destructive" />
                    Cancel
                  </Button>
                </>
              )}
              {!compareMode && (
                <Button
                  onClick={() => setCompareMode(true)}
                  className="glass-card px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
                >
                  <GitCompare size={14} className="text-primary" />
                  Compare
                </Button>
              )}
            </div>
          )}
        </div>

        {loadingHistory ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card p-4">
                <div className="h-32 skeleton rounded-lg mb-3" />
                <div className="h-4 skeleton rounded w-2/3 mb-2" />
                <div className="h-3 skeleton rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="empty-history"><div className="empty-icon"><Footprints size={26} /></div><div className="min-w-0"><h3 className="font-semibold mb-1">Your next great fit starts here</h3><p className="text-sm text-muted-foreground">Your saved analyses will appear here after your first scan.</p></div><Button onClick={onGetStarted} className="btn-ghost">Start an analysis <ArrowRight size={16} /></Button></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item, i) => {
              const isSelected = selectedForCompare.includes(item.id);
              return (
              <Motion
                key={item.id}
                transition={{ delay: Math.min(i * 0.06, 0.4) }}
                className={`glass-card p-4 group hover:-translate-y-1 transition-all duration-300 relative ${isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''} ${compareMode ? 'cursor-pointer' : ''}`}
                onClick={compareMode ? () => toggleCompareSelection(item.id) : undefined}
              >
                {compareMode && (
                  <div className={`absolute top-3 right-3 z-10 h-6 w-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary' : 'glass-card'}`}>
                    {isSelected && <Check size={14} className="text-primary-foreground" />}
                  </div>
                )}
                <div className="relative rounded-lg overflow-hidden mb-3">
                  <img src={item.image} alt={item.recommended_shoe} className="w-full h-32 object-cover" />
                  <div className="absolute top-2 right-2 glass-card px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-semibold text-success dark:text-success">{item.confidence}%</span>
                  </div>
                  {!compareMode && (
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="absolute top-2 left-2 glass-card p-1.5 rounded-lg opacity-100 transition-opacity "
                      aria-label="Delete analysis"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  )}
                </div>
                <h3 className="font-semibold text-sm truncate">{item.recommended_shoe}</h3>
                <p className="text-xs text-muted-foreground mb-2">{item.brand} · {item.activity_label}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="glass px-2 py-0.5 rounded-md text-[10px] font-medium">{item.shoe_size_uk}</span>
                  <span className="glass px-2 py-0.5 rounded-md text-[10px] font-medium">{item.foot_type_label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
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
      <section className="home-section">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <Motion
              key={f.title}
              transition={{ delay: i * 0.1 }}
              className="feature-item"
            >
              <div className={`h-14 w-14 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center mb-4 shadow-lg group- transition-transform duration-300`}>
                <f.icon size={22} />
              </div>
              <h3 className="font-semibold text-base mb-1.5 leading-snug">{f.title}</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">{f.desc}</p>
            </Motion>
          ))}
        </div>
      </section>

      {/* Community Rating & Rate the App */}
      <section className="home-section">
        <div className="community-section">

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-4">
              <Star size={16} className="text-warning fill-warning" />
              <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Community Ratings</span>
            </div>
            {ratingStats.count > 0 ? (
              <>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={28}
                      className={s <= Math.round(ratingStats.average) ? 'text-warning fill-warning' : 'text-muted-foreground dark:text-muted-foreground'}
                    />
                  ))}
                </div>
                <p className="text-3xl font-bold gradient-text">{ratingStats.average.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">Based on {ratingStats.count} {ratingStats.count === 1 ? 'rating' : 'ratings'}</p>
              </>
            ) : (
              <p className="text-muted-foreground dark:text-muted-foreground">No ratings yet — be the first to rate FootFit AI!</p>
            )}
            <Button
              onClick={() => { setShowAppRatingModal(true); setRatingSubmitted(false); }}
              className="mt-6 btn-primary ripple group inline-flex items-center gap-2"
            >
              <Star size={18} className="group- transition-transform" />
              {userRating ? 'Update Your Rating' : 'Rate FootFit AI'}
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-12 pb-20">
        <Motion className="text-center py-8">


          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to find your perfect shoe?</h2>
            <p className="text-muted-foreground dark:text-muted-foreground mb-8 max-w-lg mx-auto">
              Take a photo of your foot and let our AI analyze it to recommend the ideal shoe for your lifestyle.
            </p>
            <Button onClick={onGetStarted} className="btn-primary ripple group inline-flex items-center gap-2 text-lg">
              Start Analysis
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Motion>
      </section>

      {/* Footer */}
      <footer className="border-t border-border dark:border-card/5 py-6">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-sm text-muted-foreground">FootFit AI. Built for innovation.</p>
        </div>
      </footer>

      {/* Comparison Modal */}
      {showCompareModal && compareItems.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-fade-in" onClick={exitCompareMode}>
          <div className="glass-card p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <GitCompare size={22} className="text-primary" />
                <h2 className="text-xl font-bold">Side-by-Side Comparison</h2>
              </div>
              <Button onClick={exitCompareMode} className="glass-card p-2 rounded-md  transition-transform">
                <X size={18} className="text-muted-foreground" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {compareItems.map((item, idx) => (
                <div key={item.id} className="space-y-3">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-primary dark:text-primary glass px-2 py-0.5 rounded-md">
                      Analysis {idx === 0 ? 'A' : 'B'}
                    </span>
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img src={item.image} alt={item.recommended_shoe} className="w-full h-32 object-cover" />
                  </div>
                  <h3 className="font-semibold text-sm text-center">{item.recommended_shoe}</h3>
                  <p className="text-xs text-muted-foreground text-center">{item.brand}</p>
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
                const diffColor = diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground';

                return (
                  <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 glass-card p-2.5">
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground text-center font-medium">{valA}</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground font-medium">{row.label}</span>
                      {isNumeric && diff !== 0 && (
                        <div className={`flex items-center gap-0.5 text-[10px] ${diffColor}`}>
                          <DiffIcon size={10} />
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground text-center font-medium">{valB}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* App Rating Modal */}
      {showAppRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-fade-in" onClick={() => { setShowAppRatingModal(false); onAppRatingDismissed(); }}>
          <div className="glass-card p-8 max-w-md w-full animate-bounce-in relative" onClick={(e) => e.stopPropagation()}>
            <Button onClick={() => { setShowAppRatingModal(false); onAppRatingDismissed(); }} className="absolute top-4 right-4 p-2  transition-transform">
              <X size={20} className="text-muted-foreground" />
            </Button>
            {ratingSubmitted ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="text-success fill-success" />
                </div>
                <p className="font-semibold text-xl mb-1">Thank you for your feedback!</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Your rating helps us improve FootFit AI.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full mb-4">
                  <Star size={14} className="text-warning fill-warning" />
                  <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">{userRating ? 'Update Your Rating' : 'Rate FootFit AI'}</span>
                </div>
                <h3 className="font-bold text-xl mb-1">{userRating ? 'Update your rating' : 'How would you rate FootFit AI?'}</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">Your honest feedback helps us improve.</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Button
                      key={s}
                      onClick={() => setSelectedRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-105 active:scale-110"
                      aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={40}
                        className={s <= (hoverRating || selectedRating) ? 'text-warning fill-warning' : 'text-muted-foreground dark:text-muted-foreground'}
                      />
                    </Button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <div className="animate-fade-in space-y-4">
                    <div className="relative">
                      <MessageSquare size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                      <textarea
                        value={ratingFeedback}
                        onChange={(e) => setRatingFeedback(e.target.value)}
                        placeholder="Optional: tell us what you think..."
                        maxLength={300}
                        className="w-full glass rounded-lg pl-10 pr-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleSubmitRating}
                      disabled={submittingRating || selectedRating < 1}
                      className="btn-primary ripple group w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                      {submittingRating ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
                    </Button>
                  </div>
                )}
                <Button
                  onClick={() => { setShowAppRatingModal(false); onAppRatingDismissed(); }}
                  className="mt-4 text-sm text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground transition-colors"
                >
                  Maybe later
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
}
