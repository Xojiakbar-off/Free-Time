import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { siteConfig } from '../config.js';
import { api, API_BASE } from '../services/api.js';
import { Gift, Users, Eye, Activity, ArrowRight, BookOpen, GraduationCap, BarChart3, Focus } from 'lucide-react';
import Leaderboard from './Leaderboard.jsx';

function AuthCard() {
  const { t, login, register, setSession } = useApp();
  const [mode, setMode] = useState('register');
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

  return (
    <div className="glass-panel rounded-3xl p-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5">
        <Gift size={28} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-1">{t.authTitle}</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">{t.authSub} +5⭐</p>

      <div className="flex bg-slate-100 dark:bg-white/10 rounded-xl p-1 mb-6">
        {['register', 'login'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === m ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {m === 'login' ? t.loginTab : t.registerTab}
          </button>
        ))}
      </div>

      <button
        onClick={handleGoogleSignIn}
        type="button"
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white font-semibold mb-5 hover:bg-slate-50 dark:hover:bg-white/15 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        {t.googleSignIn}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        <span className="text-xs text-slate-400">{t.orEmail}</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
      </div>

      <form onSubmit={submit}>
        {mode === 'register' && (
          <label className="block mb-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t.nameLabel}</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t.nameLabel}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-400 placeholder:text-slate-400" />
          </label>
        )}
        <label className="block mb-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t.emailLabel}</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-400 placeholder:text-slate-400" />
        </label>
        <label className="block mb-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t.passwordLabel}</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-400 placeholder:text-slate-400" />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-semibold transition-opacity disabled:opacity-60">
          {loading ? '...' : (mode === 'login' ? t.loginBtn : t.registerBtn)}
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

export default function Landing({ onEnterGuest }) {
  const { t } = useApp();
  const [stats, setStats] = useState({ totalVisits: 0, liveCount: 0, visitsToday: 0, members: 0, booksCompleted: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(API_BASE + '/api/public/stats')
        .then(r => r.json())
        .then(d => { if (!cancelled) setStats(d); })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const features = [
    { icon: BookOpen, title: t.feature1Title, text: t.feature1Text, color: 'from-indigo-500 to-purple-600' },
    { icon: GraduationCap, title: t.feature2Title, text: t.feature2Text, color: 'from-purple-500 to-pink-500' },
    { icon: BarChart3, title: t.feature3Title, text: t.feature3Text, color: 'from-green-500 to-emerald-600' },
    { icon: Focus, title: t.feature4Title, text: t.feature4Text, color: 'from-amber-400 to-orange-500' },
  ];

  const statCards = [
    { icon: Activity, label: t.liveOnline, value: stats.liveCount, color: 'text-green-500' },
    { icon: Eye, label: t.visitsToday, value: stats.visitsToday, color: 'text-indigo-500' },
    { icon: Users, label: t.members, value: stats.members, color: 'text-purple-500' },
    { icon: BookOpen, label: t.readBooks, value: stats.booksCompleted, color: 'text-amber-500' },
  ];

  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/30 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-14">
        {/* Brand row */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt={t.siteName} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <div className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{t.siteName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t.siteTagline}</div>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-600 dark:text-indigo-300 text-xs font-semibold">
            <Activity size={14} />{t.landingBadge}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: informative sidebar */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t.landingTitle}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t.landingSub}</p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map(f => (
                <div key={f.title} className="glass-panel rounded-2xl p-5 hover:border-indigo-400/40 transition-colors">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-3`}>
                    <f.icon size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>

            {/* Live stats */}
            <div className="glass-panel rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-green-500" />{t.landingStatsTitle}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statCards.map(s => (
                  <div key={s.label} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 text-center">
                    <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini leaderboard */}
            <Leaderboard compact />
          </div>

          {/* Right: registration form */}
          <div className="lg:sticky lg:top-8">
            <AuthCard />
            <button
              onClick={onEnterGuest}
              className="mt-3 w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
            >
              {t.guestMode}
            </button>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">{t.footerContact}: <a href={`tel:${siteConfig.phone}`} className="text-indigo-600 dark:text-indigo-300 font-semibold">{siteConfig.phoneDisplay}</a></p>
      </div>
    </div>
  );
}