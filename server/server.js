import 'dotenv/config';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const FRONTEND_URL = (process.env.FRONTEND_URL || '').trim();
app.use(cors({
  origin: FRONTEND_URL ? [FRONTEND_URL, 'http://localhost:5173'] : true,
  credentials: true,
}));
app.use(express.json());

const BOT_TOKEN = (process.env.BOT_TOKEN || '').trim();
const BOT_USERNAME = (process.env.BOT_USERNAME || 'FreeTimeHelperBot').trim();
const PORT = process.env.PORT || 4000;

// ---------- Telegram bot ----------
const TG_TIMEOUT = 15000;
async function tgFetch(url, body) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TG_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    const data = await res.json();
    if (!data.ok) console.error('Telegram API error:', data.error_code, data.description);
    return data;
  } catch (e) {
    console.error('Telegram fetch error:', String(e));
    return { ok: false, error: String(e) };
  } finally {
    clearTimeout(timer);
  }
}
async function sendTelegram(chatId, text) {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN env da yo\'q' };
  return tgFetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: chatId, text, parse_mode: 'HTML',
  });
}

// Register the bot webhook-ish (getUpdates) is not needed; messages come via link.
// We support an admin chat id to notify on new signups / visitors.
const ADMIN_CHAT_ID = (process.env.ADMIN_CHAT_ID || '').trim();
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');

// ---------- Bot info (exposed safely to the client) ----------
let cachedBotInfo = { username: BOT_USERNAME, active: false };
async function refreshBotInfo() {
  if (!BOT_TOKEN) return;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 10000);
    let meRes;
    try {
      meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, { signal: ac.signal });
    } finally {
      clearTimeout(timer);
    }
    const meData = await meRes.json();
    if (meData.ok && meData.result?.username) {
      cachedBotInfo = { username: meData.result.username, active: true, name: meData.result.first_name };
      console.log('Bot connected:', meData.result.username);
    } else {
      console.error('Bot getMe failed:', JSON.stringify(meData));
    }
    const cmds = BOT_COMMANDS.map(line => {
      const sp = line.indexOf(' ');
      return { command: line.slice(0, sp).replace(/^\//, ''), description: line.slice(sp + 1) };
    });
    await tgFetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, { commands: cmds });
  } catch (e) { console.error('Bot info refresh failed:', e); }
}

app.get('/api/bot/info', (req, res) => {
  res.json({
    username: cachedBotInfo.username,
    active: cachedBotInfo.active,
    name: cachedBotInfo.name || cachedBotInfo.username,
    url: `https://t.me/${cachedBotInfo.username}`,
  });
});

async function notifyAdmin(text) {
  if (!ADMIN_CHAT_ID || !BOT_TOKEN) return;
  try {
    await sendTelegram(ADMIN_CHAT_ID, text);
  } catch (err) { console.error('Admin notify failed:', err); }
}

// ---------- Interactive Telegram bot (private chat) ----------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function esc(txt = '') {
  return String(txt).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
const BOT_COMMANDS = [
  '/start — asosiy menyu',
  '/info — sayt va bot haqida',
  '/stats — jonli statistika',
  '/top — reyting yetakchilari',
  '/motiv — motivatsiya',
  '/contact — adminga xabar',
  '/help — yordam',
];
const botCommandsHtml = () => BOT_COMMANDS.map(c => `• ${c}`).join('\n');
const botPendingContacts = new Map();
const PENDING_TIMEOUT_MS = 5 * 60 * 1000;
let botOffset = 0;
let botPolling = false;
let botConflicts = 0;

function publicStats() {
  const todayStart = new Date().toISOString().slice(0, 10);
  const liveSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  return {
    totalVisits: db.prepare('SELECT COUNT(*) c FROM visitors').get().c,
    visitsToday: db.prepare('SELECT COUNT(*) c FROM visitors WHERE timestamp LIKE ?').get(`${todayStart}%`).c,
    members: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    booksCompleted: db.prepare('SELECT COUNT(*) c FROM completed_books').get().c,
    liveCount: db.prepare('SELECT COUNT(DISTINCT sessionId) c FROM visitors WHERE timestamp > ?').get(liveSince).c,
  };
}
function topUsers(n = 5) {
  return db.prepare('SELECT name, stars FROM users WHERE is_admin != 1 ORDER BY stars DESC, created_at ASC LIMIT ?').all(n);
}
const MOTIV_QUOTES = [
  'Har kuni kichik qadam — va bir yildan keyin siz uni payqamaysiz. Mehnat doim o\u2019z mevasini beradi. 🚀',
  'Ingliz tili — butun dunyoga ochilgan eshik. Bir kun bitta dars: FreeTime yoningizda. 📖',
  'Kuchli bo\u2019lish istak emas, doimiy harakat talab qiladi. Bugundan boshlang! 💪',
  'Hisobot kutgan emas, harakat kutgan. 10 daqiqa kitob o\u2019qing — natija keladi. ☕',
  'Xatolar — o\u2019sish bosqichi. Testda adashsangiz ham, yulduz to\u2019plang, oldinga yuring! ⭐',
  'Fokus — eng kuchli ko\u2019nikma. Pomodoro boshlang va vaqtingizni mag\u2019lub qiling. ⏱️',
];
function randomMotiv() {
  return MOTIV_QUOTES[Math.floor(Math.random() * MOTIV_QUOTES.length)];
}

