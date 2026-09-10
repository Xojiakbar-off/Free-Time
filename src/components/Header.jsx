import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Sun, Moon, Bookmark, ShieldCheck, Menu, X, BookOpen, Star } from 'lucide-react';

export default function Header({ currentSection, onNavigate }) {
  const { t, lang, setLang, theme, toggleTheme, bookmarks, user } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const links = [
    { id: 'home', label: t.home },
    { id: 'books', label: t.books },
    { id: 'movies', label: t.movies },
    { id: 'english', label: t.english },
    { id: 'lessons', label: t.lessonsTitle || 'Darslar', icon: BookOpen },
    { id: 'mindGym', label: t.mindGym },
    { id: 'focus', label: t.focus },
    { id: 'podcasts', label: t.podcasts },
    { id: 'saved', label: t.saved },
    { id: 'profile', label: t.profileStars, icon: Star },
  ];

  if (user?.is_admin) {
    links.push({ id: 'admin', label: t.admin, icon: ShieldCheck });
  }

  const navBtn = (id, label) => (
    <button
      key={id}
      onClick={() => { onNavigate(id); setMobileOpen(false); }}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        currentSection === id
          ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
          : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 shrink-0">
          {logoError ? (
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
              {t.siteName.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <img src="/logo.jpg" alt={t.siteName} className="w-9 h-9 rounded-xl object-cover" onError={() => setLogoError(true)} />
          )}
          <span className="font-bold text-lg text-slate-900 dark:text-white hidden sm:block">{t.siteName}</span>
        </button>

        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
          {links.map(l => navBtn(l.id, l.label))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 text-xs">
            {['uz', 'en', 'ru'].map(code => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-2 py-1.5 font-semibold uppercase transition-colors ${
                  lang === code ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10 transition-colors" title={theme === 'dark' ? t.themeLight : t.themeDark}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => onNavigate('saved')} className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10 transition-colors" title={t.saved}>
            <Bookmark size={18} />
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </button>

          {user?.is_admin && (
            <button onClick={() => onNavigate('admin')} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10 transition-colors" title={t.admin}>
              <ShieldCheck size={18} />
            </button>
          )}

          <button onClick={() => setMobileOpen(o => !o)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden glass-panel border-t border-slate-200 dark:border-white/10 px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
          {links.map(l => navBtn(l.id, l.label))}
        </div>
      )}
    </header>
  );
}
