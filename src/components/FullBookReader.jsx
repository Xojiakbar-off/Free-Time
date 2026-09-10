import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, Bookmark, Volume2, VolumeX, Type, Sun, Moon, Coffee, CheckCircle, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

const MIN_PAGES = 20;
const PAGE_PADDING = 320;

function buildPages(book) {
  if (!book?.chapters?.length) return [];
  const segments = book.chapters.map(ch => ({ title: ch.title, text: ch.content || '' }));
  const totalChars = segments.reduce((a, s) => a + s.text.length, 0);
  const pageSize = Math.max(PAGE_PADDING, Math.ceil(totalChars / MIN_PAGES));
  const pages = [];

  segments.forEach(seg => {
    let text = seg.text;
    while (text.length > 0) {
      const take = Math.min(pageSize, text.length);
      let chunk = text.slice(0, take);
      if (take < text.length) {
        const lastSpace = chunk.lastIndexOf(' ');
        if (lastSpace > take * 0.6) chunk = chunk.slice(0, lastSpace);
      }
      pages.push({ title: seg.title, content: chunk });
      text = text.slice(chunk.length);
    }
  });

  let guard = 0;
  while (pages.length < MIN_PAGES && pages.length > 0 && guard < 200) {
    guard++;
    const idx = pages.findIndex(p => p.content.length > 180);
    if (idx === -1) break;
    const big = pages[idx];
    const mid = Math.floor(big.content.length / 2);
    const firstSpace = big.content.lastIndexOf(' ', mid);
    const splitAt = firstSpace > mid * 0.6 ? firstSpace : mid;
    pages.splice(idx, 1,
      { title: big.title, content: big.content.slice(0, splitAt) },
      { title: big.title, content: big.content.slice(splitAt) },
    );
  }

  return pages;
}