function botMenuKeyboard() {
  const rows = [];
  if (SITE_URL) rows.push([{ text: '🌐 Saytni ochish', url: SITE_URL }]);
  rows.push([
    { text: 'ℹ️ Ma\'lumot', callback_data: 'info' },
    { text: '📊 Statistika', callback_data: 'stats' },
    { text: '🏆 Top-5', callback_data: 'top' },
  ]);
  rows.push([
    { text: '⭐ Motiv', callback_data: 'motiv' },
    { text: '💬 Xabar', callback_data: 'contact' },
    { text: '🏠 Menyu', callback_data: 'menu' },
  ]);
  return { inline_keyboard: rows };
}

async function sendTelegramMenu(chatId, text, replyMarkup) {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN env da yo\'q' };
  const data = await tgFetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup,
  });
  if (!data.ok) {
    const plain = text.replace(/<[^>]*>/g, '');
    return tgFetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId, text: plain, reply_markup: replyMarkup,
    });
  }
  return data;
}

function botMenuText(firstName) {
  const siteLine = SITE_URL ? `\n🌐 <b>Sayt:</b> ${SITE_URL}\n` : '';
  return `Assalomu alaykum, <b>${esc(firstName)}</b>! 👋

<b>FreeTime</b> — bo\u2019sh vaqtingizni <u>foydali</u> o\u2019tkazish uchun yagona platforma. 📚🎬🧠${siteLine}
<b>Saytda nima bor?</b>
📚 <b>20+ kitob</b> — har biri o\u2019qish rejimi bilan. Kitobni tugatish = <b>+50 ⭐</b>
🗣️ <b>Ingliz tili</b> — 24 ta to\u2019liq dars (A1–C1), videolar, kartalar, testlar, grammatika
🎬 <b>Filmlar</b> — subtitr va so\u2019z boyligi bilan (tomosha <b>100 ⭐</b>)
🎮 <b>Aql charx</b> — 6 ta o\u2019yin. 10-ta to\u2019g\u2019ri misol = <b>+5 ⭐</b>
⏱️ <b>Fokus</b> — Pomodoro va shovqin muhitlari. Soat tugashi = <b>+5 ⭐</b>
🎧 <b>Podcastlar</b> — audio va iqtiboslar
🏆 <b>Reyting</b> — yulduzlar to\u2019plang, yetakchilar jadvaliga chiqing!

<b>⭐ Yulduzlar qanday to\u2019planadi?</b>
• Ro\u2019yxatdan o\u2019tish: +5 ⭐
• Har bir darsni tugatish: 10–15 ⭐ (barchasi = +50 ⭐ bonus)
• Testda to\u2019g\u2019ri javob: +2 ⭐ · Test yakuni: +5 ⭐
• Kitob tugatish: +50 ⭐
• 10-ta misol: +5 ⭐ · Pomodoro: +5 ⭐

<u><b>Bot buyruqlari:</b></u>
${botCommandsHtml()}

Tugmalardan foydalaning yoki buyruq yozing! 🚀`;
}

function botInfoText() {
  return `📚 <b>FreeTime haqida</b>

<b>Bu nima?</b>
FreeTime — o\u2019zbek tilidagi bo\u2019sh vaqt platformasi: kitob, ingliz tili, filmlar, aql o\u2019yinlari va fokus — hammasi bitta joyda.

<b>📖 Kitoblar</b>
20 dan ortiq kitoblar, har biri 20+ sahifali o\u2019qish rejimi bilan. O\u2019qishingizni tugatib 50 ⭐ oling. Kutubxonangizni kitob belgilari bilan tashkil qiling.

<b>🇬🇧 Ingliz tili</b>
24 ta to\u2019liq dars A1–C1 darajalarida, videolar, flash-kartalar, testlar va grammatika. Har bir dars 10–15 ⭐, testlarda qo\u2019shimcha yulduzlar.

<b>🎬 Filmlar</b>
Subtitrli filmlar, tarjima va so\u2019z boyligi. Tomosha qilish uchun 100 ⭐ kerak — sabr va mehnat bilan to\u2019lang!

<b>🧠 Aql charx</b>
6 ta o\u2019yin: topishmoq, tezkor matematika, xotira, wordle. 10-ta to\u2019g\u2019ri misol = +5 ⭐ sovg\u2019a.

<b>⏱️ Fokus</b>
Pomodoro taymer + tabiat tovushlari (yomg\u2019ir, okean, o\u2019rmon, olov, kafe, shovqin). Har bir tugagan Pomodoro = +5 ⭐.

<b>🎧 Podcastlar & 📊 Statistikalar</b>
Audio mashg\u2019ulotlar va jonli tashrif/hodisalar statistikasi.${SITE_URL ? `\n\n🌐 <b>Sayt:</b> ${SITE_URL}` : ''}

📱 Telefon: +998 94 598 20 11
🤖 Telegram: @${cachedBotInfo.username}`;
}

