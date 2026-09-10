import { useApp } from '../context/AppContext.jsx';
import { BookOpen, Brain, Trophy, Award, CheckCircle, BookMarked } from 'lucide-react';

const STAR_MILESTONES = [
  { stars: 5, label: 'Boshlang\'ich', icon: '🌟', color: 'from-yellow-400 to-orange-500', desc: 'Ro\'yxatdan o\'tish' },
  { stars: 10, label: 'Yangi boshlovchi', icon: '⭐', color: 'from-yellow-500 to-amber-500', desc: 'Birinchi qadamlar' },
  { stars: 25, label: 'Faol o\'quvchi', icon: '💫', color: 'from-amber-400 to-yellow-500', desc: 'Doimiy harakat' },
  { stars: 50, label: 'Saralangan asar', icon: '🏆', color: 'from-indigo-400 to-purple-500', desc: 'Bir kitobni to\'liq o\'qish' },
  { stars: 100, label: 'Donishmand', icon: '👑', color: 'from-purple-500 to-pink-500', desc: 'Katta yutuq' },
  { stars: 200, label: 'Yulduz', icon: '✨', color: 'from-pink-400 to-red-400', desc: 'Haqiqiy stars' },
];

export default function StarsSection() {
  const { t, stars, completedBooks, gamesPlayed, bookmarks } = useApp();
  const lessonsDone = JSON.parse(localStorage.getItem('ft_completed_lessons') || '[]').length;
  const maxStars = STAR_MILESTONES[STAR_MILESTONES.length - 1].stars;
  const progress = Math.min((stars / maxStars) * 100, 100);
  const currentLevel = STAR_MILESTONES.filter(m => stars >= m.stars).pop() || STAR_MILESTONES[0];
  const nextLevel = STAR_MILESTONES.find(m => m.stars > stars);

  const achievements = [
    { icon: BookOpen, label: t.chapters || 'Kitoblar', count: completedBooks.length, color: 'text-indigo-400' },
    { icon: BookMarked, label: t.lessonsCompleted || 'Darslar', count: lessonsDone, color: 'text-green-400' },
    { icon: Brain, label: t.score || 'O\'yinlar', count: Object.values(gamesPlayed).reduce((a, b) => a + b, 0), color: 'text-purple-400' },
    { icon: Trophy, label: t.bookmark || 'Saqlanganlar', count: bookmarks.length, color: 'text-yellow-400' },
  ];

  return (
    <section id="stars" className="max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-4">
          <span className="text-4xl">{currentLevel.icon}</span>
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{stars} ⭐</h2>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">{currentLevel.label}</p>
          </div>
        </div>
        {nextLevel && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{nextLevel.stars - stars} ta yulduz keyingi daraja uchun: {nextLevel.label}</p>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-6 mb-8">
        <div className="h-4 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-2">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>0</span>
          <span>{stars}/{maxStars}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {achievements.map((a, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 text-center">
            <a.icon size={24} className={`${a.color} mx-auto mb-2`} />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{a.count}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{a.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Award size={22} className="text-yellow-500 dark:text-yellow-400" />Darajalar</h3>
      <div className="space-y-3">
        {STAR_MILESTONES.map((m) => {
          const unlocked = stars >= m.stars;
          return (
            <div key={m.stars} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${unlocked ? 'bg-gradient-to-r ' + m.color + ' bg-opacity-10 border-yellow-500/30' : 'bg-slate-100 border-slate-200 dark:bg-white/5 dark:border-white/5 opacity-50'}`}>
              <span className="text-3xl">{m.icon}</span>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white">{m.label}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900 dark:text-white">{m.stars} ⭐</span>
                {unlocked && <CheckCircle size={18} className="text-green-600 dark:text-green-400 ml-1 inline" />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}