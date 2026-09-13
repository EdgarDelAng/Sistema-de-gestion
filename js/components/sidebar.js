import { Auth, ROLES } from '../core/auth.js';
import { Router } from '../core/router.js';
import { ModeToggle } from './mode-toggle.js';

const MENU = {
  [ROLES.ADMIN]: [
    { title: null, items: [
      { section: 'inicio', label: 'Inicio', icon: 'fa-house' }
    ]},
    { title: 'Control escolar', items: [
      { section: 'alumnos', label: 'Alumnos', icon: 'fa-user-graduate' },
      { section: 'profesores', label: 'Profesores', icon: 'fa-chalkboard-teacher' },
      { section: 'materias', label: 'Materias', icon: 'fa-book' },
      { section: 'grupos', label: 'Grupos', icon: 'fa-users' },
      { section: 'inscripciones', label: 'Inscripciones', icon: 'fa-clipboard-list' }
    ]},
    { title: 'Académico', items: [
      { section: 'calificaciones', label: 'Calificaciones', icon: 'fa-chart-bar' },
      { section: 'asistencia', label: 'Asistencia', icon: 'fa-clipboard-check' },
      { section: 'horarios', label: 'Horarios', icon: 'fa-clock' },
      { section: 'kardex', label: 'Kárdex', icon: 'fa-file-lines' }
    ]},
    { title: 'Comunicación', items: [
      { section: 'avisos', label: 'Avisos', icon: 'fa-bullhorn' },
      { section: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
      { section: 'calendario', label: 'Calendario', icon: 'fa-calendar' }
    ]},
    { title: 'Reportes', items: [
      { section: 'reportes', label: 'Reportes', icon: 'fa-file-alt' }
    ]},
    { title: 'Administración', items: [
      { section: 'configuracion', label: 'Configuración', icon: 'fa-gear' }
    ]},
    { title: null, items: [
      { section: 'ayuda', label: 'Ayuda', icon: 'fa-circle-question' }
    ]}
  ],

    [ROLES.PROFESOR]: [
    { title: null, items: [
      { section: 'inicio', label: 'Inicio', icon: 'fa-house' }
    ]},
    { title: 'Mi información', items: [
      { section: 'profesores', label: 'Mi ficha docente', icon: 'fa-id-card' },
      { section: 'mis-grupos', label: 'Mis grupos', icon: 'fa-users' },
      { section: 'horarios', label: 'Mi horario', icon: 'fa-clock' }
    ]},
    { title: 'Docencia', items: [
      { section: 'calificaciones', label: 'Calificaciones', icon: 'fa-chart-bar' },
      { section: 'asistencia', label: 'Asistencia', icon: 'fa-clipboard-check' }
    ]},
    { title: 'Comunicación', items: [
      { section: 'avisos', label: 'Avisos', icon: 'fa-bullhorn' },
      { section: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' }
    ]},
    { title: null, items: [
      { section: 'mi-perfil', label: 'Mi cuenta', icon: 'fa-user' },
      { section: 'ayuda', label: 'Ayuda', icon: 'fa-circle-question' }
    ]}
  ],

  [ROLES.ALUMNO]: [
    { title: null, items: [
      { section: 'inicio', label: 'Inicio', icon: 'fa-house' }
    ]},
    { title: 'Mi información', items: [
      { section: 'mi-kardex', label: 'Kárdex', icon: 'fa-file-lines' },
      { section: 'mis-calificaciones', label: 'Calificaciones', icon: 'fa-chart-bar' },
      { section: 'mi-horario', label: 'Mi horario', icon: 'fa-clock' },
      { section: 'mi-asistencia', label: 'Mi asistencia', icon: 'fa-clipboard-check' }
    ]},
    { title: 'Trámites', items: [
      { section: 'boleta', label: 'Boleta', icon: 'fa-file-invoice' },
      { section: 'tramites', label: 'Trámites', icon: 'fa-file-signature' },
      { section: 'documentos', label: 'Documentos', icon: 'fa-folder-open' }
    ]},
    { title: 'Comunicación', items: [
      { section: 'avisos', label: 'Avisos', icon: 'fa-bullhorn' },
      { section: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' }
    ]},
    { title: null, items: [
      { section: 'mi-perfil', label: 'Mi perfil', icon: 'fa-user' },
      { section: 'ayuda', label: 'Ayuda', icon: 'fa-circle-question' }
    ]}
  ]
};

export function renderSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const estructura = MENU[Auth.user.rol] || MENU[ROLES.ADMIN];

  el.innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon"><i class="fas fa-school"></i></div>
      <div class="brand-text">
        <strong>Colegio Papu</strong>
        <small>Sistema Escolar</small>
      </div>
    </div>
    <nav class="sidebar-nav" aria-label="Menú principal">
      ${estructura.map((grupo) => `
        <div class="sidebar-section">
          ${grupo.title ? `<div class="sidebar-section-title">${grupo.title}</div>` : ''}
          ${grupo.items.filter((it) => Auth.can(it.section)).map((it) => `
            <a class="sidebar-link" data-nav="${it.section}" href="#/${it.section}">
              <i class="fas ${it.icon}"></i>
              <span>${it.label}</span>
            </a>
          `).join('')}
        </div>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div id="modeToggleContainer"></div>
      <div style="text-align:center;margin-top:var(--sp-3);font-size:.68rem;color:rgba(184,203,220,.5)">
        Versión 1.0.0
      </div>
    </div>
  `;

  // Navegación
  el.querySelectorAll('.sidebar-link').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      Router.navigate(a.dataset.nav);
      if (window.innerWidth <= 900) {
        el.classList.remove('open');
        document.getElementById('mobileMenuBtn')?.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Toggle de tema
  ModeToggle.render('modeToggleContainer');
}