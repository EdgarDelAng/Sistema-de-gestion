import { Auth } from '../core/auth.js';
import { StatsService, HorariosService, CatalogosService } from '../services/data.service.js';
import { escapeHtml } from '../core/ui.js';

export async function renderDashboardProfesor(container) {
  const u = Auth.user;
  const saludo = getSaludo();
  const grupos = await CatalogosService.grupos();
  const alumnos = await CatalogosService.alumnos();
  const materias = await CatalogosService.materias();

  // Simular: el profesor 1 imparte 3 materias
  const profesorId = u.profesorId || 1;
  const misMaterias = materias.filter((m) => m.profesorId === profesorId);
  const misGrupos = grupos.slice(0, 4); // demo
  const misAlumnos = alumnos.filter((a) => misGrupos.some((g) => g.id === a.grupoId));

  // Próxima clase (demo)
  const horarios = await HorariosService.porProfesor(profesorId);
  const proxima = horarios[0];

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-gauge-high"></i> ${saludo}, ${escapeHtml(u.nombre.split(' ')[0])}</h1>
        <p class="page-sub">Panel docente · Ciclo 2026-2027</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div><div class="stat-value">${misGrupos.length}</div><div class="stat-label">Mis grupos</div></div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
        <div><div class="stat-value">${misAlumnos.length}</div><div class="stat-label">Alumnos</div></div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><i class="fas fa-book"></i></div>
        <div><div class="stat-value">${misMaterias.length}</div><div class="stat-label">Materias</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--sp-4)">
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-list-check"></i> Pendientes</h3></div>
        <div class="list-item">
          <i class="fas fa-pen-to-square" style="color:var(--c-warning);font-size:1.1rem"></i>
          <div style="flex:1">
            <div class="list-item-title">Capturar calificaciones del primer parcial</div>
            <div class="list-item-desc">Tienes 3 grupos pendientes de captura</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="location.hash='#/calificaciones'">Ir</button>
        </div>
        <div class="list-item">
          <i class="fas fa-clipboard-check" style="color:var(--c-brand-500);font-size:1.1rem"></i>
          <div style="flex:1">
            <div class="list-item-title">Pase de lista pendiente</div>
            <div class="list-item-desc">Grupo 6°A · Matemáticas</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="location.hash='#/asistencia'">Ir</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-clock"></i> Próxima clase</h3></div>
        ${proxima ? `
          <div style="padding:var(--sp-4);background:var(--bg-muted);border-radius:var(--r-md);text-align:center">
            <div style="font-size:1.6rem;font-weight:800;color:var(--c-brand-500)">${proxima.horaInicio}</div>
            <div style="font-weight:700;color:var(--c-brand-900);margin-top:4px">${escapeHtml(proxima.dia)}</div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:var(--sp-2)">
              Aula ${escapeHtml(proxima.aula || '—')}
            </div>
          </div>` : `
          <p class="text-muted" style="font-size:var(--fs-sm)">Sin clases programadas hoy.</p>`}
      </div>
    </div>
  `;
}

function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}