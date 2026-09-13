import { StatsService } from '../services/data.service.js';
import { escapeHtml } from '../core/ui.js';

export async function renderDashboardAdmin(container) {
  const stats = await StatsService.resumen();
  const top = await StatsService.topAlumnos(5);
  const riesgo = await StatsService.alumnosEnRiesgo(5);

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-gauge-high"></i> Panel de control</h1>
        <p class="page-sub">Resumen general del plantel · Ciclo 2026-2027</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
        <div><div class="stat-value">${stats.alumnos}</div><div class="stat-label">Alumnos</div></div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><i class="fas fa-chalkboard-teacher"></i></div>
        <div><div class="stat-value">${stats.profesores}</div><div class="stat-label">Profesores</div></div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div><div class="stat-value">${stats.grupos}</div><div class="stat-label">Grupos</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-book"></i></div>
        <div><div class="stat-value">${stats.materias}</div><div class="stat-label">Materias</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
        <div><div class="stat-value">${stats.promedioGeneral.toFixed(1)}</div><div class="stat-label">Promedio general</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-5)">
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-trophy"></i> Mejores promedios</h3></div>
        ${top.length === 0 ? `<p class="text-muted" style="font-size:var(--fs-sm)">Sin datos.</p>` : `
          <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
            ${top.map((a, i) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
                <div style="display:flex;align-items:center;gap:var(--sp-3)">
                  <div style="width:26px;height:26px;border-radius:var(--r-sm);background:${i === 0 ? '#f1c40f' : i === 1 ? '#bdc3c7' : i === 2 ? '#cd7f32' : 'var(--c-brand-500)'};color:#fff;display:grid;place-items:center;font-weight:700;font-size:.72em">${i + 1}</div>
                  <div>
                    <div style="font-weight:600;font-size:.85em">${escapeHtml(a.nombre + ' ' + a.apellidos)}</div>
                    <div style="font-size:.7em;color:var(--text-muted)">${escapeHtml(a.grado)}</div>
                  </div>
                </div>
                <span class="badge badge-success">${a.promedio.toFixed(1)}</span>
              </div>`).join('')}
          </div>`}
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title" style="color:var(--c-danger)"><i class="fas fa-triangle-exclamation"></i> Alumnos en riesgo</h3>
        </div>
        ${riesgo.length === 0 ? `<p class="text-muted" style="font-size:var(--fs-sm)">Sin alumnos en riesgo. ¡Excelente!</p>` : `
          <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
            ${riesgo.map((a) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px var(--sp-3);background:var(--c-danger-bg);border-radius:var(--r-md);border-left:3px solid var(--c-danger)">
                <div>
                  <div style="font-weight:600;font-size:.85em">${escapeHtml(a.nombre + ' ' + a.apellidos)}</div>
                  <div style="font-size:.7em;color:var(--text-muted)">${escapeHtml(a.grado)}</div>
                </div>
                <span class="badge badge-danger">${a.promedio.toFixed(1)}</span>
              </div>`).join('')}
          </div>`}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-bolt"></i> Accesos rápidos</h3></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--sp-3)">
        ${quickLinks().map((q) => `
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

function quickLinks() {
  return [
    { icon: 'fa-user-plus', label: 'Nuevo alumno', goto: 'alumnos' },
    { icon: 'fa-chart-bar', label: 'Calificaciones', goto: 'calificaciones' },
    { icon: 'fa-clipboard-check', label: 'Asistencia', goto: 'asistencia' },
    { icon: 'fa-bullhorn', label: 'Avisos', goto: 'avisos' }
  ];
}