function botStatsText() {
  const s = publicStats();
  return `📊 <b>Jonli statistika</b>

👥 Ro\u2019yxatdan o\u2019tgan a\u2019zolar: <b>${s.members}</b>
📈 Bugungi tashriflar: <b>${s.visitsToday}</b>
🌐 Jami tashriflar: <b>${s.totalVisits}</b>
🟢 Hozir saytda: <b>${s.liveCount}</b>
📚 Tugatilgan kitoblar: <b>${s.booksCompleted}</b>

Yulduzlarni ko\u2019paytirish uchun kundalik mashg\u2019ulot qiling! 💪`;
}

function botTopText() {
  const rows = topUsers(5);
  if (rows.length === 0) return '🏆 Hozircha reyting bo\u2019sh. Birinchi bo\u2019ling!';
  const medals = ['🥇', '🥈', '🥉'];
  const lines = rows.map((u, i) => `${medals[i] || '🏅'} <b>${esc(u.name)}</b> — ${u.stars} ⭐`);
  return `🏆 <b>Top-5 yetakchilar</b>\n\n${lines.join('\n')}\n\nSiz ham yulduz yig\u2019ing va reytingga chiqing!`;
}

function botMotivText() {
  return `⭐ <b>Motivatsiya</b>\n\n\u201c${esc(randomMotiv())}\u201d\n\n<code>/start</code> — asosiy menyu`;
}

async function handleBotUpdate(upd) {
  const msg = upd.message || upd.edited_message;
  if (!msg || !msg.chat || msg.chat.type !== 'private') return;
  const chatId = msg.chat.id;
  const firstName = msg.chat.first_name || 'foydalanuvchi';
  const text = (msg.text || '').trim();
  if (!text) return;

  try {
    const pending = botPendingContacts.get(chatId);
    if (pending === 'awaiting') {
      botPendingContacts.delete(chatId);
      db.prepare('INSERT INTO messages (name, contact, text, created_at) VALUES (?,?,?,?)')
        .run(esc(firstName), `tg:${chatId}`, esc(text), now());
      await notifyAdmin(`💬 Telegramdan xabar:\n👤 ${esc(firstName)}\n🆔 ${chatId}\n📝 ${esc(text)}`);
      await sendTelegram(chatId, '✅ Rahmat! Xabaringiz qabul qilindi.\n\n✅ Thanks! Your message has been received.');
      return;
    }

    const lower = text.toLowerCase();
    if (lower === '/start' || lower === 'start' || lower === 'boshlash') {
      await sendTelegramMenu(chatId, botMenuText(firstName), botMenuKeyboard());
    } else if (lower === '/help' || lower === 'yordam' || lower === 'помощь' || lower === 'buyruqlar') {
      await sendTelegramMenu(chatId, `<b>Buyruqlar / Commands</b>\n\n${botCommandsHtml()}`, botMenuKeyboard());
    } else if (lower === '/info' || lower === 'info' || lower === 'malumot') {
      await sendTelegramMenu(chatId, botInfoText(), botMenuKeyboard());
    } else if (lower === '/stats' || lower === 'statistika') {
      await sendTelegramMenu(chatId, botStatsText(), botMenuKeyboard());
    } else if (lower === '/top' || lower === 'reyting') {
      await sendTelegramMenu(chatId, botTopText(), botMenuKeyboard());
    } else if (lower === '/motiv' || lower === 'motiv') {
      await sendTelegramMenu(chatId, botMotivText(), botMenuKeyboard());
    } else if (lower === '/contact' || lower === 'xabar' || lower === 'contact') {
      botPendingContacts.set(chatId, 'awaiting');
      setTimeout(() => { if (botPendingContacts.get(chatId) === 'awaiting') botPendingContacts.delete(chatId); }, PENDING_TIMEOUT_MS);
      await sendTelegram(chatId, '✍️ Xabaringizni yozing, men adminga yetkazaman.\n\n✍️ Type your message and I\'ll deliver it to the admin.');
    } else {
      await sendTelegramMenu(chatId,
        `Men tushunmadim 🤔\n\nMavjud buyruqlar:\n${botCommandsHtml()}\n\nShuningdek, tugmalardan foydalanishingiz mumkin.`, botMenuKeyboard());
    }
  } catch (e) {
    console.error('handleBotUpdate error:', e);
    await sendTelegram(chatId, 'Xatolik yuz berdi. Qaytadan urinib ko\'ring. /start');
  }
}

