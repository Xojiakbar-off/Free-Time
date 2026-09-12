import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { quotesData } from '../data/podcastsData.js';
import { booksData } from '../data/booksData.js';
import { moviesData } from '../data/moviesData.js';
import { podcastsData } from '../data/podcastsData.js';
import { englishVideos } from '../data/englishData.js';
import { Activity, ArrowRight, BookMarked, Clapperboard, Headphones, GraduationCap, PlayCircle, Star } from 'lucide-react';

function SectionHead({ icon: Icon, title, sub, action, extra }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={20} className="text-indigo-400" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        {sub && <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      <button onClick={action} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors">
        {extra || '→'}
      </button>
    </div>
  );
}

export default function Hero({ onNavigate }) {
  const { t, lang } = useApp();
  const [stats, setStats] = useState(() => analyticsService.getStats());
  const quote = quotesData[new Date().getDate() % quotesData.length];

  useEffect(() => {
    const interval = setInterval(() => setStats(analyticsService.getStats()), 5000);
    return () => clearInterval(interval);
  }, []);

  const quoteText = quote.text[lang] || quote.text.en;
  const featuredBooks = booksData.slice(0, 3);
  const featuredMovies = moviesData.slice(0, 3);
  const featuredPodcasts = podcastsData.slice(0, 3);
  const featuredVideos = englishVideos.slice(0, 3);
  const readMoreLabel = (<>{t.readMore} <ArrowRight size={15} /></>);

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/30 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-14 lg:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-6">
            <Activity size={16} />
            {t.visitorBadge}: <span className="font-bold">{stats.liveCount}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
            {t.heroGreeting}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            <button onClick={() => onNavigate('books')} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
              {t.booksTitle}
            </button>
            <button onClick={() => onNavigate('english')} className="px-5 py-2.5 rounded-xl bg-slate-900/5 border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-900/10 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 transition-colors">
              {t.englishTitle}
            </button>
            <button onClick={() => onNavigate('focus')} className="px-5 py-2.5 rounded-xl bg-slate-900/5 border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-900/10 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 transition-colors">
              {t.focusTitle}
            </button>
            <button onClick={() => onNavigate('movies')} className="px-5 py-2.5 rounded-xl bg-slate-900/5 border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-900/10 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 transition-colors">
              {t.moviesTitle}
            </button>
          </div>
        </div>

        {/* Daily quote */}
        <div className="glass-panel rounded-2xl p-6 max-w-3xl mx-auto text-center mb-16">
          <div className="text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-300 mb-3 font-semibold">
            {t.dailyQuoteTitle}
          </div>
          <p className="text-lg text-slate-700 dark:text-slate-200 italic mb-2">"{quoteText}"</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">— {quote.author}</p>
        </div>

        {/* Featured books */}
        <div className="mb-16">
          <SectionHead icon={BookMarked} title={t.booksTitle} sub={t.booksSub} action={() => onNavigate('books')} extra={readMoreLabel} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBooks.map(b => (
              <div key={b.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col card-hover">
                <div className="relative h-40">
                  <img src={b.cover} alt={b.title[lang] || b.title.en} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <span className="absolute bottom-2 left-3 flex items-center gap-1 text-yellow-400 text-xs font-semibold"><Star size={12} className="fill-yellow-400" />{b.rating}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{b.title[lang] || b.title.en}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{b.author} · {b.readTime}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-1">{b.description[lang] || b.description.en}</p>
                  <button onClick={() => onNavigate('books')} className="w-full py-2.5 rounded-xl bg-indigo-500/80 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
                    {t.startReading}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured movies */}
        <div className="mb-16">
          <SectionHead icon={Clapperboard} title={t.moviesTitle} sub={t.moviesSub} action={() => onNavigate('movies')} extra={readMoreLabel} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMovies.map(m => (
              <div key={m.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col card-hover">
                <div className="relative h-40 group">
                  <img src={m.cover} alt={m.title[lang] || m.title.en} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle size={44} className="text-white/90" /></div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="px-2 py-1 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 text-xs w-fit mb-2">{m.genre}</span>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{m.title[lang] || m.title.en}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{m.year} · {m.director}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-1">{m.description[lang] || m.description.en}</p>
                  <button onClick={() => onNavigate('movies')} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold">
                    {t.watchNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured podcasts */}
        <div className="mb-16">
          <SectionHead icon={Headphones} title={t.podcastsTitle} sub={t.podcastsSub} action={() => onNavigate('podcasts')} extra={readMoreLabel} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPodcasts.map(p => (
              <div key={p.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col card-hover">
                <div className="relative h-40">
                  <img src={p.cover} alt={p.title[lang] || p.title.en} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-purple-500 text-white text-xs font-semibold">{p.category}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{p.host} · {p.duration}</p>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">{p.title[lang] || p.title.en}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-1">{p.description[lang] || p.description.en}</p>
                  <button onClick={() => onNavigate('podcasts')} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold">
                    {t.listenAudio}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured lessons */}
        <div>
          <SectionHead icon={GraduationCap} title={t.englishTitle} sub={t.englishSub} action={() => onNavigate('english')} extra={readMoreLabel} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVideos.map(v => (
              <div key={v.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col card-hover">
                <div className="relative h-40">
                  <img src={v.thumbnail} alt={v.title[lang] || v.title.en} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-1 rounded bg-indigo-500 text-white text-xs font-bold">{v.level}</span>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><PlayCircle size={44} className="text-white/90" /></div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{v.channel} · {v.duration}</p>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">{v.title[lang] || v.title.en}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-1">{v.description[lang] || v.description.en}</p>
                  <button onClick={() => onNavigate('english')} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                    {t.watchNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}