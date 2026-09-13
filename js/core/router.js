// ============================================================
// router.js — con breadcrumbs automáticos
// ============================================================
import { Auth } from './auth.js';

const BREADCRUMB_MAP = {
  // Admin
  'inicio':             ['Inicio'],
  'alumnos':            ['Inicio', 'Alumnos'],
  'profesores':         ['Inicio', 'Profesores'],
  'materias':           ['Inicio', 'Materias'],
  'grupos':             ['Inicio', 'Grupos'],
  'inscripciones':      ['Inicio', 'Inscripciones'],
  'calificaciones':     ['Inicio', 'Calificaciones'],
  'asistencia':         ['Inicio', 'Asistencia'],
  'horarios':           ['Inicio', 'Horarios'],
  'kardex':             ['Inicio', 'Kárdex'],
  'avisos':             ['Inicio', 'Avisos'],
  'notificaciones':     ['Inicio', 'Notificaciones'],
  'calendario':         ['Inicio', 'Calendario'],
  'reportes':           ['Inicio', 'Reportes'],
  'usuarios':           ['Inicio', 'Usuarios'],
  'configuracion':      ['Inicio', 'Configuración'],
  'ayuda':              ['Inicio', 'Ayuda'],

  // Profesor
  'mis-grupos':         ['Inicio', 'Mis grupos'],
  'mi-perfil':          ['Inicio', 'Mi perfil'],

  // Alumno
  'mi-kardex':          ['Inicio', 'Mi kárdex'],
  'mis-calificaciones': ['Inicio', 'Mis calificaciones'],
  'mi-horario':         ['Inicio', 'Mi horario'],
  'mi-asistencia':      ['Inicio', 'Mi asistencia'],
  'boleta':             ['Inicio', 'Mi boleta'],
  'tramites':           ['Inicio', 'Trámites'],
  'documentos':         ['Inicio', 'Documentos']
};

const SECTION_ICON = {
  inicio: 'fa-house',
  alumnos: 'fa-user-graduate',
  profesores: 'fa-chalkboard-teacher',
  materias: 'fa-book',
  grupos: 'fa-users',
  inscripciones: 'fa-clipboard-list',
  calificaciones: 'fa-chart-bar',
  asistencia: 'fa-clipboard-check',
  horarios: 'fa-clock',
  kardex: 'fa-file-lines',
  avisos: 'fa-bullhorn',
  notificaciones: 'fa-bell',
  calendario: 'fa-calendar',
  reportes: 'fa-file-alt',
  usuarios: 'fa-user-shield',
  configuracion: 'fa-gear',
  ayuda: 'fa-circle-question',
  'mi-perfil': 'fa-user'
};

export const Router = {
  routes: {},
  errorRoutes: { 403: null, 404: null },
  _initialized: false,

  register(section, handler) { this.routes[section] = handler; },
  registerError(code, handler) { this.errorRoutes[code] = handler; },

  navigate(section, params = {}) {
    const query = new URLSearchParams(params).toString();
    const target = `#/${section}${query ? '?' + query : ''}`;
    if (location.hash === target) this.handle();
    else location.hash = target;
  },

  current() {
    const hash = location.hash.slice(2) || 'inicio';
    const [section, query] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    return { section, params };
  },

  async handle() {
    const { section, params } = this.current();

    if (!this.routes[section]) return this.renderError(404);
    if (!Auth.can(section) && section !== 'inicio') return this.renderError(403, { intento: section });

    // Nav activo
    document.querySelectorAll('[data-nav]').forEach((el) => {
      el.classList.toggle('active', el.dataset.nav === section);
    });

    // Header title
    const titleEl = document.getElementById('headerTitle');
    if (titleEl) {
      const link = document.querySelector(`[data-nav="${section}"]`);
      titleEl.textContent = link?.querySelector('span')?.textContent || 'Inicio';
    }

    // Breadcrumbs
    this.updateBreadcrumbs(section);

    const container = document.getElementById('view');
    if (!container) return;
    container.innerHTML = '';

    try {
      await this.routes[section](container, params);
    } catch (err) {
      console.error('Router error:', err);
      container.innerHTML = `
        <div class="empty">
          <i class="fas fa-triangle-exclamation" style="color:var(--c-danger)"></i>
          <h4>Ocurrió un error</h4>
          <p>${err.message || 'Intenta de nuevo'}</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="fas fa-rotate"></i> Recargar
          </button>
        </div>`;
    }
  },

  renderError(code, data = {}) {
    const handler = this.errorRoutes[code];
    const container = document.getElementById('view');
    if (handler && container) {
      container.innerHTML = '';
      handler(container, data);
    }
    document.querySelectorAll('[data-nav]').forEach((el) => el.classList.remove('active'));
    this.updateBreadcrumbs(null);
  },

  updateBreadcrumbs(section) {
    const el = document.getElementById('breadcrumbs');
    if (!el) return;

    if (!section) { el.innerHTML = ''; return; }

    const crumbs = BREADCRUMB_MAP[section] || ['Inicio', section];
    const icon = SECTION_ICON[section] || 'fa-circle';

    el.innerHTML = crumbs.map((label, i) => {
      const isLast = i === crumbs.length - 1;
      const isFirst = i === 0;
      if (isFirst) {
        return `
          <a data-crumb="inicio" style="display:inline-flex;align-items:center;gap:4px">
            <i class="fas fa-house" style="font-size:.85em"></i> ${label}
          </a>
          ${!isLast ? '<i class="fas fa-chevron-right sep"></i>' : ''}`;
      }
      if (isLast) {
        return `<span class="current" style="display:inline-flex;align-items:center;gap:4px">
          <i class="fas ${icon}" style="font-size:.85em;opacity:.7"></i> ${label}
        </span>`;
      }
      return `<a data-crumb="${label.toLowerCase()}">${label}</a><i class="fas fa-chevron-right sep"></i>`;
    }).join('');

    el.querySelector('[data-crumb="inicio"]')?.addEventListener('click', () => this.navigate('inicio'));
  },

  start() {
    if (this._initialized) return;
    this._initialized = true;
    window.addEventListener('hashchange', () => this.handle());
    if (!location.hash) history.replaceState(null, '', '#/' + Auth.getDefaultSection());
    this.handle();
  }
};