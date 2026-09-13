import { UI, escapeHtml } from '../core/ui.js';
import {
  ProfesoresService, MateriasService, GruposService,
  HorariosService, AlumnosService
} from '../services/data.service.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';
import { Auth } from '../core/auth.js';
import { Validators, Validacion } from '../components/form-validator.js';

const AREAS = ['Matemáticas','Lengua','Ciencias','Historia','Inglés','Arte','Educación Física','Tecnología'];
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
const TIPOS_CONTRATO = ['Tiempo completo','Medio tiempo','Por horas'];

export async function renderProfesores(container) {
  // ⬇️ Si es profesor, solo ve su propia ficha
  if (Auth.hasRole('profesor')) {
    return renderMiFichaDocente(container);
  }

  const puedeEditar = Auth.hasRole('admin');
  const state = { search: '', area: '', estado: '', contrato: '' };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-chalkboard-teacher"></i> Profesores</h1>
        <p class="page-sub">Gestión del personal docente, carga académica y nómina</p>
      </div>
      ${puedeEditar ? `
        <button class="btn btn-primary" id="btnNuevo">
          <i class="fas fa-plus"></i> Nuevo profesor
        </button>` : ''}
    </div>

    <div id="stats"></div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="input-icon" style="flex:1;min-width:220px">
          <i class="fas fa-search"></i>
          <input type="search" class="input" id="searchInput" placeholder="Buscar por nombre, área o correo…">
        </div>
        <select class="select" id="filtroArea" style="width:auto;min-width:150px">
          <option value="">Todas las áreas</option>
          ${AREAS.map((a) => `<option value="${a}">${escapeHtml(a)}</option>`).join('')}
        </select>
        <select class="select" id="filtroContrato" style="width:auto;min-width:150px">
          <option value="">Todos los contratos</option>
          ${TIPOS_CONTRATO.map((t) => `<option value="${t}">${escapeHtml(t)}</option>`).join('')}
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
              <th>No. Empleado</th>
              <th>Nombre</th>
              <th>Área</th>
              <th>Contrato</th>
              <th style="text-align:center">Horas/sem</th>
              <th style="text-align:center">Alumnos</th>
              <th style="text-align:right">Sueldo quinc.</th>
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

  async function cargar() {
    tbody.innerHTML = `<tr><td colspan="9"><div class="skeleton-block" style="height:200px;margin:var(--sp-3)"></div></td></tr>`;
    statsWrap.innerHTML = `<div class="skeleton-block" style="height:100px;margin-bottom:var(--sp-4)"></div>`;

    const [profesores, materias, grupos, horarios, alumnos] = await Promise.all([
      ProfesoresService.todos(),
      MateriasService.todos(),
      GruposService.todos(),
      HorariosService.todos(),
      AlumnosService.todos()
    ]);

    const enriquecidos = profesores.map((p) => {
      const misClases = horarios.filter((h) => h.profesorId === p.id);
      const misGrupos = [...new Set(misClases.map((h) => h.grupoId))].map((gid) => grupos.find((g) => g.id === gid)).filter(Boolean);
      const misAlumnos = alumnos.filter((a) => misGrupos.some((g) => g.id === a.grupoId));
      const misMaterias = [...new Set(misClases.map((h) => h.materiaId))].map((mid) => materias.find((m) => m.id === mid)).filter(Boolean);
      return { ...p, _clases: misClases, _grupos: misGrupos, _alumnos: misAlumnos, _materias: misMaterias };
    });

    const activos = enriquecidos.filter((p) => p.estado === 'activo').length;
    const nomina = enriquecidos.reduce((a, p) => a + (p.sueldoQuincenal || 0), 0);
    const nominaAnual = nomina * 24;
    const promedioHoras = enriquecidos.length ? (enriquecidos.reduce((a, p) => a + (p.horasSemanales || 0), 0) / enriquecidos.length).toFixed(1) : 0;

    statsWrap.innerHTML = `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-chalkboard-teacher"></i></div>
          <div><div class="stat-value">${enriquecidos.length}</div><div class="stat-label">Plantilla docente</div></div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-circle-check"></i></div>
          <div><div class="stat-value">${activos}</div><div class="stat-label">Activos</div></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-clock"></i></div>
          <div><div class="stat-value">${promedioHoras}</div><div class="stat-label">Horas/sem. promedio</div></div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
          <div>
            <div class="stat-value" style="font-size:var(--fs-lg)">$${nomina.toLocaleString('es-MX')}</div>
            <div class="stat-label">Nómina quincenal</div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--sp-4);padding:var(--sp-3) var(--sp-4)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--sp-3)">
          <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-sm);color:var(--text-secondary)">
            <i class="fas fa-coins" style="color:var(--c-success)"></i>
            <span>Nómina anual estimada (24 quincenas):</span>
            <strong style="color:var(--c-brand-900);font-size:var(--fs-md)">$${nominaAnual.toLocaleString('es-MX')} MXN</strong>
          </div>
          <div style="display:flex;gap:var(--sp-2);font-size:var(--fs-xs)">
            <span class="badge badge-info">Tiempo completo: ${enriquecidos.filter((p) => p.tipoContrato === 'Tiempo completo').length}</span>
            <span class="badge badge-warning">Medio tiempo: ${enriquecidos.filter((p) => p.tipoContrato === 'Medio tiempo').length}</span>
            <span class="badge badge-neutral">Por horas: ${enriquecidos.filter((p) => p.tipoContrato === 'Por horas').length}</span>
          </div>
        </div>
      </div>
    `;

    const q = state.search.toLowerCase();
    const filtrados = enriquecidos.filter((p) => {
      if (q && !`${p.nombre} ${p.apellidos} ${p.email} ${p.area} ${p.numEmpleado}`.toLowerCase().includes(q)) return false;
      if (state.area && p.area !== state.area) return false;
      if (state.contrato && p.tipoContrato !== state.contrato) return false;
      if (state.estado && p.estado !== state.estado) return false;
      return true;
    });

    if (!filtrados.length) {
      tbody.innerHTML = `<tr><td colspan="9">
        ${emptyState({
          icon: 'fa-chalkboard-teacher',
          title: 'No hay profesores',
          message: enriquecidos.length ? 'Prueba con otros filtros.' : 'Crea el primer profesor para comenzar.',
          actionLabel: puedeEditar && !enriquecidos.length ? 'Nuevo profesor' : '',
          onAction: puedeEditar ? () => abrirFormulario(null, cargar) : null
        })}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map((p) => fila(p)).join('');
    engancharFilas(filtrados);
  }

  function fila(p) {
    const initials = (p.nombre[0] + p.apellidos[0]).toUpperCase();
    const contratoBadge = {
      'Tiempo completo': 'success',
      'Medio tiempo': 'warning',
      'Por horas': 'neutral'
    }[p.tipoContrato] || 'neutral';
    return `
      <tr data-id="${p.id}" style="cursor:pointer">
        <td><code style="font-size:.8em;color:var(--text-secondary)">${escapeHtml(p.numEmpleado || '—')}</code></td>
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.7rem;flex-shrink:0">
              ${initials}
            </div>
            <div>
              <strong>${escapeHtml(p.nombre + ' ' + p.apellidos)}</strong>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">${escapeHtml(p.especialidad || p.email || '—')}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-info">${escapeHtml(p.area)}</span></td>
        <td><span class="badge badge-${contratoBadge}">${escapeHtml(p.tipoContrato)}</span></td>
        <td style="text-align:center">${p.horasSemanales || '—'}</td>
        <td style="text-align:center"><strong>${p._alumnos.length}</strong></td>
        <td style="text-align:right"><strong style="color:var(--c-success-fg)">$${(p.sueldoQuincenal || 0).toLocaleString('es-MX')}</strong></td>
        <td>${statusBadge(p.estado)}</td>
        <td style="text-align:right">
          <div class="table-actions">
            <button class="btn-icon" data-ver="${p.id}" title="Ver detalle"><i class="fas fa-eye"></i></button>
            ${puedeEditar ? `
              <button class="btn-icon" data-editar="${p.id}" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon danger" data-eliminar="${p.id}" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
  }

  function engancharFilas(lista) {
    tbody.querySelectorAll('[data-ver]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = lista.find((x) => x.id === Number(btn.dataset.ver));
        verDetalle(p);
      });
    });
    tbody.querySelectorAll('[data-editar]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirFormulario(Number(btn.dataset.editar), cargar);
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
        const p = lista.find((x) => x.id === Number(tr.dataset.id));
        if (p) verDetalle(p);
      });
    });
  }

  function verDetalle(p) {
    const { overlay } = UI.modal({
      title: 'Información del profesor',
      size: 'modal-lg',
      body: `
        <div style="display:flex;gap:var(--sp-4);align-items:center;padding-bottom:var(--sp-4);border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);flex-wrap:wrap">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
            ${(p.nombre[0] + p.apellidos[0]).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">
              ${escapeHtml(p.nombre + ' ' + p.apellidos)}
            </div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
              <code style="font-size:.9em">${escapeHtml(p.numEmpleado || '—')}</code>
              · ${escapeHtml(p.area)} · ${escapeHtml(p.especialidad || '')}
            </div>
          </div>
          <div style="text-align:right">
            ${statusBadge(p.estado)}
            <div style="margin-top:6px;font-size:var(--fs-xs);color:var(--text-muted)">Sueldo quincenal</div>
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-success-fg)">
              $${(p.sueldoQuincenal || 0).toLocaleString('es-MX')}
            </div>
          </div>
        </div>

        <div style="display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);overflow-x:auto">
          ${[
            { id: 'info',     label: 'Datos',      icon: 'fa-circle-info' },
            { id: 'carga',    label: 'Carga académica', icon: 'fa-book' },
            { id: 'horario',  label: 'Horario',    icon: 'fa-clock' },
            { id: 'alumnos',  label: 'Alumnos',    icon: 'fa-user-graduate' },
            { id: 'nomina',   label: 'Nómina',     icon: 'fa-money-bill-wave' }
          ].map((t, i) => `
            <button class="prof-tab" data-tab="${t.id}" style="padding:10px 16px;font-size:var(--fs-sm);font-weight:600;color:${i === 0 ? 'var(--c-brand-500)' : 'var(--text-secondary)'};border-bottom:2px solid ${i === 0 ? 'var(--c-brand-500)' : 'transparent'};background:none;cursor:pointer;white-space:nowrap;transition:all .15s">
              <i class="fas ${t.icon}"></i> ${t.label}
            </button>`).join('')}
        </div>

        <div id="tabContent"></div>
      `
    });

    const content = overlay.querySelector('#tabContent');
    const tabs = overlay.querySelectorAll('.prof-tab');

    const activar = (tab) => {
      tabs.forEach((t) => {
        const activo = t.dataset.tab === tab;
        t.style.color = activo ? 'var(--c-brand-500)' : 'var(--text-secondary)';
        t.style.borderBottomColor = activo ? 'var(--c-brand-500)' : 'transparent';
      });
      if (tab === 'info') content.innerHTML = tabInfo(p);
      if (tab === 'carga') content.innerHTML = tabCarga(p);
      if (tab === 'horario') content.innerHTML = tabHorario(p);
      if (tab === 'alumnos') content.innerHTML = tabAlumnos(p);
      if (tab === 'nomina') content.innerHTML = tabNomina(p);
    };

    tabs.forEach((t) => t.addEventListener('click', () => activar(t.dataset.tab)));
    activar('info');
  }

  function tabInfo(p) {
    const ingreso = new Date(p.fechaIngreso);
    const hoy = new Date();
    const anios = Math.floor((hoy - ingreso) / (365.25 * 24 * 60 * 60 * 1000));

    const bloques = [
      ['No. Empleado', p.numEmpleado || '—', 'fa-id-badge'],
      ['Nombre completo', `${p.nombre} ${p.apellidos}`, 'fa-user'],
      ['Área', p.area, 'fa-book-open'],
      ['Especialidad', p.especialidad || '—', 'fa-star'],
      ['Correo institucional', p.email || '—', 'fa-envelope'],
      ['Teléfono', p.telefono || '—', 'fa-phone'],
      ['Horario declarado', p.horario || '—', 'fa-clock'],
      ['Fecha de ingreso', p.fechaIngreso || '—', 'fa-calendar'],
      ['Antigüedad', anios > 0 ? `${anios} año${anios !== 1 ? 's' : ''}` : 'Menos de 1 año', 'fa-hourglass-half'],
      ['RFC', p.rfc || '—', 'fa-id-card'],
      ['Banco', p.banco || '—', 'fa-building-columns'],
      ['Cuenta', p.cuenta || '—', 'fa-credit-card']
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

  function tabCarga(p) {
    return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div><div class="stat-value">${p._grupos.length}</div><div class="stat-label">Grupos</div></div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-book"></i></div>
          <div><div class="stat-value">${p._materias.length}</div><div class="stat-label">Materias</div></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-clock"></i></div>
          <div><div class="stat-value">${p._clases.length}</div><div class="stat-label">Clases/semana</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
          <div><div class="stat-value">${p._alumnos.length}</div><div class="stat-label">Alumnos</div></div>
        </div>
      </div>

      <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin-bottom:var(--sp-3)">
        <i class="fas fa-book"></i> Materias que imparte
      </h4>
      ${p._materias.length === 0 ? `<p class="text-muted" style="font-size:var(--fs-sm)">Sin materias asignadas.</p>` : `
        <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-4)">
          ${p._materias.map((m) => `
            <span class="badge badge-info" style="text-transform:none;font-weight:600">
              <i class="fas fa-book"></i> ${escapeHtml(m.nombre)}
            </span>`).join('')}
        </div>`}

      <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin-bottom:var(--sp-3)">
        <i class="fas fa-users"></i> Grupos asignados
      </h4>
      ${p._grupos.length === 0 ? `<p class="text-muted" style="font-size:var(--fs-sm)">Sin grupos asignados.</p>` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:var(--sp-2)">
          ${p._grupos.map((g) => `
            <div style="padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md);text-align:center">
              <div style="font-weight:700;color:var(--c-brand-900)">${escapeHtml(g.nombre)}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px">Aula ${escapeHtml(g.aula || '—')}</div>
            </div>`).join('')}
        </div>`}
    `;
  }

  function tabHorario(p) {
    if (!p._clases.length) {
      return emptyState({ icon: 'fa-calendar-xmark', title: 'Sin horario asignado', message: 'Este profesor no tiene clases programadas.' });
    }
    const horas = [...new Set(p._clases.map((c) => c.horaInicio))].sort();
    const matriz = {};
    DIAS.forEach((d) => { matriz[d] = {}; horas.forEach((h) => { matriz[d][h] = null; }); });
    p._clases.forEach((c) => {
      if (matriz[c.dia] && matriz[c.dia][c.horaInicio] !== undefined) matriz[c.dia][c.horaInicio] = c;
    });

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
                  const grupo = p._grupos.find((g) => g.id === c.grupoId);
                  const mat = p._materias.find((m) => m.id === c.materiaId);
                  return `
                    <td style="background:linear-gradient(135deg,rgba(20,184,166,.1),rgba(37,99,235,.08));border-radius:var(--r-sm);padding:6px">
                      <div style="font-weight:700;color:var(--c-brand-500);font-size:.75em">${escapeHtml(mat?.nombre || '—')}</div>
                      <div style="font-size:.68em;color:var(--text-muted);margin-top:2px">${escapeHtml(grupo?.nombre || '')}</div>
                      <div style="font-size:.65em;color:var(--text-muted)">Aula ${escapeHtml(c.aula || '—')}</div>
                    </td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:var(--sp-3);padding:var(--sp-2) var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);font-size:var(--fs-xs);color:var(--text-secondary)">
        <i class="fas fa-info-circle" style="color:var(--c-brand-500)"></i>
        ${p._clases.length} clases programadas en ${p._grupos.length} grupos diferentes
      </div>`;
  }

  function tabAlumnos(p) {
    if (!p._alumnos.length) {
      return emptyState({ icon: 'fa-user-graduate', title: 'Sin alumnos', message: 'Este profesor no tiene alumnos en sus grupos.' });
    }
    const porGrupo = {};
    p._alumnos.forEach((a) => {
      const g = p._grupos.find((x) => x.id === a.grupoId);
      if (!g) return;
      if (!porGrupo[g.id]) porGrupo[g.id] = { grupo: g, alumnos: [] };
      porGrupo[g.id].alumnos.push(a);
    });

    return `
      <div style="margin-bottom:var(--sp-3);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:var(--fs-sm);color:var(--text-secondary)">
            <i class="fas fa-user-graduate" style="color:var(--c-brand-500)"></i>
            Total de alumnos atendidos
          </span>
          <span class="badge badge-info">${p._alumnos.length} alumnos</span>
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

  function tabNomina(p) {
    const horasMes = p.horasSemanales * 4.33;
    const sueldoMensual = Math.round(p.sueldoQuincenal * 2);
    const sueldoAnual = sueldoMensual * 12;

    const isr = Math.round(p.sueldoQuincenal * 0.12);
    const imss = Math.round(p.sueldoQuincenal * 0.025);
    const neto = p.sueldoQuincenal - isr - imss;

    return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
          <div>
            <div class="stat-value" style="font-size:var(--fs-lg)">$${p.sueldoQuincenal.toLocaleString('es-MX')}</div>
            <div class="stat-label">Quincenal</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-calendar"></i></div>
          <div>
            <div class="stat-value" style="font-size:var(--fs-lg)">$${sueldoMensual.toLocaleString('es-MX')}</div>
            <div class="stat-label">Mensual estimado</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div>
            <div class="stat-value" style="font-size:var(--fs-lg)">$${sueldoAnual.toLocaleString('es-MX')}</div>
            <div class="stat-label">Anual estimado</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-clock"></i></div>
          <div>
            <div class="stat-value">${p.horasSemanales}</div>
            <div class="stat-label">Horas/semana</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--sp-4);padding:var(--sp-4)">
        <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin-bottom:var(--sp-3)">
          <i class="fas fa-file-contract"></i> Detalles del contrato
        </h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--sp-3)">
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Tipo de contrato</div><div style="font-weight:600">${escapeHtml(p.tipoContrato)}</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Sueldo por hora</div><div style="font-weight:600">$${p.sueldoPorHora} MXN</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Horas por mes</div><div style="font-weight:600">${horasMes.toFixed(1)} hrs</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Fecha de ingreso</div><div style="font-weight:600">${escapeHtml(p.fechaIngreso)}</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">RFC</div><div style="font-weight:600;font-family:monospace">${escapeHtml(p.rfc || '—')}</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Banco / Cuenta</div><div style="font-weight:600">${escapeHtml(p.banco)} · ${escapeHtml(p.cuenta)}</div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--sp-4);padding:var(--sp-4)">
        <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin-bottom:var(--sp-3)">
          <i class="fas fa-receipt"></i> Desglose del pago quincenal
        </h4>
        <table class="table" style="font-size:var(--fs-sm)">
          <tbody>
            <tr>
              <td style="color:var(--text-secondary)">Sueldo bruto</td>
              <td style="text-align:right;font-weight:600">$${p.sueldoQuincenal.toLocaleString('es-MX')}</td>
            </tr>
            <tr>
              <td style="color:var(--text-secondary)">ISR (12%)</td>
              <td style="text-align:right;color:var(--c-danger-fg)">-$${isr.toLocaleString('es-MX')}</td>
            </tr>
            <tr>
              <td style="color:var(--text-secondary)">IMSS (2.5%)</td>
              <td style="text-align:right;color:var(--c-danger-fg)">-$${imss.toLocaleString('es-MX')}</td>
            </tr>
            <tr style="background:var(--c-success-bg);border-top:2px solid var(--c-success)">
              <td style="font-weight:700;color:var(--c-success-fg)">Sueldo neto</td>
              <td style="text-align:right;font-weight:800;font-size:var(--fs-md);color:var(--c-success-fg)">$${neto.toLocaleString('es-MX')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card" style="padding:var(--sp-4)">
        <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin-bottom:var(--sp-3)">
          <i class="fas fa-history"></i> Últimos pagos
        </h4>
        <table class="table" style="font-size:var(--fs-sm)">
          <thead>
            <tr>
              <th>Periodo</th>
              <th style="text-align:right">Monto</th>
              <th style="text-align:center">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${(p.pagos || []).map((pago) => `
              <tr>
                <td>${escapeHtml(pago.periodo)}</td>
                <td style="text-align:right;font-weight:600">$${pago.monto.toLocaleString('es-MX')}</td>
                <td style="text-align:center">${statusBadge(pago.estado === 'Pagado' ? 'Activo' : 'Inactivo')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function abrirFormulario(id, onSave) {
    let profe = null;
    if (id) {
      try { profe = await ProfesoresService.obtener(id); }
      catch (e) { UI.toast(e.message, 'error'); return; }
    }
    const esEdicion = !!profe;
    const data = profe || {
      numEmpleado: '', nombre: '', apellidos: '', area: 'Matemáticas',
      especialidad: '', email: '', telefono: '', horario: 'Lun-Vie',
      estado: 'activo', tipoContrato: 'Tiempo completo', horasSemanales: 40,
      sueldoPorHora: 220, fechaIngreso: new Date().toISOString().slice(0, 10),
      rfc: '', banco: 'BBVA', cuenta: '', sueldoQuincenal: 0, pagos: []
    };

    const { overlay, close } = UI.modal({
      title: esEdicion ? 'Editar profesor' : 'Nuevo profesor',
      size: 'modal-lg',
      body: `
        <div class="form-grid-2">
          <div class="field">
            <label>No. Empleado</label>
            <input class="input" id="f_numEmpleado" value="${escapeHtml(data.numEmpleado || '')}" placeholder="Se autogenera si está vacío" maxlength="10">
          </div>
          <div class="field">
            <label>Estado</label>
            <select class="select" id="f_estado">
              <option value="activo" ${data.estado !== 'inactivo' ? 'selected' : ''}>Activo</option>
              <option value="inactivo" ${data.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>
          <div class="field">
            <label>Nombre <span class="req">*</span></label>
            <input class="input" id="f_nombre" value="${escapeHtml(data.nombre)}" maxlength="60">
          </div>
          <div class="field">
            <label>Apellidos <span class="req">*</span></label>
            <input class="input" id="f_apellidos" value="${escapeHtml(data.apellidos)}" maxlength="80">
          </div>
          <div class="field">
            <label>Área <span class="req">*</span></label>
            <select class="select" id="f_area">
              ${AREAS.map((a) => `<option value="${a}" ${data.area === a ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Especialidad</label>
            <input class="input" id="f_especialidad" value="${escapeHtml(data.especialidad || '')}" placeholder="Ej: Álgebra">
          </div>
          <div class="field">
            <label>Correo</label>
            <input class="input" type="email" id="f_email" value="${escapeHtml(data.email || '')}">
          </div>
          <div class="field">
            <label>Teléfono</label>
            <input class="input" id="f_telefono" value="${escapeHtml(data.telefono || '')}" inputmode="tel">
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Horario general</label>
            <input class="input" id="f_horario" value="${escapeHtml(data.horario || '')}" placeholder="Ej: Lun-Vie 8:00-16:00">
          </div>
        </div>

        <div style="margin-top:var(--sp-5);padding-top:var(--sp-5);border-top:1px solid var(--border)">
          <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin-bottom:var(--sp-3)">
            <i class="fas fa-money-bill-wave" style="color:var(--c-success)"></i> Datos financieros
          </h4>
          <div class="form-grid-2">
            <div class="field">
              <label>Tipo de contrato <span class="req">*</span></label>
              <select class="select" id="f_tipoContrato">
                ${TIPOS_CONTRATO.map((t) => `<option value="${t}" ${data.tipoContrato === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>Horas semanales <span class="req">*</span></label>
              <input class="input" type="number" id="f_horasSemanales" value="${data.horasSemanales}" min="1" max="60">
            </div>
            <div class="field">
              <label>Sueldo por hora (MXN) <span class="req">*</span></label>
              <input class="input" type="number" id="f_sueldoPorHora" value="${data.sueldoPorHora}" min="50" step="10">
            </div>
            <div class="field">
              <label>Sueldo quincenal (MXN)</label>
              <input class="input" id="f_sueldoQuincenal" value="${data.sueldoQuincenal || 0}" readonly style="background:var(--bg-muted);font-weight:700;color:var(--c-success-fg)">
              <div class="field-hint">Se calcula automáticamente</div>
            </div>
            <div class="field">
              <label>Fecha de ingreso</label>
              <input class="input" type="date" id="f_fechaIngreso" value="${data.fechaIngreso || ''}">
            </div>
            <div class="field">
              <label>RFC</label>
              <input class="input" id="f_rfc" value="${escapeHtml(data.rfc || '')}" maxlength="13" style="text-transform:uppercase">
            </div>
            <div class="field">
              <label>Banco</label>
              <input class="input" id="f_banco" value="${escapeHtml(data.banco || '')}" placeholder="Ej: BBVA">
            </div>
            <div class="field">
              <label>Cuenta</label>
              <input class="input" id="f_cuenta" value="${escapeHtml(data.cuenta || '')}" placeholder="****0000">
            </div>
          </div>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="saveBtn">
          <i class="fas fa-floppy-disk"></i> ${esEdicion ? 'Actualizar' : 'Crear profesor'}
        </button>`
    });

    const actualizarSueldo = () => {
      const horas = Number(overlay.querySelector('#f_horasSemanales').value) || 0;
      const sueldoHora = Number(overlay.querySelector('#f_sueldoPorHora').value) || 0;
      const quincenal = Math.round(sueldoHora * horas * 52 / 24);
      overlay.querySelector('#f_sueldoQuincenal').value = quincenal;
    };
    overlay.querySelector('#f_horasSemanales').addEventListener('input', actualizarSueldo);
    overlay.querySelector('#f_sueldoPorHora').addEventListener('input', actualizarSueldo);
    actualizarSueldo();

    Validacion.bind(overlay, {
      f_nombre: [Validators.required, Validators.minLength(3)],
      f_apellidos: [Validators.required, Validators.minLength(3)],
      f_email: [Validators.email],
      f_telefono: [Validators.phone]
    });

    overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
      const valido = Validacion.validar(overlay, {
        f_nombre: [Validators.required, Validators.minLength(3)],
        f_apellidos: [Validators.required, Validators.minLength(3)],
        f_email: [Validators.email],
        f_telefono: [Validators.phone]
      });
      if (!valido) { UI.toast('Revisa los campos marcados en rojo', 'warning'); return; }

      const horas = Number(overlay.querySelector('#f_horasSemanales').value) || 0;
      const sueldoHora = Number(overlay.querySelector('#f_sueldoPorHora').value) || 0;
      const sueldoQuincenal = Math.round(sueldoHora * horas * 52 / 24);

      const payload = {
        numEmpleado: overlay.querySelector('#f_numEmpleado').value.trim() || null,
        nombre: overlay.querySelector('#f_nombre').value.trim(),
        apellidos: overlay.querySelector('#f_apellidos').value.trim(),
        area: overlay.querySelector('#f_area').value,
        especialidad: overlay.querySelector('#f_especialidad').value.trim(),
        email: overlay.querySelector('#f_email').value.trim(),
        telefono: overlay.querySelector('#f_telefono').value.trim(),
        horario: overlay.querySelector('#f_horario').value.trim(),
        estado: overlay.querySelector('#f_estado').value,
        tipoContrato: overlay.querySelector('#f_tipoContrato').value,
        horasSemanales: horas,
        sueldoPorHora: sueldoHora,
        sueldoQuincenal,
        fechaIngreso: overlay.querySelector('#f_fechaIngreso').value,
        rfc: overlay.querySelector('#f_rfc').value.trim().toUpperCase(),
        banco: overlay.querySelector('#f_banco').value.trim(),
        cuenta: overlay.querySelector('#f_cuenta').value.trim()
      };

      if (!payload.numEmpleado) {
        const todos = await ProfesoresService.todos();
        const maxN = todos.reduce((max, p) => {
          const n = parseInt((p.numEmpleado || 'P-0').replace(/\D/g, '')) || 0;
          return Math.max(max, n);
        }, 0);
        payload.numEmpleado = 'P-' + String(maxN + 1).padStart(3, '0');
      }

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      try {
        if (esEdicion) await ProfesoresService.actualizar(id, payload);
        else {
          payload.pagos = [{ periodo: 'Quincena actual', monto: sueldoQuincenal, estado: 'Pagado' }];
          await ProfesoresService.crear(payload);
        }
        UI.toast(esEdicion ? 'Profesor actualizado' : 'Profesor creado', 'success');
        close();
        onSave?.();
      } catch (err) {
        UI.toast(err.message, 'error');
        UI.buttonLoading(btn, false);
      }
    });
  }

  async function confirmarEliminar(id) {
    const p = await ProfesoresService.obtener(id);
    const ok = await UI.confirm({
      title: 'Eliminar profesor',
      message: `¿Eliminar a ${p.nombre} ${p.apellidos}? Se desvincularán sus clases de los grupos. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    try {
      const db = (await import('../services/data.service.js'))._db();
      db.materiaGrupo = (db.materiaGrupo || []).filter((mg) => mg.profesorId !== Number(id));
      db.horarios = (db.horarios || []).filter((h) => h.profesorId !== Number(id));
      (db.grupos || []).forEach((g) => { if (g.tutorId === Number(id)) g.tutorId = null; });
      await ProfesoresService.eliminar(id);
      UI.toast('Profesor eliminado', 'success');
      cargar();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  let timer;
  container.querySelector('#searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.search = e.target.value; cargar(); }, 280);
  });
  container.querySelector('#filtroArea').addEventListener('change', (e) => { state.area = e.target.value; cargar(); });
  container.querySelector('#filtroContrato').addEventListener('change', (e) => { state.contrato = e.target.value; cargar(); });
  container.querySelector('#filtroEstado').addEventListener('change', (e) => { state.estado = e.target.value; cargar(); });

  const btnNuevo = container.querySelector('#btnNuevo');
  if (btnNuevo) btnNuevo.addEventListener('click', () => abrirFormulario(null, cargar));

  await cargar();
}

// ============================================================
// VISTA DE "MI FICHA DOCENTE" — Solo para el rol profesor
// ============================================================
async function renderMiFichaDocente(container) {
  const profesorId = Auth.user.profesorId;
  if (!profesorId) {
    container.innerHTML = `
      <div class="card" style="padding:var(--sp-6);text-align:center">
        <i class="fas fa-triangle-exclamation" style="font-size:2.5rem;color:var(--c-danger);opacity:.5"></i>
        <h3 style="margin-top:var(--sp-3);color:var(--c-brand-900)">Sin ficha docente</h3>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--sp-2)">
          Tu cuenta no está vinculada a un profesor. Contacta a administración.
        </p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;

  const [profesor, materias, grupos, horarios, alumnos] = await Promise.all([
    ProfesoresService.obtener(profesorId),
    MateriasService.todos(),
    GruposService.todos(),
    HorariosService.todos(),
    AlumnosService.todos()
  ]);

  const misClases = horarios.filter((h) => h.profesorId === profesorId);
  const misGruposIds = [...new Set(misClases.map((h) => h.grupoId))];
  const misGrupos = grupos.filter((g) => misGruposIds.includes(g.id));
  const misMateriasIds = [...new Set(misClases.map((h) => h.materiaId))];
  const misMaterias = materias.filter((m) => misMateriasIds.includes(m.id));
  const misAlumnos = alumnos.filter((a) => misGruposIds.includes(a.grupoId));

  const initials = (profesor.nombre[0] + profesor.apellidos[0]).toUpperCase();
  const DIAS_LOCAL = ['Lunes','Martes','Miércoles','Jueves','Viernes'];

  const ingreso = new Date(profesor.fechaIngreso);
  const hoy = new Date();
  const anios = Math.floor((hoy - ingreso) / (365.25 * 24 * 60 * 60 * 1000));

  const isr = Math.round((profesor.sueldoQuincenal || 0) * 0.12);
  const imss = Math.round((profesor.sueldoQuincenal || 0) * 0.025);
  const sueldoNeto = (profesor.sueldoQuincenal || 0) - isr - imss;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-id-card"></i> Mi ficha docente</h1>
        <p class="page-sub">Información personal, académica y laboral</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4);background:linear-gradient(135deg, rgba(37,99,235,.08), rgba(20,184,166,.08))">
      <div style="display:flex;gap:var(--sp-4);align-items:center;flex-wrap:wrap">
        <div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500));color:#fff;display:grid;place-items:center;font-size:2rem;font-weight:800;flex-shrink:0">
          ${initials}
        </div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:var(--fs-xl);font-weight:800;color:var(--c-brand-900)">
            ${escapeHtml(profesor.nombre + ' ' + profesor.apellidos)}
          </div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:4px">
            <code>${escapeHtml(profesor.numEmpleado)}</code>
            · ${escapeHtml(profesor.area)}
            · ${escapeHtml(profesor.especialidad || '')}
          </div>
          <div style="margin-top:var(--sp-3);display:flex;gap:var(--sp-2);flex-wrap:wrap">
            ${statusBadge(profesor.estado === 'activo' ? 'Activo' : 'Inactivo')}
            <span class="badge badge-info">${escapeHtml(profesor.tipoContrato)}</span>
            <span class="badge badge-neutral">${profesor.horasSemanales} hrs/semana</span>
            <span class="badge badge-success">${anios > 0 ? anios + ' año' + (anios !== 1 ? 's' : '') : 'Menos de 1 año'} de antigüedad</span>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div><div class="stat-value">${misGrupos.length}</div><div class="stat-label">Mis grupos</div></div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><i class="fas fa-book"></i></div>
        <div><div class="stat-value">${misMaterias.length}</div><div class="stat-label">Materias</div></div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><i class="fas fa-clock"></i></div>
        <div><div class="stat-value">${misClases.length}</div><div class="stat-label">Clases/semana</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
        <div><div class="stat-value">${misAlumnos.length}</div><div class="stat-label">Mis alumnos</div></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-user"></i> Datos personales</h3></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--sp-3)">
       
                  ${[
          ['Matrícula', profesor.matricula || profesor.numEmpleado, 'fa-id-badge'],
          ['Usuario de acceso', profesor.matricula || profesor.numEmpleado, 'fa-key'],
          ['Nombre completo', profesor.nombre + ' ' + profesor.apellidos, 'fa-user'],
          ['Correo institucional', profesor.email, 'fa-envelope'],
          ['Teléfono', profesor.telefono || '—', 'fa-phone'],
          ['Área', profesor.area, 'fa-book-open'],
          ['Especialidad', profesor.especialidad || '—', 'fa-star'],
          ['Fecha de ingreso', profesor.fechaIngreso, 'fa-calendar'],
          ['RFC', profesor.rfc || '—', 'fa-id-card']
        ].map(([lbl, val, ico]) => `
          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:4px">
              <i class="fas ${ico}"></i> ${lbl}
            </div>
            <div style="font-weight:600;margin-top:4px">${escapeHtml(String(val))}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-money-bill-wave"></i> Mi nómina</h3></div>
      <div class="stats-grid" style="margin-bottom:var(--sp-3)">
        <div class="stat-card success">
          <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
          <div><div class="stat-value" style="font-size:var(--fs-lg)">$${(profesor.sueldoQuincenal || 0).toLocaleString('es-MX')}</div><div class="stat-label">Sueldo quincenal</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-calendar"></i></div>
          <div><div class="stat-value" style="font-size:var(--fs-lg)">$${((profesor.sueldoQuincenal || 0) * 2).toLocaleString('es-MX')}</div><div class="stat-label">Mensual estimado</div></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div><div class="stat-value" style="font-size:var(--fs-lg)">$${((profesor.sueldoQuincenal || 0) * 24).toLocaleString('es-MX')}</div><div class="stat-label">Anual estimado</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-clock"></i></div>
          <div><div class="stat-value">${profesor.sueldoPorHora || 0}</div><div class="stat-label">MXN / hora</div></div>
        </div>
      </div>

      <table class="table" style="font-size:var(--fs-sm)">
        <tbody>
          <tr><td style="color:var(--text-secondary)">Sueldo bruto</td><td style="text-align:right;font-weight:600">$${(profesor.sueldoQuincenal || 0).toLocaleString('es-MX')}</td></tr>
          <tr><td style="color:var(--text-secondary)">ISR (12%)</td><td style="text-align:right;color:var(--c-danger-fg)">-$${isr.toLocaleString('es-MX')}</td></tr>
          <tr><td style="color:var(--text-secondary)">IMSS (2.5%)</td><td style="text-align:right;color:var(--c-danger-fg)">-$${imss.toLocaleString('es-MX')}</td></tr>
          <tr style="background:var(--c-success-bg);border-top:2px solid var(--c-success)">
            <td style="font-weight:700;color:var(--c-success-fg)">Sueldo neto estimado</td>
            <td style="text-align:right;font-weight:800;font-size:var(--fs-md);color:var(--c-success-fg)">$${sueldoNeto.toLocaleString('es-MX')}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:var(--sp-3);display:flex;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted)">
        <span><i class="fas fa-building-columns"></i> ${escapeHtml(profesor.banco || '—')}</span>
        <span><i class="fas fa-credit-card"></i> ${escapeHtml(profesor.cuenta || '—')}</span>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-book"></i> Materias que imparto</h3></div>
      ${misMaterias.length === 0 ? `<p class="text-muted" style="font-size:var(--fs-sm)">Sin materias asignadas.</p>` : `
        <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
          ${misMaterias.map((m) => `
            <span class="badge badge-info" style="text-transform:none;font-weight:600;font-size:var(--fs-sm);padding:6px 12px">
              <i class="fas fa-book"></i> ${escapeHtml(m.clave)} · ${escapeHtml(m.nombre)}
            </span>`).join('')}
        </div>`}
    </div>

    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-users"></i> Mis grupos</h3></div>
      ${misGrupos.length === 0 ? `<p class="text-muted" style="font-size:var(--fs-sm)">Sin grupos asignados.</p>` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--sp-3)">
          ${misGrupos.map((g) => {
            const cantAlumnos = misAlumnos.filter((a) => a.grupoId === g.id).length;
            return `
              <div class="grupo-card" style="cursor:default">
                <div class="grupo-icon"><i class="fas fa-users"></i></div>
                <div class="grupo-info">
                  <div class="grupo-name">${escapeHtml(g.nombre)}</div>
                  <div class="grupo-meta">${cantAlumnos} alumnos · Aula ${escapeHtml(g.aula || '—')}</div>
                </div>
              </div>`;
          }).join('')}
        </div>`}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-clock"></i> Mi horario semanal</h3></div>
      ${misClases.length === 0 ? `<p class="text-muted" style="font-size:var(--fs-sm)">Sin clases programadas.</p>` : (() => {
        const horas = [...new Set(misClases.map((c) => c.horaInicio))].sort();
        const matriz = {};
        DIAS_LOCAL.forEach((d) => { matriz[d] = {}; horas.forEach((h) => { matriz[d][h] = null; }); });
        misClases.forEach((c) => {
          if (matriz[c.dia] && matriz[c.dia][c.horaInicio] !== undefined) matriz[c.dia][c.horaInicio] = c;
        });
        return `
          <div class="table-scroll">
            <table class="table" style="font-size:var(--fs-sm);text-align:center">
              <thead>
                <tr>
                  <th style="text-align:left">Hora</th>
                  ${DIAS_LOCAL.map((d) => `<th>${d}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${horas.map((hora) => `
                  <tr>
                    <td style="text-align:left"><strong>${hora}</strong></td>
                    ${DIAS_LOCAL.map((dia) => {
                      const c = matriz[dia][hora];
                      if (!c) return `<td style="color:var(--text-muted)">—</td>`;
                      const grupo = misGrupos.find((g) => g.id === c.grupoId);
                      const mat = misMaterias.find((m) => m.id === c.materiaId);
                      return `
                        <td style="background:linear-gradient(135deg,rgba(20,184,166,.1),rgba(37,99,235,.08));border-radius:var(--r-sm);padding:6px">
                          <div style="font-weight:700;color:var(--c-brand-500);font-size:.75em">${escapeHtml(mat?.nombre || '—')}</div>
                          <div style="font-size:.68em;color:var(--text-muted);margin-top:2px">${escapeHtml(grupo?.nombre || '')}</div>
                          <div style="font-size:.65em;color:var(--text-muted)">Aula ${escapeHtml(c.aula || '—')}</div>
                        </td>`;
                    }).join('')}
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
      })()}
    </div>

    <div class="card" style="margin-top:var(--sp-4);padding:var(--sp-3) var(--sp-4);background:var(--bg-muted);border:none">
      <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted)">
        <i class="fas fa-lock" style="color:var(--c-brand-500)"></i>
        Esta es una vista de solo lectura. Para modificar tu información, contacta a Servicios Escolares.
      </div>
    </div>
  `;
}