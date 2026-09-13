import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { siteConfig } from '../config.js';
import Leaderboard from './Leaderboard.jsx';
import { User, Mail, Lock, LogOut, ShieldCheck, ArrowRight, Star, Award, BookOpen, Brain, Trophy, Bookmark } from 'lucide-react';
import SavedItems from './SavedItems.jsx';

export default function UserProfile() {
  const { t, user, login, register, logout, setSession, stars, completedBooks, gamesPlayed } = useApp();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') await register(name, email, password);
      else await login(email, password);
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignIn = () => {
    setError('');
    const clientId = siteConfig.googleClientId;
    if (!clientId || clientId.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
      setError('Google Sign-In is not configured yet. Please use email login instead.');
      return;
    }
    const gsi = window.google?.accounts?.id;
    if (!gsi) {
      setError('Google Sign-In is not available. Please use email login.');
      return;
    }
    try {
      gsi.initialize({
        client_id: clientId,
        callback: async (response) => {
          setLoading(true);
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const data = await api('/auth/google', { method: 'POST', body: { email: payload.email, name: payload.name, sub: payload.sub } });
            setSession(data);
          } catch (err) {
            setError(err.message || 'Google authentication failed');
            setLoading(false);
          }
        },
        auto_select: false,
      });
      gsi.prompt();
    } catch (err) {
      setError(err?.message || 'Google authentication is not available.');
    }
  };

  useEffect(() => {
    if (window.google?.accounts?.id) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  if (!user) {
    return (
      <section id="profile" className="max-w-md mx-auto px-4 py-16 scroll-mt-16">
        <div className="glass-panel rounded-2xl p-4 mb-5 flex items-start gap-3 border border-indigo-400/30 bg-indigo-500/5">
          <User size={18} className="text-indigo-500 dark:text-indigo-300 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.guestModeDesc}</p>
        </div>
        <div className="glass-panel rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5">
            <User size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">{t.authTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">{t.authSub}</p>

          <div className="flex bg-slate-100 dark:bg-white/10 rounded-xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === m ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {m === 'login' ? t.loginTab : t.registerTab}
              </button>
            ))}
          </div>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white font-semibold mb-4 hover:bg-slate-50 dark:hover:bg-white/15 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t.googleSignIn}
          </button>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <label className="block mb-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t.nameLabel}</span>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 focus-within:border-indigo-400">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <input value={name} onChange={e => setName(e.target.value)} placeholder={t.nameLabel}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-white text-sm placeholder:text-slate-400" />
                </div>
              </label>
            )}
            <label className="block mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t.emailLabel}</span>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 focus-within:border-indigo-400">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"
                  className="w-full bg-transparent outline-none text-slate-900 dark:text-white text-sm placeholder:text-slate-400" />
              </div>
            </label>
            <label className="block mb-5">
              <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t.passwordLabel}</span>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 focus-within:border-indigo-400">
                <Lock size={16} className="text-slate-400 shrink-0" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-slate-900 dark:text-white text-sm placeholder:text-slate-400" />
              </div>
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors disabled:opacity-60">
              {loading ? '...' : (mode === 'login' ? t.loginBtn : t.registerBtn)}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-5">
            {mode === 'login' ? t.toRegisterHint : t.toLoginHint}{' '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-indigo-600 dark:text-indigo-300 font-semibold">
              {mode === 'login' ? t.toRegister : t.toLogin}
            </button>
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Bookmark size={18} className="text-indigo-500 dark:text-indigo-400" />{t.savedTitle}</h3>
          <SavedItems embedded />
        </div>
      </section>
    );
  }

  const completedBooksCount = completedBooks.length;
  const gamesCount = Object.values(gamesPlayed || {}).reduce((a, b) => a + b, 0);
  const lessonsDone = JSON.parse(localStorage.getItem('ft_completed_lessons') || '[]').length;
  const getRank = (s) => {
    if (s >= 200) return { label: '⭐ Yulduz / Star', color: 'from-pink-400 to-red-400' };
    if (s >= 100) return { label: '👑 Donishmand / Wise', color: 'from-purple-500 to-pink-500' };
    if (s >= 50) return { label: '🏆 Saralangan / Featured', color: 'from-indigo-400 to-purple-500' };
    if (s >= 25) return { label: '💫 Faol / Active', color: 'from-amber-400 to-yellow-500' };
    if (s >= 10) return { label: '⭐ Yangi / Newcomer', color: 'from-yellow-500 to-amber-500' };
    return { label: '🌟 Boshlang\'ich / Beginner', color: 'from-yellow-400 to-orange-500' };
  };
  const rank = getRank(stars);

  return (
    <section id="profile" className="max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">{user.name}
              {user.is_admin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center gap-1"><ShieldCheck size={11} />{t.youAreAdmin}</span>}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
        <button onClick={logout} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-sm flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors">
          <LogOut size={14} />{t.logoutBtn}
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-6 mb-6 animate-fade-in">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Bookmark size={18} className="text-indigo-500 dark:text-indigo-400" />{t.savedTitle}</h3>
        <SavedItems embedded />
      </div>

      <div className="glass-panel rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Star size={20} className="text-yellow-500" />{t.profileStars}</h3>
        <div className="text-5xl font-extrabold text-slate-900 dark:text-white mb-2">{stars} ⭐</div>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r ${rank.color} bg-opacity-10 text-sm font-semibold`}>
          {rank.label}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Award size={20} className="text-indigo-500" />{t.userStats}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4 text-center">
            <Star size={24} className="text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stars}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t.totalStars}</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center">
            <BookOpen size={24} className="text-indigo-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{lessonsDone}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t.lessonsCompleted}</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center">
            <Trophy size={24} className="text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{completedBooksCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t.booksCompletedCount}</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center">
            <Brain size={24} className="text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{gamesCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t.gamesPlayedCount}</div>
          </div>
        </div>
      </div>

      <Leaderboard className="mb-6" />

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Award size={18} className="text-yellow-500" />{t.userRanking}</h3>
        <div className="space-y-2">
          {[
            { stars: 0, label: '🌟 Beginner', threshold: '0' },
            { stars: 10, label: '⭐ Newcomer', threshold: '10' },
            { stars: 25, label: '💫 Active', threshold: '25' },
            { stars: 50, label: '🏆 Featured', threshold: '50' },
            { stars: 100, label: '👑 Wise', threshold: '100' },
            { stars: 200, label: '✨ Star', threshold: '200' },
          ].map(r => (
            <div key={r.threshold} className={`flex items-center gap-3 p-3 rounded-xl ${stars >= r.stars ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-slate-50 dark:bg-white/5 opacity-50'}`}>
              <span className="text-lg">{r.label.split(' ')[0]}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{r.label.split(' ').slice(1).join(' ')}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({r.threshold}+ ⭐)</span>
              </div>
              {stars >= r.stars && <span className="text-green-500 text-xs font-bold">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
