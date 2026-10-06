import Button from '@/components/AdvisorButton';
import { useEffect, useState } from 'react';
import { Star, Trash2, X, Shield, MessageSquare, Activity, RefreshCw } from 'lucide-react';
import {
  getAllAppRatings,
  getAllAnalysisRatings,
  clearAllAppRatings,
  clearAllAnalysisRatings,
  type AdminAppRating,
  type AdminAnalysisRating,
} from '@/lib/admin';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [appRatings, setAppRatings] = useState<AdminAppRating[]>([]);
  const [analysisRatings, setAnalysisRatings] = useState<AdminAnalysisRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = async () => {
    setLoading(true);
    const [ar, anr] = await Promise.all([getAllAppRatings(), getAllAnalysisRatings()]);
    setAppRatings(ar);
    setAnalysisRatings(anr);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleClearApp = async () => {
    if (!confirm('Clear ALL app ratings? This cannot be undone.')) return;
    setClearing(true);
    await clearAllAppRatings();
    setClearing(false);
    load();
  };

  const handleClearAnalysis = async () => {
    if (!confirm('Clear ALL analysis ratings? This cannot be undone.')) return;
    setClearing(true);
    await clearAllAnalysisRatings();
    setClearing(false);
    load();
  };

  const avgApp = appRatings.length > 0 ? (appRatings.reduce((a, r) => a + r.rating, 0) / appRatings.length).toFixed(1) : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-bounce-in relative" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 glass-card border-b border-card/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h2 className="font-bold text-lg">Creator Admin Panel</h2>
          </div>
          <Button onClick={onClose} className="p-2  transition-transform">
            <X size={20} className="text-muted-foreground" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* App Ratings */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-warning fill-warning" />
                    <h3 className="font-semibold">App Ratings</h3>
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">({appRatings.length} total, avg {avgApp})</span>
                  </div>
                  <Button
                    onClick={handleClearApp}
                    disabled={clearing || appRatings.length === 0}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </Button>
                </div>
                {appRatings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No app ratings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {appRatings.map((r) => (
                      <div key={r.id} className="glass rounded-lg p-4 flex items-start gap-3">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= r.rating ? 'text-warning fill-warning' : 'text-muted-foreground dark:text-muted-foreground'} />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          {r.feedback ? (
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground flex items-start gap-1.5">
                              <MessageSquare size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                              {r.feedback}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No written feedback</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Analysis Ratings */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-primary" />
                    <h3 className="font-semibold">Analysis Ratings</h3>
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">({analysisRatings.length} total)</span>
                  </div>
                  <Button
                    onClick={handleClearAnalysis}
                    disabled={clearing || analysisRatings.length === 0}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </Button>
                </div>
                {analysisRatings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No analysis ratings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisRatings.map((r) => (
                      <div key={r.id} className="glass rounded-lg p-4 flex items-start gap-3">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= (r.rating ?? 0) ? 'text-warning fill-warning' : 'text-muted-foreground dark:text-muted-foreground'} />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{r.recommended_shoe} · {r.brand}</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">{r.activity_label}</p>
                          {r.rating_feedback && (
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 flex items-start gap-1.5">
                              <MessageSquare size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                              {r.rating_feedback}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
