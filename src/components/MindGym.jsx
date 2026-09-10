import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { riddlesData, wordleWords } from '../data/gamesData.js';
import { Eye, RotateCcw, Trophy, Calculator, Puzzle, Brain, Keyboard } from 'lucide-react';

export default function MindGym() {
  const { t, lang } = useApp();
  const [game, setGame] = useState('riddles');
  const [score, setScore] = useState(0);
  const games = [
    { id:'riddles', label:t.gameRiddles, icon:Puzzle },
    { id:'math', label:t.gameSpeedMath, icon:Calculator },
    { id:'memory', label:t.gameMemory, icon:Brain },
    { id:'wordle', label:t.gameWordle, icon:Keyboard },
  ];
  return (
    <section id="mindGym" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.mindGymTitle}</h2><p className="text-slate-500 dark:text-slate-400">{t.mindGymSub}</p></div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10"><Trophy size={18} className="text-yellow-400"/><span className="font-bold text-slate-900 dark:text-white">{score}</span></div>
      </div>
      <div className="flex gap-2 mb-8 flex-wrap">{games.map(g=>(<button key={g.id} onClick={()=>setGame(g.id)} className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${game===g.id?'bg-indigo-500 text-white':'bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}><g.icon size={16}/>{g.label}</button>))}</div>
      {game==='riddles'&&<RiddlesGame lang={lang} setScore={setScore} t={t}/>}
      {game==='math'&&<MathGame setScore={setScore} t={t} lang={lang}/>}
      {game==='memory'&&<MemoryGame setScore={setScore} t={t}/>}
      {game==='wordle'&&<WordleGame setScore={setScore}/>}
    </section>
  );
}

function RiddlesGame({lang,setScore,t}) {
  const [idx,setIdx] = useState(0);
  const [showAns,setShowAns] = useState(false);
  const [done,setDone] = useState(new Set());
  const r = riddlesData[idx];
  const reveal = ()=>{ setShowAns(true); if(!done.has(idx)){setDone(new Set(done).add(idx));setScore(s=>s+10);} };
  return (
    <div className="max-w-xl mx-auto glass-panel rounded-2xl p-8 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Riddle {idx+1}/{riddlesData.length}</p>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{r.question[lang]}</h3>
      <p className="text-xs text-slate-500 mb-4">💡 {r.hint}</p>
      {showAns&&<div className="bg-green-500/15 border border-green-500/40 rounded-xl p-4 mb-4"><p className="font-bold text-green-700 dark:text-green-400 text-lg">{r.answer[lang]}</p></div>}
      <div className="flex justify-center gap-3">
        {!showAns
          ?<button onClick={reveal} className="px-6 py-3 rounded-xl bg-indigo-500 text-white"><Eye size={16} className="inline mr-1"/>{t.revealAnswer}</button>
          :<button onClick={()=>{setShowAns(false);setIdx((idx+1)%riddlesData.length);}} className="px-6 py-3 rounded-xl bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-300">Next →</button>}
      </div>
    </div>
  );
}
function MathGame({setScore,t,lang}) {
  const { addStars } = useApp();
  const genPair = ()=>[Math.floor(Math.random()*20)+10, Math.floor(Math.random()*20)+1];
  const [[a,b],setPair] = useState(genPair);
  const [answer,setAnswer] = useState('');
  const [right,setRight] = useState(0);
  const [total,setTotal] = useState(0);
  const [flash,setFlash] = useState(null);
  const [bonus,setBonus] = useState(false);
  const [correctAns,setCorrectAns] = useState(null);
  const checkAnswer = ()=>{
    if(answer.trim()==='' || isNaN(parseInt(answer.trim()))) return;
    const userAns = parseInt(answer.trim(), 10);
    const sum = a + b;
    const isCorrect = userAns === sum;
    setTotal(p=>p+1);
    setCorrectAns(sum);
    setFlash(isCorrect);
    if(isCorrect){ setScore(s=>s+10); const newRight=right+1; setRight(newRight); if(newRight%10===0){ addStars(5, t.mindGymReward); setBonus(true); setTimeout(()=>setBonus(false),2500); } }
    setTimeout(()=>{ setPair(genPair()); setAnswer(''); setFlash(null); setCorrectAns(null); },1800);
  };
  const flashMsg = flash===null ? '' : flash
    ? (lang==='uz'?'✅ To\'g\'ri! +10 ball':lang==='ru'?'✅ Правильно! +10 очков':'✅ Correct! +10 points')
    : (lang==='uz'?'❌ Noto\'g\'ri! Javob: ':lang==='ru'?'❌ Неправильно! Ответ: ':'❌ Wrong! Answer: ')+correctAns;
  return (
    <div className="max-w-md mx-auto glass-panel rounded-2xl p-8 text-center">
      <div className="flex justify-center items-end gap-3 mb-6"><span className="text-5xl font-extrabold text-slate-900 dark:text-white">{a}</span><span className="text-3xl text-indigo-500 dark:text-indigo-400">+</span><span className="text-5xl font-extrabold text-slate-900 dark:text-white">{b}</span><span className="text-3xl text-indigo-500 dark:text-indigo-400">=</span><span className="text-3xl text-slate-500 dark:text-slate-400">?</span></div>
      {bonus&&<div className="mb-4 py-2.5 rounded-xl bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 border border-yellow-400/40 text-sm font-bold animate-pulse">⭐ {t.mindGymReward}</div>}
      {flash!==null&&<div className={`mb-4 py-2 rounded-xl text-sm font-bold ${flash?'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30':'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'}`}>{flashMsg}</div>}
      <div className="flex items-center justify-center gap-2 mb-4">
        <input inputMode="numeric" value={answer} onChange={e=>{if(/^\d*$/.test(e.target.value))setAnswer(e.target.value);}} onKeyDown={e=>{if(e.key==='Enter')checkAnswer();}} disabled={flash!==null} className="w-28 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 text-center text-slate-900 dark:text-white text-2xl font-bold border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-400 disabled:opacity-50" placeholder="?"/>
        <button onClick={checkAnswer} disabled={flash!==null} className="px-5 py-3 rounded-xl bg-indigo-500 text-white font-semibold disabled:opacity-50">{t.checkAnswer}</button>
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{t.score}: {right}/{total}</div>
    </div>
  );
}

function MemoryGame({setScore,t}) {
  const cards = ['📚','🎬','🧠','💡','🌍','⚡'];
  const pairs = [...cards,...cards].map((e,i)=>({id:i,emoji:e,flipped:false,match:false}));
  const [grid,setGrid] = useState(()=>pairs.sort(()=>Math.random()-0.5));
  const [open,setOpen] = useState([]);
  const [moves,setMoves] = useState(0);
  const flip = (id)=>{
    if(open.length===2||open.includes(id)||grid.find(c=>c.id===id)?.match) return;
    const o=[...open,id]; setOpen(o); setMoves(moves+1);
    setGrid(g0=>g0.map(c=>c.id===id?{...c,flipped:true}:c));
    if(o.length===2){
      const f=grid.find(c=>c.id===o[0]); const s=grid.find(c=>c.id===o[1]);
      if(f.emoji===s.emoji){ setGrid(g0=>g0.map(c=>({...c,match:c.emoji===f.emoji||c.match,flipped:c.emoji===f.emoji||c.match}))); setScore(sc=>sc+10); setOpen([]); }
      else setTimeout(()=>{ setGrid(g0=>g0.map(c=>({...c,flipped:c.match}))); setOpen([]); },700);
    }
  };
  const allMatched = grid.length>0&&grid.every(c=>c.match);
  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-3">{t.score}: {moves}</p>
      <div className="grid grid-cols-4 gap-3">{grid.map(c=>(<button key={c.id} onClick={()=>flip(c.id)} className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${c.match?'bg-emerald-500/30 border-emerald-400/50':c.flipped?'bg-indigo-100/70 border-indigo-400/50 dark:bg-white/15 dark:border-indigo-400/50':'bg-slate-100 border-slate-200 dark:bg-white/5 dark:border-white/10'}`}>{c.flipped||c.match?c.emoji:''}</button>))}</div>
      {allMatched&&<div className="text-center mt-4"><p className="text-green-700 dark:text-green-400 font-bold mb-2">🎉 Well done!</p><button onClick={()=>{setGrid(pairs.sort(()=>Math.random()-0.5));setMoves(0);}} className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm"><RotateCcw size={14} className="inline mr-1"/>Restart</button></div>}
    </div>
  );
}
function WordleGame({setScore}) {
  const [target] = useState(()=>wordleWords[Math.floor(Math.random()*wordleWords.length)]);
  const [guesses,setGuesses] = useState([]);
  const [current,setCurrent] = useState('');
  const [won,setWon] = useState(false);
  const [lost,setLost] = useState(false);
  const submit = ()=>{
    if(current.length!==5||won||lost) return;
    const guess=current.toUpperCase();
    const n=[...guesses,guess]; setGuesses(n);
    if(guess===target.word){setWon(true);setScore(s=>s+50);}
    else if(n.length>=6) setLost(true);
    else setScore(s=>s+5);
    setCurrent('');
  };
  const cellClass = (g,i)=>{
    if(g===target.word) return 'bg-emerald-500/60 border-emerald-300 text-white';
    const l=g[i];
    if(l===target.word[i]) return 'bg-emerald-500/60 border-emerald-300 text-white';
    if(target.word.includes(l)) return 'bg-yellow-500/50 border-yellow-300 text-white';
    return 'bg-white/5 border-white/10 text-slate-500';
  };
  return (
    <div className="max-w-sm mx-auto">
      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-1">💡 {target.hint}</p>
      <div className="space-y-2 mb-4">{Array.from({length:6}).map((_,gi)=>(<div key={gi} className="grid grid-cols-5 gap-1.5">{Array.from({length:5}).map((_,ci)=>{const g=guesses[gi];return(<div key={ci} className={`aspect-square rounded-lg border flex items-center justify-center text-xl font-extrabold ${g?cellClass(g,ci):gi===guesses.length?'border-indigo-400/40':'border-slate-200 dark:border-white/10'}`}>{g?g[ci]:''}</div>);})}</div>))}</div>
      <div className="flex gap-2">
        <input value={current} onChange={e=>setCurrent(e.target.value.replace(/[^a-zA-Z]/g,'').slice(0,5))} onKeyDown={e=>{if(e.key==='Enter')submit();}} placeholder="WORD" className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-center uppercase font-bold tracking-[0.4em] outline-none focus:border-indigo-400"/>
        <button onClick={submit} className="px-5 py-3 rounded-xl bg-indigo-500 text-white font-semibold">Go</button>
      </div>
      {won&&<p className="text-center text-green-700 dark:text-green-400 font-bold mt-3">🎉 {target.word} — Well done!</p>}
      {lost&&<p className="text-center text-red-700 dark:text-red-400 font-bold mt-3">Answer: {target.word}. Try again!</p>}
    </div>
  );
}