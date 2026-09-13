import { useState, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Landing from './components/Landing.jsx';
import Hero from './components/Hero.jsx';
import BooksSection from './components/BooksSection.jsx';
import MoviesSection from './components/MoviesSection.jsx';
import EnglishHub from './components/EnglishHub.jsx';
import LessonPage from './components/LessonPage.jsx';
import MindGym from './components/MindGym.jsx';
import FocusAmbience from './components/FocusAmbience.jsx';
import Podcasts from './components/Podcasts.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import StarsSection from './components/StarsSection.jsx';
import UserProfile from './components/UserProfile.jsx';
import FullBookReader from './components/FullBookReader.jsx';
import Footer from './components/Footer.jsx';
import { analyticsService } from './services/analyticsService.js';

function LoadingScreen({ leaving, t }) {
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 transition-opacity duration-500 ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ background: 'radial-gradient(900px 500px at 85% -10%, rgba(124, 58, 237, 0.18) 0%, transparent 62%), linear-gradient(180deg, #080d1e 0%, #0f1730 48%, #080d1e 100%)' }}>
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-600/40 animate-pulse ring-2 ring-indigo-500/30">
          <img src="/logo.jpg" alt="FreeTime" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -inset-4 rounded-[2.5rem] border-2 border-indigo-500/30 animate-ping" />
      </div>
      <div className="text-white text-lg font-semibold tracking-wide">FreeTime</div>
      <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 animate-[loadbar_1.2s_ease-in-out_forwards]" />
      </div>
      <p className="text-xs text-slate-400">{t?.loadingWorkspace || 'Loading your workspace…'}</p>
    </div>
  );
}

function App() {
  const [section, setSection] = useState(() => {
    const s = localStorage.getItem('ft_section');
    return s === 'saved' ? 'profile' : (s || 'home');
  });
  const [fullBook, setFullBook] = useState(null);
  const [guest, setGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [openLessonId, setOpenLessonId] = useState(() => parseInt(localStorage.getItem('ft_open_lesson') || '0', 10));
  const { theme, user, authReady, t } = useApp();

  const wasAuthed = useRef(!!user);
  useEffect(() => {
    if (wasAuthed.current && !user) {
      setSection('home');
      setFullBook(null);
      localStorage.setItem('ft_section', 'home');
    }
    wasAuthed.current = !!user;
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    document.body.style.background = theme === 'dark'
      ? 'radial-gradient(1200px 560px at 88% -8%, rgba(109, 40, 217, 0.16) 0%, rgba(109, 40, 217, 0) 60%), radial-gradient(1000px 500px at 8% 102%, rgba(79, 70, 229, 0.14) 0%, rgba(79, 70, 229, 0) 60%), linear-gradient(180deg, #080d1e 0%, #0f1730 46%, #080d1e 100%)'
      : 'radial-gradient(1200px 600px at 15% -10%, #d9e2ff 0%, rgba(217, 226, 255, 0) 60%), radial-gradient(1000px 500px at 90% 0%, #f2e5ff 0%, rgba(242, 229, 255, 0) 55%), linear-gradient(180deg, #f3f5fb 0%, #e8ecf8 50%, #f3f5fb 100%)';
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    const show = setTimeout(() => setLeaving(true), 1200);
    const hide = setTimeout(() => setLoading(false), 1750);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  useEffect(() => {
    const onLeave = () => analyticsService.updateSessionDuration();
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, []);

  useEffect(() => {
    analyticsService.trackPageVisit(section === 'home' ? '/' : '/' + section);
    localStorage.setItem('ft_section', section);
  }, [section]);

  useEffect(() => {
    if (fullBook) return;
    if (section === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const t = setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, [section, fullBook]);

  const navigate = (id, opts) => {
    setFullBook(null);
    if (opts && typeof opts.lesson !== 'undefined') {
      setOpenLessonId(opts.lesson);
      localStorage.setItem('ft_open_lesson', String(opts.lesson));
    }
    setSection(id);
    localStorage.setItem('ft_section', id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openFullBook = (book) => {
    setFullBook(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <>
        <LoadingScreen leaving={leaving} t={t} />
        {user || guest ? null : <div className="h-screen" />}
      </>
    );
  }

  if (!authReady || (!user && !guest)) {
    if (!authReady) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-sm">...</div>
        </div>
      );
    }
    return (
      <div className="flex-1">
        <Landing onEnterGuest={() => { setGuest(true); setSection('home'); localStorage.setItem('ft_section', 'home'); window.scrollTo({ top: 0 }); }} />
      </div>
    );
  }

  if (fullBook) {
    return (
      <div className="flex-1 app-shell">
        <Sidebar currentSection={section} onNavigate={navigate} />
        <FullBookReader book={fullBook} onBack={() => setFullBook(null)} />
        <Footer onNavigate={navigate} />
      </div>
    );
  }

  return (
    <div className="flex-1 app-shell">
      <Sidebar currentSection={section} onNavigate={navigate} />
      <main>
        <div className={section === 'home' ? '' : 'hidden'}>
          <Hero onNavigate={navigate} />
        </div>
        <div className={section === 'books' ? '' : 'hidden'}><BooksSection onOpenBook={openFullBook} /></div>
        <div className={section === 'movies' ? '' : 'hidden'}><MoviesSection onNavigate={navigate} /></div>
        <div className={section === 'english' ? '' : 'hidden'}><EnglishHub onNavigate={navigate} /></div>
        <div className={section === 'lessons' ? '' : 'hidden'}><LessonPage openLessonId={openLessonId} /></div>
        <div className={section === 'mindGym' ? '' : 'hidden'}><MindGym /></div>
        <div className={section === 'focus' ? '' : 'hidden'}><FocusAmbience /></div>
        <div className={section === 'podcasts' ? '' : 'hidden'}><Podcasts /></div>
        <div className={section === 'admin' ? '' : 'hidden'}><AdminPanel /></div>
        <div className={section === 'stars' ? '' : 'hidden'}><StarsSection /></div>
        <div className={section === 'profile' ? '' : 'hidden'}><UserProfile /></div>
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default App;