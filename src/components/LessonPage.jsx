import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { lessons } from '../data/lessonsData.js';
import { BookOpen, Star, Award, CheckCircle } from 'lucide-react';
import { logActivity } from '../services/activityService.js';
import confetti from 'canvas-confetti';

export default function LessonPage({ openLessonId }) {
  const { t, lang, addStars, completedBooks } = useApp();
  const initialIndex = lessons.findIndex(l => l.id === openLessonId) >= 0
    ? lessons.findIndex(l => l.id === openLessonId)
    : 0;
  const [page, setPage] = useState(initialIndex);
  const [completedLessons, setCompletedLessons] = useState(() => JSON.parse(localStorage.getItem('ft_completed_lessons') || '[]'));
  const [justCompleted, setJustCompleted] = useState(false);

  const lesson = lessons[page];
  const totalPages = lessons.length;
  const allDone = completedLessons.length === totalPages;

  const markComplete = () => {
    if (completedLessons.includes(lesson.id)) return;
    const updated = [...completedLessons, lesson.id];
    setCompletedLessons(updated);
    localStorage.setItem('ft_completed_lessons', JSON.stringify(updated));
    logActivity('lesson', lesson.title[lang] || lesson.title.en);
    addStars(lesson.stars, `Dars tugadi: ${lesson.title[lang] || lesson.title.en}`);

    if (updated.length === totalPages && !completedBooks.includes('english-lessons-bundle')) {
      setTimeout(() => {
        addStars(50, 'Barcha ingliz darslari tugadi!');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setJustCompleted(true);
      }, 500);
    }
  };

  return (
    <section id="lessons" className="max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 mb-4">
          <BookOpen size={18} className="text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{t.lessonsTitle}</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.lessonsTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{t.lessonsSub}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { if (page > 0) setPage(page - 1); setJustCompleted(false); }}
          disabled={page === 0}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xl font-bold disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
          title={t.lessonPrev}
        >
          &lt;
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t.lessonPage} {page + 1} {t.lessonOf} {totalPages}
          </span>
          <div className="flex gap-1">
            {lessons.map((l, i) => (
              <button
                key={l.id}
                onClick={() => { setPage(i); setJustCompleted(false); }}
                className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-indigo-500' : completedLessons.includes(l.id) ? 'bg-green-500' : 'bg-slate-300 dark:bg-white/20'}`}
                title={l.title[lang] || l.title.en}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() => { if (page < totalPages - 1) setPage(page + 1); setJustCompleted(false); }}
          disabled={page === totalPages - 1}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500 text-white text-xl font-bold disabled:opacity-40 hover:bg-indigo-600 transition-colors"
          title={t.lessonNext}
        >
          &gt;
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
            {lesson.id}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {lesson.title[lang] || lesson.title.en}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Star size={12} className="text-yellow-500" /> +{lesson.stars} {t.lessonStarsEarned}
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          {(lesson.content[lang] || lesson.content.en).split('. ').reduce((acc, sentence, i, arr) => {
            if (i % 3 === 0) acc.push([]);
            acc[acc.length - 1].push(sentence + (i < arr.length - 1 ? '. ' : ''));
            return acc;
          }, []).map((group, i) => (
            <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3 text-sm">
              {group.join('')}
            </p>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Award size={16} className="text-yellow-500" />
          <span>{completedLessons.length}/{totalPages} {t.lessonsCompleted}</span>
        </div>

        {!completedLessons.includes(lesson.id) ? (
          <button
            onClick={markComplete}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <CheckCircle size={18} /> {t.lessonComplete}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400 text-sm font-medium">
            <CheckCircle size={16} /> ✓ {t.lessonComplete}
          </div>
        )}
      </div>

      {allDone && (
        <div className="mt-8 glass-panel rounded-2xl p-6 text-center border border-yellow-500/30">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.lessonFinishAll}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">+50 ⭐ {t.lessonStarsEarned}</p>
        </div>
      )}

      {justCompleted && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30">
            <span className="text-2xl">🎉</span>
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-300">+50 ⭐ Bonus!</span>
          </div>
        </div>
      )}
    </section>
  );
}
