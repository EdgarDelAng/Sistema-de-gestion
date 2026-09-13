import { Auth } from '../core/auth.js';
import { StatsService, HorariosService } from '../services/data.service.js';
import { escapeHtml } from '../core/ui.js';
import { statusBadge } from '../components/status-badge.js';

export async function renderDashboardAlumno(container) {
  const u = Auth.user;
  const saludo = getSaludo();
  const stats = await StatsService.resumen();

  // Demo: alumno 1
  const alumnoId = u.alumnoId || 1;
  const horarios = await HorariosService.porGrupo(1);
  const proxima = horarios[0];

  // Datos simulados
  const promedio = 9.1;
  const asistenciaPct = 94;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-gauge-high"></i> ${saludo}, ${escapeHtml(u.nombre.split(' ')[0])}</h1>
        <p class="page-sub">Portal del estudiante · Ciclo 2026-2027</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card success">
        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
        <div><div class="stat-value">${promedio.toFixed(1)}</div><div class="stat-label">Mi promedio</div></div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
        <div><div class="stat-value">${asistenciaPct}%</div><div class="stat-label">Asistencia</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-book"></i></div>
        <div><div class="stat-value">${stats.materias}</div><div class="stat-label">Materias</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-bullhorn"></i></div>
        <div><div class="stat-value">${stats.avisos}</div><div class="stat-label">Avisos</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-5)">
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-user-check"></i> Estado académico</h3></div>
        <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3);background:var(--c-success-bg);border-radius:var(--r-md);border-left:4px solid var(--c-success)">
          <i class="fas fa-circle-check" style="color:var(--c-success);font-size:1.5rem"></i>
          <div>
            <div style="font-weight:700;color:var(--c-success-fg)">Regular</div>
            <div style="font-size:var(--fs-xs);color:var(--text-secondary)">Sin adeudos ni materias reprobadas</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-clock"></i> Próxima clase</h3></div>
        ${proxima ? `
          <div style="padding:var(--sp-4);background:var(--bg-muted);border-radius:var(--r-md)">
            <div style="font-size:1.4rem;font-weight:800;color:var(--c-brand-500)">${proxima.horaInicio} – ${proxima.horaFin}</div>
            <div style="font-weight:700;color:var(--c-brand-900);margin-top:6px">${escapeHtml(proxima.dia)}</div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:4px">
              <i class="fas fa-door-open"></i> Aula ${escapeHtml(proxima.aula || '—')}
            </div>
          </div>` : `<p class="text-muted" style="font-size:var(--fs-sm)">Sin clases programadas.</p>`}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-bolt"></i> Accesos rápidos</h3></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--sp-3)">
        ${[
          { icon: 'fa-file-lines', label: 'Mi kárdex', goto: 'mi-kardex' },
          { icon: 'fa-clock', label: 'Mi horario', goto: 'mi-horario' },
          { icon: 'fa-chart-bar', label: 'Mis notas', goto: 'mis-calificaciones' },
          { icon: 'fa-clipboard-check', label: 'Mi asistencia', goto: 'mi-asistencia' },
          { icon: 'fa-file-invoice', label: 'Mi boleta', goto: 'boleta' },
          { icon: 'fa-bullhorn', label: 'Avisos', goto: 'avisos' }
        ].map((q) => `
          <button class="btn btn-secondary" style="height:auto;padding:var(--sp-4);flex-direction:column;gap:var(--sp-2)" data-goto="${q.goto}">
            <i class="fas ${q.icon}" style="font-size:1.3rem;color:var(--c-brand-500)"></i>
            <span>${q.label}</span>
          </button>`).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-goto]').forEach((b) => {
    b.addEventListener('click', () => { location.hash = `#/${b.dataset.goto}`; });
  });
}

function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}