import { Auth } from '../core/auth.js';
import { HorariosService, CatalogosService, _db, ConfigService } from '../services/data.service.js';
import { escapeHtml } from '../core/ui.js';

export async function renderDashboardProfesor(container) {
  const u = Auth.user;
  const saludo = getSaludo();
  const grupos = await CatalogosService.grupos();
  const alumnos = await CatalogosService.alumnos();
  const materias = await CatalogosService.materias();
  const cfg = ConfigService.actual();
  const db = _db();
  const profesorId = Number(u.profesorId);
  if (!profesorId) {
    container.innerHTML = `<div class="card" style="padding:var(--sp-8);text-align:center"><i class="fas fa-user-lock" style="font-size:2rem;color:var(--c-warning)"></i><h2 style="margin-top:var(--sp-3)">Cuenta sin ficha docente vinculada</h2><p class="text-muted">Cierra sesión e inicia nuevamente con tu matrícula docente.</p></div>`;
    return;
  }
  const asignaciones = (db.materiaGrupo || []).filter(x => x.profesorId === profesorId);
  const grupoIds = [...new Set(asignaciones.map(x => x.grupoId))];
  const materiaIds = [...new Set(asignaciones.map(x => x.materiaId))];
  const misMaterias = materias.filter(m => materiaIds.includes(m.id));
  const misGrupos = grupos.filter(g => grupoIds.includes(g.id));
  const misAlumnos = alumnos.filter(a => grupoIds.includes(a.grupoId) && a.estado === 'activo');
  const horarios = await HorariosService.porProfesor(profesorId);
  const proxima = horarios[0];

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-gauge-high"></i> ${saludo}, ${escapeHtml(u.nombre.split(' ')[0])}</h1>
        <p class="page-sub">Panel docente · Ciclo ${escapeHtml(cfg.cicloEscolar || '—')}</p>
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
            <div class="list-item-desc">Tienes ${misGrupos.length} grupos asignados para seguimiento</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="location.hash='#/calificaciones'">Ir</button>
        </div>
        <div class="list-item">
          <i class="fas fa-clipboard-check" style="color:var(--c-brand-500);font-size:1.1rem"></i>
          <div style="flex:1">
            <div class="list-item-title">Pase de lista pendiente</div>
            <div class="list-item-desc">${misGrupos[0] ? escapeHtml(misGrupos[0].nombre) : 'Sin grupo'} · ${misMaterias[0] ? escapeHtml(misMaterias[0].nombre) : 'Sin materia'}</div>
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