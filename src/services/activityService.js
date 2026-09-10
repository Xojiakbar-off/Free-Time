const KEY = 'ft_activity_log';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(log) {
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {}
}

export function logActivity(type, detail = '') {
  const log = read();
  log.push({ type, detail, day: todayKey(), ts: new Date().toISOString() });
  const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
  const clean = log.filter(e => e.ts >= cutoff);
  write(clean.slice(-1000));
}

export function getTodayActivity() {
  const day = todayKey();
  const log = read();
  const today = log.filter(e => e.day === day);
  return {
    total: today.length,
    books: today.filter(e => e.type === 'book').length,
    lessons: today.filter(e => e.type === 'lesson').length,
    games: today.filter(e => e.type === 'game').length,
    stars: today.filter(e => e.type === 'stars').length,
  };
}

export function getWeekActivity() {
  const days = [];
  const log = read();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    days.push({ date: d, count: log.filter(e => e.day === d).length });
  }
  return days;
}