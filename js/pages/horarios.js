import { HorariosService, GruposService, ProfesoresService, CatalogosService } from '../services/data.service.js';
import { UI, escapeHtml } from '../core/ui.js';
import { emptyState } from '../components/loading.js';
import { Auth } from '../core/auth.js';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

export async function renderHorarios(container) {
  // ⬇️ Si es alumno, mostrar SOLO su horario
  if (Auth.hasRole('alumno')) {
    return renderMiHorario(container);
  }

  let vista = 'general';

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-clock"></i> Horarios</h1>
        <p class="page-sub">Consulta horarios generales, por grupo o por profesor</p>
      </div>
      ${Auth.hasRole('admin') ? `
        <button class="btn btn-primary" id="btnAgregar"><i class="fas fa-plus"></i> Agregar clase</button>
      ` : ''}
    </div>

    <div class="panel-tabs">
      <button class="panel-tab ${Auth.hasRole('profesor') ? '' : 'active'}" data-vista="general" style="${Auth.hasRole('profesor') ? 'display:none' : ''}">
        <i class="fas fa-table-cells"></i> Horario general
      </button>
      <button class="panel-tab ${Auth.hasRole('profesor') ? 'active' : ''}" data-vista="grupos">
        <i class="fas fa-users"></i> Por grupo
      </button>
      <button class="panel-tab" data-vista="profesores">
        <i class="fas fa-chalkboard-teacher"></i> Por profesor
      </button>
    </div>

    <div id="vistaWrap"></div>
  `;

  const wrap = container.querySelector('#vistaWrap');
  if (Auth.hasRole('profesor')) vista = 'grupos';

  async function renderVista() {
    wrap.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;
    if (vista === 'general') return renderGeneral();
    if (vista === 'grupos') return renderPorGrupo();
    if (vista === 'profesores') return renderPorProfesor();
  }

  async function renderGeneral() {
    const grupos = await GruposService.todos();
    const materias = await CatalogosService.materias();
    const profesores = await ProfesoresService.todos();
    const todos = await HorariosService.todos();

    if (!todos.length) {
      wrap.innerHTML = emptyState({ icon: 'fa-calendar-xmark', title: 'Sin clases registradas' });
      return;
    }

    wrap.innerHTML = `
      <div class="card" style="margin-bottom:var(--sp-4);padding:var(--sp-3)">
        <div style="font-size:var(--fs-sm);color:var(--text-secondary);text-align:center">
          <i class="fas fa-info-circle" style="color:var(--c-brand-500)"></i>
          Vista general · ${todos.length} clases programadas en ${grupos.length} grupos
        </div>
      </div>
      ${grupos.map((g) => {
        const horariosGrupo = todos.filter((h) => h.grupoId === g.id);
        if (!horariosGrupo.length) return '';
        return `
          <div class="card" style="margin-bottom:var(--sp-4)">
            <div class="card-header">
              <h3 class="card-title"><i class="fas fa-users"></i> ${escapeHtml(g.nombre)} <span class="badge badge-info" style="margin-left:var(--sp-2)">Aula ${escapeHtml(g.aula || '—')}</span></h3>
            </div>
            <div class="table-scroll">
              <table class="table" style="font-size:var(--fs-sm)">
                <thead><tr><th>Hora</th>${DIAS.map((d) => `<th style="text-align:center">${d}</th>`).join('')}</tr></thead>
                <tbody>
                  ${HORAS.map((hora) => `
                    <tr>
                      <td><strong>${hora}</strong></td>
                      ${DIAS.map((dia) => {
                        const c = horariosGrupo.find((h) => h.dia === dia && h.horaInicio === hora);
                        if (!c) return `<td style="text-align:center;color:var(--text-muted)">—</td>`;
                        const mat = materias.find((m) => m.id === c.materiaId);
                        const prof = profesores.find((p) => p.id === c.profesorId);
                        return `<td style="text-align:center;background:rgba(37,99,235,.05);padding:6px">
                          <div style="font-weight:700;color:var(--c-brand-500);font-size:.8em">${escapeHtml(mat?.nombre || '—')}</div>
                          <div style="font-size:.68em;color:var(--text-muted);margin-top:2px">${escapeHtml(prof ? prof.nombre + ' ' + prof.apellidos : 'Sin asignar')}</div>
                        </td>`;
                      }).join('')}
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      }).join('')}
    `;
  }

  async function renderPorGrupo() {
    let grupos = await GruposService.todos();
    // Si es profesor, mostrar solo sus grupos
    if (Auth.hasRole('profesor')) {
      const horarios = await HorariosService.porProfesor(Auth.user.profesorId);
      const misGruposIds = [...new Set(horarios.map((h) => h.grupoId))];
      grupos = grupos.filter((g) => misGruposIds.includes(g.id));
    }

    wrap.innerHTML = `
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-users"></i> Selecciona un grupo</h3></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--sp-3)" id="gruposGrid">
          ${grupos.map((g) => `
            <div class="grupo-card" data-grupo="${g.id}">
              <div class="grupo-icon"><i class="fas fa-users"></i></div>
              <div class="grupo-info">
                <div class="grupo-name">${escapeHtml(g.nombre)}</div>
                <div class="grupo-meta">Aula ${escapeHtml(g.aula || '—')}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div id="horarioDetalle"></div>
    `;

    const detalle = wrap.querySelector('#horarioDetalle');

    wrap.querySelectorAll('[data-grupo]').forEach((card) => {
      card.addEventListener('click', async () => {
        wrap.querySelectorAll('.grupo-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        const grupoId = Number(card.dataset.grupo);
        const grupo = grupos.find((g) => g.id === grupoId);
        detalle.innerHTML = `<div class="skeleton-block" style="height:300px"></div>`;

        const horarios = await HorariosService.porGrupo(grupoId);
        const materias = await CatalogosService.materias();
        const profesores = await ProfesoresService.todos();

        if (!horarios.length) {
          detalle.innerHTML = emptyState({ icon: 'fa-calendar-xmark', title: `Sin horario para ${grupo.nombre}` });
          return;
        }

        detalle.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i class="fas fa-calendar-week"></i> Horario · ${escapeHtml(grupo.nombre)}</h3>
            </div>
            <div class="table-scroll">
              <table class="table" style="font-size:var(--fs-sm)">
                <thead><tr><th>Hora</th>${DIAS.map((d) => `<th style="text-align:center">${d}</th>`).join('')}</tr></thead>
                <tbody>
                  ${HORAS.map((hora) => `
                    <tr>
                      <td><strong>${hora}</strong></td>
                      ${DIAS.map((dia) => {
                        const c = horarios.find((h) => h.dia === dia && h.horaInicio === hora);
                        if (!c) return `<td style="text-align:center;color:var(--text-muted)">—</td>`;
                        const mat = materias.find((m) => m.id === c.materiaId);
                        const prof = profesores.find((p) => p.id === c.profesorId);
                        return `<td style="text-align:center;background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(20,184,166,.08));padding:8px;border-radius:var(--r-sm)">
                          <div style="font-weight:700;color:var(--c-brand-500);font-size:.82em">${escapeHtml(mat?.nombre || '—')}</div>
                          <div style="font-size:.68em;color:var(--text-muted);margin-top:2px">${escapeHtml(prof ? prof.nombre + ' ' + prof.apellidos : '—')}</div>
                          <div style="font-size:.65em;color:var(--text-muted)">Aula ${escapeHtml(c.aula || '—')}</div>
                        </td>`;
                      }).join('')}
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      });
    });
  }

  async function renderPorProfesor() {
    const profesores = await ProfesoresService.todos();

    wrap.innerHTML = `
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-chalkboard-teacher"></i> Selecciona un profesor</h3></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--sp-3)" id="profsGrid">
          ${profesores.map((p) => `
            <div class="grupo-card" data-prof="${p.id}">
              <div class="grupo-icon" style="background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500))"><i class="fas fa-chalkboard-teacher"></i></div>
              <div class="grupo-info">
                <div class="grupo-name">${escapeHtml(p.nombre + ' ' + p.apellidos)}</div>
                <div class="grupo-meta">${escapeHtml(p.area)}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div id="horarioDetalleP"></div>
    `;

    const detalle = wrap.querySelector('#horarioDetalleP');

    wrap.querySelectorAll('[data-prof]').forEach((card) => {
      card.addEventListener('click', async () => {
        wrap.querySelectorAll('.grupo-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        const profId = Number(card.dataset.prof);
        const prof = profesores.find((p) => p.id === profId);
        detalle.innerHTML = `<div class="skeleton-block" style="height:300px"></div>`;

        const horarios = await HorariosService.porProfesor(profId);
        const materias = await CatalogosService.materias();
        const grupos = await GruposService.todos();

        if (!horarios.length) {
          detalle.innerHTML = emptyState({ icon: 'fa-calendar-xmark', title: `Sin clases asignadas` });
          return;
        }

        detalle.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i class="fas fa-calendar-week"></i> Horario · ${escapeHtml(prof.nombre + ' ' + prof.apellidos)}</h3>
              <span class="badge badge-info">${horarios.length} clases/semana</span>
            </div>
            <div class="table-scroll">
              <table class="table" style="font-size:var(--fs-sm)">
                <thead><tr><th>Hora</th>${DIAS.map((d) => `<th style="text-align:center">${d}</th>`).join('')}</tr></thead>
                <tbody>
                  ${HORAS.map((hora) => `
                    <tr>
                      <td><strong>${hora}</strong></td>
                      ${DIAS.map((dia) => {
                        const c = horarios.find((h) => h.dia === dia && h.horaInicio === hora);
                        if (!c) return `<td style="text-align:center;color:var(--text-muted)">—</td>`;
                        const mat = materias.find((m) => m.id === c.materiaId);
                        const gr = grupos.find((g) => g.id === c.grupoId);
                        return `<td style="text-align:center;background:linear-gradient(135deg,rgba(20,184,166,.1),rgba(37,99,235,.08));padding:8px;border-radius:var(--r-sm)">
                          <div style="font-weight:700;color:var(--c-accent-600);font-size:.82em">${escapeHtml(mat?.nombre || '—')}</div>
                          <div style="font-size:.68em;color:var(--text-muted);margin-top:2px">${escapeHtml(gr?.nombre || '—')}</div>
                        </td>`;
                      }).join('')}
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      });
    });
  }

  container.querySelectorAll('[data-vista]').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.panel-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      vista = tab.dataset.vista;
      renderVista();
    });
  });

  const btnAgregar = container.querySelector('#btnAgregar');
  if (btnAgregar) btnAgregar.addEventListener('click', () => formClase(null, () => renderVista()));

  renderVista();
}

async function formClase(id, onSave) {
  const grupos = await GruposService.todos();
  const profesores = await ProfesoresService.todos();
  const materias = await CatalogosService.materias();
  const h = id ? await HorariosService.obtener(id) : {
    dia: 'Lunes', horaInicio: '08:00', horaFin: '09:00',
    materiaId: materias[0]?.id, grupoId: grupos[0]?.id, profesorId: null, aula: ''
  };

  const { overlay, close } = UI.modal({
    title: id ? 'Editar clase' : 'Agregar clase',
    size: 'modal-lg',
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
        <div class="field"><label>Día</label>
          <select class="select" id="h_dia">${['Lunes','Martes','Miércoles','Jueves','Viernes'].map((d) => `<option ${h.dia === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Aula</label><input class="input" id="h_aula" value="${h.aula || ''}"></div>
        <div class="field"><label>Hora inicio</label><input class="input" type="time" id="h_ini" value="${h.horaInicio}"></div>
        <div class="field"><label>Hora fin</label><input class="input" type="time" id="h_fin" value="${h.horaFin}"></div>
        <div class="field"><label>Materia</label>
          <select class="select" id="h_mat">${materias.map((m) => `<option value="${m.id}" ${h.materiaId === m.id ? 'selected' : ''}>${escapeHtml(m.nombre)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Grupo</label>
          <select class="select" id="h_grupo">${grupos.map((g) => `<option value="${g.id}" ${h.grupoId === g.id ? 'selected' : ''}>${escapeHtml(g.nombre)}</option>`).join('')}</select>
        </div>
        <div class="field" style="grid-column:1/-1"><label>Profesor</label>
          <select class="select" id="h_prof">
            <option value="">Sin asignar</option>
            ${profesores.map((p) => `<option value="${p.id}" ${h.profesorId === p.id ? 'selected' : ''}>${escapeHtml(p.nombre + ' ' + p.apellidos)}</option>`).join('')}
          </select>
        </div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" data-action="close">Cancelar</button>
      <button class="btn btn-primary" id="saveBtn"><i class="fas fa-floppy-disk"></i> ${id ? 'Actualizar' : 'Agregar'}</button>`
  });

  overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
    const data = {
      dia: overlay.querySelector('#h_dia').value,
      horaInicio: overlay.querySelector('#h_ini').value,
      horaFin: overlay.querySelector('#h_fin').value,
      materiaId: Number(overlay.querySelector('#h_mat').value),
      grupoId: Number(overlay.querySelector('#h_grupo').value),
      profesorId: overlay.querySelector('#h_prof').value ? Number(overlay.querySelector('#h_prof').value) : null,
      aula: overlay.querySelector('#h_aula').value.trim()
    };
    const btn = e.currentTarget;
    UI.buttonLoading(btn, true);
    try {
      if (id) await HorariosService.actualizar(id, data);
      else await HorariosService.crear(data);
      UI.toast(id ? 'Clase actualizada' : 'Clase agregada', 'success');
      close();
      onSave?.();
    } catch (err) { UI.toast(err.message, 'error'); UI.buttonLoading(btn, false); }
  });
}

// ============================================================
// VISTA DE "MI HORARIO" — Solo para alumno
// ============================================================
async function renderMiHorario(container) {
  const alumnoId = Auth.user.alumnoId;
  if (!alumnoId) {
    container.innerHTML = `<div class="card" style="padding:var(--sp-6);text-align:center">
      <i class="fas fa-triangle-exclamation" style="font-size:2.5rem;color:var(--c-danger);opacity:.5"></i>
      <h3 style="margin-top:var(--sp-3);color:var(--c-brand-900)">Sin ficha de alumno</h3>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;

  const { AlumnosService } = await import('../services/data.service.js');
  const alumno = await AlumnosService.obtener(alumnoId);
  const grupo = alumno.grupoId ? await GruposService.obtener(alumno.grupoId).catch(() => null) : null;

  if (!grupo) {
    container.innerHTML = `
      <div class="page-head">
        <div><h1 class="page-title"><i class="fas fa-clock"></i> Mi horario</h1><p class="page-sub">Tu horario semanal</p></div>
      </div>
      <div class="card">${emptyState({ icon: 'fa-calendar-xmark', title: 'Sin grupo asignado', message: 'Contacta a Servicios Escolares.' })}</div>`;
    return;
  }

  const horarios = await HorariosService.porGrupo(grupo.id);
  const materias = await CatalogosService.materias();
  const profesores = await ProfesoresService.todos();

  if (!horarios.length) {
    container.innerHTML = `
      <div class="page-head">
        <div><h1 class="page-title"><i class="fas fa-clock"></i> Mi horario</h1><p class="page-sub">Tu horario semanal</p></div>
      </div>
      <div class="card">${emptyState({ icon: 'fa-calendar-xmark', title: 'Sin clases programadas' })}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-clock"></i> Mi horario</h1>
        <p class="page-sub">Tu horario semanal · Grupo ${escapeHtml(grupo.nombre)}</p>
      </div>
      <button class="btn btn-secondary" id="btnPrint"><i class="fas fa-print"></i> Imprimir</button>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4);background:linear-gradient(135deg, rgba(37,99,235,.08), rgba(20,184,166,.08))">
      <div style="display:flex;gap:var(--sp-4);align-items:center;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
          ${(alumno.nombre[0] + alumno.apellidos[0]).toUpperCase()}
        </div>
        <div style="flex:1">
          <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">${escapeHtml(alumno.nombre + ' ' + alumno.apellidos)}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
            <code>${escapeHtml(alumno.matricula)}</code> · Grupo ${escapeHtml(grupo.nombre)} · Aula ${escapeHtml(grupo.aula || '—')}
          </div>
        </div>
        <span class="badge badge-info">${horarios.length} clases/semana</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-calendar-week"></i> Horario semanal</h3>
      </div>
      <div class="table-scroll">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead>
            <tr>
              <th style="text-align:left">Hora</th>
              ${DIAS.map((d) => `<th style="text-align:center">${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${HORAS.map((hora) => `
              <tr>
                <td><strong>${hora}</strong></td>
                ${DIAS.map((dia) => {
                  const c = horarios.find((h) => h.dia === dia && h.horaInicio === hora);
                  if (!c) return `<td style="text-align:center;color:var(--text-muted)">—</td>`;
                  const mat = materias.find((m) => m.id === c.materiaId);
                  const prof = profesores.find((p) => p.id === c.profesorId);
                  return `<td style="text-align:center;background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(20,184,166,.08));padding:8px;border-radius:var(--r-sm)">
                    <div style="font-weight:700;color:var(--c-brand-500);font-size:.82em">${escapeHtml(mat?.nombre || '—')}</div>
                    <div style="font-size:.68em;color:var(--text-muted);margin-top:2px">${escapeHtml(prof ? prof.nombre + ' ' + prof.apellidos : '—')}</div>
                    <div style="font-size:.65em;color:var(--text-muted)">Aula ${escapeHtml(c.aula || '—')}</div>
                  </td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:var(--sp-4);padding:var(--sp-3) var(--sp-4);background:var(--bg-muted);border:none">
      <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted)">
        <i class="fas fa-lock" style="color:var(--c-brand-500)"></i>
        Vista de solo lectura. Este horario es exclusivamente de tu grupo.
      </div>
    </div>
  `;

  container.querySelector('#btnPrint')?.addEventListener('click', () => window.print());
}