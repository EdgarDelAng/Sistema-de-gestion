// ============================================================
// catalogos.service.js — Grupos, grados, materias (para selects)
// ============================================================

import { delay } from '../core/api.js';

const MOCK = {
  grados: ['6°', '7°', '8°'],
  grupos: [
    { id: 1, nombre: '6° A' },
    { id: 2, nombre: '6° B' },
    { id: 3, nombre: '7° A' },
    { id: 4, nombre: '7° B' },
    { id: 5, nombre: '8° A' },
    { id: 6, nombre: '8° B' }
  ]
};

export const CatalogosService = {
  async grados() { await delay(80); return [...MOCK.grados]; },
  async grupos() { await delay(80); return [...MOCK.grupos]; }
};