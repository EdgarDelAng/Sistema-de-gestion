import { TramitesService } from '../services/data.service.js';
import { Auth } from '../core/auth.js';
import { UI, escapeHtml } from '../core/ui.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';

const TIPOS = [
  { tipo: 'Constancia de estudios',       icon: 'fa-file-certificate', desc: 'Documento que acredita que el alumno está inscrito y cursando estudios.' },
  { tipo: 'Kárdex',                       icon: 'fa-file-lines',       desc: 'Historial académico completo con todas las materias y calificaciones.' },
  { tipo: 'Constancia de calificaciones', icon: 'fa-file-invoice',     desc: 'Documento con las calificaciones del periodo actual.' },
  { tipo: 'Constancia de buena conducta', icon: 'fa-user-shield',      desc: 'Documento que acredita la conducta del alumno.' }
];

export async function renderTramites(container) {
  const alumnoId = Auth.user.alumnoId || 1;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-file-signature"></i> Trámites</h1>
        <p class="page-sub">Solicita constancias y documentos oficiales</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-file-circle-plus"></i> Solicitar trámite</h3>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--sp-3)">
        ${TIPOS.map((t) => `
          <button class="btn btn-secondary" style="height:auto;padding:var(--sp-4);text-align:left;flex-direction:column;align-items:flex-start;gap:var(--sp-2)" data-tipo="${escapeHtml(t.tipo)}">
            <div style="display:flex;align-items:center;gap:var(--sp-3)">
              <i class="fas ${t.icon}" style="color:var(--c-brand-500);font-size:1.3rem"></i>
              <strong style="font-size:var(--fs-sm)">${escapeHtml(t.tipo)}</strong>
            </div>
            <small style="color:var(--text-muted);font-weight:400;font-size:var(--fs-xs);line-height:1.4">${escapeHtml(t.desc)}</small>
            <span style="color:var(--c-brand-500);font-size:var(--fs-xs);font-weight:600;margin-top:var(--sp-2)">Solicitar →</span>
          </button>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-list"></i> Mis solicitudes</h3>
      </div>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Observaciones</th>
              <th style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbodyTramites"></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#tbodyTramites');

  const cargar = async () => {
    tbody.innerHTML = `<tr><td colspan="6"><div class="skeleton-block" style="height:200px;margin:var(--sp-3)"></div></td></tr>`;

    let items = [];
    try {
      items = await TramitesService.porAlumno(alumnoId);
    } catch (e) {
      console.error('Error cargando trámites:', e);
      items = [];
    }

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        ${emptyState({
          icon: 'fa-file-signature',
          title: 'No hay solicitudes',
          message: 'Solicita un trámite desde las opciones de arriba.'
        })}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = items.map((t) => `
      <tr>
        <td><code style="font-size:.8em">${escapeHtml(t.folio || '—')}</code></td>
        <td>${escapeHtml(t.tipo)}</td>
        <td>${escapeHtml(t.fechaSolicitud || '—')}</td>
        <td>${statusBadge(t.estado)}</td>
        <td style="font-size:var(--fs-xs);color:var(--text-secondary)">${escapeHtml(t.observaciones || '—')}</td>
        <td style="text-align:right">
          ${t.estado === 'Disponible' ? `<button class="btn btn-sm btn-primary" data-download="${t.id}"><i class="fas fa-download"></i> Descargar</button>` : ''}
          ${t.estado === 'Solicitado' ? `<button class="btn btn-sm btn-ghost" data-cancel="${t.id}"><i class="fas fa-xmark"></i> Cancelar</button>` : ''}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-download]').forEach((b) => b.addEventListener('click', () => {
      UI.toast('Descarga lista para conectar con backend', 'info');
    }));

    tbody.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await UI.confirm({ title: 'Cancelar trámite', message: '¿Cancelar esta solicitud?', danger: true });
      if (!ok) return;
      await TramitesService.eliminar(Number(b.dataset.cancel));
      UI.toast('Solicitud cancelada', 'info');
      cargar();
    }));
  };

  container.querySelectorAll('[data-tipo]').forEach((b) => b.addEventListener('click', async () => {
    const tipo = b.dataset.tipo;
    const ok = await UI.confirm({
      title: 'Solicitar trámite',
      message: `¿Solicitar "${tipo}"? Recibirás una notificación cuando esté disponible.`,
      confirmText: 'Solicitar'
    });
    if (!ok) return;
    const folio = 'TRA-2026-' + String(Date.now()).slice(-4).padStart(4, '0');
    await TramitesService.crear({
      alumnoId,
      tipo,
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      estado: 'Solicitado',
      folio,
      observaciones: ''
    });
    UI.toast('Solicitud enviada', 'success');
    cargar();
  }));

  await cargar();
}