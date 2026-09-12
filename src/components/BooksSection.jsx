import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { booksData } from '../data/booksData.js';
import { Bookmark, Star, BookOpen, Search, Copy } from 'lucide-react';

export default function BooksSection({ onOpenBook }) {
  const { t, lang, toggleBookmark, isBookmarked } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const filtered = booksData.filter(b => {
    const okCat = filter === 'all' || b.category === filter || b.language === filter;
    const q = search.toLowerCase();
    const okQ = !q || b.title[lang]?.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    return okCat && okQ;
  });
  const cats = ['all', 'self_development', 'fiction', 'uzbek_classics', 'business', 'psychology', 'technology'];

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="books" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.booksTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t.booksSub}</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === c ? 'bg-indigo-500 text-white' : 'bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'}`}>
            {c === 'all' ? t.all : c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      <div className="relative max-w-md mb-8">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchBooks}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-400" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(book => (
          <div key={book.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col card-hover">
            <div className="h-48 overflow-hidden">
              <img src={book.cover} alt={book.title[lang] || book.title.en} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">{book.category.replace(/_/g, ' ')}</span>
                <span className="flex items-center gap-1 text-yellow-400"><Star size={12} />{book.rating}</span>
                <span className="text-slate-500 dark:text-slate-400">{book.readTime} · 20+ {t.bookPage.toLowerCase()}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{book.title[lang] || book.title.en}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t.author}: {book.author}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 flex-1">{book.description[lang] || book.description.en}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenBook(book)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <BookOpen size={16} />{t.startReading}
                </button>
                <button
                  onClick={() => copy(book.description[lang] || book.description.en)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-indigo-400/40 transition-colors"
                  title={t.share}
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => toggleBookmark({ id: book.id, type: 'book', title: book.title, author: book.author })}
                  className={`p-2.5 rounded-xl border ${isBookmarked(book.id, 'book') ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}
                >
                  <Bookmark size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-12">{t.savedEmpty}</p>}
      {copied && <p className="text-center text-xs text-green-600 dark:text-green-400 mt-4">{t.copied}</p>}
    </section>
  );
}