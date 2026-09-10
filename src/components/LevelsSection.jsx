import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { englishLevels, lessonLevelMap, levelMatchesRange, getLevelIndex, CEFR_ORDER } from '../data/englishLevels.js';
import { englishVideos } from '../data/englishData.js';
import { lessons } from '../data/lessonsData.js';
import { GraduationCap, ArrowLeft, ArrowRight, PlayCircle, BookMarked, CheckCircle2, ChevronLeft } from 'lucide-react';

function LevelCard({ level, t, lang, onSelect }) {
  return (
    <button
      onClick={() => onSelect(level.code)}
      aria-label={`${level.code} — ${level.name[lang] || level.name.en}`}
      className="glass-panel rounded-2xl p-6 text-left hover:border-indigo-400/50 hover:-translate-y-1 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-extrabold">{level.code}</span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-semibold">{level.name[lang] || level.name.en}</span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{level.tagline[lang] || level.tagline.en}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:gap-2 transition-all">
        {t.levelsOpen} <ArrowRight size={13} />
      </div>
    </button>
  );
}

export default function LevelsSection({ onNavigate }) {
  const { t, lang } = useApp();
  const [active, setActive] = useState(null);

  const level = active ? englishLevels[getLevelIndex(active)] : null;
  const activeIndex = level ? getLevelIndex(level.code) : -1;

  if (!level) {
    return (
      <div>
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <GraduationCap size={22} className="text-indigo-500 dark:text-indigo-400" />{t.englishLevelsTitle}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">{t.englishLevelsSub}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {englishLevels.map(l => <LevelCard key={l.code} level={l} t={t} lang={lang} onSelect={setActive} />)}
        </div>
      </div>
    );
  }

  const levelLessons = lessons.filter(l => lessonLevelMap[l.id] === level.code);
  const levelVideos = englishVideos.filter(v => levelMatchesRange(level.code, v.level));

  return (
    <div aria-live="polite">
      <button onClick={() => setActive(null)} className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors">
        <ChevronLeft size={16} />{t.levelsBack}
      </button>

      <div className="glass-panel rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-extrabold">{level.code}</span>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t.englishLevelsTitle} · {level.code}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{level.name[lang] || level.name.en} — {level.tagline[lang] || level.tagline.en}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeIndex > 0 && (
              <button onClick={() => setActive(CEFR_ORDER[activeIndex - 1])} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-xs font-semibold flex items-center gap-1">
                <ArrowLeft size={13} />{t.levelsPrev}
              </button>
            )}
            {activeIndex < CEFR_ORDER.length - 1 && (
              <button onClick={() => setActive(CEFR_ORDER[activeIndex + 1])} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-xs font-semibold flex items-center gap-1">
                {t.levelsNext}<ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" />{t.levelsChecklist}</h4>
            <ul className="space-y-2">
              {(level.skills[lang] || level.skills.en).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="mt-1 w-4 h-4 rounded-md bg-green-500/15 border border-green-500/40 flex items-center justify-center text-green-500 shrink-0"><CheckCircle2 size={11} /></span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><BookMarked size={16} className="text-indigo-500" />{t.levelsLessonPlan} ({levelLessons.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {levelLessons.map(l => (
                <div key={l.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{l.title[lang] || l.title.en}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">+{l.stars} ⭐</div>
                  </div>
                  <button
                    onClick={() => onNavigate && onNavigate('lessons', { lesson: l.id })}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold shrink-0 flex items-center gap-1"
                  >
                    <PlayCircle size={12} />{t.levelsOpen}
                  </button>
                </div>
              ))}
              {levelLessons.length === 0 && <p className="text-sm text-slate-500">{'—'}</p>}
            </div>
          </div>
        </div>
      </div>

      <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t.levelsVideos} ({levelVideos.length})</h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {levelVideos.map(v => (
          <div key={v.id} className="glass-panel rounded-2xl overflow-hidden">
            <div className="aspect-video relative">
              <iframe src={`https://www.youtube.com/embed/${v.embedId}`} className="w-full h-full" title={v.title.en} allowFullScreen />
              <span className="absolute top-2 left-2 px-2 py-1 rounded bg-indigo-500 text-white text-xs font-bold">{v.level}</span>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{v.title[lang] || v.title.en}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{v.channel} · {v.duration}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{v.description[lang] || v.description.en}</p>
            </div>
          </div>
        ))}
        {levelVideos.length === 0 && <p className="text-sm text-slate-500">{'—'}</p>}
      </div>
    </div>
  );
}