import { initGlobalSearch } from './components/global-search.js';
// ============================================================
// app.js — Bootstrap de la aplicación
// ============================================================

import { Auth, ROLES } from './core/auth.js';
import { Router } from './core/router.js';
import { UI, escapeHtml } from './core/ui.js';
import { AuthService } from './services/auth.service.js';
import { NotificacionesService, ConfigService } from './services/data.service.js';
import { RolesService } from './services/school-ops.service.js';
import { renderSidebar } from './components/sidebar.js';
import { PeriodSelector } from './components/period-selector.js';
import { ModeToggle } from './components/mode-toggle.js';
import { render403 } from './pages/403.js';
import { render404 } from './pages/404.js';

// ------------------------------------------------------------
// 1. Aplicar tema ANTES de cualquier render
// ------------------------------------------------------------
ModeToggle.init();

// ------------------------------------------------------------
// 2. Verificar sesión
// ------------------------------------------------------------
const haySesion = (() => {
  try { return Auth.init(); }
  catch (e) { console.error('Auth.init() falló:', e); return false; }
})();

if (!haySesion) {
  location.replace('index.html');
} else if (!Auth.user || !Auth.user.rol) {
  Auth.logout();
  location.replace('index.html');
} else {
  ModeToggle.setUser(Auth.user);
  try { bootstrap(); }
  catch (err) {
    console.error('Bootstrap error:', err);
    document.body.innerHTML = `
      <div style="padding:40px;font-family:sans-serif;max-width:640px;margin:40px auto">
        <h1 style="color:#c0392b">Error al iniciar el sistema</h1>
        <pre style="background:#f5f5f5;padding:16px;border-radius:8px;overflow:auto">${err.message}\n\n${err.stack || ''}</pre>
        <button onclick="localStorage.clear();sessionStorage.clear();location.replace('index.html')"
                style="padding:10px 20px;border-radius:6px;border:none;background:#2563eb;color:#fff;cursor:pointer;font-weight:600">
          Reiniciar sistema
        </button>
      </div>`;
  }
}

