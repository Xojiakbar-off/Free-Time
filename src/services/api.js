export function getToken() {
  return localStorage.getItem('ft_token') || sessionStorage.getItem('ft_admin_token') || '';
}

export function setToken(token) {
  if (token) localStorage.setItem('ft_token', token);
  else localStorage.removeItem('ft_token');
}

export function getAdminToken() {
  return sessionStorage.getItem('ft_admin_token') || '';
}

export function setAdminToken(token) {
  sessionStorage.setItem('ft_admin_token', token);
}

export function clearAdminToken() {
  sessionStorage.removeItem('ft_admin_token');
  sessionStorage.removeItem('ft_admin');
}

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const auth = token || getToken();
  if (auth) headers.Authorization = 'Bearer ' + auth;
  let res;
  try {
    res = await fetch(API_BASE + '/api' + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Server bilan aloqa yo\'q. Backend ishga tushirilganini tekshiring.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Xatolik yuz berdi');
    err.status = res.status;
    err.authFailure = res.status === 401 || res.status === 403;
    throw err;
  }
  return data;
}