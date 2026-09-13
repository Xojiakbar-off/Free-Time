import { useApp } from '../context/AppContext.jsx';
import { Bookmark, Trash2, StickyNote } from 'lucide-react';

export default function SavedItems({ embedded = false }) {
  const { t, lang, bookmarks, toggleBookmark, notes, deleteNote } = useApp();
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(lang==='uz'?'uz-UZ':lang==='ru'?'ru-RU':'en-US') : '';
  const isEmpty = bookmarks.length === 0 && notes.length === 0;

  return (
    <section id="saved" className={embedded ? '' : 'max-w-7xl mx-auto px-4 py-12 scroll-mt-16'}>
      {!embedded && (
        <div className="mb-8"><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.savedTitle}</h2></div>
      )}
      {isEmpty && (
        embedded
          ? <p className="text-sm text-slate-500 dark:text-slate-400 py-2">{t.savedEmpty}</p>
          : <div className="glass-panel rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400">{t.savedEmpty}</div>
      )}
      {bookmarks.length>0&&(
        <div className="mb-10">
          <h6 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold mb-3 flex items-center gap-2"><Bookmark size={13} className="text-indigo-500 dark:text-indigo-400"/>{t.bookmarksTitle}</h6>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map(b=>(
              <div key={`${b.type}-${b.id}`} className="glass-panel rounded-2xl p-5 card-hover">
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">{b.type}</span>
                <h4 className="font-bold text-slate-900 dark:text-white mt-2">{b.title[lang]||b.title.en||b.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.author||b.director||b.host||''} · {fmtDate(b.savedAt)}</p>
                <button onClick={()=>toggleBookmark({id:b.id,type:b.type})} className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-500/30 transition-colors"><Trash2 size={12} className="inline mr-1"/>{t.removeBtn}</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {notes.length>0&&(
        <div>
          <h6 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold mb-3 flex items-center gap-2"><StickyNote size={13} className="text-indigo-500 dark:text-indigo-400"/>{t.savedNotes}</h6>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(n=>(
              <div key={n.id} className="glass-panel rounded-2xl p-5 card-hover">
                <p className="text-sm text-slate-700 dark:text-slate-200 italic mb-2">"{n.text}"</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{n.source||''} · {fmtDate(n.createdAt)}</p>
                <button onClick={()=>deleteNote(n.id)} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-500/30 transition-colors"><Trash2 size={12} className="inline mr-1"/>{t.deleteNote}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}