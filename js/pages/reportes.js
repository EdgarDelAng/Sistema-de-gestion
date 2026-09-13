import {
  StatsService, CatalogosService, AlumnosService,
  CalificacionesService, AsistenciaService, KardexService, ConfigService
} from '../services/data.service.js';
import { escapeHtml } from '../core/ui.js';
import { PeriodSelector } from '../components/period-selector.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState, blockSkeleton } from '../components/loading.js';

const TIPOS = [
  { id: 'alumnos',       label: 'Alumnos',           icon: 'fa-user-graduate',     color: 'var(--c-brand-500)' },
  { id: 'profesores',    label: 'Profesores',        icon: 'fa-chalkboard-teacher', color: 'var(--c-success)' },
  { id: 'grupos',        label: 'Grupos',            icon: 'fa-users',             color: 'var(--c-warning)' },
  { id: 'calificaciones',label: 'Calificaciones',    icon: 'fa-chart-bar',         color: '#8e44ad' },
  { id: 'asistencia',    label: 'Asistencia',        icon: 'fa-clipboard-check',   color: 'var(--c-info)' },
  { id: 'riesgo',        label: 'Alumnos en riesgo', icon: 'fa-triangle-exclamation', color: 'var(--c-danger)' },
  { id: 'promedios',     label: 'Top promedios',     icon: 'fa-trophy',            color: '#f1c40f' },
  { id: 'kardex-grupal', label: 'Kárdex grupal',     icon: 'fa-file-lines',        color: 'var(--c-brand-600)' }
];

