import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { podcastsData } from '../data/podcastsData.js';
import { Play, Pause, Bookmark, Headphones, AlertTriangle, Loader2, RotateCcw, Rewind, FastForward } from 'lucide-react';

function PodcastCard({ pod, lang, t, toggleBookmark, isBookmarked }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onDur = () => setDuration(a.duration || 0);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onDur);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('canplay', onCanPlay);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onDur);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('canplay', onCanPlay);
      try { a.pause(); } catch {}
    };
  }, []);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    setFailed(false);
    try {
      if (a.paused) {
        setLoading(true);
        await a.play();
      } else {
        a.pause();
      }
    } catch (err) {
      console.warn('Audio play error:', err);
      setFailed(true);
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setFailed(false);
    setLoading(true);
    a.load();
    a.play().catch(() => setFailed(true));
  }, []);

  const skip = useCallback((sec) => {
    const a = audioRef.current;
    if (!a || !isFinite(a.currentTime)) return;
    const target = a.currentTime + sec;
    a.currentTime = Math.min(Math.max(target, 0), a.duration || 0);
  }, []);

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col card-hover">
      <div className="relative h-44">
        <img src={pod.cover} alt={pod.title[lang] || pod.title.en} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-purple-500 text-white text-xs font-semibold">{pod.category}</span>
        {playing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="w-1.5 bg-purple-400 rounded animate-pulse mx-0.5"
                style={{ animationDelay: `${i * 0.15}s`, height: loading ? '16px' : `${16 + Math.sin((currentTime + i) * 2) * 16}px`, transition: 'height 0.15s ease' }} />
            ))}
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400"><Headphones size={14} />{pod.host} · {pod.duration}</div>
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">{pod.title[lang] || pod.title.en}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-1">{pod.description[lang] || pod.description.en}</p>

        {duration > 0 && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button onClick={() => skip(-10)} title="-10s"
            className="flex flex-col items-center justify-center gap-0.5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">
            <Rewind size={16} /><span className="text-[9px] font-bold leading-none">-10</span>
          </button>
          <button onClick={togglePlay} disabled={loading && !playing}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70">
            {loading && !playing ? <Loader2 size={16} className="animate-spin" /> : playing ? <Pause size={16} /> : <Play size={16} />}
            {loading && !playing ? 'Loading...' : playing ? 'Pause' : t.listenAudio}
          </button>
          <button onClick={() => skip(10)} title="+10s"
            className="flex flex-col items-center justify-center gap-0.5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">
            <FastForward size={16} /><span className="text-[9px] font-bold leading-none">+10</span>
          </button>
          <button onClick={() => toggleBookmark({ id: pod.id, type: 'podcast', title: pod.title, host: pod.host })}
            className={`p-2.5 rounded-xl border ${isBookmarked(pod.id, 'podcast') ? 'bg-indigo-500 text-white' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>
            <Bookmark size={16} />
          </button>
        </div>

        {failed && (
          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs text-red-500 flex items-center gap-1 flex-1"><AlertTriangle size={13} />{t.audioError}</p>
            <button onClick={retry} className="text-xs text-indigo-500 flex items-center gap-1 hover:text-indigo-400"><RotateCcw size={12} />Retry</button>
          </div>
        )}

        <audio
          ref={audioRef}
          src={pod.audioSrc}
          preload="metadata"
          loop
          className="w-full mt-3 h-9"
          onPlay={() => { setPlaying(true); setLoading(false); }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={(e) => { console.warn('Audio error:', e); setFailed(true); setLoading(false); }}
        />
      </div>
    </div>
  );
}

export default function Podcasts() {
  const { t, lang, toggleBookmark, isBookmarked } = useApp();

  return (
    <section id="podcasts" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="mb-8"><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.podcastsTitle}</h2><p className="text-slate-500 dark:text-slate-400">{t.podcastsSub}</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {podcastsData.map(pod => (
          <PodcastCard key={pod.id} pod={pod} lang={lang} t={t} toggleBookmark={toggleBookmark} isBookmarked={isBookmarked} />
        ))}
      </div>
    </section>
  );
}