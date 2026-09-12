import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  Home, BookOpen, Clapperboard, Languages, GraduationCap, Brain,
  Timer, Headphones, User, ShieldCheck, Sun, Moon, Menu, X, Bookmark,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

export default function Sidebar({ currentSection, onNavigate }) {
  const { t, lang, setLang, theme, toggleTheme, user, bookmarks } = useApp();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ft_sidebar') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    localStorage.setItem('ft_sidebar', collapsed ? '1' : '0');
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    return () => document.documentElement.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.classList.toggle('sidebar-mobile-open', mobileOpen);
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.documentElement.classList.remove('sidebar-mobile-open');
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const links = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'books', label: t.books, icon: BookOpen },
    { id: 'movies', label: t.movies, icon: Clapperboard },
    { id: 'english', label: t.english, icon: Languages },
    { id: 'lessons', label: t.lessonsTitle || 'Darslar', icon: GraduationCap },
    { id: 'mindGym', label: t.mindGym, icon: Brain },
    { id: 'focus', label: t.focus, icon: Timer },
    { id: 'podcasts', label: t.podcasts, icon: Headphones },
  ];
  if (user?.is_admin) links.push({ id: 'admin', label: t.admin, icon: ShieldCheck });
  links.push({ id: 'profile', label: t.profile, icon: User });

  const go = (id) => { onNavigate(id); setMobileOpen(false); };

  const renderLogo = (size) => (
    logoError ? (
      <span className={`${size} rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold shrink-0`}>
        {t.siteName.slice(0, 2).toUpperCase()}
      </span>
    ) : (
      <img src="/logo.jpg" alt={t.siteName} className={`${size} rounded-xl object-cover shrink-0`} onError={() => setLogoError(true)} />
    )
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sidebar-topbar grid grid-cols-[1fr_auto_1fr] items-center gap-1 lg:hidden">
        <button onClick={() => setMobileOpen(o => !o)} className="justify-self-start p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10 transition-colors" title={mobileOpen ? 'Close menu' : 'Menu'}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button onClick={() => go('home')} className="flex items-center gap-2 min-w-0" title={t.siteName}>
          {renderLogo('w-7 h-7')}
          <span className="font-bold text-slate-900 dark:text-white truncate">{t.siteName}</span>
        </button>
        <div className="justify-self-end flex items-center gap-0.5">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10 transition-colors" title={theme === 'dark' ? t.themeLight : t.themeDark}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <aside className="sidebar" aria-label={t.siteName}>
        {/* Brand (desktop only; mobile uses the top bar) */}
        <div className="sidebar-brand hidden lg:flex items-center gap-3 px-5 h-16 shrink-0">
          <button onClick={() => go('home')} className="flex items-center gap-3 min-w-0 flex-1" title={t.siteName}>
            {renderLogo('w-9 h-9')}
            <span className="side-label font-bold text-lg text-slate-900 dark:text-white truncate">{t.siteName}</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 sidebar-nav">
          {links.map(l => {
            const active = currentSection === l.id;
            return (
              <button key={l.id} onClick={() => go(l.id)} title={l.label}
                className={`sidebar-link ${active ? 'active' : ''}`}>
                <span className="side-icon"><l.icon size={19} strokeWidth={active ? 2.2 : 2} /></span>
                <span className="side-label">{l.label}</span>
                {l.id === 'profile' && bookmarks.length > 0 && (
                  <span className="side-label ml-auto flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                    <Bookmark size={10} className="mr-0.5" />{bookmarks.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="shrink-0 px-2 pb-3 pt-2 border-t border-slate-200/60 dark:border-white/10">
          {user && (
            <button onClick={() => go('profile')} className={`sidebar-link ${currentSection === 'profile' ? 'active' : ''} mb-1`} title={t.profile}>
              <span className="relative shrink-0">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {String(user.name ? user.name.charAt(0) : user.email?.charAt(0) || '?').toUpperCase()}
                </span>
                {bookmarks.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold">
                    {bookmarks.length}
                  </span>
                )}
              </span>
              <span className="side-label flex-1 min-w-0 text-left">
                <span className="block truncate text-sm font-semibold">{user.name || user.email}</span>
                <span className="block truncate text-[11px] opacity-70">{user.email}</span>
              </span>
              <Bookmark size={14} className="side-label ml-auto opacity-50" />
            </button>
          )}

          <div className="sidebar-footer-row flex items-center gap-1 px-2 pt-2 justify-center lg:justify-start flex-wrap">
            <div className="sidebar-pill-row rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 text-xs" role="group" aria-label="Language">
              {['uz', 'en', 'ru'].map(code => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  aria-label={code.toUpperCase()}
                  className={`px-2 py-1.5 font-semibold uppercase transition-colors ${
                    lang === code ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <button onClick={toggleTheme} aria-label={theme === 'dark' ? t.themeLight : t.themeDark} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10 transition-colors" title={theme === 'dark' ? t.themeLight : t.themeDark}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="sidebar-collapse-btn hidden lg:flex p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}