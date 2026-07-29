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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-bounce-in relative" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 glass-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-blue-500" />
            <h2 className="font-bold text-lg">Creator Admin Panel</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:scale-110 transition-transform">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* App Ratings */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-amber-500 fill-amber-500" />
                    <h3 className="font-semibold">App Ratings</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({appRatings.length} total, avg {avgApp})</span>
                  </div>
                  <button
                    onClick={handleClearApp}
                    disabled={clearing || appRatings.length === 0}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </button>
                </div>
                {appRatings.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No app ratings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {appRatings.map((r) => (
                      <div key={r.id} className="glass rounded-2xl p-4 flex items-start gap-3">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'} />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          {r.feedback ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                              <MessageSquare size={12} className="mt-0.5 flex-shrink-0 text-gray-400" />
                              {r.feedback}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No written feedback</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
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
                    <Activity size={18} className="text-blue-500" />
                    <h3 className="font-semibold">Analysis Ratings</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({analysisRatings.length} total)</span>
                  </div>
                  <button
                    onClick={handleClearAnalysis}
                    disabled={clearing || analysisRatings.length === 0}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </button>
                </div>
                {analysisRatings.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No analysis ratings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisRatings.map((r) => (
                      <div key={r.id} className="glass rounded-2xl p-4 flex items-start gap-3">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= (r.rating ?? 0) ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'} />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{r.recommended_shoe} · {r.brand}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{r.activity_label}</p>
                          {r.rating_feedback && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-start gap-1.5">
                              <MessageSquare size={12} className="mt-0.5 flex-shrink-0 text-gray-400" />
                              {r.rating_feedback}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
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
