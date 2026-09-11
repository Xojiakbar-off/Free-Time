import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, API_BASE, getToken, getAdminToken, setAdminToken, clearAdminToken } from '../services/api.js';
import { ShieldCheck, Users, Eye, Download, LogOut, Lock, Ban, RefreshCw, Activity, MessageSquare, UserPlus, Clock, BarChart3, Mail, Unlock, BookOpen } from 'lucide-react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

export default function AdminPanel() {
  const { t, user, login } = useApp();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('ft_admin') === '1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [tick, setTick] = useState(0);
  const [live, setLive] = useState({ liveCount: 0, visitsToday: 0, members: 0, booksCompleted: 0, totalVisits: 0 });

  const effectiveAuthed = authed || !!user?.is_admin;
  const adminToken = () => (user?.is_admin ? getToken() : getAdminToken()) || '';

  useEffect(() => {
    if (!effectiveAuthed) return;
    let cancelled = false;
    const load = async () => {
      const token = user?.is_admin ? getToken() : getAdminToken();
      if (!token) return;
      try {
        const [st, an, vis, usr, msg, blk] = await Promise.all([
          api('/admin/stats', { token }),
          api('/admin/analytics', { token }),
          api('/admin/visitors', { token }),
          api('/admin/users', { token }),
          api('/admin/messages', { token }),
          api('/admin/blocked', { token }),
        ]);
        if (cancelled) return;
        setStats(st); setAnalytics(an); setVisitors(vis || []); setUsers(usr || []); setMessages(msg || []); setBlocked(blk || []);
      } catch (e) {
        if (!cancelled && e.message && (e.message.includes('403') || e.message.toLowerCase().includes('ruxsat'))) {
          clearAdminToken();
          setAuthed(false);
        }
      }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [effectiveAuthed, tick, user]);

  useEffect(() => {
    if (!effectiveAuthed) return;
    let cancelled = false;
    const loadLive = () => {
      fetch(API_BASE + '/api/public/stats')
        .then(r => r.json())
        .then(d => { if (!cancelled) setLive(d); })
        .catch(() => {});
    };
    loadLive();
    const iv = setInterval(loadLive, 8000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [effectiveAuthed, tick]);

  const doLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = await login(email, password);
      if (!u?.is_admin) { setError(t.adminForbidden); return; }
      setAdminToken(getToken());
      sessionStorage.setItem('ft_admin', '1');
      setAuthed(true);
      setPassword('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const doLogout = () => { clearAdminToken(); setAuthed(false); setStats(null); setAnalytics(null); };

  const blockSession = async (sid) => {
    try { await api('/admin/block', { method: 'POST', body: { sessionId: sid }, token: adminToken() }); setTick(t => t + 1); } catch (e) { setError(e.message); }
  };
  const unblockSession = async (sid) => {
    try { await api('/admin/unblock', { method: 'POST', body: { sessionId: sid }, token: adminToken() }); setTick(t => t + 1); } catch (e) { setError(e.message); }
  };
  const simulate = async () => {
    try { await api('/admin/simulate', { method: 'POST', token: adminToken() }); setTick(t => t + 1); } catch (e) { setError(e.message); }
  };
  const exportJSON = async () => {
    try {
      const data = await api('/admin/export', { token: adminToken() });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `freetime-analytics-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  };

  if (!effectiveAuthed) {
    return (
      <section id="admin" className="max-w-md mx-auto px-4 py-16 scroll-mt-16">
        <div className="glass-panel rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><Lock size={24} /></div>
            <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.adminTitle}</h2><p className="text-xs text-slate-500 dark:text-slate-400">{t.adminLoginRequired}</p></div>
          </div>
          <form onSubmit={doLogin}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailLabel} required
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white mb-3 outline-none focus:border-indigo-400" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passwordLabel} required
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white mb-3 outline-none focus:border-indigo-400" />
            {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold disabled:opacity-60 transition-all active:scale-[0.98] shadow-md shadow-indigo-500/30">{loading ? '...' : t.adminLoginBtn}</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section id="admin" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><ShieldCheck className="text-indigo-500 dark:text-indigo-400" />{t.adminTitle}</h2><p className="text-slate-500 dark:text-slate-400">{t.adminSub}</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={simulate} className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs flex items-center gap-1 transition-all active:scale-95 shadow-sm shadow-indigo-500/30"><RefreshCw size={12} />{t.simulateVisitor}</button>
          <button onClick={exportJSON} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-300 text-xs flex items-center gap-1 transition-all active:scale-95"><Download size={12} />{t.exportData}</button>
          <button onClick={() => setTick(t => t + 1)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-300 text-xs flex items-center gap-1 transition-all active:scale-95"><RefreshCw size={12} />{t.refreshBtn}</button>
          <button onClick={doLogout} className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1 transition-all active:scale-95"><LogOut size={12} />{t.adminLogout}</button>
        </div>
      </div>

      <Card className="glass-panel card-hover" elevation={0} sx={{ borderRadius: '1rem', p: 2, mb: 3 }}>
        <CardContent sx={{ p: '20px !important', '&:last-child': { pb: '20px !important' } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Activity className="text-green-500" size={18} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>{t.landingStatsTitle}</Typography>
            </Stack>
            <Chip size="small" label={t.liveOnline} sx={{ bgcolor: '#22c55e22', color: '#22c55e', fontWeight: 700 }} variant="outlined" />
          </Stack>
          <Typography className="text-slate-500 dark:text-slate-400" variant="body2" sx={{ mb: 2 }}>{t.adminSub}</Typography>
          <Divider sx={{ mb: 2, borderColor: 'divider' }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            <MuiStatCard accent="#22c55e" icon={<Activity sx={{ color: '#22c55e' }} />} label={t.liveOnline} value={live.liveCount ?? 0} />
            <MuiStatCard accent="#6366f1" icon={<Eye sx={{ color: '#6366f1' }} />} label={t.visitsToday} value={live.visitsToday ?? 0} />
            <MuiStatCard accent="#a855f7" icon={<Users sx={{ color: '#a855f7' }} />} label={t.members} value={live.members ?? 0} />
            <MuiStatCard accent="#f59e0b" icon={<BookOpen sx={{ color: '#f59e0b' }} />} label={t.readBooks} value={live.booksCompleted ?? 0} />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <MuiStatCard accent="#22c55e" icon={<Activity sx={{ color: '#22c55e' }} />} label={t.liveVisitors} value={stats?.liveCount ?? '—'} />
        <MuiStatCard accent="#6366f1" icon={<Eye sx={{ color: '#6366f1' }} />} label={t.totalVisits} value={stats?.totalVisits ?? '—'} />
        <MuiStatCard accent="#a855f7" icon={<Users sx={{ color: '#a855f7' }} />} label={t.uniqueVisitors} value={stats?.uniqueVisitors ?? '—'} />
        <MuiStatCard accent="#0ea5e9" icon={<UserPlus sx={{ color: '#0ea5e9' }} />} label={t.registeredUsers} value={stats?.users ?? '—'} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <MuiStatCard accent="#f59e0b" icon={<UserPlus sx={{ color: '#f59e0b' }} />} label={t.newUsers7d} value={stats?.newUsers7d ?? '—'} />
        <MuiStatCard accent="#06b6d4" icon={<Clock sx={{ color: '#06b6d4' }} />} label={t.avgSessionDuration} value={stats?.avgDuration != null ? `${stats.avgDuration}s` : '—'} />
        <MuiStatCard accent="#f43f5e" icon={<MessageSquare sx={{ color: '#f43f5e' }} />} label={t.messagesCount} value={stats?.messages ?? '—'} />
        <MuiStatCard accent="#ef4444" icon={<BarChart3 sx={{ color: '#ef4444' }} />} label={t.blockedCountLabel} value={stats?.blockedCount ?? '—'} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Card className="glass-panel card-hover" elevation={0} sx={{ borderRadius: '1rem', p: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart3 size={18} className="text-indigo-500 dark:text-indigo-400" />{t.visitorStats}
            </Typography>
            <MuiVisitorChart analytics={analytics} />
          </CardContent>
        </Card>
        <Card className="glass-panel card-hover" elevation={0} sx={{ borderRadius: '1rem', p: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserPlus size={18} className="text-amber-500 dark:text-amber-400" />{t.visitorsTrend}
            </Typography>
            <MuiVisitorTrend analytics={analytics} />
          </CardContent>
        </Card>
      </Box>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-panel panel-hover rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500 dark:text-indigo-400" />{t.dailyVisits}</h3>
          <DailyChart days={analytics?.visitsByDay || []} />
        </div>
        <div className="glass-panel panel-hover rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserPlus size={18} className="text-amber-500 dark:text-amber-400" />{t.newRegistrations}</h3>
          <DailyChart days={(analytics?.newUsersByDay || []).map(d => ({ ...d, uniqueVisitors: d.count }))} accent="bg-amber-500 dark:bg-amber-400" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Breakdown title={t.visitorsByDevice} data={analytics?.deviceBreakdown || []} color="#6366f1" />
        <Breakdown title={t.visitorsByBrowser} data={analytics?.browserBreakdown || []} color="#a855f7" />
        <Breakdown title={t.visitorsByPage} data={analytics?.pageBreakdown || []} color="#22d3ee" />
        <Breakdown title={t.topLocations} data={analytics?.locationBreakdown || []} color="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-panel panel-hover rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Users size={18} className="text-indigo-500 dark:text-indigo-400" />{t.visitorLogs}</h3>
          <VisitorTable visitors={visitors} t={t} onBlock={blockSession} />
        </div>
        <div className="glass-panel panel-hover rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Ban size={18} className="text-red-500 dark:text-red-400" />{t.blockedVisitors}</h3>
          {blocked.length === 0 ? <p className="text-sm text-slate-500">{t.noBlocked}</p> : (
            <div className="flex flex-wrap gap-2">
              {blocked.map(b => (
                <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-600 dark:text-red-300 font-mono transition-colors">
                  {b.sessionId}
                  <button onClick={() => unblockSession(b.sessionId)} className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-indigo-500 dark:text-slate-400 transition-all"><Unlock size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel panel-hover rounded-2xl p-6 mb-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserPlus size={18} className="text-sky-500 dark:text-sky-400" />{t.userListTitle}</h3>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 text-left">
              <th className="py-2 pr-3">{t.visitorIP}</th><th className="py-2 pr-3">{t.nameLabel}</th><th className="py-2 pr-3">{t.emailLabel}</th><th className="py-2 pr-3">⭐</th><th className="py-2 pr-3">{t.visitorTime}</th><th className="py-2 pr-3">{t.lastSeen}</th>
            </tr></thead>
            <tbody>
              {(users || []).map(u => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-200/50 dark:hover:bg-white/5">
                  <td className="py-2 pr-3 font-mono text-slate-700 dark:text-slate-300">#{u.id}</td>
                  <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{u.name}{u.is_admin === 1 && <span className="ml-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[9px]">ADMIN</span>}</td>
                  <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{u.stars}</td>
                  <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{new Date(u.last_seen).toLocaleString()}</td>
                </tr>
              ))}
              {(!users || users.length === 0) && <tr><td colSpan={6} className="py-8 text-center text-slate-500">{t.savedEmpty}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel panel-hover rounded-2xl p-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-rose-500 dark:text-rose-400" />{t.msgListTitle}</h3>
        {(!messages || messages.length === 0) ? <p className="text-sm text-slate-500">{t.noMessages}</p> : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {messages.map(m => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-colors">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1"><Mail size={12} className="text-slate-400" />{m.name} · {m.contact}</span>
                  <span className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{m.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MuiStatCard({ icon, label, value, accent = '#6366f1' }) {
  return (
    <Card className="glass-panel card-hover stat-card" elevation={0} sx={{ borderRadius: '18px' }} style={{ ['--accent']: accent }}>
      <CardContent sx={{ p: '18px 20px !important', '&:last-child': { pb: '18px !important' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${accent}22` }}>{icon}</Box>
          <Typography className="text-slate-500 dark:text-slate-400" variant="caption" sx={{ textAlign: 'right', fontSize: '0.7rem' }}>{label}</Typography>
        </Box>
        <Typography className="text-slate-900 dark:text-white" variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

function MuiVisitorChart({ analytics }) {
  const days = analytics?.visitsByDay || [];
  if (days.length === 0) return <Typography className="text-slate-500 dark:text-slate-400" variant="body2" sx={{ color: 'inherit' }}>—</Typography>;
  const max = Math.max(...days.map(d => d.visits || 0), 1);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 190, pt: 2, px: 0.5 }}>
      {days.map(d => {
        const h = d.visits ? Math.max((d.visits / max) * 100, 4) : 0;
        return (
          <Box key={d.date} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, height: '100%', justifyContent: 'flex-end' }} title={`${d.date}: ${d.visits}`}>
            <Box sx={{
              width: '100%',
              borderRadius: '6px 6px 0 0',
              background: 'linear-gradient(180deg, #6366f1, #4f46e5)',
              transition: 'height 400ms ease, filter 200ms ease',
              minHeight: 4,
              cursor: 'pointer',
              '&:hover': { filter: 'brightness(1.25)' },
            }} style={{ height: `${h}%` }} />
            <Typography className="text-slate-500 dark:text-slate-400" sx={{ fontSize: '9px', lineHeight: 1 }}>
              {(d.date || '').slice(8)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function MuiVisitorTrend({ analytics }) {
  const days = analytics?.visitsByDay || [];
  if (days.length === 0) return <Typography className="text-slate-500 dark:text-slate-400" variant="body2" sx={{ color: 'inherit' }}>—</Typography>;
  const totalVisits = days.reduce((a, d) => a + (d.visits || 0), 0);
  const totalUnique = days.reduce((a, d) => a + (d.uniqueVisitors || 0), 0);
  const avg = Math.round(totalVisits / days.length);
  const max = Math.max(...days.map(d => d.visits || 0), 1);
  const h1 = days[days.length - 1]?.visits || 0;
  const h0 = days[days.length - 2]?.visits || 0;
  const growth = h0 > 0 ? Math.round(((h1 - h0) / h0) * 100) : 0;
  const points = days.map((d, i) => ({ x: i, y: ((d.visits || 0) / max) * 100 }));
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Chip label={`${totalVisits} Visits`} sx={{ bgcolor: '#6366f122', color: 'inherit', fontWeight: 600 }} size="small" />
        <Chip label={`${totalUnique} Unique`} sx={{ bgcolor: '#a855f722', color: 'inherit', fontWeight: 600 }} size="small" />
        <Chip
          label={`${growth >= 0 ? '+' : ''}${growth}%`}
          size="small"
          sx={{ bgcolor: (growth >= 0 ? '#22c55e22' : '#ef444422'), color: growth >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}
        />
      </Box>
      <Box sx={{ position: 'relative', height: 60, mt: 1 }}>
        <Typography className="text-slate-500 dark:text-slate-400" sx={{ position: 'absolute', left: 0, top: -16, fontSize: '9px' }}>{max}</Typography>
        <svg width="100%" height="60" viewBox="0 0 100 60" preserveAspectRatio="none">
          <polyline
            points={points.map(p => `${(p.x / Math.max(points.length - 1, 1)) * 100},${100 - p.y * 0.55}`).join(' ')}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 0 3px rgba(99,102,241,0.6))' }}
          />
          <polyline
            points={`0,60 ${points.map(p => `${(p.x / Math.max(points.length - 1, 1)) * 100},${100 - p.y * 0.55}`).join(' ')} 100,60`}
            fill="rgba(99,102,241,0.15)"
            stroke="none"
          />
        </svg>
        <Typography className="text-slate-500 dark:text-slate-400" sx={{ position: 'absolute', right: 0, bottom: -16, fontSize: '9px' }}>0 · avg {avg}</Typography>
      </Box>
    </Box>
  );
}

function DailyChart({ days, accent = 'bg-indigo-500 dark:bg-indigo-400' }) {
  const max = Math.max(...(days || []).map(d => d.visits || 0), 1);
  if (!days || days.length === 0) return <p className="text-sm text-slate-500">{'—'}</p>;
  return (
    <div className="flex items-end gap-1 h-32 px-1">
      {days.map(d => {
        const h = d.visits ? Math.max((d.visits / max) * 100, 4) : 0;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group" title={`${d.date}: ${d.visits}`}>
            <div className={`w-full rounded-t ${accent} transition-all duration-300 cursor-pointer group-hover:brightness-125 group-hover:scale-x-105`} style={{ height: `${h}%` }} />
            <span className="text-[8px] text-slate-500">{(d.date || '').slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Breakdown({ title, data, color }) {
  const safeData = data || [];
  const max = Math.max(...safeData.map(d => d.count || 0), 1);
  return (
    <div className="glass-panel card-hover rounded-2xl p-5">
      <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{title}</h3>
      {safeData.length === 0 ? <p className="text-xs text-slate-500">{'—'}</p> : (
        <div className="space-y-2">
          {safeData.map(d => (
            <div key={d.name}>
              <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-300 truncate pr-2">{d.name}</span><span className="text-slate-500 dark:text-slate-400">{d.count}</span></div>
              <div className="h-2 rounded bg-slate-200 dark:bg-white/10"><div className="h-2 rounded" style={{ width: `${((d.count || 0) / max) * 100}%`, background: color }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisitorTable({ visitors, t, onBlock }) {
  const safeVisitors = visitors || [];
  return (
    <div className="overflow-x-auto max-h-80">
      <table className="w-full text-xs">
        <thead><tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 text-left">
          {[t.visitorIP, t.visitorDevice, t.visitorLocation, t.visitorTime, t.visitorPage, t.visitorDuration, ''].map((h, i) => <th key={i} className="py-2 pr-3">{h}</th>)}
        </tr></thead>
        <tbody>
          {safeVisitors.slice(0, 30).map(v => (
            <tr key={v.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-200/50 dark:hover:bg-white/5">
              <td className="py-2 pr-3 font-mono text-slate-700 dark:text-slate-300">{v.ip}</td>
              <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{v.device} · {v.browser}</td>
              <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{v.location}</td>
              <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{v.timestamp ? new Date(v.timestamp).toLocaleString() : '—'}</td>
              <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">{v.page}</span></td>
              <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{v.duration}s</td>
              <td className="py-2"><button onClick={() => onBlock(v.sessionId)} className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white text-[10px] transition-all active:scale-95"><Ban size={10} className="inline mr-1" />{t.blockVisitor}</button></td>
            </tr>
          ))}
          {safeVisitors.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500">{t.savedEmpty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
