import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { translations } from '../data/translations.js';
import { api, getToken, setToken, clearAdminToken } from '../services/api.js';
import { logActivity, getTodayActivity } from '../services/activityService.js';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ft_lang') || 'uz');
  const [theme, setTheme] = useState(() => localStorage.getItem('ft_theme') || 'dark');
  const [bookmarks, setBookmarks] = useState(() => JSON.parse(localStorage.getItem('ft_bookmarks') || '[]'));
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('ft_notes') || '[]'));
  const [stars, setStars] = useState(() => parseInt(localStorage.getItem('ft_stars') || '0'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('ft_user') || 'null'));
  const [bookProgress, setBookProgress] = useState(() => JSON.parse(localStorage.getItem('ft_book_progress') || '{}'));
  const [completedBooks, setCompletedBooks] = useState(() => JSON.parse(localStorage.getItem('ft_completed_books') || '[]'));
  const [gamesPlayed, setGamesPlayed] = useState(() => JSON.parse(localStorage.getItem('ft_games_played') || '{}'));
  const [watchedVideos, setWatchedVideos] = useState(() => JSON.parse(localStorage.getItem('ft_watched_videos') || '{}'));
  const [authReady, setAuthReady] = useState(() => !getToken());

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const starsRef = useRef(stars);
  useEffect(() => { starsRef.current = stars; }, [stars]);

  useEffect(() => { localStorage.setItem('ft_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('ft_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('ft_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem('ft_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('ft_stars', String(stars)); }, [stars]);
  useEffect(() => { localStorage.setItem('ft_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('ft_book_progress', JSON.stringify(bookProgress)); }, [bookProgress]);
  useEffect(() => { localStorage.setItem('ft_completed_books', JSON.stringify(completedBooks)); }, [completedBooks]);
  useEffect(() => { localStorage.setItem('ft_games_played', JSON.stringify(gamesPlayed)); }, [gamesPlayed]);
  useEffect(() => { localStorage.setItem('ft_watched_videos', JSON.stringify(watchedVideos)); }, [watchedVideos]);

  const t = translations[lang] || translations.uz;

  // Restore the session after a refresh. We already have the cached user in
  // localStorage, so async token validation must never log the user out on
  // transient/network errors — only on an explicit auth rejection.
  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) return;
    api('/auth/me')
      .then(d => {
        if (cancelled) return;
        if (d.user) {
          setUser(d.user);
          setStars(d.user.stars || 0);
        } else {
          setToken(null);
          setUser(null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        if (e && e.authFailure) {
          setToken(null);
          setUser(null);
        }
        // network / transient server error: keep the cached session active
      })
      .finally(() => { if (!cancelled) setAuthReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Heartbeat — records real time spent on the site (updates admin "hours on site").
  useEffect(() => {
    if (!user?.id) return;
    api('/auth/heartbeat', { method: 'POST' }).catch(() => {});
    const iv = setInterval(() => api('/auth/heartbeat', { method: 'POST' }).catch(() => {}), 60000);
    return () => clearInterval(iv);
  }, [user?.id]);

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');
  const toggleBookmark = (item) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.id === item.id && b.type === item.type);
      if (exists) return prev.filter(b => !(b.id === item.id && b.type === item.type));
      return [...prev, { ...item, savedAt: new Date().toISOString() }];
    });
  };
  const isBookmarked = (id, type) => bookmarks.some(b => b.id === id && b.type === type);
  const addNote = (note) => setNotes(prev => [{ id: Date.now(), ...note, createdAt: new Date().toISOString() }, ...prev]);
  const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  const addStars = useCallback((amount, reason) => {
    setStars(s => s + amount);
    logActivity('stars', `${amount}${reason ? ': ' + reason : ''}`);
    setNotes(prev => [{ id: Date.now(), text: `⭐ +${amount} yulduz: ${reason}`, source: 'Stars System', createdAt: new Date().toISOString() }, ...prev]);
    const u = userRef.current;
    if (u) {
      api('/stars/add', { method: 'POST', body: { email: u.email, amount, reason } }).catch(() => {});
    }
  }, []);

  const spendStars = useCallback(async (amount, reason) => {
    if (starsRef.current < amount) return false;
    setStars(s => s - amount);
    logActivity('stars', `-${amount}${reason ? ': ' + reason : ''}`);
    setNotes(prev => [{ id: Date.now(), text: `⭐ -${amount} yulduz: ${reason}`, source: 'Stars System', createdAt: new Date().toISOString() }, ...prev]);
    const u = userRef.current;
    if (u) {
      try {
        const d = await api('/stars/spend', { method: 'POST', body: { email: u.email, amount, reason } });
        if (d && typeof d.stars === 'number') setStars(d.stars);
      } catch { /* balance resolves from the server on the next /auth/me */ }
    }
    return true;
  }, []);

  const completeBook = useCallback((bookId, bookTitle) => {
    if (completedBooks.includes(bookId)) return false;
    setCompletedBooks(prev => [...prev, bookId]);
    logActivity('book', bookTitle);
    setBookProgress(prev => ({ ...prev, [bookId]: { completed: true, completedAt: new Date().toISOString() } }));
    addStars(50, `Kitob tugadi: ${bookTitle}`);
    const u = userRef.current;
    if (u) {
      api('/books/complete', { method: 'POST', body: { email: u.email, bookId, title: bookTitle } }).catch(() => {});
    }
    return true;
  }, [completedBooks, addStars]);

  const updateBookProgress = useCallback((bookId, progress) => {
    setBookProgress(prev => ({ ...prev, [bookId]: { ...prev[bookId], ...progress } }));
  }, []);

  const addGameStars = useCallback((gameType, amount, reason) => {
    addStars(amount, reason);
    logActivity('game', gameType);
    setGamesPlayed(prev => ({ ...prev, [gameType]: (prev[gameType] || 0) + 1 }));
  }, [addStars]);

  const watchVideo = useCallback((videoId, videoTitle) => {
    if (watchedVideos[videoId]) return false;
    const now = new Date().toISOString();
    setWatchedVideos(prev => ({ ...prev, [videoId]: { watched: true, watchedAt: now } }));
    logActivity('video', videoTitle);
    addStars(50, `Video: ${videoTitle}`);
    const u = userRef.current;
    if (u) {
      api('/videos/complete', { method: 'POST', body: { email: u.email, videoId, title: videoTitle } }).catch(() => {});
    }
    return true;
  }, [watchedVideos, addStars]);

  const login = useCallback(async (email, password) => {
    clearAdminToken();
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    setStars(data.user.stars || 0);
    return data.user;
  }, []);

  const setSession = useCallback((data) => {
    if (data?.token) setToken(data.token);
    setUser(data.user);
    setStars(data.user?.stars || 0);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    clearAdminToken();
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    setToken(data.token);
    setUser(data.user);
    setStars(data.user.stars || 0);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    if (getToken()) api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    clearAdminToken();
    setUser(null);
  }, []);

  return (
    <AppContext.Provider value={{
      lang, setLang, theme, toggleTheme, t,
      bookmarks, toggleBookmark, isBookmarked,
      notes, addNote, deleteNote,
      stars, addStars, spendStars, completeBook, bookProgress, updateBookProgress, completedBooks,
      addGameStars, gamesPlayed, watchedVideos, watchVideo,
      user, login, register, logout, setSession, authReady,
      todayActivity: getTodayActivity(),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }