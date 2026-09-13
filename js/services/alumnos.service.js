// ============================================================
// alumnos.service.js — CRUD de alumnos (mock listo para backend)
// ============================================================

import { API, delay } from '../core/api.js';

// ------------------------------------------------------------
// DATOS MOCK — reemplaza esto por llamadas API cuando toque
// ------------------------------------------------------------
let MOCK_ALUMNOS = [
  { id: 1, matricula: 'A2026-0001', nombre: 'Lucía', apellidos: 'Méndez López',   grado: '6°', grupoId: 1, email: 'lucia@colegio.edu', telefono: '555-1234', tutor: 'María López',   direccion: 'Calle 1 #123', estado: 'activo',   promedio: 8.5 },
  { id: 2, matricula: 'A2026-0002', nombre: 'Tomás', apellidos: 'Herrera Ruiz',    grado: '7°', grupoId: 3, email: 'tomas@colegio.edu', telefono: '555-5678', tutor: 'Carlos Ruiz',   direccion: 'Calle 2 #456', estado: 'activo',   promedio: 7.4 },
  { id: 3, matricula: 'A2026-0003', nombre: 'Valentina', apellidos: 'Ríos Torres', grado: '6°', grupoId: 1, email: 'vale@colegio.edu',  telefono: '555-9012', tutor: 'Ana Torres',    direccion: 'Calle 3 #789', estado: 'activo',   promedio: 9.3 },
  { id: 4, matricula: 'A2026-0004', nombre: 'Mateo', apellidos: 'Suárez Gómez',   grado: '8°', grupoId: 5, email: 'mateo@colegio.edu', telefono: '555-3456', tutor: 'Luis Gómez',    direccion: 'Calle 4 #012', estado: 'activo',   promedio: 6.2 },
  { id: 5, matricula: 'A2026-0005', nombre: 'Isabella', apellidos: 'Díaz López',  grado: '7°', grupoId: 4, email: 'isa@colegio.edu',   telefono: '555-7890', tutor: 'María López',   direccion: 'Calle 5 #345', estado: 'activo',   promedio: 8.0 },
  { id: 6, matricula: 'A2026-0006', nombre: 'Santiago', apellidos: 'Vargas Ruiz', grado: '8°', grupoId: 6, email: 'santi@colegio.edu', telefono: '555-2345', tutor: 'Carlos Ruiz',   direccion: 'Calle 6 #678', estado: 'inactivo', promedio: 5.8 },
  { id: 7, matricula: 'A2026-0007', nombre: 'Camila', apellidos: 'Ortiz Vega',    grado: '6°', grupoId: 2, email: 'cami@colegio.edu',  telefono: '555-6789', tutor: 'Ana Torres',    direccion: 'Calle 7 #901', estado: 'activo',   promedio: 8.8 },
  { id: 8, matricula: 'A2026-0008', nombre: 'Daniel', apellidos: 'Flores Luna',   grado: '7°', grupoId: 3, email: 'dani@colegio.edu',  telefono: '555-0123', tutor: 'Luis Gómez',    direccion: 'Calle 8 #234', estado: 'activo',   promedio: 7.2 },
  { id: 9, matricula: 'A2026-0009', nombre: 'Valeria', apellidos: 'Castro Ríos',  grado: '8°', grupoId: 5, email: 'vale.c@colegio.edu', telefono: '555-4567', tutor: 'María López',  direccion: 'Calle 9 #567', estado: 'activo',   promedio: 9.1 },
  { id: 10, matricula: 'A2026-0010', nombre: 'Matías', apellidos: 'Romero Paz',  grado: '6°', grupoId: 2, email: 'matias@colegio.edu', telefono: '555-8901', tutor: 'Carlos Ruiz',  direccion: 'Calle 10 #890', estado: 'activo', promedio: 7.9 },
  { id: 11, matricula: 'A2026-0011', nombre: 'Renata', apellidos: 'Silva Mora',  grado: '6°', grupoId: 1, email: 'renata@colegio.edu', telefono: '555-1122', tutor: 'Ana Torres',   direccion: 'Calle 11 #321', estado: 'activo', promedio: 8.3 },
  { id: 12, matricula: 'A2026-0012', nombre: 'Emilio', apellidos: 'Navarro Gil',  grado: '7°', grupoId: 4, email: 'emilio@colegio.edu', telefono: '555-3344', tutor: 'Luis Gómez',   direccion: 'Calle 12 #654', estado: 'activo', promedio: 6.7 }
];

const USE_MOCK = true;
let nextId = Math.max(...MOCK_ALUMNOS.map(a => a.id)) + 1;

export const AlumnosService = {
  async listar({ search = '', grado = '', grupoId = '', estado = '', page = 1, perPage = 10, sort = 'id', dir = 'asc' } = {}) {
    if (USE_MOCK) {
      await delay();
      let data = [...MOCK_ALUMNOS];

      if (search) {
        const q = search.toLowerCase();
        data = data.filter(a =>
          a.nombre.toLowerCase().includes(q) ||
          a.apellidos.toLowerCase().includes(q) ||
          a.matricula.toLowerCase().includes(q)
        );
      }
      if (grado) data = data.filter(a => a.grado === grado);
      if (grupoId) data = data.filter(a => a.grupoId === Number(grupoId));
      if (estado) data = data.filter(a => a.estado === estado);

      data.sort((a, b) => {
        const va = a[sort], vb = b[sort];
        if (typeof va === 'number') return (va - vb) * (dir === 'asc' ? 1 : -1);
        return String(va).localeCompare(String(vb)) * (dir === 'asc' ? 1 : -1);
      });

      const total = data.length;
      const start = (page - 1) * perPage;
      return {
        items: data.slice(start, start + perPage),
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage)
      };
    }

    return API.get('/alumnos', { search, grado, grupoId, estado, page, perPage, sort, dir });
  },

  async obtener(id) {
    if (USE_MOCK) {
      await delay(180);
      const item = MOCK_ALUMNOS.find(a => a.id === Number(id));
      if (!item) throw new Error('Alumno no encontrado');
      return { ...item };
    }
    return API.get(`/alumnos/${id}`);
  },

  async crear(data) {
    if (USE_MOCK) {
      await delay();
      const matricula = 'A2026-' + String(nextId).padStart(4, '0');
      const nuevo = {
        id: nextId++,
        matricula,
        estado: 'activo',
        promedio: 0,
        ...data
      };
      MOCK_ALUMNOS.push(nuevo);
      return { ...nuevo };
    }
    return API.post('/alumnos', data);
  },

  async actualizar(id, data) {
    if (USE_MOCK) {
      await delay();
      const idx = MOCK_ALUMNOS.findIndex(a => a.id === Number(id));
      if (idx === -1) throw new Error('Alumno no encontrado');
      MOCK_ALUMNOS[idx] = { ...MOCK_ALUMNOS[idx], ...data };
      return { ...MOCK_ALUMNOS[idx] };
    }
    return API.put(`/alumnos/${id}`, data);
  },

  async eliminar(id) {
    if (USE_MOCK) {
      await delay();
      const idx = MOCK_ALUMNOS.findIndex(a => a.id === Number(id));
      if (idx === -1) throw new Error('Alumno no encontrado');
      MOCK_ALUMNOS.splice(idx, 1);
      return { ok: true };
    }
    return API.delete(`/alumnos/${id}`);
  }
};