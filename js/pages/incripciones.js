import { InscripcionesService, CatalogosService } from '../services/data.service.js';
import { UI, escapeHtml } from '../core/ui.js';
import { statusBadge } from '../components/status-badge.js';
import { PeriodSelector } from '../components/period-selector.js';

export async function renderInscripciones(container) {
  const grupos = await CatalogosService.grupos();
  const alumnos = await CatalogosService.alumnos();
  const sel = PeriodSelector.current;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-clipboard-list"></i> Inscripciones</h1>
        <p class="page-sub">Gestión de inscripciones · ${escapeHtml(sel.ciclo)} · ${escapeHtml(sel.periodo)}</p>
      </div>
      <button class="btn btn-primary" id="btnNueva">
        <i class="fas fa-plus"></i> Nueva inscripción
      </button>
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
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
      </div>
    </div>

    <div id="statsInsc"></div>
    <div class="table-wrap">
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Alumno</th>
              <th>Grupo</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const cargar = async () => {
    const tbody = container.querySelector('#tbody');
    const statsWrap = container.querySelector('#statsInsc');
    tbody.innerHTML = UI.skeletonRows(6, 5);

    const grupoId = container.querySelector('#f_grupo').value;
    let items = await InscripcionesService.todos();
    if (grupoId) items = items.filter((i) => i.grupoId === Number(grupoId));

    // Stats
    const inscritos = items.filter((i) => i.estado === 'Inscrito').length;
    const preinscritos = items.filter((i) => i.estado === 'Preinscrito').length;
    const bajas = items.filter((i) => i.estado === 'Baja').length;
    statsWrap.innerHTML = `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div><div class="stat-value">${items.length}</div><div class="stat-label">Total</div></div></div>
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-user-check"></i></div><div><div class="stat-value">${inscritos}</div><div class="stat-label">Inscritos</div></div></div>
        <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-user-plus"></i></div><div><div class="stat-value">${preinscritos}</div><div class="stat-label">Preinscritos</div></div></div>
        <div class="stat-card danger"><div class="stat-icon"><i class="fas fa-user-xmark"></i></div><div><div class="stat-value">${bajas}</div><div class="stat-label">Bajas</div></div></div>
      </div>`;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><i class="fas fa-clipboard-list"></i><h4>No hay inscripciones</h4><p>Crea una nueva inscripción para comenzar.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = items.map((i) => {
      const al = alumnos.find((a) => a.id === i.alumnoId);
      const gr = grupos.find((g) => g.id === i.grupoId);
      return `<tr>
        <td><code style="font-size:.8em;color:var(--text-secondary)">${escapeHtml(i.folio)}</code></td>
        <td><strong>${al ? escapeHtml(al.nombre + ' ' + al.apellidos) : '—'}</strong></td>
        <td>${gr ? escapeHtml(gr.nombre) : '—'}</td>
        <td>${i.fechaInscripcion}</td>
        <td>${statusBadge(i.estado)}</td>
        <td style="text-align:right">
          <button class="btn-icon" data-edit="${i.id}" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="btn-icon danger" data-del="${i.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => formInscripcion(Number(b.dataset.edit), alumnos, grupos, cargar)));
    tbody.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await UI.confirm({ title: 'Eliminar inscripción', message: '¿Eliminar esta inscripción?', danger: true });
      if (!ok) return;
      await InscripcionesService.eliminar(Number(b.dataset.del));
      UI.toast('Inscripción eliminada', 'success');
      cargar();
    }));
  };

  container.querySelector('#f_grupo').addEventListener('change', cargar);
  container.querySelector('#btnNueva').addEventListener('click', () => formInscripcion(null, alumnos, grupos, cargar));
  cargar();
}

async function formInscripcion(id, alumnos, grupos, onSave) {
  const sel = PeriodSelector.current;
  const i = id ? await InscripcionesService.obtener(id) : {
    alumnoId: alumnos[0]?.id || null,
    grupoId: grupos[0]?.id || null,
    ciclo: sel.ciclo,
    periodo: sel.periodo,
    fechaInscripcion: new Date().toISOString().slice(0, 10),
    estado: 'Preinscrito'
  };

  const { overlay, close } = UI.modal({
    title: id ? 'Editar inscripción' : 'Nueva inscripción',
    size: 'modal-lg',
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
        <div class="field" style="grid-column:1/-1">
          <label>Alumno *</label>
          <select class="select" id="i_alumno">
            ${alumnos.map((a) => `<option value="${a.id}" ${i.alumnoId === a.id ? 'selected' : ''}>${escapeHtml(a.matricula + ' · ' + a.nombre + ' ' + a.apellidos)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Grupo *</label>
          <select class="select" id="i_grupo">
            ${grupos.map((g) => `<option value="${g.id}" ${i.grupoId === g.id ? 'selected' : ''}>${escapeHtml(g.nombre)} · Aula ${escapeHtml(g.aula || '—')}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Fecha de inscripción</label>
          <input class="input" type="date" id="i_fecha" value="${i.fechaInscripcion}">
        </div>
        <div class="field">
          <label>Ciclo escolar</label>
          <input class="input" id="i_ciclo" value="${escapeHtml(i.ciclo)}">
        </div>
        <div class="field">
          <label>Periodo</label>
          <input class="input" id="i_periodo" value="${escapeHtml(i.periodo)}">
        </div>
        <div class="field">
          <label>Estado</label>
          <select class="select" id="i_estado">
            ${['Preinscrito', 'Inscrito', 'Baja', 'Finalizado'].map((e) => `<option ${i.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Folio</label>
          <input class="input" id="i_folio" value="${escapeHtml(i.folio || 'Se generará automáticamente')}" readonly>
        </div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" data-action="close">Cancelar</button>
      <button class="btn btn-primary" id="saveBtn"><i class="fas fa-floppy-disk"></i> ${id ? 'Actualizar' : 'Registrar'}</button>`
  });

  overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
    const data = {
      alumnoId: Number(overlay.querySelector('#i_alumno').value),
      grupoId: Number(overlay.querySelector('#i_grupo').value),
      fechaInscripcion: overlay.querySelector('#i_fecha').value,
      ciclo: overlay.querySelector('#i_ciclo').value.trim(),
      periodo: overlay.querySelector('#i_periodo').value.trim(),
      estado: overlay.querySelector('#i_estado').value
    };
    if (!data.alumnoId || !data.grupoId) { UI.toast('Selecciona alumno y grupo', 'warning'); return; }
    const btn = e.currentTarget;
    UI.buttonLoading(btn, true);
    try {
      if (id) await InscripcionesService.actualizar(id, data);
      else {
        const folio = 'INS-2026-' + String(Date.now()).slice(-4).padStart(4, '0');
        await InscripcionesService.crear({ ...data, folio });
      }
      UI.toast(id ? 'Inscripción actualizada' : 'Inscripción registrada', 'success');
      close();
      onSave?.();
    } catch (err) { UI.toast(err.message, 'error'); UI.buttonLoading(btn, false); }
  });
}