export async function renderReportes(container) {
  const grupos = await CatalogosService.grupos();
  const sel = PeriodSelector.current;
  let tipoActual = 'alumnos';
  let filtros = { grupoId: '', grado: '', estado: '' };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-file-alt"></i> Reportes</h1>
        <p class="page-sub">Informes institucionales · ${escapeHtml(sel.ciclo)} · ${escapeHtml(sel.periodo)}</p>
      </div>
      <div style="display:flex;gap:var(--sp-2)">
        <button class="btn btn-secondary" id="btnPrint"><i class="fas fa-print"></i> Imprimir</button>
        <button class="btn btn-primary" id="btnExport"><i class="fas fa-file-excel"></i> Exportar</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--sp-3);margin-bottom:var(--sp-5)">
      ${TIPOS.map((t) => `
        <button class="btn btn-secondary rep-tipo" style="height:auto;padding:var(--sp-4);text-align:left;flex-direction:column;align-items:flex-start;gap:var(--sp-2);border-left:3px solid ${t.color}" data-tipo="${t.id}">
          <div style="display:flex;align-items:center;gap:var(--sp-3);width:100%">
            <i class="fas ${t.icon}" style="color:${t.color};font-size:1.2rem"></i>
            <strong style="font-size:var(--fs-sm);color:var(--c-brand-900)">${t.label}</strong>
          </div>
        </button>`).join('')}
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
      <div class="card-header">
        <h3 class="card-title" id="repTitle"><i class="fas fa-filter"></i> Filtros</h3>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--sp-3);align-items:end">
        <div class="field" style="margin:0">
          <label>Ciclo escolar</label>
          <input class="input" value="${escapeHtml(sel.ciclo)}" readonly>
        </div>
        <div class="field" style="margin:0">
          <label>Periodo</label>
          <input class="input" value="${escapeHtml(sel.periodo)}" readonly>
        </div>
        <div class="field" style="margin:0">
          <label>Grupo</label>
          <select class="select" id="f_grupo">
            <option value="">Todos los grupos</option>
            ${grupos.map((g) => `<option value="${g.id}">${escapeHtml(g.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="margin:0">
          <label>Grado</label>
          <select class="select" id="f_grado">
            <option value="">Todos los grados</option>
            <option value="6°">6°</option>
            <option value="7°">7°</option>
            <option value="8°">8°</option>
          </select>
        </div>
        <div class="field" style="margin:0">
          <label>Estado</label>
          <select class="select" id="f_estado">
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btnConsultar"><i class="fas fa-search"></i> Consultar</button>
      </div>
    </div>

    <div class="card" id="repOut">
      ${emptyState({ icon: 'fa-file-lines', title: 'Selecciona un tipo de reporte', message: 'Elige un reporte arriba y presiona Consultar.' })}
    </div>
  `;

  const out = container.querySelector('#repOut');
  const titulo = container.querySelector('#repTitle');

  const generar = async (tipo) => {
    tipoActual = tipo;
    container.querySelectorAll('.rep-tipo').forEach((b) => {
      const activo = b.dataset.tipo === tipo;
      b.style.background = activo ? 'var(--c-brand-500)' : '';
      b.style.color = activo ? '#fff' : '';
      b.style.borderColor = activo ? 'var(--c-brand-500)' : b.style.borderLeftColor;
      b.querySelector('strong').style.color = activo ? '#fff' : 'var(--c-brand-900)';
    });

    const t = TIPOS.find((x) => x.id === tipo);
    titulo.innerHTML = `<i class="fas ${t.icon}"></i> ${t.label} · ${escapeHtml(sel.ciclo)}`;

    out.innerHTML = blockSkeleton(320);

    try {
      const html = await renderReporte(tipo, filtros);
      out.innerHTML = html;
    } catch (err) {
      out.innerHTML = emptyState({ icon: 'fa-triangle-exclamation', title: 'Error al generar reporte', message: err.message });
    }
  };

  container.querySelectorAll('.rep-tipo').forEach((b) => {
    b.addEventListener('click', () => generar(b.dataset.tipo));
  });
  container.querySelector('#f_grupo').addEventListener('change', (e) => { filtros.grupoId = e.target.value; generar(tipoActual); });
  container.querySelector('#f_grado').addEventListener('change', (e) => { filtros.grado = e.target.value; generar(tipoActual); });
  container.querySelector('#f_estado').addEventListener('change', (e) => { filtros.estado = e.target.value; generar(tipoActual); });
  container.querySelector('#btnConsultar').addEventListener('click', () => generar(tipoActual));

  container.querySelector('#btnPrint').addEventListener('click', () => window.print());
  container.querySelector('#btnExport').addEventListener('click', () => {
    UI.toast('Exportación a Excel lista para conectar con backend', 'info');
  });

  // Cargar por defecto el primero
  generar('alumnos');
}

// ============================================================
// Renderizadores por tipo
// ============================================================
async function renderReporte(tipo, filtros) {
  if (tipo === 'alumnos') return reporteAlumnos(filtros);
  if (tipo === 'profesores') return reporteProfesores(filtros);
  if (tipo === 'grupos') return reporteGrupos(filtros);
  if (tipo === 'calificaciones') return reporteCalificaciones(filtros);
  if (tipo === 'asistencia') return reporteAsistencia(filtros);
  if (tipo === 'riesgo') return reporteRiesgo(filtros);
  if (tipo === 'promedios') return reportePromedios(filtros);
  if (tipo === 'kardex-grupal') return reporteKardexGrupal(filtros);
  return emptyState({ icon: 'fa-file', title: 'Reporte no disponible' });
}

async function reporteAlumnos(f) {
  let alumnos = await CatalogosService.alumnos();
  const grupos = await CatalogosService.grupos();
  if (f.grupoId) alumnos = alumnos.filter((a) => a.grupoId === Number(f.grupoId));
  if (f.grado) alumnos = alumnos.filter((a) => a.grado === f.grado);
  if (f.estado) alumnos = alumnos.filter((a) => a.estado === f.estado);

  if (!alumnos.length) return emptyState({ icon: 'fa-user-graduate', title: 'Sin alumnos con esos filtros' });

  return `
    <div class="card-header">
      <h3 class="card-title"><i class="fas fa-user-graduate"></i> ${alumnos.length} alumnos</h3>
    </div>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Matrícula</th><th>Nombre</th><th>Grado</th><th>Grupo</th><th>Turno</th><th>Estado</th></tr></thead>
        <tbody>${alumnos.map((a) => {
          const g = grupos.find((x) => x.id === a.grupoId);
          return `<tr>
            <td><code style="font-size:.8em">${escapeHtml(a.matricula)}</code></td>
            <td>${escapeHtml(a.nombre + ' ' + a.apellidos)}</td>
            <td>${a.grado}</td>
            <td>${g ? escapeHtml(g.nombre) : '—'}</td>
            <td style="text-transform:capitalize">${a.turno || '—'}</td>
            <td>${statusBadge(a.estado)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}

async function reporteProfesores() {
  const profesores = await CatalogosService.profesores();
  const materias = await CatalogosService.materias();
  if (!profesores.length) return emptyState({ icon: 'fa-chalkboard-teacher', title: 'Sin profesores registrados' });
  return `
    <div class="card-header"><h3 class="card-title"><i class="fas fa-chalkboard-teacher"></i> ${profesores.length} profesores</h3></div>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>No. Empleado</th><th>Nombre</th><th>Área</th><th>Especialidad</th><th>Materias</th><th>Estado</th></tr></thead>
        <tbody>${profesores.map((p) => {
          const suyas = materias.filter((m) => m.profesorId === p.id);
          return `<tr>
            <td><code style="font-size:.8em">${escapeHtml(p.numEmpleado || '—')}</code></td>
            <td>${escapeHtml(p.nombre + ' ' + p.apellidos)}</td>
            <td>${escapeHtml(p.area)}</td>
            <td>${escapeHtml(p.especialidad || '—')}</td>
            <td>${suyas.length}</td>
            <td>${statusBadge(p.estado)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}

async function reporteGrupos(f) {
  let grupos = await CatalogosService.grupos();
  const alumnos = await CatalogosService.alumnos();
  if (f.grupoId) grupos = grupos.filter((g) => g.id === Number(f.grupoId));
  if (!grupos.length) return emptyState({ icon: 'fa-users', title: 'Sin grupos' });
  return `
    <div class="card-header"><h3 class="card-title"><i class="fas fa-users"></i> ${grupos.length} grupos</h3></div>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Grupo</th><th>Aula</th><th>Turno</th><th>Alumnos</th><th>Capacidad</th><th>Ocupación</th></tr></thead>
        <tbody>${grupos.map((g) => {
          const inscritos = alumnos.filter((a) => a.grupoId === g.id).length;
          const pct = g.capacidad ? Math.round((inscritos / g.capacidad) * 100) : 0;
          return `<tr>
            <td><strong>${escapeHtml(g.nombre)}</strong></td>
            <td>${escapeHtml(g.aula || '—')}</td>
            <td style="text-transform:capitalize">${escapeHtml(g.turno || '—')}</td>
            <td>${inscritos}</td>
            <td>${g.capacidad || '—'}</td>
            <td><span class="badge badge-${pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'success'}">${pct}%</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}

async function reporteCalificaciones(f) {
  const grupos = await CatalogosService.grupos();
  const alumnos = await CatalogosService.alumnos();
  const califs = await (await import('../services/data.service.js')).CalificacionesService.todos();

  let filtered = califs;
  if (f.grupoId) {
    const idsAlumnos = alumnos.filter((a) => a.grupoId === Number(f.grupoId)).map((a) => a.id);
    filtered = filtered.filter((c) => idsAlumnos.includes(c.alumnoId));
  }

  if (!filtered.length) return emptyState({ icon: 'fa-chart-bar', title: 'Sin calificaciones' });

  const materias = await CatalogosService.materias();
  return `
    <div class="card-header"><h3 class="card-title"><i class="fas fa-chart-bar"></i> ${filtered.length} calificaciones</h3></div>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Alumno</th><th>Materia</th><th style="text-align:center">Parcial</th><th style="text-align:center">Nota</th><th>Estado</th></tr></thead>
        <tbody>${filtered.slice(0, 100).map((c) => {
          const al = alumnos.find((a) => a.id === c.alumnoId);
          const m = materias.find((x) => x.id === c.materiaId);
          const cfg = { escalaMinima: 6 };
          return `<tr>
            <td>${al ? escapeHtml(al.nombre + ' ' + al.apellidos) : '—'}</td>
            <td>${m ? escapeHtml(m.nombre) : '—'}</td>
            <td style="text-align:center">${c.periodo}</td>
            <td style="text-align:center"><strong>${c.nota}</strong></td>
            <td>${statusBadge(c.nota >= 6 ? 'Aprobado' : 'Reprobado')}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    ${filtered.length > 100 ? `<div style="padding:var(--sp-3);text-align:center;color:var(--text-muted);font-size:var(--fs-sm)">Mostrando 100 de ${filtered.length} registros</div>` : ''}`;
}

async function reporteAsistencia(f) {
  const asist = await AsistenciaService.historial(f.grupoId ? { grupoId: f.grupoId } : {});
  if (!asist.length) return emptyState({ icon: 'fa-clipboard-check', title: 'Sin registros de asistencia' });
  return `
    <div class="card-header"><h3 class="card-title"><i class="fas fa-clipboard-check"></i> ${asist.length} registros</h3></div>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Fecha</th><th>Alumno</th><th>Materia</th><th>Estado</th></tr></thead>
        <tbody>${asist.slice(0, 100).map((a) => `
          <tr>
            <td>${a.fecha}</td>
            <td>${escapeHtml(a.alumnoNombre)}</td>
            <td>${escapeHtml(a.materiaNombre)}</td>
            <td>${statusBadge(a.estado)}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

async function reporteRiesgo(f) {
  let riesgo = await StatsService.alumnosEnRiesgo(50);
  if (f.grupoId) riesgo = riesgo.filter((a) => a.grupoId === Number(f.grupoId));
  if (f.grado) riesgo = riesgo.filter((a) => a.grado === f.grado);
  if (!riesgo.length) return emptyState({ icon: 'fa-circle-check', title: 'Sin alumnos en riesgo', message: '¡Excelente! Ningún alumno tiene promedio bajo.' });
  return `
    <div class="card-header"><h3 class="card-title" style="color:var(--c-danger)"><i class="fas fa-triangle-exclamation"></i> ${riesgo.length} alumnos requieren atención</h3></div>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Matrícula</th><th>Alumno</th><th>Grado</th><th style="text-align:center">Promedio</th><th>Estado</th></tr></thead>
        <tbody>${riesgo.map((a) => `
          <tr>
            <td><code style="font-size:.8em">${escapeHtml(a.matricula)}</code></td>
            <td>${escapeHtml(a.nombre + ' ' + a.apellidos)}</td>
            <td>${a.grado}</td>
            <td style="text-align:center"><span class="badge badge-danger">${a.promedio.toFixed(1)}</span></td>
            <td>${statusBadge('Riesgo académico')}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

async function reportePromedios(f) {
  let top = await StatsService.topAlumnos(30);
  if (f.grupoId) top = top.filter((a) => a.grupoId === Number(f.grupoId));
  if (f.grado) top = top.filter((a) => a.grado === f.grado);
  if (!top.length) return emptyState({ icon: 'fa-trophy', title: 'Sin datos de promedio' });
  return `
    <div class="card-header"><h3 class="card-title"><i class="fas fa-trophy"></i> Mejores promedios</h3></div>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th style="text-align:center">#</th><th>Alumno</th><th>Grado</th><th style="text-align:center">Promedio</th><th>Estado</th></tr></thead>
        <tbody>${top.map((a, i) => `
          <tr>
            <td style="text-align:center"><strong>${i + 1}</strong></td>
            <td>${escapeHtml(a.nombre + ' ' + a.apellidos)}</td>
            <td>${a.grado}</td>
            <td style="text-align:center"><span class="badge badge-success">${a.promedio.toFixed(2)}</span></td>
            <td>${statusBadge('Aprobado')}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

async function reporteKardexGrupal(f) {
  const grupos = await CatalogosService.grupos();
  const alumnos = await CatalogosService.alumnos();
  let gruposSel = f.grupoId ? grupos.filter((g) => g.id === Number(f.grupoId)) : grupos;
  if (!gruposSel.length) return emptyState({ icon: 'fa-file-lines', title: 'Sin grupos' });

  const bloques = await Promise.all(gruposSel.map(async (g) => {
    const alums = alumnos.filter((a) => a.grupoId === g.id);
    const proms = await Promise.all(alums.map(async (a) => {
      try { const k = await KardexService.porAlumno(a.id); return { alumno: a, prom: k.promedioGeneral, estado: k.estado }; }
      catch { return { alumno: a, prom: 0, estado: 'Sin datos' }; }
    }));
    const promGrupo = proms.length ? proms.reduce((acc, x) => acc + x.prom, 0) / proms.length : 0;
    return { grupo: g, proms, promGrupo, alumnos: alums };
  }));

  return bloques.map((b) => `
    <div style="margin-bottom:var(--sp-5)">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);margin-bottom:var(--sp-3)">
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <i class="fas fa-users" style="color:var(--c-brand-500)"></i>
          <strong>Grupo ${escapeHtml(b.grupo.nombre)}</strong>
          <span style="color:var(--text-muted);font-size:var(--fs-sm)">${b.alumnos.length} alumnos</span>
        </div>
        <span class="badge badge-${b.promGrupo >= 8 ? 'success' : b.promGrupo >= 6 ? 'warning' : 'danger'}">Promedio: ${b.promGrupo.toFixed(1)}</span>
      </div>
      <div class="table-scroll">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead><tr><th>Alumno</th><th style="text-align:center">Promedio</th><th>Estado</th></tr></thead>
          <tbody>${b.proms.sort((a, c) => c.prom - a.prom).map((x) => `
            <tr>
              <td>${escapeHtml(x.alumno.nombre + ' ' + x.alumno.apellidos)}</td>
              <td style="text-align:center"><strong>${x.prom ? x.prom.toFixed(2) : '—'}</strong></td>
              <td>${statusBadge(x.estado)}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`).join('');
}

import { UI } from '../core/ui.js';