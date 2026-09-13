import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { englishVideos, englishFlashcards, englishQuizQuestions, grammarTips } from '../data/englishData.js';
import { Volume2, BookOpen, Lightbulb, BookMarked, Star } from 'lucide-react';
import LevelsSection from './LevelsSection.jsx';
import confetti from 'canvas-confetti';

const TABS = ['videos', 'levels', 'flashcards', 'quiz', 'grammar'];
export default function EnglishHub({ onNavigate }) {
  const { t, lang } = useApp();
  const [tab, setTab] = useState('videos');
  return (
    <section id="english" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="mb-8"><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.englishTitle}</h2><p className="text-slate-500 dark:text-slate-400">{t.englishSub}</p></div>
      {onNavigate && (
        <button onClick={() => onNavigate('lessons')} className="mb-6 flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <BookMarked size={18} /> {t.lessonsTitle || 'Ingliz Tili Darslari'} →
        </button>
      )}
      <div role="tablist" aria-label="English sections" className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(id => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === id ? 'bg-indigo-500 text-white' : 'bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'}`}
          >
            {t['tab' + id.charAt(0).toUpperCase() + id.slice(1)]}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel-videos" aria-label="Videos" hidden={tab !== 'videos'}>{tab === 'videos' && <VideoTab t={t} lang={lang} />}</div>
      <div role="tabpanel" id="panel-levels" aria-label="Levels" hidden={tab !== 'levels'}>{tab === 'levels' && <LevelsSection onNavigate={onNavigate} />}</div>
      <div role="tabpanel" id="panel-flashcards" aria-label="Flashcards" hidden={tab !== 'flashcards'}>{tab === 'flashcards' && <FlashcardTab t={t} lang={lang} />}</div>
      <div role="tabpanel" id="panel-quiz" aria-label="Quiz" hidden={tab !== 'quiz'}>{tab === 'quiz' && <QuizTab t={t} lang={lang} />}</div>
      <div role="tabpanel" id="panel-grammar" aria-label="Grammar" hidden={tab !== 'grammar'}>{tab === 'grammar' && <GrammarTab lang={lang} />}</div>
    </section>
  );
}

let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (document.getElementById('yt-iframe-api')) {
      const check = setInterval(() => {
        if (window.YT && window.YT.Player) { clearInterval(check); resolve(); }
      }, 100);
    } else {
      window.onYouTubeIframeAPIReady = () => resolve();
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  });
  return ytApiPromise;
}

function VideoPlayer({ video, onEnded }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const endedHandledRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  const videoRef = useRef(video);
  useEffect(() => { videoRef.current = video; }, [video]);
  const embedId = video.embedId;

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT || !window.YT.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: embedId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED && !endedHandledRef.current) {
              endedHandledRef.current = true;
              onEndedRef.current(videoRef.current);
            }
          }
        }
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }
    };
  }, [embedId]);

  return <div ref={containerRef} className="w-full h-full" />;
}

function VideoTab({lang}) {
  const { t, watchedVideos, watchVideo } = useApp();
  const [rewarded, setRewarded] = useState(null);
  const rewardedTimerRef = useRef(null);

  const handleEnded = (video) => {
    const ok = watchVideo(video.id, video.title.en);
    if (ok) {
      setRewarded(video);
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
      if (rewardedTimerRef.current) clearTimeout(rewardedTimerRef.current);
      rewardedTimerRef.current = setTimeout(() => setRewarded(null), 8000);
    }
  };

  return (
    <div>
      {rewarded && (
        <div className="mb-6 glass-panel rounded-2xl p-5 text-center border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-orange-500/20 animate-pulse">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t.videoCongrats}</h3>
          <p className="text-sm text-yellow-600 dark:text-yellow-300 font-semibold">⭐ +50</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {englishVideos.map(v => {
          const isDone = !!watchedVideos[v.id];
          return (
            <div key={v.id} className="glass-panel rounded-2xl overflow-hidden card-hover">
              <div className="aspect-video relative bg-slate-900/60">
                <VideoPlayer key={`${v.id}-${v.embedId}`} video={v} onEnded={handleEnded} />
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-indigo-500 text-white text-xs font-bold pointer-events-none">{v.level}</div>
                {isDone && <div className="absolute top-2 right-2 px-2 py-1 rounded bg-green-500 text-white text-xs font-bold pointer-events-none">✓ {t.videoCompleted}</div>}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{v.title[lang] || v.title.en}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{v.channel} · {v.duration}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{v.description[lang] || v.description.en}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`inline-flex items-center gap-1 font-semibold ${isDone ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    <Star size={14} className="text-yellow-500" /> +50 ⭐
                  </span>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">✓ +50 ⭐</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">{t.videoRewardHint}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function FlashcardTab({t,lang}) {
  const [idx,setIdx] = useState(0);
  const [flipped,setFlipped] = useState(false);
  const [learned,setLearned] = useState(()=>JSON.parse(localStorage.getItem('ft_learned_fc')||'[]'));
  const card = englishFlashcards[idx];
  const next = ()=>{ setFlipped(false); setIdx(p=>(p+1)%englishFlashcards.length); };
  const toggleLearned = ()=>{ const ids=learned.includes(card.id)?learned.filter(i=>i!==card.id):[...learned,card.id]; setLearned(ids); localStorage.setItem('ft_learned_fc',JSON.stringify(ids)); };
  const speak = (word)=>{ const u=new SpeechSynthesisUtterance(word); u.lang='en-US'; window.speechSynthesis?.speak(u); };
  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between mb-4 text-sm text-slate-500 dark:text-slate-400"><span>{idx+1}/{englishFlashcards.length}</span><span className="text-green-600 dark:text-green-400">{learned.length} mastered</span></div>
      <div onClick={()=>setFlipped(!flipped)} className="glass-panel rounded-2xl p-8 min-h-[260px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400/40 transition-all">
        {!flipped?(<div className="text-center"><p className="text-xs text-indigo-600 dark:text-indigo-300 mb-2">{t.wordOfTheDay}</p><h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{card.word}</h3><p className="text-slate-500 dark:text-slate-400">{card.phonetic}</p><p className="text-xs text-slate-500 mt-1">{card.partOfSpeech} · {card.category}</p></div>):(<div className="text-center"><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Translation:</p><p className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.translation[lang]||card.translation.en}</p><p className="text-sm text-indigo-600 dark:text-indigo-300 italic mb-1">"{card.exampleEn}"</p><p className="text-xs text-slate-500">{card.exampleUz}</p></div>)}
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={()=>speak(card.word)} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900/5 text-slate-700 text-sm font-medium hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"><Volume2 size={14}/> Pronounce</button>
        <button onClick={toggleLearned} className={`flex-1 py-3 rounded-xl text-sm font-medium ${learned.includes(card.id)?'bg-green-500 text-white':'bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>{learned.includes(card.id)?'✓ Learned':'Mark Learned'}</button>
        <button onClick={next} className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium">Next →</button>
      </div>
    </div>
  );
}
function QuizTab({t,lang}) {
  const { addStars } = useApp();
  const [qi,setQi] = useState(0);
  const [score,setScore] = useState(0);
  const [answered,setAnswered] = useState(null);
  const [done,setDone] = useState(false);
  const q = englishQuizQuestions[qi];
  const choose = (i)=>{ if(answered!==null) return; setAnswered(i); if(i===q.correctAnswer){ setScore(s=>s+1); addStars(2, t.quizCorrect + ` (Q${qi+1})`); } };
  const next = ()=>{ if(qi+1>=englishQuizQuestions.length){ setDone(true); addStars(5, t.quizComplete); }else{setQi(qi+1);setAnswered(null);} };
  if(done) return (<div className="text-center glass-panel rounded-2xl p-8 max-w-md mx-auto"><h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.quizWellDone}</h3><p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">{score}/{englishQuizQuestions.length}</p><p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">⭐ +5 {t.totalStars}</p><button onClick={()=>{setQi(0);setScore(0);setAnswered(null);setDone(false);}} className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold">{t.quizRestart}</button></div>);
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between mb-4 text-sm text-slate-500 dark:text-slate-400"><span>Q{qi+1}/{englishQuizQuestions.length}</span><span>{t.quizScore}: {score}</span></div>
      <div className="glass-panel rounded-2xl p-6 mb-4"><p className="text-slate-900 dark:text-white font-medium mb-4">{q.question}</p>
        <div className="space-y-2">{q.options.map((opt,i)=>{const sel=answered===i;const correct=i===q.correctAnswer;const show=answered!==null;return(<button key={i} onClick={()=>choose(i)} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${show?(correct?'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300':sel?'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300':'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-500'):'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10'} border`}>{opt}</button>);})}</div>
      </div>
      {answered!==null&&(<div><p className="text-sm text-slate-600 dark:text-slate-300 mb-3 bg-slate-100 dark:bg-white/5 p-3 rounded-xl"><Lightbulb size={16} className="inline text-indigo-500 dark:text-indigo-400 mr-1"/>{q.explanation[lang]||q.explanation.en}</p><button onClick={next} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold">{t.quizNext} →</button></div>)}
    </div>
  );
}

function GrammarTab({lang}) {
  return (<div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">{grammarTips.map(g=>(<div key={g.id} className="glass-panel rounded-2xl p-6"><div className="flex items-center gap-2 mb-3"><BookOpen size={18} className="text-indigo-500 dark:text-indigo-400"/><h3 className="font-bold text-slate-900 dark:text-white">{g.title[lang]||g.title.en}</h3></div><p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{g.rule[lang]||g.rule.en}</p><p className="text-xs text-indigo-600 dark:text-indigo-300 italic">Example: {g.example}</p></div>))}</div>);
}