async function handleBotCallback(cb) {
  const chatId = cb.message?.chat?.id;
  if (!chatId) return;
  const firstName = cb.message.chat.first_name || 'foydalanuvchi';
  const data = cb.data || '';
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cb.id }),
      signal: ac.signal,
    }).catch(() => {});
  } finally {
    clearTimeout(timer);
  }
  try {
    if (data === 'info') {
      await sendTelegramMenu(chatId, botInfoText(), botMenuKeyboard());
    } else if (data === 'stats') {
      await sendTelegramMenu(chatId, botStatsText(), botMenuKeyboard());
    } else if (data === 'top') {
      await sendTelegramMenu(chatId, botTopText(), botMenuKeyboard());
    } else if (data === 'motiv') {
      await sendTelegramMenu(chatId, botMotivText(), botMenuKeyboard());
    } else if (data === 'contact') {
      botPendingContacts.set(chatId, 'awaiting');
      setTimeout(() => { if (botPendingContacts.get(chatId) === 'awaiting') botPendingContacts.delete(chatId); }, PENDING_TIMEOUT_MS);
      await sendTelegram(chatId, '✍️ Xabaringizni yozing, men adminga yetkazaman.\n\n✍️ Type your message and I\'ll deliver it to the admin.');
    } else {
      await sendTelegramMenu(chatId, botMenuText(firstName), botMenuKeyboard());
    }
  } catch (e) {
    console.error('handleBotCallback error:', e);
    await sendTelegram(chatId, 'Xatolik yuz berdi. Qaytadan urinib ko\'ring. /start');
  }
}

// Single long-polling loop — avoids duplicate/overlapping getUpdates requests
// which previously caused recurring 409 "conflict" errors.
async function pollBotOnce() {
  if (!BOT_TOKEN || botPolling) return;
  botPolling = true;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 60000);
    let res;
    try {
      res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=30&allowed_updates=%5B%22message%22%2C%22callback_query%22%5D&offset=${botOffset}`, { signal: ac.signal });
    } finally {
      clearTimeout(timer);
    }
    const data = await res.json();
    if (!data.ok) {
      if (data.error_code === 409) {
        botConflicts += 1;
        const wait = Math.min(1000 * 2 ** botConflicts, 30000);
        console.warn(`Bot 409 conflict (#${botConflicts}), retry in ${wait}ms`);
        await sleep(wait);
      } else if (data.error_code === 401) {
        console.error('BOT_TOKEN noto\'g\'ri — bot to\'xtatildi');
        botConflicts = -1;
        botPolling = false;
        return;
      } else {
        console.error('Bot getUpdates error:', data.error_code, data.description);
        await sleep(5000);
      }
      botPolling = false;
      return;
    }
    botConflicts = 0;
    for (const upd of data.result || []) {
      botOffset = Math.max(botOffset, upd.update_id + 1);
      try {
        if (upd.message && upd.message.text) {
          await handleBotUpdate(upd);
        } else if (upd.callback_query) {
          await handleBotCallback(upd.callback_query);
        }
      } catch (e) { console.error('Bot update error:', e); }
    }
  } catch (e) {
    console.error('Bot poll error:', e);
    await sleep(5000);
  }
  botPolling = false;
}

async function startBotPolling() {
  if (!BOT_TOKEN) return;
  // eslint-disable-next-line no-constant-condition
  while (botConflicts >= 0) {
    await pollBotOnce();
    const delay = botConflicts >= 0 ? 1000 : 0;
    if (delay > 0) await sleep(delay);
  }
}

refreshBotInfo().then(() => {
  if (BOT_TOKEN) startBotPolling();
});

// ---------- Helpers ----------
function now() { return new Date().toISOString(); }
function ipFromReq(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
}
function deviceInfo(ua = '') {
  ua = ua || '';
  if (/android/i.test(ua)) return { device: 'Android', browser: (ua.match(/chrome|firefox/i) || ['Chrome'])[0].replace(/^\w/, c => c.toUpperCase()) };
  if (/iphone|ipad/i.test(ua)) return { device: 'iOS', browser: 'Safari' };
  if (/windows/i.test(ua)) {
    if (ua.includes('Firefox')) return { device: 'Windows PC', browser: 'Firefox' };
    if (ua.includes('Edg')) return { device: 'Windows PC', browser: 'Edge' };
    return { device: 'Windows PC', browser: 'Chrome' };
  }
  if (/macintosh/i.test(ua)) return { device: 'Mac', browser: 'Safari/Chrome' };
  if (/linux/i.test(ua)) return { device: 'Linux', browser: 'Chrome/Firefox' };
  return { device: 'Unknown', browser: 'Unknown' };
}

