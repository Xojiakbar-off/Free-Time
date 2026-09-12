import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { soundService } from '../services/soundService.js';
import { Play, Pause, RotateCcw, CloudRain, Waves, Trees, Flame, Coffee, Wind } from 'lucide-react';

const SOUNDS = [
  { id:'rain', labelKey:'soundRain', icon:CloudRain },
  { id:'ocean', labelKey:'soundOcean', icon:Waves },
  { id:'forest', labelKey:'soundForest', icon:Trees },
  { id:'campfire', labelKey:'soundCampfire', icon:Flame },
  { id:'cafe', labelKey:'soundCafe', icon:Coffee },
  { id:'whiteNoise', labelKey:'soundWhiteNoise', icon:Wind },
];

export default function FocusAmbience() {
  const { t, addStars } = useApp();
  const [mode,setMode] = useState('pomodoro');
  const [seconds,setSeconds] = useState(25*60);
  const [running,setRunning] = useState(false);
  const [activeSound,setActiveSound] = useState(null);
  const [volume,setVolume] = useState(0.5);
  const timerRef = useRef(null);
  const awardedRef = useRef(false);
  const MODES = [
    { id:'pomodoro', label:t.pomodoro, time:25*60 },
    { id:'short', label:t.shortBreak, time:5*60 },
    { id:'long', label:t.longBreak, time:15*60 },
  ];
  useEffect(()=>{ return ()=>{ soundService.stopAll(); }; },[]);
  useEffect(()=>{
    if(running){ timerRef.current=setInterval(()=>setSeconds(s=>{ if(s<=1){clearInterval(timerRef.current);setRunning(false);soundService.playChime(); if(mode==='pomodoro'&&!awardedRef.current){awardedRef.current=true;addStars(5,t.pomodoroComplete);} return 0;} return s-1; }),1000); }
    else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  },[running,mode,addStars,t]);
  const switchMode = (id)=>{
    const m = MODES.find(x=>x.id===id);
    if(m){ awardedRef.current=false; setMode(id); setSeconds(m.time); setRunning(false); }
  };
  const toggleSound = (id)=>{
    if(activeSound===id){ soundService.stopAmbient(id); setActiveSound(null); return; }
    if(activeSound) soundService.stopAmbient(activeSound);
    soundService.playAmbient(id,volume); setActiveSound(id);
  };
  const fmt=(s)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const prog = 1-(seconds/(MODES.find(m=>m.id===mode)?.time||1500));
  return (
    <section id="focus" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
      <div className="mb-8"><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.focusTitle}</h2><p className="text-slate-500 dark:text-slate-400">{t.focusSub}</p></div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="flex justify-center gap-2 mb-8 flex-wrap">{MODES.map(m=>(<button key={m.id} onClick={()=>switchMode(m.id)} className={`px-4 py-2 rounded-full text-sm font-medium ${mode===m.id?'bg-indigo-500 text-white':'bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{m.label}</button>))}</div>
          <div className="relative w-56 h-56 mx-auto mb-8">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-indigo-200 dark:stroke-white/10"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#grad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${prog*326.7} 326.7`}/>
              <defs><linearGradient id="grad"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-5xl font-extrabold text-slate-900 dark:text-white tabular-nums">{fmt(seconds)}</span><span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Focus</span></div>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={()=>setRunning(!running)} className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center">{running?<Pause size={22}/>:<Play size={22}/>}</button>
            <button onClick={()=>{setRunning(false);awardedRef.current=false;const m=MODES.find(x=>x.id===mode);setSeconds(m.time);}} className="w-14 h-14 rounded-full bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-300 flex items-center justify-center"><RotateCcw size={20}/></button>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t.focusTitle}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {SOUNDS.map(s=>(
              <button key={s.id} onClick={()=>toggleSound(s.id)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-sm transition-all ${activeSound===s.id?'bg-indigo-500/30 border-indigo-400 text-indigo-700 dark:text-white':'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10'}`}>
                <s.icon size={24} className={`${activeSound===s.id?'text-indigo-600 dark:text-indigo-300':''}`}/>
                {t[s.labelKey]}
                {activeSound===s.id&&(<span className="flex gap-0.5"><span className="w-1 h-3 bg-indigo-400 rounded animate-pulse"/><span className="w-1 h-3 bg-indigo-400 rounded animate-pulse" style={{animationDelay:'0.15s'}}/><span className="w-1 h-3 bg-indigo-400 rounded animate-pulse" style={{animationDelay:'0.3s'}}/></span>)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">Volume</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);if(activeSound){soundService.stopAmbient(activeSound);soundService.playAmbient(activeSound,v);}}} className="flex-1"/>
            <span className={`text-xs px-2 py-1 rounded ${activeSound?'bg-green-500/20 text-green-700 dark:text-green-400':'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>{activeSound?'●':'○'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}