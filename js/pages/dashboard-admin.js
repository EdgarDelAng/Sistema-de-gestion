import {
  StatsService,
  CalendarioService,
  AvisosService,
  NotificacionesService,
  AsistenciaService
} from '../services/data.service.js';
import { Auth } from '../core/auth.js';
import { escapeHtml } from '../core/ui.js';
import { TareasService } from '../services/school-ops.service.js';
import { PeriodSelector } from '../components/period-selector.js';

const DASHBOARD_STATE_KEY = 'school_admin_dashboard_sections';

export async function renderDashboardAdmin(container) {
  const userId = Auth.user?.id || 1;
  const [stats, top, riesgo, eventos, avisos, notificaciones, asistencias, tareas] = await Promise.all([
    StatsService.resumen(),
    StatsService.topAlumnos(5),
    StatsService.alumnosEnRiesgo(6),
    CalendarioService.todos(),
    AvisosService.listar(),
    NotificacionesService.porUsuario(userId),
    AsistenciaService.historial(),
    TareasService.listar()
  ]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const proximos = eventos
    .filter((e) => fechaLocal(e.fecha) >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 5);

  const ultimasFaltas = asistencias.filter((a) => a.estado === 'falta').slice(0, 5);
  const actividad = construirActividad(notificaciones, avisos).slice(0, 6);
  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const estadoSecciones = leerEstadoSecciones();

  container.innerHTML = `
    <section class="dashboard-admin" aria-label="Panel administrativo">
      <div class="dashboard-hero">
        <div>
          <p class="dashboard-eyebrow">${escapeHtml(PeriodSelector.current.ciclo)} · ${escapeHtml(PeriodSelector.current.periodo)}</p>
          <h1>Buenos días, ${escapeHtml(nombreCorto(Auth.user?.nombre || 'Administrador'))}</h1>
          <p>Esto es lo que requiere atención en el plantel hoy.</p>
        </div>
        <div class="dashboard-hero-actions">
          <button class="btn btn-secondary" data-goto="calendario">
            <i class="fas fa-calendar-days"></i> Ver calendario
          </button>
          <button class="btn btn-primary" data-goto="alumnos">
            <i class="fas fa-user-plus"></i> Gestionar alumnos
          </button>
        </div>
      </div>

      <div class="dashboard-kpis" aria-label="Indicadores generales">
        ${kpi('fa-user-graduate', stats.alumnos, 'Alumnos', `${stats.alumnosActivos} activos`, 'alumnos')}
        ${kpi('fa-chalkboard-user', stats.profesores, 'Profesores', 'Plantilla docente', 'profesores')}
        ${kpi('fa-users', stats.grupos, 'Grupos', `${stats.materias} materias`, 'grupos')}
        ${kpi('fa-chart-line', stats.promedioGeneral.toFixed(1), 'Promedio general', 'Escala de 0 a 10', 'calificaciones')}
      </div>

      <div class="dashboard-attention" aria-label="Atención requerida">
        <button class="attention-item attention-danger" data-goto="calificaciones">
          <span class="attention-icon"><i class="fas fa-triangle-exclamation"></i></span>
          <span><strong>${riesgo.length}</strong><small>alumnos en riesgo académico</small></span>
          <i class="fas fa-arrow-right"></i>
        </button>
        <button class="attention-item attention-warning" data-goto="asistencia">
          <span class="attention-icon"><i class="fas fa-user-clock"></i></span>
          <span><strong>${ultimasFaltas.length}</strong><small>faltas recientes por revisar</small></span>
          <i class="fas fa-arrow-right"></i>
        </button>
        <button class="attention-item" data-goto="notificaciones">
          <span class="attention-icon"><i class="fas fa-bell"></i></span>
          <span><strong>${noLeidas}</strong><small>notificaciones sin leer</small></span>
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>

      <section class="work-queue" aria-label="Pendientes operativos">
        <div class="section-heading"><div><h2>Pendientes operativos</h2><p>Generados automáticamente a partir de la información del sistema.</p></div><span class="badge badge-${tareas.length ? 'warning' : 'success'}">${tareas.length} pendientes</span></div>
        <div class="work-queue-grid">${tareas.length ? tareas.map(t=>`<button class="work-item priority-${t.prioridad}" data-goto="${t.ruta}"><span class="work-mark"></span><span><strong>${escapeHtml(t.titulo)}</strong><small>${escapeHtml(t.detalle)}</small></span><i class="fas fa-arrow-right"></i></button>`).join('') : `<div class="work-clear"><i class="fas fa-circle-check"></i><div><strong>Operación al día</strong><span>No hay pendientes críticos detectados.</span></div></div>`}</div>
      </section>

      <div class="dashboard-grid">
        ${panel('riesgo', 'Seguimiento académico', 'Alumnos que necesitan atención', 'fa-heart-pulse', `
          ${riesgo.length ? `<div class="dashboard-list">${riesgo.map((a) => `
            <button class="dashboard-person" data-goto="alumnos">
              <span class="person-avatar">${iniciales(a.nombre, a.apellidos)}</span>
              <span class="person-copy"><strong>${escapeHtml(a.nombre + ' ' + a.apellidos)}</strong><small>${escapeHtml(a.grado || 'Sin grado')}</small></span>
              <span class="score score-danger">${a.promedio.toFixed(1)}</span>
            </button>`).join('')}</div>` : empty('fa-circle-check', 'Sin alumnos en riesgo', 'No hay promedios debajo de la escala mínima.')}
          <button class="panel-link" data-goto="calificaciones">Ver calificaciones <i class="fas fa-arrow-right"></i></button>
        `, estadoSecciones)}

        ${panel('eventos', 'Próximos eventos', 'Agenda institucional', 'fa-calendar', `
          ${proximos.length ? `<div class="event-list">${proximos.map(eventoHtml).join('')}</div>` : empty('fa-calendar-check', 'Agenda despejada', 'No hay eventos próximos registrados.')}
          <button class="panel-link" data-goto="calendario">Abrir calendario <i class="fas fa-arrow-right"></i></button>
        `, estadoSecciones)}

        ${panel('actividad', 'Actividad reciente', 'Movimientos y avisos del sistema', 'fa-clock-rotate-left', `
          ${actividad.length ? `<div class="activity-list">${actividad.map(actividadHtml).join('')}</div>` : empty('fa-inbox', 'Sin actividad reciente', 'Los movimientos del sistema aparecerán aquí.')}
          <button class="panel-link" data-goto="notificaciones">Ver notificaciones <i class="fas fa-arrow-right"></i></button>
        `, estadoSecciones, 'dashboard-panel-wide')}

        ${panel('rendimiento', 'Mejores promedios', 'Rendimiento destacado del ciclo', 'fa-ranking-star', `
          ${top.length ? `<div class="ranking-list">${top.map((a, i) => `
            <div class="ranking-row">
              <span class="ranking-position">${i + 1}</span>
              <span class="person-copy"><strong>${escapeHtml(a.nombre + ' ' + a.apellidos)}</strong><small>${escapeHtml(a.grado || 'Sin grado')}</small></span>
              <span class="score score-good">${a.promedio.toFixed(1)}</span>
            </div>`).join('')}</div>` : empty('fa-chart-line', 'Sin calificaciones', 'Aún no hay información para generar el ranking.')}
        `, estadoSecciones)}
      </div>

      <section class="quick-actions-section">
        <div class="section-heading">
          <div><h2>Acciones frecuentes</h2><p>Atajos para las tareas administrativas más comunes.</p></div>
        </div>
        <div class="quick-actions-grid">
          ${quickAction('fa-user-plus', 'Alumnos', 'Altas, bajas y expedientes', 'alumnos')}
          ${quickAction('fa-clipboard-check', 'Asistencia', 'Captura y seguimiento', 'asistencia')}
          ${quickAction('fa-chart-column', 'Calificaciones', 'Consulta y captura', 'calificaciones')}
          ${quickAction('fa-bullhorn', 'Avisos', 'Comunicación escolar', 'avisos')}
          ${quickAction('fa-file-chart-column', 'Reportes', 'Indicadores del plantel', 'reportes')}
        </div>
      </section>
    </section>`;

  enlazarDashboard(container);
}

function panel(id, titulo, subtitulo, icono, contenido, estado, extra = '') {
  const cerrado = estado[id] === true;
  return `
    <section class="dashboard-panel ${extra} ${cerrado ? 'is-collapsed' : ''}" data-panel="${id}">
      <header class="dashboard-panel-header">
        <div class="panel-title-wrap"><span class="panel-icon"><i class="fas ${icono}"></i></span><div><h2>${titulo}</h2><p>${subtitulo}</p></div></div>
        <button class="panel-toggle" type="button" data-panel-toggle="${id}" aria-expanded="${!cerrado}" aria-label="${cerrado ? 'Expandir' : 'Contraer'} ${titulo}"><i class="fas fa-chevron-up"></i></button>
      </header>
      <div class="dashboard-panel-body">${contenido}</div>
    </section>`;
}

function kpi(icono, valor, etiqueta, detalle, goto) {
  return `<button class="dashboard-kpi" data-goto="${goto}"><span class="kpi-icon"><i class="fas ${icono}"></i></span><span class="kpi-copy"><strong>${valor}</strong><span>${etiqueta}</span><small>${detalle}</small></span><i class="fas fa-arrow-up-right-from-square kpi-arrow"></i></button>`;
}

function quickAction(icono, titulo, descripcion, goto) {
  return `<button class="quick-action" data-goto="${goto}"><span><i class="fas ${icono}"></i></span><strong>${titulo}</strong><small>${descripcion}</small><i class="fas fa-arrow-right quick-arrow"></i></button>`;
}

function eventoHtml(e) {
  const d = fechaLocal(e.fecha);
  const dia = new Intl.DateTimeFormat('es-MX', { day: '2-digit' }).format(d);
  const mes = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(d).replace('.', '').toUpperCase();
  return `<button class="event-row" data-goto="calendario"><span class="event-date"><strong>${dia}</strong><small>${mes}</small></span><span class="event-copy"><strong>${escapeHtml(e.titulo)}</strong><small>${escapeHtml(e.descripcion || 'Evento institucional')}</small></span><i class="fas fa-chevron-right"></i></button>`;
}

function actividadHtml(a) {
  return `<div class="activity-row"><span class="activity-dot ${a.tipo}"><i class="fas ${a.icono}"></i></span><span class="activity-copy"><strong>${escapeHtml(a.titulo)}</strong><small>${escapeHtml(a.descripcion)}</small></span><time>${formatearFecha(a.fecha)}</time></div>`;
}

function construirActividad(notificaciones, avisos) {
  const n = notificaciones.map((x) => ({ titulo: x.titulo, descripcion: x.desc || 'Notificación del sistema', fecha: x.fecha, tipo: 'notification', icono: 'fa-bell' }));
  const a = avisos.map((x) => ({ titulo: x.titulo, descripcion: `${x.autor || 'Dirección'} · ${x.prioridad || 'Aviso'}`, fecha: `${x.fecha}T12:00:00`, tipo: 'notice', icono: 'fa-bullhorn' }));
  return [...n, ...a].sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)));
}

