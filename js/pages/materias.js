import { UI, escapeHtml } from '../core/ui.js';
import {
  MateriasService, ProfesoresService, GruposService,
  AlumnosService, CalificacionesService
} from '../services/data.service.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';
import { Auth } from '../core/auth.js';
import { Validators, Validacion } from '../components/form-validator.js';

const AREAS = [
  'Ciencias básicas',
  'Humanidades',
  'Idiomas',
  'Cultural',
  'Deportes',
  'Tecnología'
];

const TIPOS = ['Obligatoria', 'Optativa', 'Taller'];

export async function renderMaterias(container) {
  const puedeEditar = Auth.hasRole('admin');
  const state = { search: '', area: '', tipo: '', estado: '' };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-book"></i> Materias</h1>
        <p class="page-sub">Catálogo de asignaturas y distribución docente</p>
      </div>
      ${puedeEditar ? `
        <button class="btn btn-primary" id="btnNuevo">
          <i class="fas fa-plus"></i> Nueva materia
        </button>` : ''}
    </div>

    <div id="stats"></div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="input-icon" style="flex:1;min-width:220px">
          <i class="fas fa-search"></i>
          <input type="search" class="input" id="searchInput" placeholder="Buscar por nombre o clave…">
        </div>
        <select class="select" id="filtroArea" style="width:auto;min-width:160px">
          <option value="">Todas las áreas</option>
          ${AREAS.map((a) => `<option value="${a}">${escapeHtml(a)}</option>`).join('')}
        </select>
        <select class="select" id="filtroTipo" style="width:auto;min-width:140px">
          <option value="">Todos los tipos</option>
          ${TIPOS.map((t) => `<option value="${t}">${escapeHtml(t)}</option>`).join('')}
        </select>
        <select class="select" id="filtroEstado" style="width:auto;min-width:130px">
          <option value="">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="inactiva">Inactivas</option>
        </select>
      </div>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Materia</th>
              <th>Área</th>
              <th style="text-align:center">Créditos</th>
              <th style="text-align:center">Horas/sem</th>
              <th style="text-align:center">Grupos</th>
              <th style="text-align:center">Alumnos</th>
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

    const [materias, profesores, grupos, alumnos, calificaciones, db] = await Promise.all([
      MateriasService.todos(),
      ProfesoresService.todos(),
      GruposService.todos(),
      AlumnosService.todos(),
      CalificacionesService.todos(),
      Promise.resolve((await import('../services/data.service.js'))._db())
    ]);

    // Enriquecer cada materia
    const enriquecidas = materias.map((m) => {
      const asignaciones = (db.materiaGrupo || []).filter((mg) => mg.materiaId === m.id);
      const gruposMateria = asignaciones.map((a) => grupos.find((g) => g.id === a.grupoId)).filter(Boolean);
      const profesoresMateria = [...new Set(asignaciones.map((a) => a.profesorId))]
        .map((pid) => profesores.find((p) => p.id === pid))
        .filter(Boolean);
      const alumnosMateria = alumnos.filter((a) => gruposMateria.some((g) => g.id === a.grupoId));
      const notas = calificaciones.filter((c) => c.materiaId === m.id);
      const promedio = notas.length
        ? notas.reduce((sum, c) => sum + c.nota, 0) / notas.length
        : 0;

      return {
        ...m,
        _asignaciones: asignaciones,
        _grupos: gruposMateria,
        _profesores: profesoresMateria,
        _alumnos: alumnosMateria,
        _calificaciones: notas,
        _promedio: promedio
      };
    });

    // Stats
    const activas = enriquecidas.filter((m) => m.estado !== 'inactiva').length;
    const totalGrupos = new Set(enriquecidas.flatMap((m) => m._grupos.map((g) => g.id))).size;
    const totalAlumnos = new Set(enriquecidas.flatMap((m) => m._alumnos.map((a) => a.id))).size;
    const promedioGlobal = (() => {
      const notas = enriquecidas.flatMap((m) => m._calificaciones);
      return notas.length ? notas.reduce((a, c) => a + c.nota, 0) / notas.length : 0;
    })();

    statsWrap.innerHTML = `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-book"></i></div>
          <div><div class="stat-value">${enriquecidas.length}</div><div class="stat-label">Total materias</div></div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-circle-check"></i></div>
          <div><div class="stat-value">${activas}</div><div class="stat-label">Activas</div></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div><div class="stat-value">${totalGrupos}</div><div class="stat-label">Grupos cubiertos</div></div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
          <div><div class="stat-value">${totalAlumnos}</div><div class="stat-label">Alumnos cursando</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div><div class="stat-value">${promedioGlobal.toFixed(2)}</div><div class="stat-label">Promedio global</div></div>
        </div>
      </div>
    `;

    // Filtros
    const q = state.search.toLowerCase();
    const filtradas = enriquecidas.filter((m) => {
      if (q && !`${m.nombre} ${m.clave}`.toLowerCase().includes(q)) return false;
      if (state.area && m.area !== state.area) return false;
      if (state.tipo && m.tipo !== state.tipo) return false;
      if (state.estado && m.estado !== state.estado) return false;
      return true;
    });

    if (!filtradas.length) {
      tbody.innerHTML = `<tr><td colspan="10">
        ${emptyState({
          icon: 'fa-book',
          title: 'No hay materias',
          message: enriquecidas.length ? 'Prueba con otros filtros.' : 'Crea la primera materia para comenzar.',
          actionLabel: puedeEditar && !enriquecidas.length ? 'Nueva materia' : '',
          onAction: puedeEditar ? () => abrirFormulario(null, grupos, profesores, cargar) : null
        })}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtradas.map((m) => fila(m)).join('');
    engancharFilas(filtradas, grupos, profesores);
  }

  function fila(m) {
    const prom = m._promedio;
    const promClass = prom >= 8 ? 'success' : prom >= 6 ? 'warning' : 'danger';
    return `
      <tr data-id="${m.id}" style="cursor:pointer">
        <td><code style="font-size:.8em;color:var(--text-secondary)">${escapeHtml(m.clave || '—')}</code></td>
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <div style="width:32px;height:32px;border-radius:var(--r-md);background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:.85rem;flex-shrink:0">
              <i class="fas fa-book"></i>
            </div>
            <div>
              <strong>${escapeHtml(m.nombre)}</strong>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">${escapeHtml(m.tipo || 'Materia')}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-info">${escapeHtml(m.area || '—')}</span></td>
        <td style="text-align:center">${m.creditos || '—'}</td>
        <td style="text-align:center">${m.horas || '—'}</td>
        <td style="text-align:center"><strong>${m._grupos.length}</strong></td>
        <td style="text-align:center"><strong>${m._alumnos.length}</strong></td>
        <td style="text-align:center">
          <span class="badge badge-${promClass}">${prom ? prom.toFixed(1) : '—'}</span>
        </td>
        <td>${statusBadge(m.estado === 'activa' ? 'Activo' : 'Inactivo')}</td>
        <td style="text-align:right">
          <div class="table-actions">
            <button class="btn-icon" data-ver="${m.id}" title="Ver detalle"><i class="fas fa-eye"></i></button>
            ${puedeEditar ? `
              <button class="btn-icon" data-editar="${m.id}" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon danger" data-eliminar="${m.id}" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
  }

  function engancharFilas(lista, grupos, profesores) {
    tbody.querySelectorAll('[data-ver]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = lista.find((x) => x.id === Number(btn.dataset.ver));
        verDetalle(m, grupos, profesores);
      });
    });
    tbody.querySelectorAll('[data-editar]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirFormulario(Number(btn.dataset.editar), grupos, profesores, cargar);
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
        const m = lista.find((x) => x.id === Number(tr.dataset.id));
        if (m) verDetalle(m, grupos, profesores);
      });
    });
  }

  // ============================================================
  // DETALLE DE LA MATERIA — Modal con tabs
  // ============================================================
  function verDetalle(m, grupos, profesores) {
    const { overlay } = UI.modal({
      title: 'Detalle de la materia',
      size: 'modal-lg',
      body: `
        <div style="display:flex;gap:var(--sp-4);align-items:center;padding-bottom:var(--sp-4);border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);flex-wrap:wrap">
          <div style="width:64px;height:64px;border-radius:var(--r-lg);background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.6rem;flex-shrink:0">
            <i class="fas fa-book"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">
              ${escapeHtml(m.nombre)}
            </div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
              <code style="font-size:.9em">${escapeHtml(m.clave || '—')}</code>
              · ${escapeHtml(m.area || '')} · ${escapeHtml(m.tipo || '')}
            </div>
          </div>
          <div style="text-align:right">
            ${statusBadge(m.estado === 'activa' ? 'Activo' : 'Inactivo')}
            <div style="margin-top:6px;font-size:var(--fs-xs);color:var(--text-muted)">Promedio</div>
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-500)">
              ${m._promedio ? m._promedio.toFixed(2) : '—'}
            </div>
          </div>
        </div>

        <div style="display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);overflow-x:auto">
          ${[
            { id: 'info',        label: 'Información',  icon: 'fa-circle-info' },
            { id: 'profesores',  label: 'Profesores',   icon: 'fa-chalkboard-teacher' },
            { id: 'grupos',      label: 'Grupos',       icon: 'fa-users' },
            { id: 'alumnos',     label: 'Alumnos',      icon: 'fa-user-graduate' },
            { id: 'califs',      label: 'Calificaciones', icon: 'fa-chart-bar' }
          ].map((t, i) => `
            <button class="mat-tab" data-tab="${t.id}" style="padding:10px 16px;font-size:var(--fs-sm);font-weight:600;color:${i === 0 ? 'var(--c-brand-500)' : 'var(--text-secondary)'};border-bottom:2px solid ${i === 0 ? 'var(--c-brand-500)' : 'transparent'};background:none;cursor:pointer;white-space:nowrap;transition:all .15s">
              <i class="fas ${t.icon}"></i> ${t.label}
            </button>`).join('')}
        </div>

        <div id="tabContent"></div>
      `
    });

    const content = overlay.querySelector('#tabContent');
    const tabs = overlay.querySelectorAll('.mat-tab');

    const activar = (tab) => {
      tabs.forEach((t) => {
        const activo = t.dataset.tab === tab;
        t.style.color = activo ? 'var(--c-brand-500)' : 'var(--text-secondary)';
        t.style.borderBottomColor = activo ? 'var(--c-brand-500)' : 'transparent';
      });
      if (tab === 'info') content.innerHTML = tabInfo(m);
      if (tab === 'profesores') content.innerHTML = tabProfesores(m);
      if (tab === 'grupos') content.innerHTML = tabGrupos(m);
      if (tab === 'alumnos') content.innerHTML = tabAlumnos(m);
      if (tab === 'califs') content.innerHTML = tabCalificaciones(m);
    };

    tabs.forEach((t) => t.addEventListener('click', () => activar(t.dataset.tab)));
    activar('info');
  }

  function tabInfo(m) {
    const bloques = [
      ['Clave', m.clave || '—', 'fa-hashtag'],
      ['Nombre', m.nombre, 'fa-book'],
      ['Área', m.area || '—', 'fa-layer-group'],
      ['Tipo', m.tipo || '—', 'fa-tag'],
      ['Créditos', m.creditos || '—', 'fa-award'],
      ['Horas por semana', m.horas || '—', 'fa-clock'],
      ['Semestre', m.semestre || '—', 'fa-calendar'],
      ['Grupos asignados', m._grupos.length, 'fa-users'],
      ['Profesores que la imparten', m._profesores.length, 'fa-chalkboard-teacher'],
      ['Alumnos cursando', m._alumnos.length, 'fa-user-graduate'],
      ['Promedio general', m._promedio ? m._promedio.toFixed(2) : '—', 'fa-chart-line'],
      ['Estado', m.estado === 'activa' ? 'Activa' : 'Inactiva', 'fa-circle-info']
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

  function tabProfesores(m) {
    if (!m._profesores.length) {
      return emptyState({
        icon: 'fa-chalkboard-teacher',
        title: 'Sin profesores asignados',
        message: 'Esta materia aún no tiene docentes asignados.'
      });
    }
    return `
      <div class="table-scroll">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead>
            <tr>
              <th>No. Empleado</th>
              <th>Profesor</th>
              <th>Área</th>
              <th style="text-align:center">Grupos que imparte</th>
              <th style="text-align:center">Alumnos</th>
            </tr>
          </thead>
          <tbody>
            ${m._profesores.map((p) => {
              const susGrupos = m._asignaciones.filter((a) => a.profesorId === p.id).map((a) => a.grupoId);
              const gruposData = m._grupos.filter((g) => susGrupos.includes(g.id));
              const alumnosDelProfe = m._alumnos.filter((a) => susGrupos.includes(a.grupoId));
              return `
                <tr>
                  <td><code style="font-size:.8em">${escapeHtml(p.numEmpleado || '—')}</code></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:var(--sp-2)">
                      <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.65rem;flex-shrink:0">
                        ${(p.nombre[0] + p.apellidos[0]).toUpperCase()}
                      </div>
                      <strong>${escapeHtml(p.nombre + ' ' + p.apellidos)}</strong>
                    </div>
                  </td>
                  <td><span class="badge badge-info">${escapeHtml(p.area)}</span></td>
                  <td style="text-align:center">
                    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">
                      ${gruposData.map((g) => `<span class="badge badge-neutral" style="text-transform:none;font-weight:600">${escapeHtml(g.nombre)}</span>`).join('')}
                    </div>
                  </td>
                  <td style="text-align:center"><strong>${alumnosDelProfe.length}</strong></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function tabGrupos(m) {
    if (!m._grupos.length) {
      return emptyState({
        icon: 'fa-users',
        title: 'Sin grupos asignados',
        message: 'Esta materia no está asignada a ningún grupo.'
      });
    }
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--sp-3)">
        ${m._grupos.map((g) => {
          const asignacion = m._asignaciones.find((a) => a.grupoId === g.id);
          const prof = m._profesores.find((p) => p.id === asignacion?.profesorId);
          const alumnosGrupo = m._alumnos.filter((a) => a.grupoId === g.id);
          return `
            <div class="grupo-card" style="cursor:default">
              <div class="grupo-icon"><i class="fas fa-users"></i></div>
              <div class="grupo-info">
                <div class="grupo-name">${escapeHtml(g.nombre)}</div>
                <div class="grupo-meta">Aula ${escapeHtml(g.aula || '—')} · ${alumnosGrupo.length} alumnos</div>
                ${prof ? `<div style="font-size:.68rem;color:var(--text-muted);margin-top:4px">
                  <i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(prof.nombre + ' ' + prof.apellidos)}
                </div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  function tabAlumnos(m) {
    if (!m._alumnos.length) {
      return emptyState({
        icon: 'fa-user-graduate',
        title: 'Sin alumnos',
        message: 'Esta materia no tiene alumnos registrados.'
      });
    }
    // Agrupar por grupo
    const porGrupo = {};
    m._alumnos.forEach((a) => {
      const g = m._grupos.find((x) => x.id === a.grupoId);
      if (!g) return;
      if (!porGrupo[g.id]) porGrupo[g.id] = { grupo: g, alumnos: [] };
      porGrupo[g.id].alumnos.push(a);
    });

    return `
      <div style="margin-bottom:var(--sp-3);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:var(--fs-sm);color:var(--text-secondary)">
            <i class="fas fa-user-graduate" style="color:var(--c-brand-500)"></i>
            Total de alumnos en esta materia
          </span>
          <span class="badge badge-info">${m._alumnos.length} alumnos</span>
        </div>
      </div>
      ${Object.values(porGrupo).map(({ grupo, alumnos }) => `
        <div style="margin-bottom:var(--sp-4)">
          <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);margin-bottom:var(--sp-2)">
            <i class="fas fa-users" style="color:var(--c-brand-500)"></i>
            <strong>${escapeHtml(grupo.nombre)}</strong>
            <span class="badge badge-neutral">${alumnos.length} alumnos</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--sp-2)">
            ${alumnos.map((a) => `
              <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md)">
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.65rem;flex-shrink:0">
                  ${(a.nombre[0] + a.apellidos[0]).toUpperCase()}
                </div>
                <div style="min-width:0;flex:1">
                  <div style="font-size:var(--fs-sm);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${escapeHtml(a.nombre + ' ' + a.apellidos)}
                  </div>
                  <div style="font-size:.65rem;color:var(--text-muted)">${escapeHtml(a.matricula)}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    `;
  }

  function tabCalificaciones(m) {
    if (!m._calificaciones.length) {
      return emptyState({
        icon: 'fa-chart-bar',
        title: 'Sin calificaciones',
        message: 'Aún no hay calificaciones registradas para esta materia.'
      });
    }

    // Distribución de notas
    const aprobados = m._calificaciones.filter((c) => c.nota >= 6).length;
    const reprobados = m._calificaciones.filter((c) => c.nota < 6).length;
    const pct = m._calificaciones.length ? Math.round((aprobados / m._calificaciones.length) * 100) : 0;

    // Notas más altas y más bajas
    const ordenadas = [...m._calificaciones].sort((a, b) => b.nota - a.nota);
    const maxNota = ordenadas[0]?.nota || 0;
    const minNota = ordenadas[ordenadas.length - 1]?.nota || 0;

    return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div><div class="stat-value">${m._promedio.toFixed(2)}</div><div class="stat-label">Promedio</div></div>
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
      <div class="card" style="padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-3)">
        <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)">
          <span style="color:var(--text-secondary)"><i class="fas fa-arrow-up" style="color:var(--c-success)"></i> Nota más alta: <strong style="color:var(--c-success-fg)">${maxNota}</strong></span>
          <span style="color:var(--text-secondary)"><i class="fas fa-arrow-down" style="color:var(--c-danger)"></i> Nota más baja: <strong style="color:var(--c-danger-fg)">${minNota}</strong></span>
          <span style="color:var(--text-secondary)"><i class="fas fa-list"></i> ${m._calificaciones.length} registros</span>
        </div>
      </div>
      <div class="table-scroll" style="max-height:300px;overflow-y:auto">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead><tr><th>Alumno</th><th>Grupo</th><th style="text-align:center">Parcial</th><th style="text-align:center">Nota</th><th>Estado</th></tr></thead>
          <tbody>
            ${m._calificaciones.slice(0, 50).map((c) => {
              const al = m._alumnos.find((a) => a.id === c.alumnoId);
              const grupo = al ? m._grupos.find((g) => g.id === al.grupoId) : null;
              return `
                <tr>
                  <td>${al ? escapeHtml(al.nombre + ' ' + al.apellidos) : '—'}</td>
                  <td>${grupo ? escapeHtml(grupo.nombre) : '—'}</td>
                  <td style="text-align:center">P${c.periodo}</td>
                  <td style="text-align:center"><strong>${c.nota}</strong></td>
                  <td>${statusBadge(c.nota >= 6 ? 'Aprobado' : 'Reprobado')}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${m._calificaciones.length > 50 ? `<div style="padding:var(--sp-2);text-align:center;color:var(--text-muted);font-size:var(--fs-xs)">Mostrando 50 de ${m._calificaciones.length} registros</div>` : ''}
    `;
  }

  // ============================================================
  // FORMULARIO CREAR / EDITAR
  // ============================================================
  async function abrirFormulario(id, grupos, profesores, onSave) {
    let materia = null;
    let gruposAsignados = [];
    let profeAsignado = null;

    if (id) {
      try {
        materia = await MateriasService.obtener(id);
        const db = (await import('../services/data.service.js'))._db();
        const asignaciones = (db.materiaGrupo || []).filter((mg) => mg.materiaId === id);
        gruposAsignados = asignaciones.map((a) => a.grupoId);
        // Tomar el profesor más común de las asignaciones
        const conteoProfs = {};
        asignaciones.forEach((a) => {
          if (a.profesorId) conteoProfs[a.profesorId] = (conteoProfs[a.profesorId] || 0) + 1;
        });
        const profTop = Object.entries(conteoProfs).sort((a, b) => b[1] - a[1])[0];
        profeAsignado = profTop ? Number(profTop[0]) : null;
      } catch (e) { UI.toast(e.message, 'error'); return; }
    }

    const esEdicion = !!materia;
    const data = materia || {
      clave: '', nombre: '', area: AREAS[0], tipo: 'Obligatoria',
      creditos: 4, horas: 4, semestre: 1, estado: 'activa'
    };

    const { overlay, close } = UI.modal({
      title: esEdicion ? 'Editar materia' : 'Nueva materia',
      size: 'modal-lg',
      body: `
        <div class="form-grid-2">
          <div class="field">
            <label>Clave <span class="req">*</span></label>
            <input class="input" id="m_clave" value="${escapeHtml(data.clave || '')}" placeholder="Ej: MAT-101" maxlength="10" style="text-transform:uppercase">
          </div>
          <div class="field">
            <label>Estado</label>
            <select class="select" id="m_estado">
              <option value="activa" ${data.estado !== 'inactiva' ? 'selected' : ''}>Activa</option>
              <option value="inactiva" ${data.estado === 'inactiva' ? 'selected' : ''}>Inactiva</option>
            </select>
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Nombre <span class="req">*</span></label>
            <input class="input" id="m_nombre" value="${escapeHtml(data.nombre)}" maxlength="60">
          </div>
          <div class="field">
            <label>Área <span class="req">*</span></label>
            <select class="select" id="m_area">
              ${AREAS.map((a) => `<option value="${a}" ${data.area === a ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Tipo <span class="req">*</span></label>
            <select class="select" id="m_tipo">
              ${TIPOS.map((t) => `<option value="${t}" ${data.tipo === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Créditos <span class="req">*</span></label>
            <input class="input" type="number" id="m_creditos" value="${data.creditos}" min="1" max="10">
          </div>
          <div class="field">
            <label>Horas por semana <span class="req">*</span></label>
            <input class="input" type="number" id="m_horas" value="${data.horas}" min="1" max="10">
          </div>
          <div class="field">
            <label>Semestre</label>
            <input class="input" type="number" id="m_semestre" value="${data.semestre || 1}" min="1" max="6">
          </div>
          <div class="field">
            <label>Profesor titular</label>
            <select class="select" id="m_profesor">
              <option value="">Sin asignar</option>
              ${profesores.map((p) => `<option value="${p.id}" ${profeAsignado === p.id ? 'selected' : ''}>${escapeHtml(p.nombre + ' ' + p.apellidos)} (${escapeHtml(p.area)})</option>`).join('')}
            </select>
            <div class="field-hint">Se asignará a los grupos marcados abajo</div>
          </div>
        </div>

        <div style="margin-top:var(--sp-5);padding-top:var(--sp-5);border-top:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
            <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin:0">
              <i class="fas fa-users" style="color:var(--c-brand-500)"></i> Grupos que cursan esta materia
            </h4>
            <div style="display:flex;gap:var(--sp-2)">
              <button type="button" class="btn btn-sm btn-ghost" id="selTodos">Seleccionar todos</button>
              <button type="button" class="btn btn-sm btn-ghost" id="deselTodos">Quitar todos</button>
            </div>
          </div>
          <div id="gruposCheckboxes" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:var(--sp-2);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);max-height:260px;overflow-y:auto">
            ${grupos.map((g) => `
              <label style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-3);background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;transition:all .15s" class="grupo-check-label">
                <input type="checkbox" class="grupo-chk" value="${g.id}" ${gruposAsignados.includes(g.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--c-brand-500);cursor:pointer">
                <div>
                  <div style="font-weight:600;font-size:var(--fs-sm)">${escapeHtml(g.nombre)}</div>
                  <div style="font-size:.65rem;color:var(--text-muted)">Aula ${escapeHtml(g.aula || '—')}</div>
                </div>
              </label>`).join('')}
          </div>
          <div class="field-hint" style="margin-top:var(--sp-2)">
            <i class="fas fa-info-circle"></i>
            <span id="contadorGrupos">${gruposAsignados.length} grupos seleccionados</span>
          </div>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="saveBtn">
          <i class="fas fa-floppy-disk"></i> ${esEdicion ? 'Actualizar' : 'Crear materia'}
        </button>`
    });

    // Contador de grupos seleccionados
    const contador = overlay.querySelector('#contadorGrupos');
    const actualizarContador = () => {
      const n = overlay.querySelectorAll('.grupo-chk:checked').length;
      contador.textContent = `${n} grupo${n !== 1 ? 's' : ''} seleccionado${n !== 1 ? 's' : ''}`;
    };
    overlay.querySelectorAll('.grupo-chk').forEach((chk) => {
      chk.addEventListener('change', () => {
        const label = chk.closest('.grupo-check-label');
        if (chk.checked) {
          label.style.borderColor = 'var(--c-brand-500)';
          label.style.background = 'rgba(37,99,235,.05)';
        } else {
          label.style.borderColor = 'var(--border)';
          label.style.background = 'var(--bg-surface)';
        }
        actualizarContador();
      });
      // Aplicar estado inicial
      if (chk.checked) {
        const label = chk.closest('.grupo-check-label');
        label.style.borderColor = 'var(--c-brand-500)';
        label.style.background = 'rgba(37,99,235,.05)';
      }
    });

    overlay.querySelector('#selTodos').addEventListener('click', () => {
      overlay.querySelectorAll('.grupo-chk').forEach((chk) => {
        chk.checked = true;
        chk.dispatchEvent(new Event('change'));
      });
    });
    overlay.querySelector('#deselTodos').addEventListener('click', () => {
      overlay.querySelectorAll('.grupo-chk').forEach((chk) => {
        chk.checked = false;
        chk.dispatchEvent(new Event('change'));
      });
    });

    Validacion.bind(overlay, {
      m_clave: [Validators.required, Validators.minLength(3)],
      m_nombre: [Validators.required, Validators.minLength(3)],
      m_creditos: [Validators.required, Validators.number, Validators.min(1), Validators.max(10)],
      m_horas: [Validators.required, Validators.number, Validators.min(1), Validators.max(10)]
    });

    overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
      const valido = Validacion.validar(overlay, {
        m_clave: [Validators.required, Validators.minLength(3)],
        m_nombre: [Validators.required, Validators.minLength(3)],
        m_creditos: [Validators.required, Validators.number, Validators.min(1), Validators.max(10)],
        m_horas: [Validators.required, Validators.number, Validators.min(1), Validators.max(10)]
      });
      if (!valido) { UI.toast('Revisa los campos marcados en rojo', 'warning'); return; }

      const gruposSel = Array.from(overlay.querySelectorAll('.grupo-chk:checked')).map((c) => Number(c.value));
      if (!gruposSel.length) { UI.toast('Selecciona al menos un grupo', 'warning'); return; }

      const payload = {
        clave: overlay.querySelector('#m_clave').value.trim().toUpperCase(),
        nombre: overlay.querySelector('#m_nombre').value.trim(),
        area: overlay.querySelector('#m_area').value,
        tipo: overlay.querySelector('#m_tipo').value,
        creditos: Number(overlay.querySelector('#m_creditos').value),
        horas: Number(overlay.querySelector('#m_horas').value),
        semestre: Number(overlay.querySelector('#m_semestre').value),
        estado: overlay.querySelector('#m_estado').value
      };
      const profesorId = overlay.querySelector('#m_profesor').value
        ? Number(overlay.querySelector('#m_profesor').value)
        : null;

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      try {
        const db = (await import('../services/data.service.js'))._db();
        if (esEdicion) {
          // Actualizar materia
          const idx = db.materias.findIndex((m) => m.id === Number(id));
          if (idx >= 0) {
            db.materias[idx] = { ...db.materias[idx], ...payload };
          }
          // Actualizar asignaciones de grupo
          db.materiaGrupo = (db.materiaGrupo || []).filter((mg) => mg.materiaId !== Number(id));
          gruposSel.forEach((gid) => {
            db.materiaGrupo.push({ materiaId: Number(id), grupoId: gid, profesorId });
          });
          // Guardar
          localStorage.setItem('colegio_db_v5', JSON.stringify(db));
        } else {
          // Crear materia
          const newId = (db.nextId.materia || 1);
          db.nextId.materia = newId + 1;
          db.materias.push({ id: newId, ...payload });
          gruposSel.forEach((gid) => {
            db.materiaGrupo.push({ materiaId: newId, grupoId: gid, profesorId });
          });
          localStorage.setItem('colegio_db_v5', JSON.stringify(db));
        }
        UI.toast(esEdicion ? 'Materia actualizada' : 'Materia creada', 'success');
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
    const m = await MateriasService.obtener(id);
    const ok = await UI.confirm({
      title: 'Eliminar materia',
      message: `¿Eliminar "${m.nombre}"? Se borrarán todas sus calificaciones, asignaciones de grupos y horarios relacionados. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    try {
      const db = (await import('../services/data.service.js'))._db();
      db.materiaGrupo = (db.materiaGrupo || []).filter((mg) => mg.materiaId !== Number(id));
      db.calificaciones = (db.calificaciones || []).filter((c) => c.materiaId !== Number(id));
      db.asistencias = (db.asistencias || []).filter((a) => a.materiaId !== Number(id));
      db.horarios = (db.horarios || []).filter((h) => h.materiaId !== Number(id));
      db.materias = (db.materias || []).filter((m) => m.id !== Number(id));
      localStorage.setItem('colegio_db_v5', JSON.stringify(db));
      UI.toast('Materia eliminada', 'success');
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
  container.querySelector('#filtroArea').addEventListener('change', (e) => { state.area = e.target.value; cargar(); });
  container.querySelector('#filtroTipo').addEventListener('change', (e) => { state.tipo = e.target.value; cargar(); });
  container.querySelector('#filtroEstado').addEventListener('change', (e) => { state.estado = e.target.value; cargar(); });

  const btnNuevo = container.querySelector('#btnNuevo');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', async () => {
      const [grupos, profesores] = await Promise.all([
        GruposService.todos(),
        ProfesoresService.todos()
      ]);
      abrirFormulario(null, grupos, profesores, cargar);
    });
  }

  await cargar();
}