import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, API_BASE, getToken, getAdminToken, setAdminToken, clearAdminToken } from '../services/api.js';
import { ShieldCheck, Users, Eye, Download, LogOut, Lock, Ban, RefreshCw, Activity, MessageSquare, UserPlus, Clock, BarChart3, Mail, Unlock, BookOpen, Star, Radio, Calendar, Timer, UserCircle } from 'lucide-react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';

const AVATAR_COLORS = ['#6366f1', '#a855f7', '#0ea5e9', '#22c55e', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6'];
function avatarColor(str = '') {
  let h = 0;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initial(name = '?') {
  return (name || '?').trim().charAt(0).toUpperCase();
}
function formatHours(seconds = 0) {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h >= 1) return `${h}s ${m}min`;
  if (m >= 1) return `${m}min`;
  return `${s}sek`;
}

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
  const [onlineUsers, setOnlineUsers] = useState([]);
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
        const [st, an, vis, usr, msg, blk, onl] = await Promise.all([
          api('/admin/stats', { token }),
          api('/admin/analytics', { token }),
          api('/admin/visitors', { token }),
          api('/admin/users', { token }),
          api('/admin/messages', { token }),
          api('/admin/blocked', { token }),
          api('/admin/online', { token }),
        ]);
        if (cancelled) return;
        setStats(st); setAnalytics(an); setVisitors(vis || []); setUsers(usr || []); setMessages(msg || []); setBlocked(blk || []); setOnlineUsers(onl || []);
      } catch (e) {
        if (!cancelled && e.message && (e.message.includes('403') || e.message.toLowerCase().includes('ruxsat'))) {
          clearAdminToken();
          setAuthed(false);
        }
      }
    };
    load();
    const iv = setInterval(load, 5000);
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
    const iv = setInterval(loadLive, 5000);
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
      <section id="admin" className="admin-cards max-w-md mx-auto px-4 py-16 scroll-mt-16">
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
    <section id="admin" className="admin-cards max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
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
            <MuiStatCard icon={<Activity sx={{ color: '#22c55e' }} />} label={t.liveOnline} value={live.liveCount ?? 0} />
            <MuiStatCard icon={<Eye sx={{ color: '#6366f1' }} />} label={t.visitsToday} value={live.visitsToday ?? 0} />
            <MuiStatCard icon={<Users sx={{ color: '#a855f7' }} />} label={t.members} value={live.members ?? 0} />
            <MuiStatCard icon={<BookOpen sx={{ color: '#f59e0b' }} />} label={t.readBooks} value={live.booksCompleted ?? 0} />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <MuiStatCard icon={<Activity sx={{ color: '#22c55e' }} />} label={t.liveVisitors} value={stats?.liveCount ?? '—'} />
        <MuiStatCard icon={<Eye sx={{ color: '#6366f1' }} />} label={t.totalVisits} value={stats?.totalVisits ?? '—'} />
        <MuiStatCard icon={<Users sx={{ color: '#a855f7' }} />} label={t.uniqueVisitors} value={stats?.uniqueVisitors ?? '—'} />
        <MuiStatCard icon={<UserPlus sx={{ color: '#0ea5e9' }} />} label={t.registeredUsers} value={stats?.users ?? '—'} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <MuiStatCard icon={<UserPlus sx={{ color: '#f59e0b' }} />} label={t.newUsers7d} value={stats?.newUsers7d ?? '—'} />
        <MuiStatCard icon={<Clock sx={{ color: '#06b6d4' }} />} label={t.avgSessionDuration} value={stats?.avgDuration != null ? `${stats.avgDuration}sek` : '—'} />
        <MuiStatCard icon={<MessageSquare sx={{ color: '#f43f5e' }} />} label={t.messagesCount} value={stats?.messages ?? '—'} />
        <MuiStatCard icon={<BarChart3 sx={{ color: '#ef4444' }} />} label={t.blockedCountLabel} value={stats?.blockedCount ?? '—'} />
      </Box>

      <div className="glass-panel panel-hover rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Radio size={16} className="text-green-500 animate-pulse" />{t.onlineNow} <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold">{onlineUsers.length}</span></h3>
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{t.lastSeen} · 5 min</span>
        </div>
        {onlineUsers.length === 0 ? <p className="text-sm text-slate-500">{'—'}</p> : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map(u => (
              <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors">
                <div className="relative">
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: avatarColor(u.email) }}>{initial(u.name)}</Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-900 dark:border-slate-800" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{u.name}{u.is_admin === 1 && <span className="ml-1 px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[9px]">ADMIN</span>}</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1"><Timer size={9} />{formatHours(u.online_seconds)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Card className="glass-panel card-hover" elevation={0} sx={{ borderRadius: '1rem', p: 2, overflow: 'visible' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart3 size={18} className="text-indigo-500 dark:text-indigo-400" />{t.visitorStats}
            </Typography>
            <MuiVisitorChart analytics={analytics} />
          </CardContent>
        </Card>
        <Card className="glass-panel card-hover" elevation={0} sx={{ borderRadius: '1rem', p: 2, overflow: 'visible' }}>
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
          <DailyChart days={(analytics?.newUsersByDay || []).map(d => ({ ...d, visits: d.count }))} accent="bg-amber-400/80 dark:bg-amber-400/80" />
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
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Radio size={16} className="text-green-500 animate-pulse" />{t.visitorLogs}
            <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold">{live.liveCount ?? 0} LIVE</span>
          </h3>
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
        <UsersTable users={users} t={t} />
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

function MuiStatCard({ icon, label, value }) {
  return (
    <Card className="admin-stat-card glass-panel" elevation={0} sx={{ borderRadius: '16px' }}>
      <CardContent sx={{ p: '18px 20px !important', '&:last-child': { pb: '18px !important' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {icon}
          <Typography className="text-slate-500 dark:text-slate-400" variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{label}</Typography>
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
    <div className="flex items-end gap-1 pt-3 px-0.5" style={{ height: 190 }}>
      {days.map(d => {
        const h = d.visits ? Math.max((d.visits / max) * 100, 4) : 0;
        return (
          <div key={d.date} className="relative flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0 group" title="">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-10 mb-1 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-semibold text-center whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none shadow-lg">
              <span className="block text-slate-300">{d.date}</span>
              <span className="block">{d.visits} ta tashrif</span>
            </div>
            <div
              className="w-full rounded-t bg-indigo-500/70 hover:bg-indigo-500 dark:bg-indigo-300/70 dark:hover:bg-indigo-300 transition-all duration-300 cursor-pointer group-hover:brightness-110"
              style={{ height: `${h}%` }}
            />
            <span className="text-[9px] text-slate-400 leading-none">{(d.date || '').slice(8)}</span>
          </div>
        );
      })}
    </div>
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
  const n = Math.max(days.length - 1, 1);
  const pts = days.map((d, i) => `${(i / n) * 100},${100 - ((d.visits || 0) / max) * 100}`);
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Chip label={`${totalVisits} Visits`} sx={{ bgcolor: '#6366f122', color: 'inherit', fontWeight: 600 }} size="small" />
        <Chip label={`${totalUnique} Unique`} sx={{ bgcolor: '#a855f722', color: 'inherit', fontWeight: 600 }} size="small" />
        <Chip label={`avg ${avg}/day`} sx={{ bgcolor: '#06b6d422', color: 'inherit', fontWeight: 600 }} size="small" />
        <Chip
          label={`${growth >= 0 ? '+' : ''}${growth}%`}
          size="small"
          sx={{ bgcolor: (growth >= 0 ? '#22c55e22' : '#ef444422'), color: growth >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}
        />
      </Box>
      <Box sx={{ position: 'relative', height: 150, mt: 1 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${pts.join(' ')} 100,100`} fill="url(#trendFill)" />
          <polyline
            points={pts.join(' ')}
            fill="none" stroke="#6366f1" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
          />
        </svg>
        {days.map((d, i) => {
          const left = (i / n) * 100;
          const top = 100 - ((d.visits || 0) / max) * 100;
          return (
            <div key={d.date} className="absolute inset-y-0 group cursor-pointer" style={{ left: `${left}%`, width: `${100 / days.length}%` }}>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-20 mb-1 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-semibold text-center whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none shadow-lg">
                <span className="block text-slate-300">{d.date}</span>
                <span className="block">{d.visits || 0} ta tashrif</span>
              </div>
              <div
                className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 ring-2 ring-white/70 dark:ring-slate-900/70"
                style={{ left: 0, top: `${top}%` }}
              />
            </div>
          );
        })}
        <Typography className="text-slate-500 dark:text-slate-400" sx={{ position: 'absolute', left: 0, top: 0, fontSize: '9px' }}>{max}</Typography>
      </Box>
    </Box>
  );
}

function DailyChart({ days, accent = 'bg-indigo-500/70 dark:bg-indigo-300/70' }) {
  const max = Math.max(...(days || []).map(d => d.visits || d.count || 0), 1);
  if (!days || days.length === 0) return <p className="text-sm text-slate-500">{'—'}</p>;
  return (
    <div className="flex items-end gap-1 h-32 px-1">
      {days.map(d => {
        const v = d.visits || d.count || 0;
        const h = v ? Math.max((v / max) * 100, 4) : 0;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group relative" title="">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-10 mb-1 px-2 py-1 rounded-md bg-slate-900 text-white text-[9px] font-semibold text-center whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none shadow-lg">
              <span className="block text-slate-300">{d.date}</span>
              <span className="block">{v} ta</span>
            </div>
            <div className={`w-full rounded-t ${accent} transition-all duration-300 cursor-pointer group-hover:brightness-110`} style={{ height: `${h}%` }} />
            <span className="text-[8px] text-slate-400 leading-none">{(d.date || '').slice(8)}</span>
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
        <div className="space-y-3">
          {safeData.map(d => (
            <div key={d.name}>
              <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-300 truncate pr-2">{d.name}</span><span className="text-slate-500 dark:text-slate-400">{d.count}</span></div>
              <LinearProgress
                variant="determinate"
                value={Math.round(((d.count || 0) / max) * 100)}
                sx={{ height: 6, borderRadius: 999, bgcolor: 'rgba(100,116,139,0.18)', '& .MuiLinearProgress-bar': { borderRadius: 999, backgroundColor: color } }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisitorTable({ visitors, t, onBlock }) {
  const safeVisitors = visitors || [];
  const cell = (extra = '') => ({ borderColor: 'rgba(100,116,139,0.15)', paddingTop: '0.5rem', paddingBottom: '0.5rem', whiteSpace: 'nowrap', ...(extra || {}) });
  return (
    <TableContainer sx={{ maxHeight: 320 }}>
      <Table size="small" stickyHeader sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            {[t.visitorIP, t.visitorDevice, t.visitorLocation, t.visitorTime, t.visitorPage, t.visitorDuration, t.blockVisitor].map((h, i) => (
              <TableCell key={i} className="text-slate-500 dark:text-slate-400 font-bold" sx={cell()}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {safeVisitors.slice(0, 50).map(v => (
            <TableRow key={v.id} hover>
              <TableCell className="font-mono text-slate-700 dark:text-slate-300" sx={cell()}>{v.ip}</TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300" sx={cell()}>{v.device} · {v.browser}</TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400" sx={cell()}>{v.location}</TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400" sx={cell()}>{v.timestamp ? new Date(v.timestamp).toLocaleString() : '—'}</TableCell>
              <TableCell sx={cell()}><span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px]">{v.page}</span></TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400" sx={cell()}>{v.duration}s</TableCell>
              <TableCell sx={cell()}>
                <button onClick={() => onBlock(v.sessionId)} className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white text-[10px] transition-all active:scale-95"><Ban size={10} className="inline mr-1" />{t.blockVisitor}</button>
              </TableCell>
            </TableRow>
          ))}
          {safeVisitors.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">{t.savedEmpty}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function UsersTable({ users, t }) {
  const safeUsers = users || [];
  const cell = (extra = '') => ({ borderColor: 'rgba(100,116,139,0.15)', paddingTop: '0.55rem', paddingBottom: '0.55rem', whiteSpace: 'nowrap', ...(extra || {}) });
  return (
    <TableContainer sx={{ maxHeight: 320 }}>
      <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            <TableCell className="text-slate-500 dark:text-slate-400 font-bold" sx={cell()}>
              <span className="inline-flex items-center gap-1"><UserCircle size={14} />{t.nameLabel}</span>
            </TableCell>
            <TableCell className="text-slate-500 dark:text-slate-400 font-bold" sx={cell()}>{t.emailLabel}</TableCell>
            <TableCell className="text-slate-500 dark:text-slate-400 font-bold" sx={cell()}>
              <span className="inline-flex items-center gap-1"><Calendar size={14} />{t.lastLogin}</span>
            </TableCell>
            <TableCell className="text-slate-500 dark:text-slate-400 font-bold" sx={cell()}>
              <span className="inline-flex items-center gap-1"><Timer size={14} />{t.hoursOnSite}</span>
            </TableCell>
            <TableCell className="text-slate-500 dark:text-slate-400 font-bold" sx={cell()}>{t.lastSeen}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {safeUsers.filter(u => u.is_admin !== 1).map(u => (
            <TableRow key={u.id} hover>
              <TableCell sx={cell()}>
                <div className="flex items-center gap-2">
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: avatarColor(u.email) }}>{initial(u.name)}</Avatar>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400" sx={cell()}>{u.email}</TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300" sx={cell()}>{u.last_login ? new Date(u.last_login).toLocaleString() : '—'}</TableCell>
              <TableCell sx={cell()}>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold"><Star size={10} className="text-amber-500" />{formatHours(u.online_seconds)}</span>
              </TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400" sx={cell()}>{u.last_seen ? new Date(u.last_seen).toLocaleString() : '—'}</TableCell>
            </TableRow>
          ))}
          {safeUsers.filter(u => u.is_admin !== 1).length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">{t.savedEmpty}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
  );
}