function enlazarDashboard(container) {
  container.querySelectorAll('[data-goto]').forEach((el) => el.addEventListener('click', () => { location.hash = `#/${el.dataset.goto}`; }));
  container.querySelectorAll('[data-panel-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const panel = container.querySelector(`[data-panel="${btn.dataset.panelToggle}"]`);
    if (!panel) return;
    const cerrado = panel.classList.toggle('is-collapsed');
    btn.setAttribute('aria-expanded', String(!cerrado));
    btn.setAttribute('aria-label', `${cerrado ? 'Expandir' : 'Contraer'} sección`);
    const estado = leerEstadoSecciones();
    estado[btn.dataset.panelToggle] = cerrado;
    localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(estado));
  }));
}

function leerEstadoSecciones() {
  try { return JSON.parse(localStorage.getItem(DASHBOARD_STATE_KEY) || '{}'); } catch { return {}; }
}

function fechaLocal(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatearFecha(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(d);
}

function nombreCorto(nombre) { return String(nombre).trim().split(/\s+/)[0] || 'Administrador'; }
function iniciales(nombre, apellidos) { return `${String(nombre || '')[0] || ''}${String(apellidos || '')[0] || ''}`.toUpperCase(); }
function empty(icono, titulo, texto) { return `<div class="dashboard-empty"><i class="fas ${icono}"></i><strong>${titulo}</strong><span>${texto}</span></div>`; }
