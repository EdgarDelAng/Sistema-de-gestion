// ============================================================
// api.js — Capa fetch centralizada + adaptador mock
// ============================================================

import { Auth } from './auth.js';

export const API = {
  // Cuando tengas backend, cambia esto a la URL real
  BASE_URL: '/api/v1',

  async request(path, { method = 'GET', body, params, signal } = {}) {
    const url = new URL(this.BASE_URL + path, location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
      });
    }

    const headers = { 'Content-Type': 'application/json' };
    if (Auth.user?.token) headers['Authorization'] = `Bearer ${Auth.user.token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });

    if (res.status === 401) {
      Auth.logout();
      location.replace('index.html');
      throw new Error('Sesión expirada');
    }
    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Error ${res.status}`);
    }
    return data;
  },

  get:    (p, params) => API.request(p, { params }),
  post:   (p, body)   => API.request(p, { method: 'POST', body }),
  put:    (p, body)   => API.request(p, { method: 'PUT', body }),
  patch:  (p, body)   => API.request(p, { method: 'PATCH', body }),
  delete: (p)         => API.request(p, { method: 'DELETE' })
};

// Helper para simular latencia en modo mock
export const delay = (ms = 280) => new Promise(r => setTimeout(r, ms));