import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'freetime.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sessionId TEXT,
  page TEXT,
  ip TEXT,
  device TEXT,
  browser TEXT,
  location TEXT,
  timestamp TEXT,
  duration INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT,
  last_seen TEXT,
  stars INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token TEXT UNIQUE,
  created_at TEXT,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS blocked_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sessionId TEXT UNIQUE,
  reason TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS stars_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  amount INTEGER,
  reason TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS completed_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  book_id TEXT,
  title TEXT,
  completed_at TEXT,
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS watched_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  video_id TEXT,
  title TEXT,
  watched_at TEXT,
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS listened_podcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  podcast_id TEXT,
  title TEXT,
  listened_at TEXT,
  UNIQUE(user_id, podcast_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  item_id TEXT,
  item_type TEXT,
  title TEXT,
  saved_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  contact TEXT,
  text TEXT,
  created_at TEXT
);
`);

const cols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
if (!cols.includes('password_hash')) db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
if (!cols.includes('is_admin')) db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
if (!cols.includes('last_login')) db.exec('ALTER TABLE users ADD COLUMN last_login TEXT');
if (!cols.includes('online_seconds')) db.exec('ALTER TABLE users ADD COLUMN online_seconds INTEGER DEFAULT 0');
if (!cols.includes('last_heartbeat')) db.exec('ALTER TABLE users ADD COLUMN last_heartbeat TEXT');

export default db;
