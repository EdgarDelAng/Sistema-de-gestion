import { AvisosService } from '../services/data.service.js';
import { UI, escapeHtml } from '../core/ui.js';
import { Auth } from '../core/auth.js';
import { Validators, Validacion } from '../components/form-validator.js';
import { emptyState } from '../components/loading.js';
import { statusBadge } from '../components/status-badge.js';

const PRIORIDADES = ['Normal', 'Importante', 'Urgente'];

export async function renderAvisos(container) {
  const esAdmin = Auth.hasRole('admin');

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-bullhorn"></i> Avisos</h1>
        <p class="page-sub">Comunicados oficiales del colegio</p>
      </div>
      ${esAdmin ? `<button class="btn btn-primary" id="btnNuevo"><i class="fas fa-plus"></i> Nuevo aviso</button>` : ''}
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--sp-3);align-items:end">
        <div class="field" style="margin:0">
          <label>Buscar</label>
          <div class="input-icon">
            <i class="fas fa-search"></i>
            <input class="input" id="f_search" placeholder="Título o contenido…">
          </div>
        </div>
        <div class="field" style="margin:0">
          <label>Prioridad</label>
          <select class="select" id="f_prioridad">
            <option value="">Todas</option>
            ${PRIORIDADES.map((p) => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="margin:0">
          <label>Dirigido a</label>
          <select class="select" id="f_dirigido">
            <option value="">Todos</option>
            <option value="todos">Todos</option>
            <option value="alumnos">Alumnos</option>
            <option value="profesor">Profesores</option>
          </select>
        </div>
        <button class="btn btn-secondary" id="btnLimpiar"><i class="fas fa-eraser"></i> Limpiar</button>
      </div>
    </div>

    <div id="avisosWrap"></div>
  `;

  let filtros = { search: '', prioridad: '', dirigidoA: '' };

  const cargar = async () => {
    const wrap = container.querySelector('#avisosWrap');
    wrap.innerHTML = `<div class="skeleton-block" style="height:200px"></div>`;

    let items = await AvisosService.listar({ rol: Auth.user.rol });
    if (filtros.search) {
      const q = filtros.search.toLowerCase();
      items = items.filter((a) => (a.titulo + ' ' + a.contenido).toLowerCase().includes(q));
    }
    if (filtros.prioridad) items = items.filter((a) => a.prioridad === filtros.prioridad);
    if (filtros.dirigidoA) items = items.filter((a) => a.dirigidoA === filtros.dirigidoA);

    if (!items.length) {
      wrap.innerHTML = emptyState({
        icon: 'fa-bullhorn',
        title: 'No hay avisos que coincidan',
        message: 'Prueba con otros filtros o crea uno nuevo.',
        actionLabel: esAdmin ? 'Nuevo aviso' : '',
        actionIcon: 'fa-plus',
        onAction: esAdmin ? () => formAviso(null, cargar) : null
      });
      return;
    }

    wrap.innerHTML = items.map((a) => renderAviso(a, esAdmin, cargar)).join('');

    wrap.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => formAviso(Number(b.dataset.edit), cargar)));
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await UI.confirm({ title: 'Eliminar aviso', message: '¿Eliminar este aviso? Esta acción no se puede deshacer.', danger: true, confirmText: 'Eliminar' });
      if (!ok) return;
      await AvisosService.eliminar(Number(b.dataset.del));
      UI.toast('Aviso eliminado', 'success');
      cargar();
    }));
    wrap.querySelectorAll('[data-view-adj]').forEach((b) => b.addEventListener('click', () => {
      UI.toast('Vista de adjuntos lista para conectar con backend', 'info');
    }));
  };

  // Buscador con debounce
  let timer;
  container.querySelector('#f_search').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { filtros.search = e.target.value; cargar(); }, 280);
  });
  container.querySelector('#f_prioridad').addEventListener('change', (e) => { filtros.prioridad = e.target.value; cargar(); });
  container.querySelector('#f_dirigido').addEventListener('change', (e) => { filtros.dirigidoA = e.target.value; cargar(); });
  container.querySelector('#btnLimpiar').addEventListener('click', () => {
    filtros = { search: '', prioridad: '', dirigidoA: '' };
    container.querySelector('#f_search').value = '';
    container.querySelector('#f_prioridad').value = '';
    container.querySelector('#f_dirigido').value = '';
    cargar();
  });

  const btnNuevo = container.querySelector('#btnNuevo');
  if (btnNuevo) btnNuevo.addEventListener('click', () => formAviso(null, cargar));

  cargar();
}

function renderAviso(a, esAdmin, onSave) {
  const hoy = new Date().toISOString().slice(0, 10);
  const expirado = a.fechaExpiracion && a.fechaExpiracion < hoy;

  const borderCol = a.prioridad === 'Urgente' ? 'var(--c-danger)'
                  : a.prioridad === 'Importante' ? 'var(--c-warning)'
                  : 'var(--c-brand-500)';

  return `
    <div class="card" style="margin-bottom:var(--sp-3);border-left:4px solid ${borderCol};opacity:${expirado ? '.65' : '1'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--sp-3);flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-2)">
            ${statusBadge(a.prioridad || 'Normal')}
            <span class="badge badge-neutral" style="text-transform:capitalize">${escapeHtml(a.dirigidoA)}</span>
            ${expirado ? '<span class="badge badge-danger"><i class="fas fa-clock"></i> Expirado</span>' : ''}
          </div>
          <h3 style="color:var(--c-brand-900);font-weight:700;font-size:var(--fs-lg);margin-bottom:var(--sp-1);line-height:1.3">
            ${escapeHtml(a.titulo)}
          </h3>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--sp-3)">
            <i class="fas fa-user"></i> ${escapeHtml(a.autor || 'Dirección')}
            <span style="margin:0 6px">·</span>
            <i class="fas fa-calendar"></i> Publicado ${a.fecha}
            ${a.fechaExpiracion ? `<span style="margin:0 6px">·</span><i class="fas fa-hourglass-end"></i> Vence ${a.fechaExpiracion}` : ''}
          </div>
          <p style="color:var(--text-secondary);line-height:1.65;font-size:var(--fs-base)">${escapeHtml(a.contenido)}</p>

          ${a.adjunto ? `
            <button class="btn btn-sm btn-secondary" style="margin-top:var(--sp-3)" data-view-adj="${a.id}">
              <i class="fas fa-paperclip"></i> ${escapeHtml(a.adjunto)}
            </button>` : ''}
        </div>
        ${esAdmin ? `
          <div style="display:flex;gap:4px">
            <button class="btn-icon" data-edit="${a.id}" title="Editar"><i class="fas fa-pen"></i></button>
            <button class="btn-icon danger" data-del="${a.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
          </div>` : ''}
      </div>
    </div>`;
}

async function formAviso(id, onSave) {
  const a = id ? await AvisosService.obtener(id) : {
    titulo: '', contenido: '', fecha: new Date().toISOString().slice(0, 10),
    fechaExpiracion: '', autor: Auth.user.nombre || 'Dirección',
    dirigidoA: 'todos', prioridad: 'Normal', adjunto: ''
  };

  const { overlay, close } = UI.modal({
    title: id ? 'Editar aviso' : 'Nuevo aviso',
    size: 'modal-lg',
    body: `
      <div class="field">
        <label for="a_titulo">Título <span class="req">*</span></label>
        <input class="input" id="a_titulo" value="${escapeHtml(a.titulo)}" placeholder="Ej: Reunión de padres de familia" maxlength="120">
      </div>
      <div class="field">
        <label for="a_cont">Contenido <span class="req">*</span></label>
        <textarea class="textarea" id="a_cont" rows="5" placeholder="Describe el aviso…" maxlength="600">${escapeHtml(a.contenido)}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
        <div class="field">
          <label for="a_prioridad">Prioridad</label>
          <select class="select" id="a_prioridad">
            ${PRIORIDADES.map((p) => `<option ${a.prioridad === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="a_dir">Dirigido a</label>
          <select class="select" id="a_dir">
            <option value="todos" ${a.dirigidoA === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="alumnos" ${a.dirigidoA === 'alumnos' ? 'selected' : ''}>Alumnos</option>
            <option value="profesor" ${a.dirigidoA === 'profesor' ? 'selected' : ''}>Profesores</option>
          </select>
        </div>
        <div class="field">
          <label for="a_fecha">Fecha de publicación <span class="req">*</span></label>
          <input class="input" type="date" id="a_fecha" value="${a.fecha}">
        </div>
        <div class="field">
          <label for="a_exp">Fecha de expiración</label>
          <input class="input" type="date" id="a_exp" value="${a.fechaExpiracion || ''}">
        </div>
        <div class="field" style="grid-column:1/-1">
          <label for="a_autor">Autor</label>
          <input class="input" id="a_autor" value="${escapeHtml(a.autor)}">
        </div>
        <div class="field" style="grid-column:1/-1">
          <label for="a_adj">Adjunto (opcional)</label>
          <input class="input" id="a_adj" value="${escapeHtml(a.adjunto || '')}" placeholder="Ej: Convocatoria.pdf">
          <div class="field-hint">Solo el nombre del archivo. La carga real se conectará con backend.</div>
        </div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" data-action="close">Cancelar</button>
      <button class="btn btn-primary" id="saveBtn">
        <i class="fas fa-floppy-disk"></i> ${id ? 'Actualizar' : 'Publicar'}
      </button>`
  });

  // Validación en vivo
  Validacion.bind(overlay, {
    a_titulo: [Validators.required, Validators.minLength(3)],
    a_cont: [Validators.required, Validators.minLength(10)],
    a_fecha: [Validators.required]
  });

  overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
    const valido = Validacion.validar(overlay, {
      a_titulo: [Validators.required, Validators.minLength(3)],
      a_cont: [Validators.required, Validators.minLength(10)],
      a_fecha: [Validators.required]
    });
    if (!valido) { UI.toast('Revisa los campos marcados en rojo', 'warning'); return; }

    const data = {
      titulo: overlay.querySelector('#a_titulo').value.trim(),
      contenido: overlay.querySelector('#a_cont').value.trim(),
      prioridad: overlay.querySelector('#a_prioridad').value,
      dirigidoA: overlay.querySelector('#a_dir').value,
      fecha: overlay.querySelector('#a_fecha').value,
      fechaExpiracion: overlay.querySelector('#a_exp').value,
      autor: overlay.querySelector('#a_autor').value.trim() || 'Dirección',
      adjunto: overlay.querySelector('#a_adj').value.trim()
    };

    const btn = e.currentTarget;
    UI.buttonLoading(btn, true);
    try {
      if (id) await AvisosService.actualizar(id, data);
      else await AvisosService.crear(data);
      UI.toast(id ? 'Aviso actualizado' : 'Aviso publicado', 'success');
      close();
      onSave?.();
    } catch (err) { UI.toast(err.message, 'error'); UI.buttonLoading(btn, false); }
  });
}