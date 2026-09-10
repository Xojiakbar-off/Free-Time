import { API_BASE } from './api.js';

const STORAGE_KEYS = {
  visitors: 'ft_visitors',
  sessions: 'ft_sessions',
  blocked: 'ft_blocked',
  auditLog: 'ft_audit_log',
  notes: 'ft_personal_notes',
  bookmarks: 'ft_bookmarks',
};

function safeJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return { device: 'Android', browser: ua.split(' ')[0] };
  if (/iphone/i.test(ua)) return { device: 'iPhone', browser: 'Safari' };
  if (/windows/i.test(ua)) {
    if (ua.includes('Firefox')) return { device: 'Windows PC', browser: 'Firefox' };
    if (ua.includes('Edg')) return { device: 'Windows PC', browser: 'Edge' };
    return { device: 'Windows PC', browser: 'Chrome' };
  }
  if (/macintosh/i.test(ua)) return { device: 'Mac', browser: 'Safari/Chrome' };
  if (/linux/i.test(ua)) return { device: 'Linux', browser: 'Firefox/Chrome' };
  return { device: 'Unknown', browser: 'Unknown' };
}

function getEstimatedLocation() {
  const zones = ['Tashkent, Uzbekistan','Samarkand, Uzbekistan','Bukhara, Uzbekistan','Moscow, Russia','New York, USA','London, UK','Istanbul, Turkey','Dubai, UAE','Seoul, South Korea','Tokyo, Japan'];
  const idx = Math.floor(Math.random() * zones.length);
  return zones[idx];
}

class AnalyticsService {
  constructor() {
    this.sessionId = generateId();
    this.sessionStart = Date.now();
    this._logSecurityEvent('session_start', 'New session initiated');
  }

  _logSecurityEvent(type, detail) {
    const log = safeJSON(STORAGE_KEYS.auditLog, []);
    log.unshift({
      id: generateId(),
      type,
      detail,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    });
    if (log.length > 200) log.length = 200;
    safeSet(STORAGE_KEYS.auditLog, log);
  }

  trackPageVisit(page) {
    const blocked = safeJSON(STORAGE_KEYS.blocked, []);
    if (blocked.includes(this.sessionId)) return null;

    const visitors = safeJSON(STORAGE_KEYS.visitors, []);
    const { device, browser } = getBrowserInfo();
    const visit = {
      id: generateId(),
      sessionId: this.sessionId,
      page,
      ip: this._fakeIP(),
      device,
      browser,
      location: getEstimatedLocation(),
      timestamp: new Date().toISOString(),
      duration: 0,
    };
    visitors.unshift(visit);
    if (visitors.length > 500) visitors.length = 500;
    safeSet(STORAGE_KEYS.visitors, visitors);
    this._logSecurityEvent('page_visit', `Visited: ${page}`);
    this._sendServer({ sessionId: this.sessionId, page }, '/visit');
    return visit;
  }

  _sendServer(body, path) {
    try {
      fetch(API_BASE + '/api' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch {}
  }

  _fakeIP() {
    const h = this.sessionId.charCodeAt(0) % 223 + 1;
    const a = this.sessionId.charCodeAt(1) % 255;
    const b = this.sessionId.charCodeAt(2) % 255;
    const c = this.sessionId.charCodeAt(3) % 255;
    return `${h}.${a}.${b}.${c}`;
  }

  updateSessionDuration() {
    const visitors = safeJSON(STORAGE_KEYS.visitors, []);
    const idx = visitors.findIndex(v => v.sessionId === this.sessionId);
    if (idx !== -1) {
      visitors[idx].duration = Math.round((Date.now() - this.sessionStart) / 1000);
      safeSet(STORAGE_KEYS.visitors, visitors);
      this._sendServer({ sessionId: this.sessionId, duration: visitors[idx].duration }, '/visit/update');
    }
  }

  getVisitors() { return safeJSON(STORAGE_KEYS.visitors, []); }

  getLiveVisitors() {
    const visitors = this.getVisitors();
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return visitors.filter(v => new Date(v.timestamp).getTime() > fiveMinAgo);
  }

  blockSession(sessionId) {
    const blocked = safeJSON(STORAGE_KEYS.blocked, []);
    if (!blocked.includes(sessionId)) {
      blocked.push(sessionId);
      safeSet(STORAGE_KEYS.blocked, blocked);
      this._logSecurityEvent('block', `Blocked: ${sessionId}`);
    }
  }

  unblockSession(sessionId) {
    let blocked = safeJSON(STORAGE_KEYS.blocked, []);
    blocked = blocked.filter(id => id !== sessionId);
    safeSet(STORAGE_KEYS.blocked, blocked);
    this._logSecurityEvent('unblock', `Unblocked: ${sessionId}`);
  }

  getBlockedSessions() { return safeJSON(STORAGE_KEYS.blocked, []); }
  getAuditLog() { return safeJSON(STORAGE_KEYS.auditLog, []); }
  clearAuditLog() { safeSet(STORAGE_KEYS.auditLog, []); }

  simulateVisitor() {
    const pages = ['/', '/books', '/movies', '/english', '/focus', '/podcasts'];
    const page = pages[Math.floor(Math.random() * pages.length)];
    const { device, browser } = getBrowserInfo();
    const visitors = safeJSON(STORAGE_KEYS.visitors, []);
    visitors.unshift({
      id: generateId(),
      sessionId: generateId(),
      page,
      ip: `${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      device, browser,
      location: getEstimatedLocation(),
      timestamp: new Date().toISOString(),
      duration: Math.floor(Math.random() * 300),
    });
    if (visitors.length > 500) visitors.length = 500;
    safeSet(STORAGE_KEYS.visitors, visitors);
    this._logSecurityEvent('simulate', `Simulated visitor on ${page}`);
    return visitors[0];
  }

  exportData() {
    return JSON.stringify({
      visitors: this.getVisitors(),
      auditLog: this.getAuditLog(),
      blocked: this.getBlockedSessions(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  getStats() {
    const visitors = this.getVisitors();
    const sessions = [...new Set(visitors.map(v => v.sessionId))];
    const live = this.getLiveVisitors();
    return {
      totalVisits: visitors.length,
      uniqueVisitors: sessions.length,
      liveCount: live.length,
    };
  }
}

export const analyticsService = new AnalyticsService();
