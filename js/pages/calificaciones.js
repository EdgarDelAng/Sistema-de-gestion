import { UI, escapeHtml } from '../core/ui.js';
import {
  CalificacionesService, GruposService, MateriasService,
  AlumnosService, KardexService
} from '../services/data.service.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';
import { Auth } from '../core/auth.js';
import { Validators, Validacion } from '../components/form-validator.js';
import { PeriodSelector } from '../components/period-selector.js';

const PARCIALES = [1, 2, 3];

export async function renderCalificaciones(container) {
  // ⬇️ Si es alumno, mostrar SOLO sus calificaciones
  if (Auth.hasRole('alumno')) {
    return renderMisCalificaciones(container);
  }

  const puedeEditar = Auth.hasRole('admin') || Auth.hasRole('profesor');
  const sel = PeriodSelector.current;

  const state = {
    grupoId: null, materiaId: null, periodo: null,
    datos: null, _grupos: null, _materias: null
  };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-chart-bar"></i> Calificaciones</h1>
        <p class="page-sub">Captura y consulta por grupo, materia y periodo · ${escapeHtml(sel.ciclo)}</p>
      </div>
      <div style="display:flex;gap:var(--sp-2)">
        <button class="btn btn-secondary" id="btnPrint" disabled>
          <i class="fas fa-print"></i> Imprimir
        </button>
        ${puedeEditar ? `
          <button class="btn btn-primary" id="btnCapturar" disabled>
            <i class="fas fa-pen-to-square"></i> Capturar notas
          </button>` : ''}
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-filter"></i> Filtros de consulta</h3>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--sp-4);align-items:end">
        <div class="field" style="margin:0">
          <label for="f_grupo">Grupo <span class="req">*</span></label>
          <select class="select" id="f_grupo">
            <option value="">Selecciona un grupo…</option>
          </select>
        </div>
        <div class="field" style="margin:0">
          <label for="f_materia">Materia <span class="req">*</span></label>
          <select class="select" id="f_materia">
            <option value="">Selecciona una materia…</option>
          </select>
        </div>
        <div class="field" style="margin:0">
          <label for="f_periodo">Periodo</label>
          <select class="select" id="f_periodo">
            <option value="">Todos los parciales</option>
            <option value="1">Solo Parcial 1</option>
            <option value="2">Solo Parcial 2</option>
            <option value="3">Solo Parcial 3</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btnConsultar" style="height:40px">
          <i class="fas fa-search"></i> Consultar
        </button>
      </div>
    </div>

    <div id="stats"></div>
    <div id="resultado"></div>
  `;

  const fGrupo = container.querySelector('#f_grupo');
  const fMateria = container.querySelector('#f_materia');
  const fPeriodo = container.querySelector('#f_periodo');
  const btnConsultar = container.querySelector('#btnConsultar');
  const btnCapturar = container.querySelector('#btnCapturar');
  const btnPrint = container.querySelector('#btnPrint');
  const statsWrap = container.querySelector('#stats');
  const resultadoWrap = container.querySelector('#resultado');

  // Para profesor, limitar grupos solo a los suyos
  let grupos = await GruposService.todos();
  if (Auth.hasRole('profesor')) {
    const { HorariosService } = await import('../services/data.service.js');
    const horarios = await HorariosService.porProfesor(Auth.user.profesorId);
    const misGruposIds = [...new Set(horarios.map((h) => h.grupoId))];
    grupos = grupos.filter((g) => misGruposIds.includes(g.id));
  }

  const materias = await MateriasService.todos();
  state._grupos = grupos;
  state._materias = materias;

  fGrupo.innerHTML = '<option value="">Selecciona un grupo…</option>' +
    grupos.map((g) => `<option value="${g.id}">${escapeHtml(g.nombre)} · Aula ${escapeHtml(g.aula || '—')}</option>`).join('');

  fMateria.innerHTML = '<option value="">Selecciona una materia…</option>' +
    materias.map((m) => `<option value="${m.id}">${escapeHtml(m.clave)} · ${escapeHtml(m.nombre)}</option>`).join('');

  renderEmpty();

  function renderEmpty() {
    statsWrap.innerHTML = '';
    resultadoWrap.innerHTML = `
      <div class="card">
        ${emptyState({
          icon: 'fa-chart-bar',
          title: 'Selecciona grupo y materia',
          message: 'Elige los filtros y presiona "Consultar" para ver las calificaciones.'
        })}
      </div>`;
  }

  async function consultar() {
    const grupoId = Number(fGrupo.value);
    const materiaId = Number(fMateria.value);
    const periodo = fPeriodo.value ? Number(fPeriodo.value) : null;

    if (!grupoId || !materiaId) {
      UI.toast('Selecciona grupo y materia para consultar', 'warning');
      return;
    }

    state.grupoId = grupoId;
    state.materiaId = materiaId;
    state.periodo = periodo;

    statsWrap.innerHTML = `<div class="skeleton-block" style="height:100px;margin-bottom:var(--sp-4)"></div>`;
    resultadoWrap.innerHTML = `<div class="card"><div class="skeleton-block" style="height:400px"></div></div>`;

    const grupo = state._grupos.find((g) => g.id === grupoId);
    const materia = state._materias.find((m) => m.id === materiaId);

    const datos = await CalificacionesService.porGrupoMateria(grupoId, materiaId);
    state.datos = datos;

    const db = (await import('../services/data.service.js'))._db();
    const profesorId = (db.materiaGrupo || []).find((mg) => mg.materiaId === materiaId && mg.grupoId === grupoId)?.profesorId;
    const profesores = await (await import('../services/data.service.js')).ProfesoresService.todos();
    const profesor = profesores.find((p) => p.id === profesorId);

    const conNotas = datos.filter((d) => d.promedio > 0);
    const promedioGeneral = conNotas.length ? conNotas.reduce((a, d) => a + d.promedio, 0) / conNotas.length : 0;
    const aprobados = conNotas.filter((d) => d.estado === 'Aprobado').length;
    const reprobados = conNotas.filter((d) => d.estado === 'Reprobado').length;
    const pctAprobacion = conNotas.length ? Math.round((aprobados / conNotas.length) * 100) : 0;

    const distribucion = { excelente: 0, bueno: 0, regular: 0, bajo: 0 };
    conNotas.forEach((d) => {
      if (d.promedio >= 9) distribucion.excelente++;
      else if (d.promedio >= 8) distribucion.bueno++;
      else if (d.promedio >= 6) distribucion.regular++;
      else distribucion.bajo++;
    });

    statsWrap.innerHTML = `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-chart-line"></i></div><div><div class="stat-value">${promedioGeneral.toFixed(2)}</div><div class="stat-label">Promedio del grupo</div></div></div>
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-circle-check"></i></div><div><div class="stat-value">${aprobados}</div><div class="stat-label">Aprobados</div></div></div>
        <div class="stat-card danger"><div class="stat-icon"><i class="fas fa-circle-xmark"></i></div><div><div class="stat-value">${reprobados}</div><div class="stat-label">Reprobados</div></div></div>
        <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-percent"></i></div><div><div class="stat-value">${pctAprobacion}%</div><div class="stat-label">Tasa de aprobación</div></div></div>
      </div>
    `;

    const distribucionHTML = `
      <div class="card" style="margin-bottom:var(--sp-4);padding:var(--sp-4)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--sp-3)">
          <div style="padding:var(--sp-3);border-radius:var(--r-md);background:rgba(16,185,129,.08);border-left:4px solid var(--c-success)">
            <div style="font-size:var(--fs-xs);color:var(--c-success-fg);font-weight:600;text-transform:uppercase">Excelente (9-10)</div>
            <div style="font-size:var(--fs-xl);font-weight:800;color:var(--c-success-fg);margin-top:4px">${distribucion.excelente}</div>
          </div>
          <div style="padding:var(--sp-3);border-radius:var(--r-md);background:rgba(37,99,235,.08);border-left:4px solid var(--c-brand-500)">
            <div style="font-size:var(--fs-xs);color:var(--c-brand-500);font-weight:600;text-transform:uppercase">Bueno (8-9)</div>
            <div style="font-size:var(--fs-xl);font-weight:800;color:var(--c-brand-500);margin-top:4px">${distribucion.bueno}</div>
          </div>
          <div style="padding:var(--sp-3);border-radius:var(--r-md);background:rgba(217,119,6,.08);border-left:4px solid var(--c-warning)">
            <div style="font-size:var(--fs-xs);color:var(--c-warning-fg);font-weight:600;text-transform:uppercase">Regular (6-8)</div>
            <div style="font-size:var(--fs-xl);font-weight:800;color:var(--c-warning-fg);margin-top:4px">${distribucion.regular}</div>
          </div>
          <div style="padding:var(--sp-3);border-radius:var(--r-md);background:rgba(220,38,38,.08);border-left:4px solid var(--c-danger)">
            <div style="font-size:var(--fs-xs);color:var(--c-danger-fg);font-weight:600;text-transform:uppercase">Bajo (<6)</div>
            <div style="font-size:var(--fs-xl);font-weight:800;color:var(--c-danger-fg);margin-top:4px">${distribucion.bajo}</div>
          </div>
        </div>
      </div>`;

    const tablaHTML = `
      <div class="table-wrap">
        <div class="table-toolbar">
          <div style="display:flex;align-items:center;gap:var(--sp-3);flex:1;flex-wrap:wrap">
            <span class="badge badge-info">${escapeHtml(grupo.nombre)}</span>
            <span class="badge badge-neutral">${escapeHtml(materia.nombre)}</span>
            ${profesor ? `<span class="badge badge-neutral"><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(profesor.nombre + ' ' + profesor.apellidos)}</span>` : ''}
          </div>
          <div class="input-icon" style="max-width:240px">
            <i class="fas fa-search"></i>
            <input type="search" class="input" id="buscarAlumnoCalif" placeholder="Buscar alumno…">
          </div>
        </div>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>Alumno</th>
                <th style="text-align:center">Matrícula</th>
                <th style="text-align:center">Parcial 1</th>
                <th style="text-align:center">Parcial 2</th>
                <th style="text-align:center">Parcial 3</th>
                <th style="text-align:center">Promedio</th>
                <th style="text-align:center">Estado</th>
                ${puedeEditar ? '<th style="text-align:right">Acciones</th>' : ''}
              </tr>
            </thead>
            <tbody id="tbodyCalifs"></tbody>
          </table>
        </div>
      </div>`;

    resultadoWrap.innerHTML = distribucionHTML + tablaHTML;

    btnCapturar.disabled = false;
    btnPrint.disabled = false;

    const tbody = resultadoWrap.querySelector('#tbodyCalifs');
    const renderFilas = (lista) => {
      tbody.innerHTML = lista.length
        ? lista.map((d, i) => filaCalif(d, i + 1, puedeEditar)).join('')
        : `<tr><td colspan="${puedeEditar ? 9 : 8}"><div class="empty" style="padding:var(--sp-5)"><i class="fas fa-search"></i><p>Sin resultados</p></div></td></tr>`;
      engancharFilas();
    };
    renderFilas(datos);

    resultadoWrap.querySelector('#buscarAlumnoCalif').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = datos.filter((d) =>
        `${d.alumno.nombre} ${d.alumno.apellidos} ${d.alumno.matricula}`.toLowerCase().includes(q)
      );
      renderFilas(filtered);
    });

    function engancharFilas() {
      if (!puedeEditar) return;
      tbody.querySelectorAll('[data-editar]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const alumnoId = Number(btn.dataset.editar);
          const alumnoData = datos.find((d) => d.alumno.id === alumnoId);
          editarNotasAlumno(alumnoData, materia, () => consultar());
        });
      });
      tbody.querySelectorAll('tr[data-alumno]').forEach((tr) => {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', (e) => {
          if (e.target.closest('[data-editar]')) return;
          const alumnoId = Number(tr.dataset.alumno);
          const alumnoData = datos.find((d) => d.alumno.id === alumnoId);
          verDetalleAlumno(alumnoData, materia, grupo);
        });
      });
    }
  }

  function filaCalif(d, idx, puedeEditar) {
    const initials = (d.alumno.nombre[0] + d.alumno.apellidos[0]).toUpperCase();
    const promClass = d.promedio >= 8 ? 'success' : d.promedio >= 6 ? 'warning' : d.promedio > 0 ? 'danger' : 'neutral';
    const notaCell = (nota) => {
      if (nota == null) return `<td style="text-align:center"><span style="color:var(--text-muted);font-size:var(--fs-xs)">—</span></td>`;
      const cls = nota >= 8 ? 'success' : nota >= 6 ? 'warning' : 'danger';
      return `<td style="text-align:center"><span class="badge badge-${cls}" style="font-size:.75rem;font-weight:700">${nota.toFixed(1)}</span></td>`;
    };
    return `
      <tr data-alumno="${d.alumno.id}">
        <td style="color:var(--text-muted);font-size:var(--fs-xs)">${idx}</td>
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.68rem;flex-shrink:0">
              ${initials}
            </div>
            <strong>${escapeHtml(d.alumno.nombre + ' ' + d.alumno.apellidos)}</strong>
          </div>
        </td>
        <td style="text-align:center"><code style="font-size:.8em;color:var(--text-secondary)">${escapeHtml(d.alumno.matricula)}</code></td>
        ${notaCell(d.notas[1])}
        ${notaCell(d.notas[2])}
        ${notaCell(d.notas[3])}
        <td style="text-align:center"><span class="badge badge-${promClass}" style="font-size:.8rem;font-weight:800">${d.promedio ? d.promedio.toFixed(1) : '—'}</span></td>
        <td style="text-align:center">${statusBadge(d.estado)}</td>
        ${puedeEditar ? `<td style="text-align:right"><button class="btn-icon" data-editar="${d.alumno.id}" title="Editar notas"><i class="fas fa-pen"></i></button></td>` : ''}
      </tr>`;
  }

  function editarNotasAlumno(d, materia, onSave) {
    const { overlay, close } = UI.modal({
      title: `Editar notas · ${d.alumno.nombre}`,
      body: `
        <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);margin-bottom:var(--sp-4)">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.9rem;flex-shrink:0">
            ${(d.alumno.nombre[0] + d.alumno.apellidos[0]).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;color:var(--c-brand-900)">${escapeHtml(d.alumno.nombre + ' ' + d.alumno.apellidos)}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">${escapeHtml(d.alumno.matricula)} · ${escapeHtml(materia.nombre)}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-4)">
          ${PARCIALES.map((p) => `
            <div class="field" style="margin:0">
              <label>Parcial ${p}</label>
              <input class="input" type="number" min="1" max="10" step="0.1" id="nota_p${p}" value="${d.notas[p] ?? ''}" placeholder="—" style="text-align:center;font-size:1.2rem;font-weight:700">
            </div>`).join('')}
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="saveBtn"><i class="fas fa-floppy-disk"></i> Guardar notas</button>`
    });

    Validacion.bind(overlay, {
      nota_p1: [Validators.number, Validators.min(1), Validators.max(10)],
      nota_p2: [Validators.number, Validators.min(1), Validators.max(10)],
      nota_p3: [Validators.number, Validators.min(1), Validators.max(10)]
    });

    overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
      const valido = Validacion.validar(overlay, {
        nota_p1: [Validators.number, Validators.min(1), Validators.max(10)],
        nota_p2: [Validators.number, Validators.min(1), Validators.max(10)],
        nota_p3: [Validators.number, Validators.min(1), Validators.max(10)]
      });
      if (!valido) { UI.toast('Revisa las notas marcadas en rojo', 'warning'); return; }

      const notas = {};
      PARCIALES.forEach((p) => {
        const v = overlay.querySelector(`#nota_p${p}`).value.trim();
        notas[p] = v === '' ? null : parseFloat(v);
      });

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      try {
        await CalificacionesService.guardarNotas(d.alumno.id, materia.id, notas);
        UI.toast('Notas guardadas correctamente', 'success');
        close();
        onSave?.();
      } catch (err) {
        UI.toast(err.message, 'error');
        UI.buttonLoading(btn, false);
      }
    });
  }

  async function verDetalleAlumno(d, materia, grupo) {
    const { overlay } = UI.modal({
      title: 'Información del alumno',
      size: 'modal-lg',
      body: `
        <div style="display:flex;align-items:center;gap:var(--sp-4);padding-bottom:var(--sp-4);border-bottom:1px solid var(--border);margin-bottom:var(--sp-4)">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
            ${(d.alumno.nombre[0] + d.alumno.apellidos[0]).toUpperCase()}
          </div>
          <div style="flex:1">
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">${escapeHtml(d.alumno.nombre + ' ' + d.alumno.apellidos)}</div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
              <code>${escapeHtml(d.alumno.matricula)}</code> · ${escapeHtml(grupo.nombre)}
            </div>
          </div>
          <div style="text-align:right">
            ${statusBadge(d.estado)}
            <div style="margin-top:6px;font-size:var(--fs-xs);color:var(--text-muted)">Promedio</div>
            <div style="font-size:var(--fs-xl);font-weight:800;color:${d.promedio >= 6 ? 'var(--c-success-fg)' : 'var(--c-danger-fg)'}">${d.promedio ? d.promedio.toFixed(1) : '—'}</div>
          </div>
        </div>
        <h4 style="font-size:var(--fs-sm);font-weight:700;color:var(--c-brand-900);margin-bottom:var(--sp-3)">
          <i class="fas fa-chart-bar"></i> Calificaciones en ${escapeHtml(materia.nombre)}
        </h4>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-4)">
          ${PARCIALES.map((p) => {
            const nota = d.notas[p];
            const cls = nota == null ? 'text-muted' : nota >= 8 ? 'c-success-fg' : nota >= 6 ? 'c-warning-fg' : 'c-danger-fg';
            return `
              <div style="padding:var(--sp-3);border-radius:var(--r-md);background:var(--bg-muted);text-align:center">
                <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Parcial ${p}</div>
                <div style="font-size:var(--fs-2xl);font-weight:800;margin-top:4px;color:var(--${cls})">${nota != null ? nota.toFixed(1) : '—'}</div>
              </div>`;
          }).join('')}
        </div>`
    });
  }

  btnConsultar.addEventListener('click', consultar);
  if (btnCapturar) btnCapturar.addEventListener('click', () => {
    if (!state.datos || !state.datos.length) { UI.toast('Primero consulta', 'warning'); return; }
    capturarTodos();
  });
  btnPrint.addEventListener('click', () => window.print());

  async function capturarTodos() {
    const materia = state._materias.find((m) => m.id === state.materiaId);
    const grupo = state._grupos.find((g) => g.id === state.grupoId);

    const { overlay, close } = UI.modal({
      title: `Capturar notas · ${grupo.nombre} · ${materia.nombre}`,
      size: 'modal-lg',
      body: `
        <div class="table-scroll" style="max-height:500px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r-md)">
          <table class="table" style="font-size:var(--fs-sm)">
            <thead style="position:sticky;top:0;z-index:1">
              <tr><th>Alumno</th><th style="text-align:center">P1</th><th style="text-align:center">P2</th><th style="text-align:center">P3</th></tr>
            </thead>
            <tbody>
              ${state.datos.map((d) => `
                <tr>
                  <td><span style="font-weight:600">${escapeHtml(d.alumno.nombre + ' ' + d.alumno.apellidos)}</span></td>
                  ${PARCIALES.map((p) => `
                    <td style="text-align:center">
                      <input type="number" min="1" max="10" step="0.1" class="input" data-alumno="${d.alumno.id}" data-periodo="${p}" value="${d.notas[p] ?? ''}" placeholder="—" style="text-align:center;font-weight:700;height:34px;padding:0 6px;width:70px">
                    </td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="saveAllBtn"><i class="fas fa-floppy-disk"></i> Guardar todas</button>`
    });

    overlay.querySelector('#saveAllBtn').addEventListener('click', async (e) => {
      const inputs = overlay.querySelectorAll('input[data-alumno]');
      const porAlumno = {};
      inputs.forEach((inp) => {
        const aid = Number(inp.dataset.alumno);
        const p = Number(inp.dataset.periodo);
        if (!porAlumno[aid]) porAlumno[aid] = {};
        porAlumno[aid][p] = inp.value.trim();
      });
      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      try {
        for (const [aid, notas] of Object.entries(porAlumno)) {
          await CalificacionesService.guardarNotas(Number(aid), state.materiaId, notas);
        }
        UI.toast('Notas guardadas', 'success');
        close();
        consultar();
      } catch (err) { UI.toast(err.message, 'error'); }
      UI.buttonLoading(btn, false);
    });
  }
}

// ============================================================
// VISTA DE "MIS CALIFICACIONES" — Solo para alumno
// ============================================================
async function renderMisCalificaciones(container) {
  const alumnoId = Auth.user.alumnoId;
  if (!alumnoId) {
    container.innerHTML = `
      <div class="card" style="padding:var(--sp-6);text-align:center">
        <i class="fas fa-triangle-exclamation" style="font-size:2.5rem;color:var(--c-danger);opacity:.5"></i>
        <h3 style="margin-top:var(--sp-3);color:var(--c-brand-900)">Sin ficha de alumno</h3>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--sp-2)">Contacta a Servicios Escolares.</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;

  const k = await KardexService.porAlumno(alumnoId);

  if (!k.filas.length) {
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-title"><i class="fas fa-chart-bar"></i> Mis calificaciones</h1>
          <p class="page-sub">Consulta tus notas por materia</p>
        </div>
      </div>
      <div class="card">${emptyState({ icon: 'fa-chart-bar', title: 'Sin calificaciones', message: 'Aún no tienes calificaciones registradas.' })}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-chart-bar"></i> Mis calificaciones</h1>
        <p class="page-sub">Consulta tus notas por materia y parcial</p>
      </div>
      <button class="btn btn-secondary" id="btnPrint"><i class="fas fa-print"></i> Imprimir</button>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4);background:linear-gradient(135deg, rgba(37,99,235,.08), rgba(20,184,166,.08))">
      <div style="display:flex;gap:var(--sp-4);align-items:center;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
          ${(k.alumno.nombre[0] + k.alumno.apellidos[0]).toUpperCase()}
        </div>
        <div style="flex:1">
          <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">${escapeHtml(k.alumno.nombre + ' ' + k.alumno.apellidos)}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
            <code>${escapeHtml(k.alumno.matricula)}</code> · ${escapeHtml(k.alumno.grado)}
          </div>
        </div>
        <div style="text-align:right">
          ${statusBadge(k.estado)}
          <div style="margin-top:6px;font-size:var(--fs-xs);color:var(--text-muted)">Promedio general</div>
          <div style="font-size:var(--fs-2xl);font-weight:800;color:var(--c-brand-500)">${k.promedioGeneral.toFixed(2)}</div>
        </div>
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom:var(--sp-4)">
      <div class="stat-card success"><div class="stat-icon"><i class="fas fa-chart-line"></i></div><div><div class="stat-value">${k.promedioGeneral.toFixed(2)}</div><div class="stat-label">Promedio</div></div></div>
      <div class="stat-card"><div class="stat-icon"><i class="fas fa-book"></i></div><div><div class="stat-value">${k.materiasCursadas}</div><div class="stat-label">Materias</div></div></div>
      <div class="stat-card success"><div class="stat-icon"><i class="fas fa-circle-check"></i></div><div><div class="stat-value">${k.materiasAprobadas}</div><div class="stat-label">Aprobadas</div></div></div>
      <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-award"></i></div><div><div class="stat-value">${k.creditosAprobados}/${k.creditosCursados}</div><div class="stat-label">Créditos</div></div></div>
    </div>

    <div class="table-wrap">
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Materia</th>
              <th style="text-align:center">Parcial 1</th>
              <th style="text-align:center">Parcial 2</th>
              <th style="text-align:center">Parcial 3</th>
              <th style="text-align:center">Promedio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${k.filas.map((f) => {
              const promClass = f.promedio >= 8 ? 'success' : f.promedio >= 6 ? 'warning' : 'danger';
              const notaCell = (nota) => {
                if (nota == null) return `<td style="text-align:center"><span style="color:var(--text-muted)">—</span></td>`;
                const cls = nota >= 8 ? 'success' : nota >= 6 ? 'warning' : 'danger';
                return `<td style="text-align:center"><span class="badge badge-${cls}" style="font-size:.8rem;font-weight:700">${nota.toFixed(1)}</span></td>`;
              };
              return `
                <tr>
                  <td><code style="font-size:.8em">${escapeHtml(f.materia?.clave || '—')}</code></td>
                  <td><strong>${escapeHtml(f.materia?.nombre || '—')}</strong></td>
                  ${notaCell(f.notas[1])}
                  ${notaCell(f.notas[2])}
                  ${notaCell(f.notas[3])}
                  <td style="text-align:center"><span class="badge badge-${promClass}" style="font-size:.85rem;font-weight:800">${f.promedio.toFixed(1)}</span></td>
                  <td>${statusBadge(f.estado)}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:var(--sp-4);padding:var(--sp-3) var(--sp-4);background:var(--bg-muted);border:none">
      <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted)">
        <i class="fas fa-lock" style="color:var(--c-brand-500)"></i>
        Vista de solo lectura. Esta información es exclusivamente tuya.
      </div>
    </div>
  `;

  container.querySelector('#btnPrint')?.addEventListener('click', () => window.print());
}