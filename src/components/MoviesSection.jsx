import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { moviesData, MOVIE_COST } from '../data/moviesData.js';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Bookmark, Star, PlayCircle, Copy, ChevronLeft, ArrowDownRight, Clock, Calendar, User } from 'lucide-react';

export default function MoviesSection() {
  const { t, lang, stars, spendStars, toggleBookmark, isBookmarked } = useApp();
  const [selected, setSelected] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const [confirmMovie, setConfirmMovie] = useState(null);
  const [warnMovie, setWarnMovie] = useState(null);
  const [spending, setSpending] = useState(false);

  const tryWatch = (movie) => {
    const cost = movie.cost ?? MOVIE_COST;
    if (stars < cost) { setWarnMovie(movie); return; }
    setConfirmMovie(movie);
  };

  const confirmWatch = async () => {
    const movie = confirmMovie;
    if (!movie || spending) return;
    const cost = movie.cost ?? MOVIE_COST;
    setSpending(true);
    const ok = await spendStars(cost, `Kino: ${movie.title?.en || movie.id}`);
    setSpending(false);
    setConfirmMovie(null);
    if (ok) setSelected(movie);
  };

  const watchDialogs = (
    <>
      <Dialog
        open={!!confirmMovie}
        onClose={() => setConfirmMovie(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '1.25rem', overflow: 'hidden', backgroundImage: 'none' } }}
      >
        {confirmMovie && (
          <div className="relative h-36">
            <img src={confirmMovie.cover} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent" />
            <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
              <div>
                <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wide mb-0.5">{t.confirmWatchTitle}</p>
                <h4 className="text-white font-bold text-lg leading-tight">{confirmMovie.title[lang] || confirmMovie.title.en}</h4>
              </div>
              <div className="flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 rounded-full px-3 py-1 text-sm font-extrabold">
                <Star size={14} className="fill-yellow-400" /> {confirmMovie.cost ?? MOVIE_COST}
              </div>
            </div>
          </div>
        )}
        <DialogContent sx={{ pt: { xs: '24px !important' }, pb: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-3 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span>{t.confirmWatchBody.replace('{cost}', String(confirmMovie?.cost ?? MOVIE_COST)).replace('{balance}', String(stars))}</span>
          </div>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-1">{t.notEnoughStarsBody.split('.')[0] + '.'}</p>
        </DialogContent>
        <DialogActions sx={{ p: { xs: '12px 24px 20px', sm: '12px 24px 20px' } }}>
          <Button fullWidth onClick={() => setConfirmMovie(null)} sx={{ borderRadius: '0.75rem', py: 1.25, textTransform: 'none', fontWeight: 600 }}>
            {t.close}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={confirmWatch}
            disabled={spending}
            sx={{
              borderRadius: '0.75rem',
              py: 1.25,
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #9333ea)' },
            }}
          >
            {spending ? '...' : <><Star size={16} className="fill-yellow-400 mr-1.5 inline text-yellow-400" />{t.confirmAction}</>}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!warnMovie}
        onClose={() => setWarnMovie(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '1.25rem', overflow: 'hidden', backgroundImage: 'none' } }}
      >
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center text-3xl">⚠️</div>
          <h4 className="text-white font-bold text-xl">{t.notEnoughStars}</h4>
        </div>
        <DialogContent sx={{ pt: { xs: '24px !important' }, pb: 1 }}>
          <p className="text-sm text-center text-slate-600 dark:text-slate-300 mb-3">
            {t.notEnoughStarsBody.replace('{cost}', String(warnMovie?.cost ?? MOVIE_COST))}
          </p>
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{t.totalStars}:</span>
            <span className="flex items-center gap-1 font-extrabold text-yellow-500"><Star size={15} className="fill-yellow-400" />{stars}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="flex items-center gap-1 font-extrabold text-rose-500"><Star size={15} />{warnMovie?.cost ?? MOVIE_COST}</span>
          </div>
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">⭐ {t.movieEarnHint}</p>
        </DialogContent>
        <DialogActions sx={{ p: { xs: '12px 24px 20px', sm: '12px 24px 20px' }, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => setWarnMovie(null)}
            sx={{ borderRadius: '0.75rem', px: 5, py: 1.25, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
          >
            {t.close}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setShowCopied(true); setTimeout(() => setShowCopied(false), 2000);
  };

  // Default home grid view
  if (!selected) {
    return (
      <section id="movies" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.moviesTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.moviesSub}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 inline-flex items-center gap-1"><Star size={12} className="fill-yellow-400" /> {t.confirmWatchBody.split('{cost}')[0]} {MOVIE_COST} ⭐</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {moviesData.map(movie => (
            <div key={movie.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col hover:border-indigo-400/40 transition-colors">
              <button onClick={() => tryWatch(movie)} className="relative h-48 overflow-hidden group text-left">
                <img src={movie.cover} alt={movie.title[lang] || movie.title.en} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle size={48} className="text-white/90" />
                </div>
              </button>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="px-2 py-1 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300">{movie.genre}</span>
                  <span className="flex items-center gap-1 text-yellow-400"><Star size={12} />{movie.rating}</span>
                  <span className="flex items-center gap-1 text-yellow-500 font-semibold"><Star size={11} className="fill-yellow-400" />{movie.cost ?? MOVIE_COST}</span>
                  <span className="text-slate-500 dark:text-slate-400">{movie.duration}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{movie.title[lang] || movie.title.en}</h3>
                <p className="text-xs text-slate-500 mb-1">{movie.year} · {movie.director}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t.subtitles}: {movie.subtitles}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-1">{movie.description[lang] || movie.description.en}</p>
                <div className="flex gap-2">
                  <button onClick={() => tryWatch(movie)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                    <PlayCircle size={16} /> {t.watchNow}
                  </button>
                  <button
                    onClick={() => toggleBookmark({ id: movie.id, type: 'movie', title: movie.title, director: movie.director })}
                    className={`p-2.5 rounded-xl border ${isBookmarked(movie.id, 'movie') ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/5'}`}
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {watchDialogs}
      </section>
    );
  }

  // YouTube-style watch layout
  const related = moviesData.filter(m => m.id !== selected.id);
  const views = Math.floor((selected.rating * 134567) % 999998 + 12000);

  return (
    <section id="movies" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.moviesTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t.moviesSub}</p>
      </div>

      <div className="flex lg:flex-row flex-col gap-6">
        {/* Main player + details */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video relative">
            <iframe
              src={`https://www.youtube.com/embed/${selected.embedVideoId}?autoplay=1&rel=0`}
              title={selected.title.en}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full"
            />
          </div>

          {/* Back button */}
          <button onClick={() => setSelected(null)} className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
            <ChevronLeft size={16} /> {lang === 'uz' ? 'Barcha kinolarga qaytish' : lang === 'ru' ? 'Назад ко всем фильмам' : 'Back to all movies'}
          </button>

          {/* Title + meta */}
          <div className="glass-panel rounded-2xl p-6 mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selected.title[lang] || selected.title.en}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { handleCopy(selected.takeaways[lang] || selected.takeaways.en); }}
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
                >
                  <Copy size={14} /> {t.share}
                </button>
                <button
                  onClick={() => toggleBookmark({ id: selected.id, type: 'movie', title: selected.title, director: selected.director })}
                  className={`p-2 rounded-lg border ${isBookmarked(selected.id, 'movie') ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10'}`}
                >
                  <Bookmark size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selected.year} · {selected.director}</p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400 border-y border-slate-200 dark:border-white/10 py-3">
              <span className="flex items-center gap-1.5"><span className="flex items-center gap-1 text-yellow-400"><Star size={14} className="fill-yellow-400" />{selected.rating}</span></span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-500 dark:text-indigo-400" />{selected.duration}</span>
              <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-purple-500 dark:text-purple-400" />{views.toLocaleString()} {t.views}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500 dark:text-emerald-400" />{selected.year}</span>
              <span className="flex items-center gap-1.5"><User size={14} className="text-slate-500 dark:text-slate-400" />{selected.director}</span>
              <span className="flex items-center gap-1.5"><span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300">{selected.genre}</span></span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{selected.description[lang] || selected.description.en}</p>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 mt-4">
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-300 mb-2">{t.movieTakeaways}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">"{selected.takeaways[lang] || selected.takeaways.en}"</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 mt-3">
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-300 mb-3">{t.movieVocabulary}</h4>
              <div className="flex flex-wrap gap-2">
                {selected.vocabulary?.map((v, i) => (
                  <span key={i} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">{v.word}</strong> <span className="text-xs text-indigo-600 dark:text-indigo-300">{v.phonetic}</span>
                    <br /><span className="text-xs text-slate-500 dark:text-slate-400">{v.meaning}</span>
                  </span>
                ))}
              </div>
            </div>

            {showCopied && <p className="text-xs text-green-600 dark:text-green-400 mt-3">{t.copied}</p>}
          </div>
        </div>

        {/* Related / Up next sidebar */}
        <aside className="lg:w-96 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownRight size={16} className="text-indigo-500 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'uz' ? 'Keyingi kino' : lang === 'ru' ? 'Смотреть дальше' : 'Up Next'}
            </h4>
          </div>
          <div className="space-y-4">
            {related.map(movie => (
              <button
                key={movie.id}
                onClick={() => { setSelected(movie); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full flex gap-3 text-left group"
              >
                <div className="relative w-40 h-24 rounded-xl overflow-hidden shrink-0 group-hover:ring-2 ring-indigo-400 transition-all">
                  <img src={movie.cover} alt={movie.title[lang] || movie.title.en} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={30} className="text-white/90" />
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white">{movie.duration}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {movie.title[lang] || movie.title.en}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{movie.director}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 text-yellow-400"><Star size={10} className="fill-yellow-400" />{movie.rating}</span>
                    <span>{movie.year}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
        {watchDialogs}
    </section>
  );
}