export default function FullBookReader({ book, onBack }) {
  const { t, lang, completeBook, completedBooks, toggleBookmark, isBookmarked, addNote } = useApp();
  const [currentPage, setCurrentPage] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [readTheme, setReadTheme] = useState('dark');
  const [speaking, setSpeaking] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [completed, setCompleted] = useState(completedBooks.includes(book.id));
  const [pages] = useState(() => buildPages(book));
  const contentRef = useRef(null);

  const totalPages = pages.length;
  const isLastPage = currentPage >= totalPages - 1;
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  const themes = {
    dark: { bg: 'bg-slate-950', text: 'text-slate-200', card: 'bg-slate-900', border: 'border-white/10', muted: 'text-slate-400' },
    light: { bg: 'bg-gray-50', text: 'text-gray-900', card: 'bg-white', border: 'border-gray-200', muted: 'text-gray-500' },
    sepia: { bg: 'bg-[#fdf6e3]', text: 'text-[#5c4b37]', card: 'bg-[#f5ecd7]', border: 'border-[#d4c5a9]', muted: 'text-[#8b7355]' },
  };
  const th = themes[readTheme] || themes.dark;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const toggleTTS = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else {
      const text = pages[currentPage]?.content || '';
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US';
      u.onend = () => setSpeaking(false);
      window.speechSynthesis?.speak(u);
      setSpeaking(true);
    }
  };

  const handleCompleteBook = () => {
    if (completed) return;
    const didComplete = completeBook(book.id, book.title[lang] || book.title.en);
    if (didComplete) {
      setCompleted(true);
      setShowCompletion(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#facc15', '#f59e0b', '#eab308', '#84cc16', '#22c55e'],
      });
      setTimeout(() => {
        confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#facc15', '#f59e0b'] });
        confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#facc15', '#f59e0b'] });
      }, 300);
    }
  };

  if (showCompletion) {
    return (
      <div className={`min-h-screen ${th.bg} flex items-center justify-center p-4`}>
        <div className={`${th.card} rounded-3xl p-10 max-w-lg w-full text-center border ${th.border}`}>
          <div className="text-7xl mb-4">🏆</div>
          <h2 className={`text-3xl font-extrabold mb-3 ${th.text}`}>{t.bookCompleteTitle}</h2>
          <p className={`${th.muted} mb-4 text-lg`}>{t.bookCompleteSub}</p>
          <p className={`${th.muted} mb-4 text-sm italic`}>"{book.title[lang] || book.title.en}"</p>
          <div className="flex items-center justify-center gap-2 text-yellow-400 mb-6">
            <Star size={28} className="fill-yellow-400" />
            <span className="text-4xl font-extrabold">+50</span>
            <Star size={28} className="fill-yellow-400" />
          </div>
          <button onClick={onBack} className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold text-lg">
            {lang === 'uz' ? 'Davom etish' : lang === 'ru' ? 'Продолжить' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${th.bg} transition-colors`}>
      {/* Top bar */}
      <div className={`sticky top-0 z-40 ${th.card} border-b ${th.border} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={onBack} className={`flex items-center gap-2 ${th.text} font-medium text-sm`}>
            <ArrowLeft size={18} />
            {lang === 'uz' ? 'Orqaga' : lang === 'ru' ? 'Назад' : 'Back'}
          </button>
          <h3 className={`font-bold text-sm truncate flex-1 text-center ${th.text}`}>
            {book.title[lang] || book.title.en}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleBookmark({ id: book.id, type: 'book', title: book.title, author: book.author })} className={`p-2 rounded-lg ${isBookmarked(book.id, 'book') ? 'bg-indigo-500 text-white' : th.text + ' hover:bg-black/5'}`}>
              <Bookmark size={16} />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-200 dark:bg-white/5">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Book info header */}
        <div className={`${th.card} rounded-2xl p-6 mb-6 border ${th.border}`}>
          <div className="flex gap-4">
            <img src={book.cover} alt="" className="w-16 h-24 object-cover rounded-xl shrink-0" />
            <div className="min-w-0">
              <h1 className={`text-xl font-extrabold mb-1 ${th.text} truncate`}>{book.title[lang] || book.title.en}</h1>
              <p className={`text-sm ${th.muted} mb-2`}>{book.author} · {book.category?.replace(/_/g, ' ')}</p>
              <p className={`text-xs ${th.muted} font-semibold`}>{totalPages} {t.bookPage} · +50 ⭐</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={`${th.card} rounded-2xl p-4 mb-6 border ${th.border} flex flex-wrap items-center gap-3`}>
          <div className="flex items-center gap-2">
            <Type size={14} className={th.muted} />
            <input type="range" min={14} max={28} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-24" />
          </div>
          <div className="flex gap-1">
            {[['dark', <Moon key="dark" size={14} />], ['light', <Sun key="light" size={14} />], ['sepia', <Coffee key="sepia" size={14} />]].map(([id, icon]) => (
              <button key={id} onClick={() => setReadTheme(id)} className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${readTheme === id ? 'border-indigo-500' : 'border-transparent'} ${id === 'dark' ? 'bg-slate-700' : id === 'light' ? 'bg-gray-200' : 'bg-[#fdf6e3]'}`}>
                {icon}
              </button>
            ))}
          </div>
          <button onClick={toggleTTS} className={`ml-auto flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg ${speaking ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'}`}>
            {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {speaking ? t.stopNarrator : t.listenNarrator}
          </button>
        </div>

        {/* Book content */}
        <div ref={contentRef} className={`${th.card} rounded-2xl p-8 md:p-10 border ${th.border} mb-6`}>
          <p className={`text-xs ${th.muted} mb-1`}>{pages[currentPage]?.title}</p>
          <div style={{ fontSize }} className={`leading-relaxed whitespace-pre-line ${th.text}`}>
            {pages[currentPage]?.content}
          </div>
        </div>

        {/* Page navigation */}
        <div className={`${th.card} rounded-2xl p-4 border ${th.border} mb-6 flex items-center gap-3`}>
          <button
            disabled={currentPage === 0}
            onClick={() => { setCurrentPage(p => p - 1); window.speechSynthesis?.cancel(); setSpeaking(false); }}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm border ${th.border} ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : ''} ${th.text} hover:bg-black/5`}
          >
            ← {t.prevPage}
          </button>
          <span className={`text-sm font-bold ${th.text} shrink-0`}>
            {t.bookPage} {currentPage + 1} / {totalPages}
          </span>
          {isLastPage && !completed ? (
            <button onClick={handleCompleteBook} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              {t.finishBook}
            </button>
          ) : isLastPage && completed ? (
            <div className={`flex-1 py-3 rounded-xl text-center text-sm font-bold ${th.text}`}>
              ✅ {t.finished}
            </div>
          ) : (
            <button
              onClick={() => { setCurrentPage(p => p + 1); window.speechSynthesis?.cancel(); setSpeaking(false); }}
              className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm"
            >
              {t.nextPage} →
            </button>
          )}
        </div>

        {/* Page dots */}
        <div className="flex flex-wrap justify-center gap-1 mb-8">
          {pages.map((p, i) => (
            <button
              key={i}
              onClick={() => { setCurrentPage(i); window.speechSynthesis?.cancel(); setSpeaking(false); }}
              className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-colors ${i === currentPage ? 'bg-indigo-500 text-white' : `${th.card} ${th.text} border ${th.border}`}`}
              title={`${t.bookPage} ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Notes */}
        <div className={`${th.card} rounded-2xl p-6 border ${th.border} mb-8`}>
          <h4 className={`font-bold mb-3 ${th.text}`}>📝 {t.addPersonalNote}</h4>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} className={`w-full p-3 rounded-lg border ${th.border} text-sm outline-none ${th.text} ${th.card}`} placeholder={lang === 'uz' ? 'Eslatma qoldiring...' : 'Leave a note...'} />
          <button onClick={() => { if (noteText.trim()) { addNote({ text: noteText, source: book.title.en || book.title[lang] }); setNoteText(''); } }} className="mt-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold">
            {t.notesSaved}
          </button>
        </div>
      </div>
    </div>
  );
}