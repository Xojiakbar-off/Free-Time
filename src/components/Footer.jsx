import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Mail, Phone, Send, Clapperboard, Heart } from 'lucide-react';
import { siteConfig } from '../config.js';
import { API_BASE } from '../services/api.js';

export default function Footer({ onNavigate }) {
  const { t, lang, user } = useApp();
  const [botInfo, setBotInfo] = useState(null);
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(API_BASE + '/api/bot/info')
      .then(r => r.json())
      .then(data => { if (!cancelled) setBotInfo(data); })
      .catch(() => { if (!cancelled) setBotInfo({ username: siteConfig.telegramUsername, url: siteConfig.telegramUrl, active: false }); });
    return () => { cancelled = true; };
  }, []);

  const botUrl = botInfo?.url || siteConfig.telegramUrl;
  const botName = botInfo?.username || siteConfig.telegramUsername;

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await fetch(API_BASE + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Footer Visitor', contact: contact, text: message }),
      });
      setSent(true);
      setTimeout(() => { setSent(false); setMessage(''); setContact(''); }, 3000);
    } catch { }
  };

  const nav = [
    ['home', t.home], ['books', t.books], ['movies', t.movies],
    ['english', t.english], ['mindGym', t.mindGym], ['focus', t.focus],
    ['podcasts', t.podcasts], ['lessons', t.lessonsTitle || 'Darslar'],
  ];

  if (user?.is_admin) {
    nav.push(['admin', t.admin]);
  }

  return (
<footer className="glass-panel border-t border-slate-200 dark:border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row justify-between gap-10">
          {/* Brand + About */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              {logoError ? (
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {t.siteName.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <img src="/logo.jpg" alt={t.siteName} className="w-8 h-8 rounded-lg object-cover shrink-0" onError={() => setLogoError(true)} />
              )}
              <span className="font-bold text-slate-900 dark:text-white text-lg">{t.siteName}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t.footerDesc}</p>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Clapperboard size={16} className="text-purple-500 dark:text-purple-400" />
                {t.moviesAboutTitle}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.moviesAboutText}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Heart size={12} className="text-pink-500 dark:text-pink-400" />
              {t.designedWithLove}
            </div>
          </div>

          {/* Navigation links */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-2">
            {nav.map(([id, label]) => (
              <button key={id} onClick={() => onNavigate(id)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-left">
                {label}
              </button>
            ))}
          </div>

          {/* Contact / bot column */}
          <div className="max-w-xs w-full">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t.footerContact}</h4>

            {/* Phone number */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3">
              <Phone size={15} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
              <a href={`tel:${siteConfig.phone.replace(/[^+\d]/g, '')}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                {siteConfig.phoneDisplay || t.footerPhonePlaceholder}
              </a>
            </div>

            {/* Telegram bot */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3">
              <Send size={15} className="text-sky-500 dark:text-sky-400 shrink-0" />
              <a href={botUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                {botInfo?.active ? `@${botName}` : `Telegram: @${botName}`}
              </a>
            </div>
            <p className="text-xs text-slate-500 mb-4">{t.footerTelegramLabel}</p>

            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
              <Mail size={15} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <a href={`mailto:${siteConfig.email}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">{siteConfig.email}</a>
            </div>

            {/* Mini contact form -> forwarded to Telegram admin via /api/contact */}
            <input
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder={t.footerPhonePlaceholder}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 outline-none focus:border-indigo-400"
            />
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={2}
              placeholder={lang === 'uz' ? 'Xabaringizni yozing...' : lang === 'ru' ? 'Напишите ваше сообщение...' : 'Type your message...'}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 outline-none focus:border-indigo-400"
            />
            <button onClick={sendMessage} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              {sent ? (lang === 'uz' ? '✓ Yuborildi' : lang === 'ru' ? '✓ Отправлено' : '✓ Sent') : (lang === 'uz' ? 'Yuborish' : lang === 'ru' ? 'Отправить' : 'Send')}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-sm text-slate-500 dark:text-slate-500">
          <span>© {new Date().getFullYear()} {t.siteName}. {t.allRightsReserved}</span>
          <span>{t.designedWithLove}</span>
        </div>
      </div>
    </footer>
  );
}