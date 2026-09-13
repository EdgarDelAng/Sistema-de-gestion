import { UI, escapeHtml } from '../core/ui.js';
import {
  InscripcionesService, AlumnosService, GruposService,
  ProfesoresService, KardexService
} from '../services/data.service.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';
import { Auth } from '../core/auth.js';
import { Validators, Validacion } from '../components/form-validator.js';
import { PeriodSelector } from '../components/period-selector.js';

const ESTADOS = ['Preinscrito', 'Inscrito', 'Baja', 'Finalizado'];

export async function renderInscripciones(container) {
  const puedeEditar = Auth.hasRole('admin');
  const state = { search: '', grupoId: '', estado: '', ciclo: '' };
  const sel = PeriodSelector.current;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-clipboard-list"></i> Inscripciones</h1>
        <p class="page-sub">Control de inscripciones · ${escapeHtml(sel.ciclo)} · ${escapeHtml(sel.periodo)}</p>
      </div>
      ${puedeEditar ? `
        <button class="btn btn-primary" id="btnNuevo">
          <i class="fas fa-plus"></i> Nueva inscripción
        </button>` : ''}
    </div>

    <div id="stats"></div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="input-icon" style="flex:1;min-width:220px">
          <i class="fas fa-search"></i>
          <input type="search" class="input" id="searchInput" placeholder="Buscar por folio, alumno o matrícula…">
        </div>
        <select class="select" id="filtroGrupo" style="width:auto;min-width:150px">
          <option value="">Todos los grupos</option>
        </select>
        <select class="select" id="filtroEstado" style="width:auto;min-width:150px">
          <option value="">Todos los estados</option>
          ${ESTADOS.map((e) => `<option value="${e}">${escapeHtml(e)}</option>`).join('')}
        </select>
      </div>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Alumno</th>
              <th>Matrícula</th>
              <th>Grupo</th>
              <th>Fecha inscripción</th>
              <th>Ciclo / Periodo</th>
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
    tbody.innerHTML = `<tr><td colspan="8"><div class="skeleton-block" style="height:200px;margin:var(--sp-3)"></div></td></tr>`;
    statsWrap.innerHTML = `<div class="skeleton-block" style="height:100px;margin-bottom:var(--sp-4)"></div>`;

    const [inscripciones, alumnos, grupos] = await Promise.all([
      InscripcionesService.todos(),
      AlumnosService.todos(),
      GruposService.todos()
    ]);

    // Poblar filtro de grupos
    const filtroGrupo = container.querySelector('#filtroGrupo');
    if (filtroGrupo.options.length <= 1) {
      grupos.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.nombre;
        filtroGrupo.appendChild(opt);
      });
    }

    // Enriquecer cada inscripción
    const enriquecidas = inscripciones.map((i) => {
      const alumno = alumnos.find((a) => a.id === i.alumnoId);
      const grupo = grupos.find((g) => g.id === i.grupoId);
      return { ...i, _alumno: alumno, _grupo: grupo };
    });

    // Stats
    const total = enriquecidas.length;
    const inscritos = enriquecidas.filter((i) => i.estado === 'Inscrito').length;
    const preinscritos = enriquecidas.filter((i) => i.estado === 'Preinscrito').length;
    const bajas = enriquecidas.filter((i) => i.estado === 'Baja').length;
    const finalizados = enriquecidas.filter((i) => i.estado === 'Finalizado').length;
    const pctInscritos = total ? Math.round((inscritos / total) * 100) : 0;

    statsWrap.innerHTML = `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
          <div><div class="stat-value">${total}</div><div class="stat-label">Total inscripciones</div></div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-user-check"></i></div>
          <div><div class="stat-value">${inscritos}</div><div class="stat-label">Inscritos</div></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-user-clock"></i></div>
          <div><div class="stat-value">${preinscritos}</div><div class="stat-label">Preinscritos</div></div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon"><i class="fas fa-user-xmark"></i></div>
          <div><div class="stat-value">${bajas}</div><div class="stat-label">Bajas</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-percent"></i></div>
          <div><div class="stat-value">${pctInscritos}%</div><div class="stat-label">Conversión</div></div>
        </div>
      </div>
      ${finalizados > 0 ? `
        <div class="card" style="margin-bottom:var(--sp-4);padding:var(--sp-3) var(--sp-4)">
          <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-sm);color:var(--text-secondary)">
            <i class="fas fa-flag-checkered" style="color:var(--c-info)"></i>
            <span><strong style="color:var(--c-brand-900)">${finalizados}</strong> inscripciones finalizadas en el ciclo actual</span>
          </div>
        </div>` : ''}
    `;

    // Filtros
    const q = state.search.toLowerCase();
    const filtradas = enriquecidas.filter((i) => {
      if (q) {
        const alumnoStr = i._alumno ? `${i._alumno.nombre} ${i._alumno.apellidos} ${i._alumno.matricula}` : '';
        if (!`${i.folio} ${alumnoStr}`.toLowerCase().includes(q)) return false;
      }
      if (state.grupoId && i.grupoId !== Number(state.grupoId)) return false;
      if (state.estado && i.estado !== state.estado) return false;
      if (state.ciclo && i.ciclo !== state.ciclo) return false;
      return true;
    });

    if (!filtradas.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        ${emptyState({
          icon: 'fa-clipboard-list',
          title: 'No hay inscripciones',
          message: enriquecidas.length ? 'Prueba con otros filtros.' : 'Crea la primera inscripción para comenzar.',
          actionLabel: puedeEditar && !enriquecidas.length ? 'Nueva inscripción' : '',
          onAction: puedeEditar ? () => abrirFormulario(null, alumnos, grupos, cargar) : null
        })}
      </td></tr>`;
      return;
    }

    // Ordenar por fecha descendente
    filtradas.sort((a, b) => (b.fechaInscripcion || '').localeCompare(a.fechaInscripcion || ''));

    tbody.innerHTML = filtradas.map((i) => fila(i)).join('');
    engancharFilas(filtradas, alumnos, grupos);
  }

  function fila(i) {
    const alumno = i._alumno;
    const grupo = i._grupo;
    const iniciales = alumno ? (alumno.nombre[0] + alumno.apellidos[0]).toUpperCase() : '?';
    return `
      <tr data-id="${i.id}" style="cursor:pointer">
        <td><code style="font-size:.8em;color:var(--text-secondary)">${escapeHtml(i.folio || '—')}</code></td>
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.68rem;flex-shrink:0">
              ${iniciales}
            </div>
            <div>
              <strong>${alumno ? escapeHtml(alumno.nombre + ' ' + alumno.apellidos) : 'Sin alumno'}</strong>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">${escapeHtml(alumno?.email || '')}</div>
            </div>
          </div>
        </td>
        <td><code style="font-size:.8em">${escapeHtml(alumno?.matricula || '—')}</code></td>
        <td>
          ${grupo ? `<span class="badge badge-info">${escapeHtml(grupo.nombre)}</span>` : '<span style="color:var(--text-muted)">—</span>'}
        </td>
        <td>${escapeHtml(i.fechaInscripcion || '—')}</td>
        <td>
          <div style="font-size:var(--fs-sm)">${escapeHtml(i.ciclo || '—')}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">${escapeHtml(i.periodo || '')}</div>
        </td>
        <td>${statusBadge(i.estado)}</td>
        <td style="text-align:right">
          <div class="table-actions">
            <button class="btn-icon" data-ver="${i.id}" title="Ver detalle"><i class="fas fa-eye"></i></button>
            ${puedeEditar ? `
              <button class="btn-icon" data-editar="${i.id}" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon danger" data-eliminar="${i.id}" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
  }

  function engancharFilas(lista, alumnos, grupos) {
    tbody.querySelectorAll('[data-ver]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = lista.find((x) => x.id === Number(btn.dataset.ver));
        verDetalle(i, alumnos, grupos);
      });
    });
    tbody.querySelectorAll('[data-editar]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirFormulario(Number(btn.dataset.editar), alumnos, grupos, cargar);
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
        const i = lista.find((x) => x.id === Number(tr.dataset.id));
        if (i) verDetalle(i, alumnos, grupos);
      });
    });
  }

  // ============================================================
  // DETALLE DE LA INSCRIPCIÓN — Modal con tabs
  // ============================================================
  function verDetalle(i, alumnos, grupos) {
    const alumno = i._alumno;
    const grupo = i._grupo;
    const iniciales = alumno ? (alumno.nombre[0] + alumno.apellidos[0]).toUpperCase() : '?';

    const { overlay } = UI.modal({
      title: 'Detalle de la inscripción',
      size: 'modal-lg',
      body: `
        <div style="display:flex;gap:var(--sp-4);align-items:center;padding-bottom:var(--sp-4);border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);flex-wrap:wrap">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
            ${iniciales}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">
              ${alumno ? escapeHtml(alumno.nombre + ' ' + alumno.apellidos) : 'Sin alumno'}
            </div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
              <code style="font-size:.9em">${escapeHtml(i.folio || '—')}</code>
              ${grupo ? ` · ${escapeHtml(grupo.nombre)}` : ''}
            </div>
          </div>
          <div style="text-align:right">
            ${statusBadge(i.estado)}
          </div>
        </div>

        <div style="display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);overflow-x:auto">
          ${[
            { id: 'info',     label: 'Información',  icon: 'fa-circle-info' },
            { id: 'alumno',   label: 'Alumno',       icon: 'fa-user' },
            { id: 'grupo',    label: 'Grupo',        icon: 'fa-users' },
            { id: 'acad',     label: 'Académico',    icon: 'fa-graduation-cap' }
          ].map((t, idx) => `
            <button class="ins-tab" data-tab="${t.id}" style="padding:10px 16px;font-size:var(--fs-sm);font-weight:600;color:${idx === 0 ? 'var(--c-brand-500)' : 'var(--text-secondary)'};border-bottom:2px solid ${idx === 0 ? 'var(--c-brand-500)' : 'transparent'};background:none;cursor:pointer;white-space:nowrap;transition:all .15s">
              <i class="fas ${t.icon}"></i> ${t.label}
            </button>`).join('')}
        </div>

        <div id="tabContent"></div>
      `
    });

    const content = overlay.querySelector('#tabContent');
    const tabs = overlay.querySelectorAll('.ins-tab');

    const activar = async (tab) => {
      tabs.forEach((t) => {
        const activo = t.dataset.tab === tab;
        t.style.color = activo ? 'var(--c-brand-500)' : 'var(--text-secondary)';
        t.style.borderBottomColor = activo ? 'var(--c-brand-500)' : 'transparent';
      });
      if (tab === 'info') content.innerHTML = tabInfo(i);
      if (tab === 'alumno') content.innerHTML = tabAlumno(alumno, grupo);
      if (tab === 'grupo') content.innerHTML = tabGrupo(grupo);
      if (tab === 'acad') {
        content.innerHTML = `<div class="skeleton-block" style="height:200px"></div>`;
        if (alumno) {
          try {
            const k = await KardexService.porAlumno(alumno.id);
            content.innerHTML = tabAcademico(k);
          } catch { content.innerHTML = emptyState({ icon: 'fa-chart-bar', title: 'Sin datos académicos' }); }
        } else {
          content.innerHTML = emptyState({ icon: 'fa-user-slash', title: 'Sin alumno asignado' });
        }
      }
    };

    tabs.forEach((t) => t.addEventListener('click', () => activar(t.dataset.tab)));
    activar('info');
  }

  function tabInfo(i) {
    const bloques = [
      ['Folio', i.folio || '—', 'fa-hashtag'],
      ['Fecha de inscripción', i.fechaInscripcion || '—', 'fa-calendar'],
      ['Ciclo escolar', i.ciclo || '—', 'fa-calendar-check'],
      ['Periodo', i.periodo || '—', 'fa-calendar-day'],
      ['Estado', i.estado, 'fa-circle-info'],
      ['Grupo asignado', i._grupo?.nombre || '—', 'fa-users'],
      ['Alumno', i._alumno ? `${i._alumno.nombre} ${i._alumno.apellidos}` : '—', 'fa-user'],
      ['Matrícula', i._alumno?.matricula || '—', 'fa-id-card']
    ];
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--sp-3)">
        ${bloques.map(([lbl, val, ico]) => `
          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:4px">
              <i class="fas ${ico}"></i> ${lbl}
            </div>
            <div style="font-weight:600;margin-top:4px">${escapeHtml(String(val))}</div>
          </div>`).join('')}
      </div>`;
  }

  function tabAlumno(a, grupo) {
    if (!a) return emptyState({ icon: 'fa-user-slash', title: 'Sin alumno asignado' });
    const initials = (a.nombre[0] + a.apellidos[0]).toUpperCase();
    const edad = a.fechaNac ? (() => {
      const hoy = new Date();
      const nac = new Date(a.fechaNac);
      let e = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
      return e;
    })() : null;

    const bloques = [
      ['Matrícula', a.matricula, 'fa-id-card'],
      ['Nombre completo', `${a.nombre} ${a.apellidos}`, 'fa-user'],
      ['Fecha de nacimiento', a.fechaNac || '—', 'fa-cake-candles'],
      ['Edad', edad ? `${edad} años` : '—', 'fa-hourglass-half'],
      ['Grado', a.grado || '—', 'fa-graduation-cap'],
      ['Grupo', grupo?.nombre || '—', 'fa-users'],
      ['Turno', a.turno || '—', 'fa-clock'],
      ['Estado', a.estado, 'fa-circle-info'],
      ['Correo', a.email || '—', 'fa-envelope'],
      ['Teléfono', a.telefono || '—', 'fa-phone'],
      ['Tutor', a.tutor || '—', 'fa-user-tie'],
      ['Dirección', a.direccion || '—', 'fa-location-dot']
    ];
    return `
      <div style="display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-4);background:var(--bg-muted);border-radius:var(--r-md);margin-bottom:var(--sp-4)">
        <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.2rem;font-weight:800;flex-shrink:0">
          ${initials}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;color:var(--c-brand-900);font-size:var(--fs-md)">${escapeHtml(a.nombre + ' ' + a.apellidos)}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">${escapeHtml(a.email || '')}</div>
        </div>
      </div>
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

  function tabGrupo(g) {
    if (!g) return emptyState({ icon: 'fa-users-slash', title: 'Sin grupo asignado' });
    const bloques = [
      ['Grupo', g.nombre, 'fa-users'],
      ['Grado', g.nombre.split(' ')[0] || '—', 'fa-graduation-cap'],
      ['Aula', g.aula || '—', 'fa-door-open'],
      ['Turno', g.turno || '—', 'fa-clock'],
      ['Capacidad', g.capacidad || '—', 'fa-user-plus'],
      ['Ciclo escolar', g.ciclo || '—', 'fa-calendar'],
      ['Periodo', g.periodo || '—', 'fa-calendar-check'],
      ['Estado', g.estado, 'fa-circle-info']
    ];
    return `
      <div style="display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-4);background:var(--bg-muted);border-radius:var(--r-md);margin-bottom:var(--sp-4)">
        <div style="width:56px;height:56px;border-radius:var(--r-lg);background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.3rem;font-weight:800;flex-shrink:0">
          ${escapeHtml(g.nombre.split(' ')[0])}
        </div>
        <div style="flex:1">
          <div style="font-weight:800;color:var(--c-brand-900);font-size:var(--fs-md)">Grupo ${escapeHtml(g.nombre)}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">Aula ${escapeHtml(g.aula || '—')} · Turno ${escapeHtml(g.turno || '—')}</div>
        </div>
      </div>
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

  function tabAcademico(k) {
    if (!k || !k.filas.length) {
      return emptyState({ icon: 'fa-chart-bar', title: 'Sin registros académicos', message: 'Este alumno aún no tiene calificaciones.' });
    }
    return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div><div class="stat-value">${k.promedioGeneral.toFixed(2)}</div><div class="stat-label">Promedio</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-book"></i></div>
          <div><div class="stat-value">${k.materiasCursadas}</div><div class="stat-label">Materias</div></div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-circle-check"></i></div>
          <div><div class="stat-value">${k.materiasAprobadas}</div><div class="stat-label">Aprobadas</div></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-award"></i></div>
          <div><div class="stat-value">${k.creditosAprobados}/${k.creditosCursados}</div><div class="stat-label">Créditos</div></div>
        </div>
      </div>
      <div class="table-scroll" style="max-height:300px;overflow-y:auto">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead><tr><th>Materia</th><th style="text-align:center">P1</th><th style="text-align:center">P2</th><th style="text-align:center">P3</th><th style="text-align:center">Prom.</th><th>Estado</th></tr></thead>
          <tbody>
            ${k.filas.map((f) => `
              <tr>
                <td><strong>${escapeHtml(f.materia?.nombre || '—')}</strong></td>
                <td style="text-align:center">${f.notas[1] ?? '—'}</td>
                <td style="text-align:center">${f.notas[2] ?? '—'}</td>
                <td style="text-align:center">${f.notas[3] ?? '—'}</td>
                <td style="text-align:center"><strong>${f.promedio ? f.promedio.toFixed(1) : '—'}</strong></td>
                <td>${statusBadge(f.estado)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ============================================================
  // FORMULARIO CREAR / EDITAR
  // ============================================================
  async function abrirFormulario(id, alumnos, grupos, onSave) {
    let inscripcion = null;
    if (id) {
      try { inscripcion = await InscripcionesService.obtener(id); }
      catch (e) { UI.toast(e.message, 'error'); return; }
    }
    const esEdicion = !!inscripcion;
    const data = inscripcion || {
      alumnoId: '', grupoId: '', ciclo: sel.ciclo, periodo: sel.periodo,
      fechaInscripcion: new Date().toISOString().slice(0, 10),
      estado: 'Preinscrito', folio: ''
    };

    // Alumnos sin grupo (para inscripción) + el alumno actual si estamos editando
    const alumnosDisponibles = alumnos.filter((a) => !a.grupoId || a.id === data.alumnoId);

    const { overlay, close } = UI.modal({
      title: esEdicion ? 'Editar inscripción' : 'Nueva inscripción',
      size: 'modal-lg',
      body: `
        <div class="form-grid-2">
          <div class="field" style="grid-column:1/-1">
            <label>Alumno <span class="req">*</span></label>
            <select class="select" id="i_alumno">
              <option value="">Selecciona un alumno…</option>
              ${alumnosDisponibles.map((a) => `
                <option value="${a.id}" ${data.alumnoId === a.id ? 'selected' : ''}>
                  ${escapeHtml(a.matricula + ' · ' + a.nombre + ' ' + a.apellidos)}${a.grupoId ? ' (ya en grupo)' : ''}
                </option>`).join('')}
            </select>
            <div class="field-hint">Solo se muestran alumnos sin grupo asignado</div>
          </div>

          <div class="field">
            <label>Grupo <span class="req">*</span></label>
            <select class="select" id="i_grupo">
              <option value="">Selecciona un grupo…</option>
              ${grupos.map((g) => `
                <option value="${g.id}" ${data.grupoId === g.id ? 'selected' : ''}>
                  ${escapeHtml(g.nombre)} · Aula ${escapeHtml(g.aula || '—')} (${g.capacidad} lugares)
                </option>`).join('')}
            </select>
          </div>

          <div class="field">
            <label>Fecha de inscripción <span class="req">*</span></label>
            <input class="input" type="date" id="i_fecha" value="${data.fechaInscripcion || ''}">
          </div>

          <div class="field">
            <label>Ciclo escolar <span class="req">*</span></label>
            <input class="input" id="i_ciclo" value="${escapeHtml(data.ciclo || sel.ciclo)}">
          </div>

          <div class="field">
            <label>Periodo <span class="req">*</span></label>
            <input class="input" id="i_periodo" value="${escapeHtml(data.periodo || sel.periodo)}">
          </div>

          <div class="field">
            <label>Estado <span class="req">*</span></label>
            <select class="select" id="i_estado">
              ${ESTADOS.map((e) => `<option value="${e}" ${data.estado === e ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('')}
            </select>
          </div>

          <div class="field" style="grid-column:1/-1">
            <label>Folio</label>
            <input class="input" id="i_folio" value="${escapeHtml(data.folio || '')}" readonly style="background:var(--bg-muted);font-family:monospace">
            <div class="field-hint">${esEdicion ? 'Folio original' : 'Se generará automáticamente al guardar'}</div>
          </div>
        </div>

        <div id="resumenGrupo" style="margin-top:var(--sp-4);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);font-size:var(--fs-sm);display:none"></div>
      `,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="saveBtn">
          <i class="fas fa-floppy-disk"></i> ${esEdicion ? 'Actualizar' : 'Registrar inscripción'}
        </button>`
    });

    // Mostrar resumen del grupo al seleccionar
    const resumen = overlay.querySelector('#resumenGrupo');
    overlay.querySelector('#i_grupo').addEventListener('change', async (e) => {
      const gid = Number(e.target.value);
      if (!gid) { resumen.style.display = 'none'; return; }
      const grupo = grupos.find((g) => g.id === gid);
      const inscritos = alumnos.filter((a) => a.grupoId === gid).length;
      const disponibles = (grupo?.capacidad || 0) - inscritos;
      resumen.style.display = 'block';
      resumen.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span><i class="fas fa-users" style="color:var(--c-brand-500)"></i> <strong>${escapeHtml(grupo.nombre)}</strong> · Aula ${escapeHtml(grupo.aula || '—')}</span>
          <span class="badge badge-${disponibles > 5 ? 'success' : disponibles > 0 ? 'warning' : 'danger'}">
            ${inscritos}/${grupo.capacidad} lugares · ${disponibles} disponibles
          </span>
        </div>`;
    });

    // Disparar resumen si ya hay grupo seleccionado
    if (data.grupoId) {
      overlay.querySelector('#i_grupo').dispatchEvent(new Event('change'));
    }

    Validacion.bind(overlay, {
      i_alumno: [Validators.required],
      i_grupo: [Validators.required],
      i_fecha: [Validators.required]
    });

    overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
      const valido = Validacion.validar(overlay, {
        i_alumno: [Validators.required],
        i_grupo: [Validators.required],
        i_fecha: [Validators.required]
      });
      if (!valido) { UI.toast('Revisa los campos marcados en rojo', 'warning'); return; }

      const alumnoId = Number(overlay.querySelector('#i_alumno').value);
      const grupoId = Number(overlay.querySelector('#i_grupo').value);
      const grupo = grupos.find((g) => g.id === grupoId);
      const inscritos = alumnos.filter((a) => a.grupoId === grupoId).length;

      // Validar cupo
      if (grupo && inscritos >= grupo.capacidad && (!esEdicion || data.grupoId !== grupoId)) {
        UI.toast(`El grupo ${grupo.nombre} está lleno (${inscritos}/${grupo.capacidad})`, 'warning');
        return;
      }

      const payload = {
        alumnoId,
        grupoId,
        ciclo: overlay.querySelector('#i_ciclo').value.trim(),
        periodo: overlay.querySelector('#i_periodo').value.trim(),
        fechaInscripcion: overlay.querySelector('#i_fecha').value,
        estado: overlay.querySelector('#i_estado').value
      };

      // Generar folio si es nuevo
      if (!esEdicion) {
        const todos = await InscripcionesService.todos();
        const maxN = todos.reduce((max, i) => {
          const n = parseInt((i.folio || '').replace(/\D/g, '')) || 0;
          return Math.max(max, n);
        }, 0);
        payload.folio = 'INS-2026-' + String(maxN + 1).padStart(4, '0');
      } else {
        payload.folio = data.folio;
      }

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      try {
        // Actualizar el alumno con su grupo
        if (payload.estado === 'Inscrito' || payload.estado === 'Preinscrito') {
          await AlumnosService.actualizar(alumnoId, { grupoId });
        }

        if (esEdicion) await InscripcionesService.actualizar(id, payload);
        else await InscripcionesService.crear(payload);

        UI.toast(esEdicion ? 'Inscripción actualizada' : 'Inscripción registrada', 'success');
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
    const i = await InscripcionesService.obtener(id);
    const alumno = await AlumnosService.obtener(i.alumnoId).catch(() => null);
    const nombre = alumno ? `${alumno.nombre} ${alumno.apellidos}` : 'el alumno';
    const ok = await UI.confirm({
      title: 'Eliminar inscripción',
      message: `¿Eliminar la inscripción de ${nombre}? El alumno quedará sin grupo asignado. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    try {
      // Desasignar alumno del grupo
      await AlumnosService.actualizar(i.alumnoId, { grupoId: null });
      await InscripcionesService.eliminar(id);
      UI.toast('Inscripción eliminada', 'success');
      cargar();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  // ============================================================
  // EVENTOS
  // ============================================================
  let timer;
  container.querySelector('#searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.search = e.target.value; cargar(); }, 280);
  });
  container.querySelector('#filtroGrupo').addEventListener('change', (e) => { state.grupoId = e.target.value; cargar(); });
  container.querySelector('#filtroEstado').addEventListener('change', (e) => { state.estado = e.target.value; cargar(); });

  const btnNuevo = container.querySelector('#btnNuevo');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', async () => {
      const [alumnos, grupos] = await Promise.all([
        AlumnosService.todos(),
        GruposService.todos()
      ]);
      abrirFormulario(null, alumnos, grupos, cargar);
    });
  }

  await cargar();
}