// ---------- Auth helpers (scrypt password hashing + sessions) ----------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  if (!pw || !stored || !stored.includes(':') || stored.length < 40) return false;
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(pw, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?,?,?,?)').run(userId, token, now(), expiresAt);
  return token;
}
function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}
function sessionUser(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.name, u.email, u.stars, u.is_admin
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ?`).get(token);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return row;
}
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, stars: u.stars, is_admin: u.is_admin === 1 };
}
function adminAuthed(req) {
  const key = req.headers['x-admin-key'];
  if (key && key === (process.env.ADMIN_KEY || 'freetime-admin-2026')) return true;
  const u = sessionUser(bearer(req));
  return !!(u && u.is_admin === 1);
}
function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@free.time').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'xojift15';
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) {
    db.prepare('UPDATE users SET is_admin = 1, name = ? WHERE id = ?').run('Administrator', existing.id);
    return;
  }
  db.prepare('INSERT INTO users (name, email, password_hash, is_admin, created_at, last_seen, stars) VALUES (?,?,?,1,?,?,0)')
    .run('Administrator', email, hashPassword(password), now(), now());
  console.log('👑 Admin hisob yaratildi:', email);
}
seedAdmin();

// ---------- Visitor tracking ----------
app.post('/api/visit', (req, res) => {
  const { sessionId, page } = req.body || {};
  const sid = sessionId || 'anon';
  const blocked = db.prepare('SELECT 1 FROM blocked_sessions WHERE sessionId = ?').get(sid);
  if (!blocked) {
    const ua = req.headers['user-agent'] || '';
    const { device, browser } = deviceInfo(ua);
    const ip = ipFromReq(req);
    const location = 'O\'zbekiston / Internet';
    db.prepare(
      'INSERT INTO visitors (sessionId, page, ip, device, browser, location, timestamp, duration) VALUES (?,?,?,?,?,?,?,0)'
    ).run(sid, page || '/', ip, device, browser, location, now());
  }
  res.json({ ok: true, blocked: !!blocked });
});

app.post('/api/visit/update', (req, res) => {
  const { sessionId, duration } = req.body || {};
  if (sessionId) {
    db.prepare('UPDATE visitors SET duration = ? WHERE sessionId = ? AND duration < ?')
      .run(duration || 0, sessionId, duration || 0);
  }
  res.json({ ok: true });
});

// ---------- Users / auth (email + password) ----------
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanName) return res.status(400).json({ error: 'Ism talab qilinadi' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ error: 'Email manzili noto\'g\'ri' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' });
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (existing) return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
  const info = db.prepare('INSERT INTO users (name, email, password_hash, created_at, last_seen, stars) VALUES (?,?,?,?,?,5)')
    .run(cleanName, cleanEmail, hashPassword(password), now(), now());
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now(), info.lastInsertRowid);
  db.prepare('INSERT INTO stars_log (user_id, amount, reason, timestamp) VALUES (?,?,?,?)')
    .run(info.lastInsertRowid, 5, 'Ro\'yxatdan o\'tish', now());
  const token = createSession(info.lastInsertRowid);
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  await notifyAdmin(`🆕 Yangi foydalanuvchi ro'yxatdan o'tdi:\n👤 ${cleanName}\n📧 ${cleanEmail}`);
  res.json({ token, user: publicUser(u) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!u || !verifyPassword(password || '', u.password_hash)) {
    return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
  }
  const token = createSession(u.id);
  db.prepare('UPDATE users SET last_seen = ?, last_login = ?, last_heartbeat = ? WHERE id = ?').run(now(), now(), now(), u.id);
  res.json({ token, user: publicUser(u) });
});

app.post('/api/auth/google', async (req, res) => {
  const { email, name, sub } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email manzili noto\'g\'ri' });
  }
  const cleanEmail = email.trim().toLowerCase();
  let u = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!u) {
    const cleanName = (name || 'Google User').trim();
    const googlePassword = `google_${sub || crypto.randomBytes(16).toString('hex')}`;
    const info = db.prepare('INSERT INTO users (name, email, password_hash, created_at, last_seen, stars) VALUES (?,?,?,?,?,5)')
      .run(cleanName, cleanEmail, hashPassword(googlePassword), now(), now());
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now(), info.lastInsertRowid);
    db.prepare('INSERT INTO stars_log (user_id, amount, reason, timestamp) VALUES (?,?,?,?)')
      .run(info.lastInsertRowid, 5, 'Google orqali ro\'yxatdan o\'tish', now());
    u = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    await notifyAdmin(`🆕 Yangi foydalanuvchi Google orqali ro'yxatdan o'tdi:\n👤 ${cleanName}\n📧 ${cleanEmail}`);
  }
  const token = createSession(u.id);
  db.prepare('UPDATE users SET last_seen = ?, last_login = ?, last_heartbeat = ? WHERE id = ?').run(now(), now(), now(), u.id);
  res.json({ token, user: publicUser(u) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = bearer(req);
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const u = sessionUser(bearer(req));
  if (u) db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(now(), u.id);
  res.json({ user: u ? publicUser(u) : null });
});

// Heartbeat — accumulate real time spent on the site for each user.
app.post('/api/auth/heartbeat', (req, res) => {
  const u = sessionUser(bearer(req));
  if (!u) return res.status(401).json({ error: 'Avval kirish kerak' });
  const fresh = now();
  const row = db.prepare('SELECT last_heartbeat FROM users WHERE id = ?').get(u.id);
  if (row && row.last_heartbeat) {
    const delta = Math.max(0, Math.min((Date.now() - new Date(row.last_heartbeat).getTime()) / 1000, 300));
    db.prepare('UPDATE users SET online_seconds = online_seconds + ?, last_heartbeat = ?, last_seen = ? WHERE id = ?')
      .run(Math.round(delta), fresh, fresh, u.id);
  } else {
    db.prepare('UPDATE users SET last_heartbeat = ?, last_seen = ? WHERE id = ?').run(fresh, fresh, u.id);
  }
  res.json({ ok: true });
});

// ---------- Stars ----------
app.post('/api/stars/add', (req, res) => {
  const { email, amount, reason } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email kerak' });
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!u) return res.status(404).json({ error: 'foydalanuvchi topilmadi' });
  db.prepare('UPDATE users SET stars = stars + ? WHERE id = ?').run(amount || 0, u.id);
  db.prepare('INSERT INTO stars_log (user_id, amount, reason, timestamp) VALUES (?,?,?,?)').run(u.id, amount || 0, reason || '', now());
  const updated = db.prepare('SELECT stars FROM users WHERE id = ?').get(u.id);
  res.json({ ok: true, stars: updated.stars });
});

app.post('/api/stars/spend', (req, res) => {
  const { email, amount, reason } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email kerak' });
  const spend = parseInt(amount, 10) || 0;
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!u) return res.status(404).json({ error: 'foydalanuvchi topilmadi' });
  if (spend <= 0) return res.status(400).json({ error: 'amount noto\'g\'ri' });
  if ((u.stars || 0) < spend) {
    return res.status(400).json({ error: 'Yulduzlar yetarli emas', stars: u.stars });
  }
  db.prepare('UPDATE users SET stars = stars - ? WHERE id = ?').run(spend, u.id);
  db.prepare('INSERT INTO stars_log (user_id, amount, reason, timestamp) VALUES (?,?,?,?)').run(u.id, -spend, reason || '', now());
  const updated = db.prepare('SELECT stars FROM users WHERE id = ?').get(u.id);
  res.json({ ok: true, stars: updated.stars });
});

// ---------- Completed books ----------
app.post('/api/books/complete', async (req, res) => {
  const { email, bookId, title } = req.body || {};
  if (!email || !bookId) return res.status(400).json({ error: 'email va bookId kerak' });
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!u) return res.status(404).json({ error: 'foydalanuvchi topilmadi' });
  const existing = db.prepare('SELECT * FROM completed_books WHERE user_id = ? AND book_id = ?').get(u.id, bookId);
  if (existing) return res.json({ ok: true, already: true, newStars: 0 });
  db.prepare('INSERT INTO completed_books (user_id, book_id, title, completed_at) VALUES (?,?,?,?)').run(u.id, bookId, title || '', now());
  db.prepare('UPDATE users SET stars = stars + 50 WHERE id = ?').run(u.id);
  db.prepare('INSERT INTO stars_log (user_id, amount, reason, timestamp) VALUES (?,?,?,?)').run(u.id, 50, `Kitob tugadi: ${title || bookId}`, now());
  const updated = db.prepare('SELECT stars FROM users WHERE id = ?').get(u.id);
  res.json({ ok: true, already: false, newStars: 50, stars: updated.stars });
});

app.get('/api/books/completed', (req, res) => {
  const email = req.query.email;
  if (!email) return res.json([]);
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!u) return res.json([]);
  const rows = db.prepare('SELECT book_id FROM completed_books WHERE user_id = ?').all(u.id);
  res.json(rows.map(r => r.book_id));
});

app.post('/api/videos/complete', (req, res) => {
  const { email, videoId, title } = req.body || {};
  if (!email || !videoId) return res.status(400).json({ error: 'email va videoId kerak' });
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!u) return res.status(404).json({ error: 'foydalanuvchi topilmadi' });
  const existing = db.prepare('SELECT * FROM watched_videos WHERE user_id = ? AND video_id = ?').get(u.id, videoId);
  if (existing) return res.json({ ok: true, already: true, newStars: 0 });
  db.prepare('INSERT INTO watched_videos (user_id, video_id, title, watched_at) VALUES (?,?,?,?)').run(u.id, videoId, title || '', now());
  db.prepare('UPDATE users SET stars = stars + 50 WHERE id = ?').run(u.id);
  db.prepare('INSERT INTO stars_log (user_id, amount, reason, timestamp) VALUES (?,?,?,?)').run(u.id, 50, `Video: ${title || videoId}`, now());
  const updated = db.prepare('SELECT stars FROM users WHERE id = ?').get(u.id);
  res.json({ ok: true, already: false, newStars: 50, stars: updated.stars });
});

// ---------- Messages / contact ----------
app.post('/api/contact', async (req, res) => {
  const { name, contact, text } = req.body || {};
  db.prepare('INSERT INTO messages (name, contact, text, created_at) VALUES (?,?,?,?)').run(name || '', contact || '', text || '', now());
  await notifyAdmin(`💬 Yangi xabar:\n👤 ${name}\n📞 ${contact}\n📝 ${text}`);
  res.json({ ok: true });
});

// ---------- Public live stats & leaderboard ----------
app.get('/api/public/stats', (req, res) => {
  const todayStart = new Date().toISOString().slice(0, 10);
  const liveSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  res.json({
    totalVisits: db.prepare('SELECT COUNT(*) c FROM visitors').get().c,
    uniqueVisitors: db.prepare('SELECT COUNT(DISTINCT sessionId) c FROM visitors').get().c,
    liveCount: db.prepare('SELECT COUNT(DISTINCT sessionId) c FROM visitors WHERE timestamp > ?').get(liveSince).c,
    visitsToday: db.prepare('SELECT COUNT(*) c FROM visitors WHERE timestamp LIKE ?').get(`${todayStart}%`).c,
    members: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    booksCompleted: db.prepare('SELECT COUNT(*) c FROM completed_books').get().c,
  });
});

app.get('/api/leaderboard', (req, res) => {
  const email = (req.query.email || '').toLowerCase();
  const rows = db.prepare(
    'SELECT name, email, stars, created_at FROM users WHERE is_admin != 1 ORDER BY stars DESC, created_at ASC LIMIT 50'
  ).all();
  const user = email ? db.prepare('SELECT name, email, stars, created_at FROM users WHERE email = ?').get(email) : null;
  let userRank = null;
  if (user) {
    const rank = db.prepare(
      'SELECT COUNT(*) c FROM users WHERE is_admin != 1 AND stars > ?'
    ).get(user.stars).c;
    userRank = rank + 1;
  }
  res.json({ users: rows, userRank, userStars: user ? user.stars : null });
});

// ---------- Admin ----------
app.get('/api/admin/stats', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  const total = db.prepare('SELECT COUNT(*) c FROM visitors').get().c;
  const unique = db.prepare('SELECT COUNT(DISTINCT sessionId) c FROM visitors').get().c;
  const liveSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const live = db.prepare('SELECT COUNT(DISTINCT sessionId) c FROM visitors WHERE timestamp > ?').get(liveSince).c;
  res.json({
    totalVisits: total,
    uniqueVisitors: unique,
    liveCount: live,
    users: db.prepare('SELECT COUNT(*) c FROM users WHERE is_admin != 1').get().c,
    newUsers7d: db.prepare('SELECT COUNT(*) c FROM users WHERE created_at > ?').get(new Date(Date.now() - 7 * 864e5).toISOString()).c,
    avgDuration: Math.round(db.prepare('SELECT AVG(duration) a FROM visitors WHERE duration > 0').get().a || 0),
    messages: db.prepare('SELECT COUNT(*) c FROM messages').get().c,
    completedBooks: db.prepare('SELECT COUNT(*) c FROM completed_books').get().c,
    blockedCount: db.prepare('SELECT COUNT(*) c FROM blocked_sessions').get().c,
  });
});

app.get('/api/admin/analytics', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);

  const daily = db.prepare(
    "SELECT substr(timestamp, 1, 10) d, COUNT(*) visits, COUNT(DISTINCT sessionId) uniqueVisitors FROM visitors WHERE timestamp >= ? GROUP BY d"
  ).all(since);
  const byDay = new Map(daily.map(r => [r.d, r]));
  const visitsByDay = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const r = byDay.get(d);
    visitsByDay.push({ date: d, visits: r ? r.visits : 0, uniqueVisitors: r ? r.uniqueVisitors : 0 });
  }

  const dailyUsers = db.prepare(
    "SELECT substr(created_at, 1, 10) d, COUNT(*) c FROM users WHERE created_at >= ? GROUP BY d"
  ).all(since);
  const usersByDay = new Map(dailyUsers.map(r => [r.d, r.c]));
  const newUsersByDay = visitsByDay.map(d => ({ date: d.date, count: usersByDay.get(d.date) || 0 }));

  const breakdown = (col) => db.prepare(`SELECT ${col} name, COUNT(*) count FROM visitors GROUP BY ${col} ORDER BY count DESC`).all().slice(0, 8);

  res.json({
    visitsByDay,
    newUsersByDay,
    deviceBreakdown: breakdown('device'),
    browserBreakdown: breakdown('browser'),
    pageBreakdown: breakdown('page'),
    locationBreakdown: breakdown('location'),
  });
});

app.get('/api/admin/visitors', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  res.json(db.prepare('SELECT * FROM visitors ORDER BY id DESC LIMIT 200').all());
});

app.get('/api/admin/users', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  res.json(db.prepare('SELECT * FROM users ORDER BY id DESC').all());
});

app.get('/api/admin/online', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  res.json(db.prepare(
    'SELECT id, name, email, last_seen, last_login, last_heartbeat, online_seconds, is_admin FROM users WHERE last_seen > ? OR last_heartbeat > ? ORDER BY last_seen DESC LIMIT 30'
  ).all(since, since));
});

app.get('/api/admin/messages', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 100').all());
});

app.get('/api/admin/blocked', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  res.json(db.prepare('SELECT * FROM blocked_sessions ORDER BY id DESC').all());
});

app.post('/api/admin/block', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId kerak' });
  db.prepare('INSERT OR IGNORE INTO blocked_sessions (sessionId, reason, created_at) VALUES (?,?,?)')
    .run(sessionId, 'Admin tomonidan bloklandi', now());
  res.json({ ok: true });
});

app.post('/api/admin/unblock', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  const { sessionId } = req.body || {};
  if (sessionId) db.prepare('DELETE FROM blocked_sessions WHERE sessionId = ?').run(sessionId);
  res.json({ ok: true });
});

app.post('/api/admin/simulate', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  const pages = ['/', '/books', '/movies', '/english', '/games', '/focus', '/podcasts'];
  const devices = [['Windows PC', 'Chrome'], ['Windows PC', 'Firefox'], ['Windows PC', 'Edge'], ['Android', 'Chrome'], ['iOS', 'Safari'], ['Mac', 'Safari/Chrome'], ['Linux', 'Firefox']];
  const locations = ['Tashkent, Uzbekistan', 'Samarkand, Uzbekistan', 'Bukhara, Uzbekistan', 'Andijan, Uzbekistan', 'Moscow, Russia', 'New York, USA', 'London, UK', 'Istanbul, Turkey', 'Dubai, UAE', 'Seoul, South Korea'];
  const insert = db.prepare('INSERT INTO visitors (sessionId, page, ip, device, browser, location, timestamp, duration) VALUES (?,?,?,?,?,?,?,?)');
  for (let i = 0; i < 60; i++) {
    const [device, browser] = devices[Math.floor(Math.random() * devices.length)];
    const age = Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000);
    insert.run(
      'sim_' + crypto.randomBytes(6).toString('hex'),
      pages[Math.floor(Math.random() * pages.length)],
      `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device, browser,
      locations[Math.floor(Math.random() * locations.length)],
      new Date(Date.now() - age).toISOString(),
      Math.floor(Math.random() * 600)
    );
  }
  res.json({ ok: true, added: 60 });
});

app.get('/api/admin/export', (req, res) => {
  if (!adminAuthed(req)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  res.json({
    visitors: db.prepare('SELECT * FROM visitors ORDER BY id DESC LIMIT 500').all(),
    users: db.prepare('SELECT * FROM users ORDER BY id DESC').all(),
    messages: db.prepare('SELECT * FROM messages ORDER BY id DESC').all(),
    blocked: db.prepare('SELECT * FROM blocked_sessions').all(),
    exportedAt: now(),
  });
});

// ---------- Serve built frontend if exists ----------
import { existsSync } from 'fs';
const distPath = fileURLToPath(new URL('../dist/', import.meta.url));
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(fileURLToPath(new URL('../dist/index.html', import.meta.url)));
  });
}

app.listen(PORT, () => {
  console.log(`FreeTime server http://localhost:${PORT}`);
  if (!BOT_TOKEN) console.log('⚠️  BOT_TOKEN env da yo\'q — bot ishlamaydi');
});
