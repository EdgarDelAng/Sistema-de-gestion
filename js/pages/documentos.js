import { DocumentosService } from '../services/data.service.js';
import { Auth } from '../core/auth.js';
import { UI, escapeHtml } from '../core/ui.js';
import { emptyState } from '../components/loading.js';

const ICONO_TIPO = {
  'Boleta': 'fa-file-invoice',
  'Kárdex': 'fa-file-lines',
  'Constancia': null,
  'Comprobante': 'fa-receipt'
};

export async function renderDocumentos(container) {
  const alumnoId = Number(Auth.user.alumnoId);
  if (!alumnoId) { container.innerHTML = `<div class="card" style="padding:var(--sp-8);text-align:center"><h2>Cuenta sin expediente vinculado</h2><p class="text-muted">Vuelve a iniciar sesión con tu matrícula para consultar documentos.</p></div>`; return; }

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-folder-open"></i> Documentos</h1>
        <p class="page-sub">Descarga tus documentos académicos</p>
      </div>
    </div>
    <div id="docsWrap"></div>
  `;

  const wrap = container.querySelector('#docsWrap');
  wrap.innerHTML = `<div class="skeleton-block" style="height:200px"></div>`;

  let items = [];
  try {
    items = await DocumentosService.porAlumno(alumnoId);
  } catch (e) {
    console.error('Error cargando documentos:', e);
    items = [];
  }

  if (!items.length) {
    wrap.innerHTML = `
      <div class="card" style="text-align:center;padding:var(--sp-8)">
        ${emptyState({
          icon: 'fa-folder-open',
          title: 'No tienes documentos disponibles',
          message: 'Los documentos aparecerán aquí conforme se generen.'
        })}
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--sp-4)">
      ${items.map((d) => `
        <div class="card" style="padding:var(--sp-4)">
          <div style="display:flex;align-items:flex-start;gap:var(--sp-3)">
            <div style="width:44px;height:44px;border-radius:var(--r-md);background:var(--c-info-bg);color:var(--c-info);display:grid;place-items:center;font-size:1.2rem;flex-shrink:0">
              ${docIcon(d.tipo)}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;color:var(--c-brand-900);font-size:var(--fs-base);line-height:1.3">${escapeHtml(d.nombre)}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px">
                <span class="badge badge-info" style="text-transform:capitalize">${escapeHtml(d.tipo)}</span>
              </div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:6px">
                <i class="fas fa-calendar"></i> ${escapeHtml(d.fecha || '—')} · ${escapeHtml(d.tamano || '—')}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-3)">
            <button class="btn btn-sm btn-primary" style="flex:1" data-download="${d.id}">
              <i class="fas fa-download"></i> Descargar
            </button>
            <button class="btn btn-sm btn-secondary" data-view="${d.id}" title="Previsualizar">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  wrap.querySelectorAll('[data-download]').forEach((b) => b.addEventListener('click', () => {
    UI.toast('Descarga lista para conectar con backend', 'info');
  }));

  wrap.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    const d = items.find((x) => x.id === Number(b.dataset.view));
    if (!d) return;
    UI.modal({
      title: d.nombre,
      size: 'modal-lg',
      body: `
        <div style="background:var(--bg-muted);border-radius:var(--r-md);padding:var(--sp-8);text-align:center">
          <i class="fas fa-file-pdf" style="font-size:3rem;color:var(--c-danger);opacity:.7"></i>
          <p style="margin-top:var(--sp-4);color:var(--text-secondary)">Vista previa no disponible en modo demo.</p>
          <p style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px">Tipo: ${escapeHtml(d.tipo)} · ${escapeHtml(d.tamano)}</p>
        </div>`
    });
  }));
}
function docIcon(tipo) {
 if(tipo==='Constancia') return `<svg class="doc-type-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h8l3 3V20a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14.5 3.5v4h4"/><path d="M8.5 11h6M8.5 14h6M8.5 17h3.5"/><path d="m14.5 16.5 1 1 2-2"/></svg>`;
 return `<i class="fas ${ICONO_TIPO[tipo] || 'fa-file'}" aria-hidden="true"></i>`;
}
