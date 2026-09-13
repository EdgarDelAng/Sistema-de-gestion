import { UI, escapeHtml } from '../core/ui.js';
import {
  GruposService, ProfesoresService, AlumnosService,
  MateriasService, HorariosService, CalificacionesService
} from '../services/data.service.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';
import { Auth } from '../core/auth.js';
import { Validators, Validacion } from '../components/form-validator.js';

const GRADOS = ['1°','2°','3°','4°','5°','6°'];
const TURNOS = ['matutino','vespertino'];
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];

export async function renderGrupos(container) {
  const puedeEditar = Auth.hasRole('admin');
  const state = { search: '', grado: '', turno: '', estado: '' };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-users"></i> Grupos</h1>
        <p class="page-sub">Gestión de grupos, tutores y distribución de alumnos</p>
      </div>
      ${puedeEditar ? `
        <button class="btn btn-primary" id="btnNuevo">
          <i class="fas fa-plus"></i> Nuevo grupo
        </button>` : ''}
    </div>

    <div id="stats"></div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="input-icon" style="flex:1;min-width:220px">
          <i class="fas fa-search"></i>
          <input type="search" class="input" id="searchInput" placeholder="Buscar por nombre o tutor…">
        </div>
        <select class="select" id="filtroGrado" style="width:auto;min-width:130px">
          <option value="">Todos los grados</option>
          ${GRADOS.map((g) => `<option value="${g}">${escapeHtml(g)}</option>`).join('')}
        </select>
        <select class="select" id="filtroTurno" style="width:auto;min-width:130px">
          <option value="">Todos los turnos</option>
          ${TURNOS.map((t) => `<option value="${t}">${escapeHtml(t)}</option>`).join('')}
        </select>
        <select class="select" id="filtroEstado" style="width:auto;min-width:130px">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Grado</th>
              <th>Tutor</th>
              <th>Aula</th>
              <th>Turno</th>
              <th style="text-align:center">Alumnos</th>
              <th style="text-align:center">Ocupación</th>
              <th style="text-align:center">Promedio</th>
              <th>Estado</th>
              <th style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#tbody');
  const statsWrap = container.querySelector('#stats');

  // ============================================================
  // Cargar y renderizar
  // ============================================================
  async function cargar() {
    tbody.innerHTML = `<tr><td colspan="10"><div class="skeleton-block" style="height:200px;margin:var(--sp-3)"></div></td></tr>`;
    statsWrap.innerHTML = `<div class="skeleton-block" style="height:100px;margin-bottom:var(--sp-4)"></div>`;

    const [grupos, profesores, alumnos, materias, calificaciones, db] = await Promise.all([
      GruposService.todos(),
      ProfesoresService.todos(),
      AlumnosService.todos(),
      MateriasService.todos(),
      CalificacionesService.todos(),
      Promise.resolve((await import('../services/data.service.js'))._db())
    ]);

    // Enriquecer cada grupo
    const enriquecidos = grupos.map((g) => {
      const tutor = profesores.find((p) => p.id === g.tutorId);
      const alumnosGrupo = alumnos.filter((a) => a.grupoId === g.id);
      const asignaciones = (db.materiaGrupo || []).filter((mg) => mg.grupoId === g.id);
      const materiasGrupo = asignaciones
        .map((a) => ({
          materia: materias.find((m) => m.id === a.materiaId),
          profesor: profesores.find((p) => p.id === a.profesorId)
        }))
        .filter((x) => x.materia);
      const profesoresUnicos = [...new Set(materiasGrupo.map((x) => x.profesor?.id).filter(Boolean))];

      const alumnoIds = alumnosGrupo.map((a) => a.id);
      const notasGrupo = calificaciones.filter((c) => alumnoIds.includes(c.alumnoId));
      const promedio = notasGrupo.length
        ? notasGrupo.reduce((sum, c) => sum + c.nota, 0) / notasGrupo.length
        : 0;

      const ocupacion = g.capacidad ? Math.round((alumnosGrupo.length / g.capacidad) * 100) : 0;

      return {
        ...g,
        _tutor: tutor,
        _alumnos: alumnosGrupo,
        _materias: materiasGrupo,
        _profesoresCount: profesoresUnicos.length,
        _calificaciones: notasGrupo,
        _promedio: promedio,
        _ocupacion: ocupacion
      };
    });

    // Stats
    const activos = enriquecidos.filter((g) => g.estado !== 'inactivo').length;
    const totalAlumnos = new Set(enriquecidos.flatMap((g) => g._alumnos.map((a) => a.id))).size;
    const capacidadTotal = enriquecidos.reduce((a, g) => a + (g.capacidad || 0), 0);
    const ocupacionPromedio = capacidadTotal ? Math.round((totalAlumnos / capacidadTotal) * 100) : 0;
    const promedioGlobal = (() => {
      const notas = enriquecidos.flatMap((g) => g._calificaciones);
      return notas.length ? notas.reduce((a, c) => a + c.nota, 0) / notas.length : 0;
    })();

    statsWrap.innerHTML = `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div><div class="stat-value">${enriquecidos.length}</div><div class="stat-label">Total grupos</div></div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-circle-check"></i></div>
          <div><div class="stat-value">${activos}</div><div class="stat-label">Activos</div></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
          <div><div class="stat-value">${totalAlumnos}</div><div class="stat-label">Alumnos inscritos</div></div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon"><i class="fas fa-percent"></i></div>
          <div><div class="stat-value">${ocupacionPromedio}%</div><div class="stat-label">Ocupación</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div><div class="stat-value">${promedioGlobal.toFixed(2)}</div><div class="stat-label">Promedio global</div></div>
        </div>
      </div>
    `;

    // Filtros
    const q = state.search.toLowerCase();
    const filtrados = enriquecidos.filter((g) => {
      if (q) {
        const tutorNombre = g._tutor ? `${g._tutor.nombre} ${g._tutor.apellidos}` : '';
        if (!`${g.nombre} ${tutorNombre}`.toLowerCase().includes(q)) return false;
      }
      if (state.grado) {
        const grado = g.nombre.split(' ')[0];
        if (grado !== state.grado) return false;
      }
      if (state.turno && g.turno !== state.turno) return false;
      if (state.estado && g.estado !== state.estado) return false;
      return true;
    });

    if (!filtrados.length) {
      tbody.innerHTML = `<tr><td colspan="10">
        ${emptyState({
          icon: 'fa-users',
          title: 'No hay grupos',
          message: enriquecidos.length ? 'Prueba con otros filtros.' : 'Crea el primer grupo para comenzar.',
          actionLabel: puedeEditar && !enriquecidos.length ? 'Nuevo grupo' : '',
          onAction: puedeEditar ? () => abrirFormulario(null, profesores, cargar) : null
        })}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map((g) => fila(g)).join('');
    engancharFilas(filtrados, profesores);
  }

  function fila(g) {
    const tutor = g._tutor;
    const inicialesTutor = tutor ? (tutor.nombre[0] + tutor.apellidos[0]).toUpperCase() : '?';
    const promClass = g._promedio >= 8 ? 'success' : g._promedio >= 6 ? 'warning' : 'danger';
    const ocupClass = g._ocupacion >= 90 ? 'danger' : g._ocupacion >= 70 ? 'warning' : 'success';

    return `
      <tr data-id="${g.id}" style="cursor:pointer">
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <div style="width:36px;height:36px;border-radius:var(--r-md);background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:800;font-size:.78rem;flex-shrink:0">
              ${escapeHtml(g.nombre.split(' ')[0])}
            </div>
            <div>
              <strong>${escapeHtml(g.nombre)}</strong>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">${g._materias.length} materias</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(g.nombre.split(' ')[0] || '—')}</td>
        <td>
          ${tutor ? `
            <div style="display:flex;align-items:center;gap:var(--sp-2)">
              <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.62rem;flex-shrink:0">
                ${inicialesTutor}
              </div>
              <span style="font-size:var(--fs-sm)">${escapeHtml(tutor.nombre + ' ' + tutor.apellidos)}</span>
            </div>` : '<span style="color:var(--text-muted)">Sin asignar</span>'}
        </td>
        <td><code style="font-size:.8em;color:var(--text-secondary)">${escapeHtml(g.aula || '—')}</code></td>
        <td style="text-transform:capitalize">${escapeHtml(g.turno || '—')}</td>
        <td style="text-align:center">
          <strong>${g._alumnos.length}</strong>
          <span style="color:var(--text-muted);font-size:var(--fs-xs)">/${g.capacidad || '—'}</span>
        </td>
        <td style="text-align:center">
          <span class="badge badge-${ocupClass}">${g._ocupacion}%</span>
        </td>
        <td style="text-align:center">
          <span class="badge badge-${promClass}">${g._promedio ? g._promedio.toFixed(1) : '—'}</span>
        </td>
        <td>${statusBadge(g.estado === 'activo' ? 'Activo' : 'Inactivo')}</td>
        <td style="text-align:right">
          <div class="table-actions">
            <button class="btn-icon" data-ver="${g.id}" title="Ver detalle"><i class="fas fa-eye"></i></button>
            ${puedeEditar ? `
              <button class="btn-icon" data-editar="${g.id}" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon danger" data-eliminar="${g.id}" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
  }

  function engancharFilas(lista, profesores) {
    tbody.querySelectorAll('[data-ver]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const g = lista.find((x) => x.id === Number(btn.dataset.ver));
        verDetalle(g, profesores);
      });
    });
    tbody.querySelectorAll('[data-editar]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirFormulario(Number(btn.dataset.editar), profesores, cargar);
      });
    });
    tbody.querySelectorAll('[data-eliminar]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmarEliminar(Number(btn.dataset.eliminar));
      });
    });
    tbody.querySelectorAll('tr[data-id]').forEach((tr) => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('[data-ver], [data-editar], [data-eliminar]')) return;
        const g = lista.find((x) => x.id === Number(tr.dataset.id));
        if (g) verDetalle(g, profesores);
      });
    });
  }

  // ============================================================
  // DETALLE DEL GRUPO — Modal con tabs
  // ============================================================
  function verDetalle(g, profesores) {
    const { overlay } = UI.modal({
      title: 'Detalle del grupo',
      size: 'modal-lg',
      body: `
        <div style="display:flex;gap:var(--sp-4);align-items:center;padding-bottom:var(--sp-4);border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);flex-wrap:wrap">
          <div style="width:64px;height:64px;border-radius:var(--r-lg);background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:800;font-size:1.3rem;flex-shrink:0">
            ${escapeHtml(g.nombre.split(' ')[0])}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">
              Grupo ${escapeHtml(g.nombre)}
            </div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
              Aula <code>${escapeHtml(g.aula || '—')}</code>
              · Turno <span style="text-transform:capitalize">${escapeHtml(g.turno || '—')}</span>
              · ${g._alumnos.length}/${g.capacidad || '—'} alumnos
            </div>
          </div>
          <div style="text-align:right">
            ${statusBadge(g.estado === 'activo' ? 'Activo' : 'Inactivo')}
            <div style="margin-top:6px;font-size:var(--fs-xs);color:var(--text-muted)">Promedio</div>
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-500)">
              ${g._promedio ? g._promedio.toFixed(2) : '—'}
            </div>
          </div>
        </div>

        <div style="display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);overflow-x:auto">
          ${[
            { id: 'info',     label: 'Información',  icon: 'fa-circle-info' },
            { id: 'alumnos',  label: 'Alumnos',      icon: 'fa-user-graduate' },
            { id: 'materias', label: 'Materias',     icon: 'fa-book' },
            { id: 'horario',  label: 'Horario',      icon: 'fa-clock' },
            { id: 'califs',   label: 'Calificaciones', icon: 'fa-chart-bar' }
          ].map((t, i) => `
            <button class="grupo-tab" data-tab="${t.id}" style="padding:10px 16px;font-size:var(--fs-sm);font-weight:600;color:${i === 0 ? 'var(--c-brand-500)' : 'var(--text-secondary)'};border-bottom:2px solid ${i === 0 ? 'var(--c-brand-500)' : 'transparent'};background:none;cursor:pointer;white-space:nowrap;transition:all .15s">
              <i class="fas ${t.icon}"></i> ${t.label}
            </button>`).join('')}
        </div>

        <div id="tabContent"></div>
      `
    });

    const content = overlay.querySelector('#tabContent');
    const tabs = overlay.querySelectorAll('.grupo-tab');

    const activar = (tab) => {
      tabs.forEach((t) => {
        const activo = t.dataset.tab === tab;
        t.style.color = activo ? 'var(--c-brand-500)' : 'var(--text-secondary)';
        t.style.borderBottomColor = activo ? 'var(--c-brand-500)' : 'transparent';
      });
      if (tab === 'info') content.innerHTML = tabInfo(g);
      if (tab === 'alumnos') content.innerHTML = tabAlumnos(g);
      if (tab === 'materias') content.innerHTML = tabMaterias(g);
      if (tab === 'horario') {
        content.innerHTML = `<div class="skeleton-block" style="height:200px"></div>`;
        tabHorario(g).then((html) => { content.innerHTML = html; });
      }
      if (tab === 'califs') content.innerHTML = tabCalificaciones(g);
    };

    tabs.forEach((t) => t.addEventListener('click', () => activar(t.dataset.tab)));
    activar('info');
  }

  function tabInfo(g) {
    const tutor = g._tutor;
    const bloques = [
      ['Grupo', g.nombre, 'fa-users'],
      ['Grado', g.nombre.split(' ')[0] || '—', 'fa-graduation-cap'],
      ['Aula', g.aula || '—', 'fa-door-open'],
      ['Turno', g.turno || '—', 'fa-clock'],
      ['Ciclo escolar', g.ciclo || '—', 'fa-calendar'],
      ['Periodo', g.periodo || '—', 'fa-calendar-check'],
      ['Capacidad', g.capacidad || '—', 'fa-user-plus'],
      ['Alumnos inscritos', g._alumnos.length, 'fa-user-graduate'],
      ['Ocupación', `${g._ocupacion}%`, 'fa-percent'],
      ['Tutor', tutor ? `${tutor.nombre} ${tutor.apellidos}` : 'Sin asignar', 'fa-user-tie'],
      ['Materias impartidas', g._materias.length, 'fa-book'],
      ['Profesores', g._profesoresCount, 'fa-chalkboard-teacher'],
      ['Promedio del grupo', g._promedio ? g._promedio.toFixed(2) : '—', 'fa-chart-line'],
      ['Estado', g.estado === 'activo' ? 'Activo' : 'Inactivo', 'fa-circle-info']
    ];
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--sp-3)">
        ${bloques.map(([lbl, val, ico]) => `
          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:4px">
              <i class="fas ${ico}"></i> ${lbl}
            </div>
            <div style="font-weight:600;margin-top:4px">${escapeHtml(String(val))}</div>
          </div>`).join('')}
      </div>`;
  }

  function tabAlumnos(g) {
    if (!g._alumnos.length) {
      return emptyState({
        icon: 'fa-user-graduate',
        title: 'Sin alumnos',
        message: 'Este grupo aún no tiene alumnos asignados.'
      });
    }
    return `
      <div style="margin-bottom:var(--sp-3);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:var(--fs-sm)">
          <span style="color:var(--text-secondary)">
            <i class="fas fa-user-graduate" style="color:var(--c-brand-500)"></i>
            ${g._alumnos.length} de ${g.capacidad} lugares ocupados
          </span>
          <span class="badge badge-${g._ocupacion >= 90 ? 'danger' : g._ocupacion >= 70 ? 'warning' : 'success'}">
            ${g._ocupacion}% ocupación
          </span>
        </div>
      </div>
      <div class="table-scroll" style="max-height:340px;overflow-y:auto">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead>
            <tr><th>Matrícula</th><th>Nombre</th><th>Correo</th><th>Estado</th></tr>
          </thead>
          <tbody>
            ${g._alumnos.map((a) => `
              <tr>
                <td><code style="font-size:.8em">${escapeHtml(a.matricula)}</code></td>
                <td>
                  <div style="display:flex;align-items:center;gap:var(--sp-2)">
                    <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.6rem;flex-shrink:0">
                      ${(a.nombre[0] + a.apellidos[0]).toUpperCase()}
                    </div>
                    <strong>${escapeHtml(a.nombre + ' ' + a.apellidos)}</strong>
                  </div>
                </td>
                <td>${escapeHtml(a.email || '—')}</td>
                <td>${statusBadge(a.estado === 'activo' ? 'Activo' : 'Inactivo')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function tabMaterias(g) {
    if (!g._materias.length) {
      return emptyState({
        icon: 'fa-book',
        title: 'Sin materias asignadas',
        message: 'Este grupo no tiene materias asignadas.'
      });
    }
    return `
      <div class="table-scroll">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Materia</th>
              <th>Área</th>
              <th>Profesor</th>
              <th style="text-align:center">Créditos</th>
            </tr>
          </thead>
          <tbody>
            ${g._materias.map(({ materia, profesor }) => `
              <tr>
                <td><code style="font-size:.8em">${escapeHtml(materia.clave || '—')}</code></td>
                <td><strong>${escapeHtml(materia.nombre)}</strong></td>
                <td>${materia.area ? `<span class="badge badge-info">${escapeHtml(materia.area)}</span>` : '—'}</td>
                <td>
                  ${profesor ? `
                    <div style="display:flex;align-items:center;gap:var(--sp-2)">
                      <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.6rem;flex-shrink:0">
                        ${(profesor.nombre[0] + profesor.apellidos[0]).toUpperCase()}
                      </div>
                      <span>${escapeHtml(profesor.nombre + ' ' + profesor.apellidos)}</span>
                    </div>` : '<span style="color:var(--text-muted)">Sin asignar</span>'}
                </td>
                <td style="text-align:center">${materia.creditos || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  async function tabHorario(g) {
    const horarios = await HorariosService.porGrupo(g.id);
    if (!horarios.length) {
      return emptyState({
        icon: 'fa-calendar-xmark',
        title: 'Sin horario asignado',
        message: 'Este grupo no tiene clases programadas.'
      });
    }

    const horas = [...new Set(horarios.map((h) => h.horaInicio))].sort();
    const matriz = {};
    DIAS.forEach((d) => { matriz[d] = {}; horas.forEach((h) => { matriz[d][h] = null; }); });
    horarios.forEach((h) => {
      if (matriz[h.dia] && matriz[h.dia][h.horaInicio] !== undefined) matriz[h.dia][h.horaInicio] = h;
    });

    const materias = g._materias;

    return `
      <div class="table-scroll">
        <table class="table" style="font-size:var(--fs-sm);text-align:center">
          <thead>
            <tr>
              <th style="text-align:left">Hora</th>
              ${DIAS.map((d) => `<th>${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${horas.map((hora) => `
              <tr>
                <td style="text-align:left"><strong>${hora}</strong></td>
                ${DIAS.map((dia) => {
                  const c = matriz[dia][hora];
                  if (!c) return `<td style="color:var(--text-muted)">—</td>`;
                  const info = materias.find((x) => x.materia.id === c.materiaId);
                  return `
                    <td style="background:linear-gradient(135deg,rgba(20,184,166,.1),rgba(37,99,235,.08));border-radius:var(--r-sm);padding:6px">
                      <div style="font-weight:700;color:var(--c-brand-500);font-size:.75em">${escapeHtml(info?.materia?.nombre || '—')}</div>
                      <div style="font-size:.68em;color:var(--text-muted);margin-top:2px">${escapeHtml(info?.profesor?.nombre || '')} ${escapeHtml(info?.profesor?.apellidos?.split(' ')[0] || '')}</div>
                    </td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:var(--sp-3);padding:var(--sp-2) var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);font-size:var(--fs-xs);color:var(--text-secondary)">
        <i class="fas fa-info-circle" style="color:var(--c-brand-500)"></i>
        ${horarios.length} clases programadas en la semana
      </div>`;
  }

  function tabCalificaciones(g) {
    if (!g._calificaciones.length) {
      return emptyState({
        icon: 'fa-chart-bar',
        title: 'Sin calificaciones',
        message: 'Aún no hay calificaciones registradas para este grupo.'
      });
    }

    const aprobados = g._calificaciones.filter((c) => c.nota >= 6).length;
    const reprobados = g._calificaciones.filter((c) => c.nota < 6).length;
    const pct = Math.round((aprobados / g._calificaciones.length) * 100);

    // Agrupar por alumno para ver su promedio
    const porAlumno = {};
    g._calificaciones.forEach((c) => {
      if (!porAlumno[c.alumnoId]) porAlumno[c.alumnoId] = { notas: [], alumno: g._alumnos.find((a) => a.id === c.alumnoId) };
      porAlumno[c.alumnoId].notas.push(c.nota);
    });

    const filas = Object.values(porAlumno)
      .map((x) => ({
        alumno: x.alumno,
        promedio: x.notas.reduce((a, b) => a + b, 0) / x.notas.length,
        totalNotas: x.notas.length
      }))
      .sort((a, b) => b.promedio - a.promedio);

    return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div><div class="stat-value">${g._promedio.toFixed(2)}</div><div class="stat-label">Promedio del grupo</div></div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-check"></i></div>
          <div><div class="stat-value">${aprobados}</div><div class="stat-label">Aprobados</div></div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon"><i class="fas fa-xmark"></i></div>
          <div><div class="stat-value">${reprobados}</div><div class="stat-label">Reprobados</div></div>
        </div>
        <div class="stat-card ${pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger'}">
          <div class="stat-icon"><i class="fas fa-percent"></i></div>
          <div><div class="stat-value">${pct}%</div><div class="stat-label">Aprobación</div></div>
        </div>
      </div>
      <div class="table-scroll" style="max-height:340px;overflow-y:auto">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead>
            <tr>
              <th style="text-align:center">#</th>
              <th>Alumno</th>
              <th style="text-align:center">Notas</th>
              <th style="text-align:center">Promedio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${filas.map((f, i) => `
              <tr>
                <td style="text-align:center">${i + 1}</td>
                <td>${f.alumno ? escapeHtml(f.alumno.nombre + ' ' + f.alumno.apellidos) : '—'}</td>
                <td style="text-align:center">${f.totalNotas}</td>
                <td style="text-align:center"><strong>${f.promedio.toFixed(1)}</strong></td>
                <td>${statusBadge(f.promedio >= 6 ? 'Aprobado' : 'Reprobado')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ============================================================
  // FORMULARIO CREAR / EDITAR
  // ============================================================
  async function abrirFormulario(id, profesores, onSave) {
    let grupo = null;
    if (id) {
      try { grupo = await GruposService.obtener(id); }
      catch (e) { UI.toast(e.message, 'error'); return; }
    }
    const esEdicion = !!grupo;
    const data = grupo || {
      nombre: '', tutorId: null, aula: '', capacidad: 35,
      turno: 'matutino', ciclo: '2026-2027',
      periodo: 'Agosto-Diciembre 2026', estado: 'activo'
    };

    const { overlay, close } = UI.modal({
      title: esEdicion ? 'Editar grupo' : 'Nuevo grupo',
      size: 'modal-lg',
      body: `
        <div class="form-grid-2">
          <div class="field">
            <label>Nombre del grupo <span class="req">*</span></label>
            <input class="input" id="g_nombre" value="${escapeHtml(data.nombre)}" placeholder="Ej: 3° A" maxlength="10">
            <div class="field-hint">Formato: grado + letra (Ej: "3° A")</div>
          </div>
          <div class="field">
            <label>Estado</label>
            <select class="select" id="g_estado">
              <option value="activo" ${data.estado !== 'inactivo' ? 'selected' : ''}>Activo</option>
              <option value="inactivo" ${data.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>
          <div class="field">
            <label>Aula</label>
            <input class="input" id="g_aula" value="${escapeHtml(data.aula || '')}" placeholder="Ej: 301" maxlength="10">
          </div>
          <div class="field">
            <label>Capacidad <span class="req">*</span></label>
            <input class="input" type="number" id="g_capacidad" value="${data.capacidad || 35}" min="1" max="60">
          </div>
          <div class="field">
            <label>Turno <span class="req">*</span></label>
            <select class="select" id="g_turno">
              ${TURNOS.map((t) => `<option value="${t}" ${data.turno === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Ciclo escolar</label>
            <input class="input" id="g_ciclo" value="${escapeHtml(data.ciclo || '2026-2027')}">
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Periodo</label>
            <input class="input" id="g_periodo" value="${escapeHtml(data.periodo || 'Agosto-Diciembre 2026')}">
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Tutor</label>
            <select class="select" id="g_tutor">
              <option value="">Sin asignar</option>
              ${profesores.map((p) => `<option value="${p.id}" ${data.tutorId === p.id ? 'selected' : ''}>${escapeHtml(p.nombre + ' ' + p.apellidos)} (${escapeHtml(p.area)})</option>`).join('')}
            </select>
            <div class="field-hint">El tutor es responsable del grupo durante el ciclo</div>
          </div>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="saveBtn">
          <i class="fas fa-floppy-disk"></i> ${esEdicion ? 'Actualizar' : 'Crear grupo'}
        </button>`
    });

    Validacion.bind(overlay, {
      g_nombre: [Validators.required, Validators.minLength(2)],
      g_capacidad: [Validators.required, Validators.number, Validators.min(1), Validators.max(60)]
    });

    overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
      const valido = Validacion.validar(overlay, {
        g_nombre: [Validators.required, Validators.minLength(2)],
        g_capacidad: [Validators.required, Validators.number, Validators.min(1), Validators.max(60)]
      });
      if (!valido) { UI.toast('Revisa los campos marcados en rojo', 'warning'); return; }

      const payload = {
        nombre: overlay.querySelector('#g_nombre').value.trim(),
        aula: overlay.querySelector('#g_aula').value.trim(),
        capacidad: Number(overlay.querySelector('#g_capacidad').value),
        turno: overlay.querySelector('#g_turno').value,
        ciclo: overlay.querySelector('#g_ciclo').value.trim(),
        periodo: overlay.querySelector('#g_periodo').value.trim(),
        tutorId: overlay.querySelector('#g_tutor').value ? Number(overlay.querySelector('#g_tutor').value) : null,
        estado: overlay.querySelector('#g_estado').value
      };

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      try {
        if (esEdicion) await GruposService.actualizar(id, payload);
        else await GruposService.crear(payload);
        UI.toast(esEdicion ? 'Grupo actualizado' : 'Grupo creado', 'success');
        close();
        onSave?.();
      } catch (err) {
        UI.toast(err.message, 'error');
        UI.buttonLoading(btn, false);
      }
    });
  }

  // ============================================================
  // CONFIRMAR ELIMINAR
  // ============================================================
  async function confirmarEliminar(id) {
    const g = await GruposService.obtener(id);
    const alumnos = await AlumnosService.porGrupo(id);
    const extra = alumnos.length
      ? ` Los ${alumnos.length} alumnos quedarán sin grupo asignado.`
      : '';
    const ok = await UI.confirm({
      title: 'Eliminar grupo',
      message: `¿Eliminar el grupo "${g.nombre}"?${extra} Se desvincularán también sus materias, horarios y calificaciones. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    try {
      const db = (await import('../services/data.service.js'))._db();

      // Desasignar alumnos
      (db.alumnos || []).forEach((a) => { if (a.grupoId === Number(id)) a.grupoId = null; });
      // Eliminar asignaciones de materia-grupo
      db.materiaGrupo = (db.materiaGrupo || []).filter((mg) => mg.grupoId !== Number(id));
      // Eliminar horarios
      db.horarios = (db.horarios || []).filter((h) => h.grupoId !== Number(id));
      // Eliminar inscripciones
      db.inscripciones = (db.inscripciones || []).filter((i) => i.grupoId !== Number(id));
      // Eliminar el grupo
      db.grupos = (db.grupos || []).filter((g) => g.id !== Number(id));

      localStorage.setItem('colegio_db_v5', JSON.stringify(db));
      UI.toast('Grupo eliminado', 'success');
      cargar();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  // ============================================================
  // EVENTOS DE FILTROS
  // ============================================================
  let timer;
  container.querySelector('#searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.search = e.target.value; cargar(); }, 280);
  });
  container.querySelector('#filtroGrado').addEventListener('change', (e) => { state.grado = e.target.value; cargar(); });
  container.querySelector('#filtroTurno').addEventListener('change', (e) => { state.turno = e.target.value; cargar(); });
  container.querySelector('#filtroEstado').addEventListener('change', (e) => { state.estado = e.target.value; cargar(); });

  const btnNuevo = container.querySelector('#btnNuevo');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', async () => {
      const profesores = await ProfesoresService.todos();
      abrirFormulario(null, profesores, cargar);
    });
  }

  await cargar();
}