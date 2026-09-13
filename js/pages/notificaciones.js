import { NotificacionesService } from '../services/data.service.js';
import { Auth } from '../core/auth.js';
import { UI, escapeHtml } from '../core/ui.js';

const ICONOS = {
  academico: { icon: 'fa-chart-line', color: 'var(--c-brand-500)' },
  aviso: { icon: 'fa-bullhorn', color: 'var(--c-warning)' },
  tramite: { icon: 'fa-file-signature', color: 'var(--c-success)' },
  inscripcion: { icon: 'fa-user-plus', color: 'var(--c-info)' }
};

export async function renderNotificaciones(container) {
  const usuarioId = Auth.user.id || 1;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-bell"></i> Notificaciones</h1>
        <p class="page-sub">Centro de actividad del sistema</p>
      </div>
      <button class="btn btn-secondary" id="btnMarcarTodas">
        <i class="fas fa-check-double"></i> Marcar todas como leídas
      </button>
    </div>

    <div class="card">
      <div id="notifList"></div>
    </div>
  `;

  const cargar = async () => {
    const wrap = container.querySelector('#notifList');
    wrap.innerHTML = `<div class="skeleton-block" style="height:200px"></div>`;
    const items = await NotificacionesService.porUsuario(usuarioId);

    if (!items.length) {
      wrap.innerHTML = `<div class="empty"><i class="fas fa-bell-slash"></i><h4>Sin notificaciones</h4><p>Aquí aparecerá tu actividad reciente.</p></div>`;
      return;
    }

    wrap.innerHTML = items.map((n) => {
      const cfg = ICONOS[n.tipo] || ICONOS.academico;
      const fecha = new Date(n.fecha);
      const hace = tiempoRelativo(fecha);
      return `
        <div class="list-item ${n.leida ? '' : 'unread'}" style="${n.leida ? '' : 'background:var(--c-info-bg);border-left-color:var(--c-brand-500);'}cursor:pointer" data-id="${n.id}">
          <div style="width:36px;height:36px;border-radius:var(--r-md);background:${cfg.color};color:#fff;display:grid;place-items:center;flex-shrink:0">
            <i class="fas ${cfg.icon}"></i>
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px">
              <div class="list-item-title" style="margin-bottom:0">${escapeHtml(n.titulo)}</div>
              ${n.leida ? '' : `<span style="width:8px;height:8px;background:var(--c-brand-500);border-radius:50%;display:inline-block"></span>`}
            </div>
            <div class="list-item-desc">${escapeHtml(n.desc)}</div>
            <div class="list-item-meta"><i class="far fa-clock"></i> ${hace}</div>
          </div>
        </div>
      `;
    }).join('');

    wrap.querySelectorAll('[data-id]').forEach((el) => {
      el.addEventListener('click', async () => {
        await NotificacionesService.marcarLeida(Number(el.dataset.id));
        cargar();
        actualizarBadge();
      });
    });
  };

  const actualizarBadge = async () => {
    const count = await NotificacionesService.contarNoLeidas(usuarioId);
    const dot = document.getElementById('notifDot');
    if (dot) {
      dot.textContent = count;
      dot.style.display = count > 0 ? 'grid' : 'none';
    }
  };

  container.querySelector('#btnMarcarTodas').addEventListener('click', async () => {
    await NotificacionesService.marcarTodasLeidas(usuarioId);
    UI.toast('Todas marcadas como leídas', 'success');
    cargar();
    actualizarBadge();
  });

  cargar();
  actualizarBadge();
}

function tiempoRelativo(fecha) {
  const diff = (Date.now() - fecha.getTime()) / 1000;
  if (diff < 60) return 'Hace unos segundos';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
  if (diff < 172800) return 'Ayer';
  return fecha.toLocaleDateString('es-MX');
}