// ------------------------------------------------------------
// 3. Bootstrap
// ------------------------------------------------------------
function bootstrap() {

  // ============ RUTAS ============
  const PAGES = {
    inicio:               () => import('./pages/inicio.js').then(m => m.renderInicio),

    // Admin / Control escolar
    alumnos:              () => import('./pages/alumnos.js').then(m => m.renderAlumnos),
    profesores:           () => import('./pages/profesores.js').then(m => m.renderProfesores),
    materias:             () => import('./pages/materias.js').then(m => m.renderMaterias),
    grupos:               () => import('./pages/grupos.js').then(m => m.renderGrupos),
    inscripciones:        () => import('./pages/inscripciones.js').then(m => m.renderInscripciones),
    calificaciones:       () => import('./pages/calificaciones.js').then(m => m.renderCalificaciones),
    asistencia:           () => import('./pages/asistencia.js').then(m => m.renderAsistencia),
    horarios:             () => import('./pages/horarios.js').then(m => m.renderHorarios),
    kardex:               () => import('./pages/kardex.js').then(m => m.renderKardex),
    avisos:               () => import('./pages/avisos.js').then(m => m.renderAvisos),
    notificaciones:       () => import('./pages/notificaciones.js').then(m => m.renderNotificaciones),
    reportes:             () => import('./pages/reportes.js').then(m => m.renderReportes),
    auditoria:            () => import('./pages/auditoria.js').then(m => m.renderAuditoria),
    usuarios:             () => import('./pages/usuarios.js').then(m => m.renderUsuarios),
    configuracion:        () => import('./pages/configuracion.js').then(m => m.renderConfiguracion),
    ayuda:                () => import('./pages/ayuda.js').then(m => m.renderAyuda),
    calendario:           () => import('./pages/calendario.js').then(m => m.renderCalendario),

    // Profesor
    'mis-grupos':         () => import('./pages/grupos.js').then(m => m.renderGrupos),

    // Alumno
    'mi-kardex':          () => import('./pages/kardex.js').then(m => m.renderKardex),
    'mis-calificaciones': () => import('./pages/calificaciones.js').then(m => m.renderCalificaciones),
    'mi-horario':         () => import('./pages/horarios.js').then(m => m.renderHorarios),
    'mi-asistencia':      () => import('./pages/asistencia.js').then(m => m.renderAsistencia),
    'boleta':             () => import('./pages/boleta.js').then(m => m.renderBoleta),
    'tramites':           () => import('./pages/tramites.js').then(m => m.renderTramites),
    'documentos':         () => import('./pages/documentos.js').then(m => m.renderDocumentos),

    // Común
    'mi-perfil':          () => import('./pages/mi-perfil.js').then(m => m.renderMiPerfil)
  };

  function registerRoutes() {
    Object.entries(PAGES).forEach(([section, loader]) => {
      Router.register(section, async (container, params) => {
        try {
          const fn = await loader();
          if (typeof fn !== 'function') {
            throw new Error(`El módulo "${section}" no exporta una función de render.`);
          }
          await fn(container, params);
        } catch (err) {
          console.error(`Error cargando "${section}":`, err);
          container.innerHTML = `
            <div class="error-page">
              <div class="err-icon" style="background:var(--c-danger-bg);color:var(--c-danger)">
                <i class="fas fa-triangle-exclamation"></i>
              </div>
              <div class="err-code" style="font-size:var(--fs-3xl)">No se pudo cargar el módulo</div>
              <h2>${escapeHtml(section)}</h2>
              <p>Ocurrió un error inesperado. Puedes reintentar o volver al inicio sin perder el resto de la sesión.</p>
              <pre style="background:var(--bg-muted);padding:var(--sp-3);border-radius:var(--r-md);font-size:.75em;overflow:auto;color:var(--c-danger);max-width:100%">${escapeHtml(err?.message || 'Error desconocido')}</pre>
              <div style="display:flex;gap:var(--sp-2);justify-content:center;flex-wrap:wrap;margin-top:var(--sp-4)">
                <button class="btn btn-secondary" onclick="location.reload()"><i class="fas fa-rotate"></i> Reintentar</button>
                <button class="btn btn-primary" onclick="location.hash='#/inicio'"><i class="fas fa-house"></i> Volver al inicio</button>
              </div>
            </div>`;
        }
      });
    });

    Router.registerError(403, render403);
    Router.registerError(404, render404);
  }

  // ============ HEADER ============
  function renderBranding() {
    const cfg = ConfigService.actual();
    const name = cfg.nombreColegio || 'Sistema Escolar';
    document.title = `Sistema Escolar · ${name}`;
    const footer = document.getElementById('footerBrand');
    if (footer) footer.textContent = `© ${new Date().getFullYear()} ${name} · Sistema Escolar Integrado`;
  }

  function renderHeader() {
    const u = Auth.user;
    const initials = u.iniciales || u.nombre.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('userName').textContent = u.nombre || 'Usuario';
    document.getElementById('userRole').textContent = u.rol || '—';
    document.getElementById('userAvatar').textContent = initials;
  }

  // ============ USER MENU ============
  function bindUserMenu() {
    const chip = document.getElementById('userChip');
    const menu = document.getElementById('userMenu');
    if (!chip || !menu) return;

    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      chip.classList.toggle('open', open);
      chip.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', () => {
      menu.classList.remove('open');
      chip.classList.remove('open');
      chip.setAttribute('aria-expanded', 'false');
    });

    menu.querySelector('#miPerfil')?.addEventListener('click', () => {
      Router.navigate('mi-perfil');
    });

    const configItem = menu.querySelector('#miConfig');
    if (configItem) {
      if (!Auth.hasRole(ROLES.ADMIN)) {
        configItem.innerHTML = '<i class="fas fa-circle-half-stroke" aria-hidden="true"></i> Cambiar apariencia';
      }
      configItem.addEventListener('click', () => {
        if (Auth.hasRole(ROLES.ADMIN)) {
          Router.navigate('configuracion');
          return;
        }
        // Profesor y alumno personalizan modo y color sin entrar a Configuración institucional.
        menu.classList.remove('open');
        chip.classList.remove('open');
        ModeToggle.openAppearanceDialog();
      });
    }

    menu.querySelector('#logoutBtn')?.addEventListener('click', async () => {
      const ok = await UI.confirm({
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que deseas salir del sistema?',
        confirmText: 'Sí, cerrar sesión',
        danger: true
      });
      if (!ok) return;
      try { await AuthService.logout(); } catch {}
      Auth.logout();
      UI.toast('Sesión cerrada', 'info', 800);
      setTimeout(() => location.replace('index.html'), 400);
    });
  }

  // ============ NOTIFICACIONES ============
  function bindNotifications() {
    const btn = document.getElementById('notifBtn');
    if (!btn) return;
    let panel = document.getElementById('notifPopover');
    if (!panel) { panel = document.createElement('div'); panel.id='notifPopover'; panel.className='notif-popover'; panel.hidden=true; document.body.append(panel); }
    const refresh = async () => {
      const items = await NotificacionesService.paraUsuario(Auth.user); const unread=items.filter(n=>!n.leida).length;
      const dot=document.getElementById('notifDot'); if(dot){dot.textContent=unread;dot.style.display=unread?'grid':'none'}
      panel.innerHTML=`<div class="notif-popover-head"><div><strong>Notificaciones</strong><small>${unread} sin leer</small></div><button class="btn btn-sm btn-secondary" id="seeAllNotif">Ver todas</button></div><div class="notif-popover-list">${items.slice(0,6).map(n=>`<button class="notif-popover-item ${n.leida?'':'unread'}" data-nid="${n.id}"><span class="notif-dot-mini"></span><span><strong>${n.titulo}</strong><small>${n.desc||''}</small></span></button>`).join('')||'<div class="command-empty">Sin notificaciones.</div>'}</div>`;
      panel.querySelector('#seeAllNotif')?.addEventListener('click',()=>{panel.hidden=true;Router.navigate('notificaciones')});
      panel.querySelectorAll('[data-nid]').forEach(el=>el.onclick=async()=>{
        if(el.dataset.busy==='1') return;
        el.dataset.busy='1';
        await NotificacionesService.marcarLeidaPara(Number(el.dataset.nid), Auth.user);
        el.classList.remove('unread');
        el.dataset.busy='0';
        const remaining = await NotificacionesService.contarNoLeidasPara(Auth.user);
        const dot=document.getElementById('notifDot'); if(dot){dot.textContent=remaining;dot.style.display=remaining?'grid':'none'}
        const small=panel.querySelector('.notif-popover-head small'); if(small) small.textContent=`${remaining} sin leer`;
      });
    };
    btn.addEventListener('click', async (e) => { e.stopPropagation(); panel.hidden=!panel.hidden; if(!panel.hidden) await refresh(); });
    document.addEventListener('click',e=>{if(!panel.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))panel.hidden=true});
    refresh();
  }

  // ============ TEMA ============
  document.addEventListener('appearance:changed', (e) => {
    const icon = document.querySelector('#themeBtn i');
    if (icon) icon.className = e.detail.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    UI.toast('Apariencia guardada', 'success', 1400);
  });

  function bindThemeToggle() {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    // Actualizar icono inicial
    const icon = btn.querySelector('i');
    if (icon) icon.className = ModeToggle.current === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    btn.addEventListener('click', () => {
      const next = ModeToggle.toggle();
      if (icon) icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      UI.toast(next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'info', 1400);
    });
  }

  // ============ BÚSQUEDA GLOBAL ============
  function bindGlobalSearch() {
    const search = document.getElementById('globalSearch');
    if (!search) return;
    initGlobalSearch(search);
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); search.focus(); search.select();
      }
      if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault(); search.focus();
      }
    });
  }

  // ============ ATAJOS DE TECLADO ============
  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.altKey && e.key.toLowerCase() === 'h') { e.preventDefault(); Router.navigate('inicio'); }
      if (e.altKey && e.key.toLowerCase() === 'p') { e.preventDefault(); Router.navigate('mi-perfil'); }
      if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); Router.navigate('notificaciones'); }
    });
  }

  // ============ FOOTER LINKS ============
  function bindFooterLinks() {
    const showModal = (title, body) => UI.modal({ title, body });
    document.getElementById('footerPrivacy')?.addEventListener('click', () => showModal('Aviso de privacidad',
      `<div style="color:var(--text-secondary);line-height:1.7;font-size:var(--fs-sm)">
        <p>Los datos recabados se utilizan exclusivamente para fines académicos y administrativos. El acceso está restringido por rol.</p>
      </div>`));
    document.getElementById('footerHelp')?.addEventListener('click', () => Router.navigate('ayuda'));
    document.getElementById('footerContact')?.addEventListener('click', () => { const cfg=ConfigService.actual(); showModal('Contacto',
      `<div style="color:var(--text-secondary);line-height:1.9;font-size:var(--fs-sm)">
        <div><strong style="color:var(--text-primary)">${cfg.nombreColegio || 'Servicios Escolares'}</strong></div>
        <div><i class="fas fa-envelope" style="width:18px;color:var(--c-brand-500)"></i> ${cfg.email || '—'}</div>
        <div><i class="fas fa-phone" style="width:18px;color:var(--c-brand-500)"></i> ${cfg.telefono || '—'}</div>
        <div><i class="fas fa-location-dot" style="width:18px;color:var(--c-brand-500)"></i> ${cfg.direccion || '—'}</div>
      </div>`); });
  }

  // ============ MENÚ MÓVIL ============
  function bindMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;

    btn.addEventListener('click', () => {
      const abierto = sidebar.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(abierto));
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth > 900) return;
      if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
        sidebar.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  // ============ SESSION WATCHDOG ============
  async function bindSessionWatchdog() {
    let timer;
    let minutos = 60;
    try {
      const seguridad = await RolesService.seguridad();
      const valor = Number(seguridad?.expiracionMin);
      if (Number.isFinite(valor) && valor >= 5 && valor <= 1440) minutos = valor;
    } catch {}
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        UI.toast('Sesión expirada por inactividad', 'warning', 4000);
        Auth.logout();
        setTimeout(() => location.replace('index.html'), 1200);
      }, minutos * 60 * 1000);
    };
    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach((ev) =>
      document.addEventListener(ev, reset, { passive: true })
    );
    reset();
  }

  // ============ INIT ============
  renderSidebar();
  renderBranding();
  renderHeader();
  PeriodSelector.render();
  registerRoutes();
  bindUserMenu();
  bindNotifications();
  bindThemeToggle();
  bindGlobalSearch();
  bindKeyboardShortcuts();
  bindFooterLinks();
  bindMobileMenu();
  bindSessionWatchdog();
  window.addEventListener('school:data-changed', (e) => {
    if (e.detail?.entity === 'configuracion') { renderBranding(); renderSidebar(); }
  });
  window.addEventListener('school:cycles-changed', () => { PeriodSelector.render(); });
  Router.start();

}