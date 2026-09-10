import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { API_BASE } from '../services/api.js';
import { Trophy, Medal, Star } from 'lucide-react';

const RANK_STYLES = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-slate-300 to-slate-400',
  3: 'from-orange-400 to-amber-600',
};

export default function Leaderboard({ compact = false, className = '' }) {
  const { t, user, stars } = useApp();
  const [data, setData] = useState({ users: [], userRank: null, userStars: null });

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const q = user ? `?email=${encodeURIComponent(user.email)}` : '';
      fetch(API_BASE + '/api/leaderboard' + q)
        .then(r => r.json())
        .then(d => { if (!cancelled) setData(d); })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [user, stars]); // eslint-disable-line react-hooks/exhaustive-deps

  const top = (data.users || []).slice(0, compact ? 5 : 10);
  const rankColor = (i) => RANK_STYLES[i + 1] || 'from-indigo-500 to-purple-600';
  const showRank = user && data.userRank;

  return (
    <div className={`glass-panel rounded-2xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={18} className="text-yellow-500" />
        <h3 className="font-bold text-slate-900 dark:text-white">{t.leaderboardTitle}</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t.topReaders}</p>

      {top.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">—</p>
      )}

      <div className="space-y-1">
        {top.map((u, i) => {
          const isMe = user && u.email === user.email;
          return (
            <div
              key={u.email}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                isMe ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-slate-50 dark:bg-white/5'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${rankColor(i)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {i + 1}
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0">
                {(u.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {u.name} {isMe && <span className="text-[10px] text-indigo-500">({t.activeUser})</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-yellow-500 shrink-0">
                <Star size={13} className="fill-yellow-400" />{u.stars}
              </div>
            </div>
          );
        })}
      </div>

      {showRank && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Medal size={15} className="text-indigo-500" />
            {t.yourRank}: <span className="font-bold text-slate-900 dark:text-white">#{data.userRank}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-yellow-500">
            <Star size={14} className="fill-yellow-400" />{user?.stars ?? data.userStars ?? stars}
          </div>
        </div>
      )}
    </div>
  );
}