import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { moviesData, MOVIE_COST } from '../data/moviesData.js';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { Bookmark, Star, PlayCircle, Copy, ChevronLeft, ArrowDownRight, Clock, Calendar, User, ShieldCheck, TriangleAlert, X, Sparkles } from 'lucide-react';

export default function MoviesSection({ onNavigate }) {
  const { t, lang, stars, spendStars, toggleBookmark, isBookmarked } = useApp();
  const [selected, setSelected] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const [confirmMovie, setConfirmMovie] = useState(null);
  const [spending, setSpending] = useState(false);

  const tryWatch = (movie) => {
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
        maxWidth="sm"
        fullWidth
        transitionDuration={{ enter: 240, exit: 200 }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(5, 10, 26, 0.68)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              '@keyframes movieBackdropIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
              animation: 'movieBackdropIn 240ms ease-out',
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundImage: 'none',
            bgcolor: '#00103c',
            background: '#00103c',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(129, 140, 248, 0.28)',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            '&:hover': { borderColor: 'rgb(138, 43, 226)' },
            boxShadow: '0 34px 90px -22px rgba(2, 6, 23, 0.9), 0 0 60px -18px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.09)',
            maxHeight: '92vh',
            '@keyframes movieModalIn': {
              '0%': { opacity: 0, transform: 'translateY(26px) scale(0.94)' },
              '60%': { opacity: 1, transform: 'translateY(-4px) scale(1.01)' },
              '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
            },
            animation: 'movieModalIn 360ms cubic-bezier(0.22, 1, 0.36, 1) both',
          },
        }}
      >
        {confirmMovie && (() => {
          const cost = confirmMovie.cost ?? MOVIE_COST;
          const hasEnough = stars >= cost;
          const missing = Math.max(0, cost - stars);
          const title = confirmMovie.title[lang] || confirmMovie.title.en;
          const goEarnStars = () => {
            setConfirmMovie(null);
            if (onNavigate) onNavigate('english');
          };
          return (
            <div className="relative overflow-hidden text-left rounded-[20px] bg-[#00103c]">
              <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-indigo-600/30 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-28 -left-24 w-72 h-72 rounded-full bg-purple-600/25 blur-[90px]" />

              <div className="relative">
                <div className="relative h-28 sm:h-36 overflow-hidden rounded-t-[20px]">
                  <img src={confirmMovie.cover} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-[#00103c]/70 to-[#00103c]" />
                </div>

                <button
                  onClick={() => setConfirmMovie(null)}
                  aria-label={t.close}
                  className="absolute top-3 right-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/15 text-white/85 hover:bg-white/15 hover:text-white backdrop-blur-md transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="relative -mt-9 sm:-mt-10 px-4 sm:px-6 flex items-end gap-3.5 sm:gap-4">
                  <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 ring-1 ring-white/25 shadow-[0_10px_30px_rgba(2,6,23,0.65)]">
                    <img src={confirmMovie.cover} alt={title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 pb-1.5 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-300 mb-1">{t.confirmWatchTitle}</p>
                    <h3 className="text-white font-extrabold text-lg sm:text-xl leading-tight truncate">{title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-white/70">
                      <span className="inline-flex items-center gap-1"><Calendar size={12} className="text-indigo-300" />{confirmMovie.year}</span>
                      <span className="inline-flex items-center gap-1"><Clock size={12} className="text-indigo-300" />{confirmMovie.duration}</span>
                      <span className="inline-flex items-center gap-1 text-yellow-300"><Star size={12} className="fill-yellow-400" />{confirmMovie.rating}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[11px] font-semibold">{confirmMovie.genre}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative px-4 sm:px-6 pt-5 sm:pt-6 pb-5 sm:pb-6">
                <div className="text-center mb-5">
                  <h4 className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">
                    {t.movieConfirmQuestion.replace('{cost}', String(cost))}
                  </h4>
                  <p className="text-slate-400 text-[13px] sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
                    {t.movieConfirmExplain.replace('{cost}', String(cost))}
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-purple-400/60" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#00103c] border border-yellow-400/25 flex items-center justify-center shadow-[0_0_18px_rgba(250,204,21,0.16)] shrink-0">
                        <Star size={19} className="fill-yellow-400 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t.yourStarsLabel}</p>
                        <p className="text-xl sm:text-2xl font-extrabold text-white leading-none">{stars} <span className="text-base sm:text-lg align-middle text-yellow-300">⭐</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t.requiredStars}</p>
                      <p className="text-xl sm:text-2xl font-extrabold text-white leading-none flex items-center justify-end gap-1">
                        {cost} <Star size={16} className="fill-indigo-400 text-indigo-400" />
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={goEarnStars}
                    className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-100 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/25 hover:border-indigo-400/40 rounded-full px-4 py-1.5 transition-colors"
                  >
                    <Sparkles size={13} /> {t.earnStarsAction}
                  </button>
                </div>

                {!hasEnough && (
                  <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-rose-200">
                      <TriangleAlert size={17} className="text-rose-400 shrink-0" />
                      {t.notEnoughStars}
                    </span>
                    <span className="text-xs font-semibold text-rose-300/90">{t.missingStarsShort.replace('{amount}', String(missing))}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <Button
                    fullWidth
                    onClick={() => setConfirmMovie(null)}
                    sx={{
                      borderRadius: '0.9rem',
                      py: 1.3,
                      textTransform: 'none',
                      fontWeight: 700,
                      color: '#e2e8f0',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      background: 'rgba(148, 163, 184, 0.08)',
                      '&:hover': { background: 'rgba(148, 163, 184, 0.16)', borderColor: 'rgba(148, 163, 184, 0.4)' },
                    }}
                  >
                    {t.cancelAction}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={confirmWatch}
                    disabled={!hasEnough || spending}
                    sx={{
                      borderRadius: '0.9rem',
                      py: { xs: 1.4, sm: 1.3 },
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: '#fff',
                      background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)',
                      boxShadow: '0 14px 34px -10px rgba(124, 58, 237, 0.6), 0 4px 14px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
                      '&:hover': { background: 'linear-gradient(90deg, #4338ca 0%, #6d28d9 55%, #9333ea 100%)' },
                      '&.Mui-disabled': {
                        background: 'rgba(148, 163, 184, 0.12)',
                        color: 'rgba(148, 163, 184, 0.5)',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {spending ? '...' : (
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Star size={17} className="fill-yellow-300 text-yellow-300 -mt-px" />
                        {t.spendStarsAction.replace('{cost}', String(cost))}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
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
            <div key={movie.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col card-hover">
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
            {selected.videoUrl ? (
              <video
                key={selected.videoUrl}
                className="w-full h-full outline-none bg-black"
                controls
                playsInline
                preload="metadata"
                poster={selected.cover}
                title={selected.title.en}
              >
                <source src={selected.videoUrl} type="video/webm" />
                {lang === 'uz'
                  ? 'Brauzeringiz videoni qo\'llab-quvvatlamaydi.'
                  : lang === 'ru'
                    ? 'Ваш браузер не поддерживает видео.'
                    : 'Your browser does not support the video tag.'}
              </video>
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${selected.embedVideoId}?autoplay=1&rel=0`}
                title={selected.title.en}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full"
              />
            )}
          </div>
          {selected.videoUrl && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              {lang === 'uz'
                ? `Bepul va qonuniy manba: ${selected.videoSource || 'Wikimedia Commons'} — to'liq film, hech qanday reklamasiz.`
                : lang === 'ru'
                  ? `Бесплатный легальный источник: ${selected.videoSource || 'Wikimedia Commons'} — полный фильм, без рекламы.`
                  : `Free legal source: ${selected.videoSource || 'Wikimedia Commons'} — full movie, no ads.`}
            </p>
          )}

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