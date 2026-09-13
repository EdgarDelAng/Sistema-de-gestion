import { KardexService, GruposService, AlumnosService } from '../services/data.service.js';
import { Auth } from '../core/auth.js';
import { escapeHtml } from '../core/ui.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';

export async function renderKardex(container) {
  const esAlumno = Auth.hasRole('alumno');

  if (esAlumno) {
    return renderKardexDirecto(container, Auth.user.alumnoId || 1);
  }

  let grupoSel = null;
  let alumnoSel = null;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-file-lines"></i> Kárdex académico</h1>
        <p class="page-sub">Selecciona un grupo y un alumno para ver su kárdex</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-users"></i> Grupos</h3></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--sp-3)" id="gruposGrid"></div>
    </div>

    <div id="alumnosWrap"></div>
    <div id="kardexWrap"></div>
  `;

  const gruposGrid = container.querySelector('#gruposGrid');
  const alumnosWrap = container.querySelector('#alumnosWrap');
  const kardexWrap = container.querySelector('#kardexWrap');

  const grupos = await GruposService.todos();
  gruposGrid.innerHTML = grupos.map((g) => `
    <div class="grupo-card" data-grupo="${g.id}">
      <div class="grupo-icon"><i class="fas fa-users"></i></div>
      <div class="grupo-info">
        <div class="grupo-name">${escapeHtml(g.nombre)}</div>
        <div class="grupo-meta">Aula ${escapeHtml(g.aula || '—')}</div>
      </div>
    </div>`).join('');

  gruposGrid.querySelectorAll('[data-grupo]').forEach((card) => {
    card.addEventListener('click', async () => {
      gruposGrid.querySelectorAll('.grupo-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      grupoSel = Number(card.dataset.grupo);
      alumnoSel = null;
      kardexWrap.innerHTML = '';
      await renderAlumnos();
    });
  });

  async function renderAlumnos() {
    alumnosWrap.innerHTML = `<div class="skeleton-block" style="height:120px"></div>`;
    const alumnos = await AlumnosService.porGrupo(grupoSel);
    if (!alumnos.length) {
      alumnosWrap.innerHTML = emptyState({ icon: 'fa-user-graduate', title: 'Sin alumnos en este grupo' });
      return;
    }
    alumnosWrap.innerHTML = `
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-user-graduate"></i> Alumnos del grupo</h3></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--sp-3)" id="alumnosGrid">
          ${alumnos.map((a) => {
            const initials = (a.nombre[0] + a.apellidos[0]).toUpperCase();
            return `
              <div class="grupo-card" data-alumno="${a.id}">
                <div class="grupo-icon" style="background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500));border-radius:50%">${initials}</div>
                <div class="grupo-info">
                  <div class="grupo-name">${escapeHtml(a.nombre + ' ' + a.apellidos)}</div>
                  <div class="grupo-meta">${escapeHtml(a.matricula)}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
    alumnosWrap.querySelectorAll('[data-alumno]').forEach((card) => {
      card.addEventListener('click', async () => {
        alumnosWrap.querySelectorAll('.grupo-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        alumnoSel = Number(card.dataset.alumno);
        await renderKardex();
      });
    });
  }

  async function renderKardex() {
    kardexWrap.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;
    const k = await KardexService.porAlumno(alumnoSel);
    const estadoClase = k.estado === 'Regular' ? 'success' : k.estado === 'Riesgo académico' ? 'danger' : 'warning';

    kardexWrap.innerHTML = `
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--sp-4)">
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Alumno</div><div style="font-weight:600">${escapeHtml(k.alumno.nombre + ' ' + k.alumno.apellidos)}</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Matrícula</div><div style="font-weight:600">${escapeHtml(k.alumno.matricula)}</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Grado</div><div style="font-weight:600">${escapeHtml(k.alumno.grado)}</div></div>
          <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Estado</div><div>${statusBadge(k.estado)}</div></div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-chart-line"></i></div><div><div class="stat-value">${k.promedioGeneral.toFixed(2)}</div><div class="stat-label">Promedio acumulado</div></div></div>
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-book"></i></div><div><div class="stat-value">${k.materiasCursadas}</div><div class="stat-label">Materias cursadas</div></div></div>
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-circle-check"></i></div><div><div class="stat-value">${k.materiasAprobadas}</div><div class="stat-label">Aprobadas</div></div></div>
        <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-award"></i></div><div><div class="stat-value">${k.creditosAprobados}/${k.creditosCursados}</div><div class="stat-label">Créditos</div></div></div>
      </div>

      <div class="table-wrap">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Clave</th><th>Materia</th>
                <th style="text-align:center">P1</th>
                <th style="text-align:center">P2</th>
                <th style="text-align:center">P3</th>
                <th style="text-align:center">Promedio</th>
                <th style="text-align:center">Créditos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${k.filas.length === 0 ? `
                <tr><td colspan="8">${emptyState({ icon: 'fa-file-lines', title: 'Sin calificaciones registradas' })}</td></tr>
              ` : k.filas.map((f) => `
                <tr>
                  <td><code style="font-size:.8em">${escapeHtml(f.materia?.clave || '—')}</code></td>
                  <td><strong>${escapeHtml(f.materia?.nombre || '—')}</strong></td>
                  <td style="text-align:center">${f.notas[1] ?? '—'}</td>
                  <td style="text-align:center">${f.notas[2] ?? '—'}</td>
                  <td style="text-align:center">${f.notas[3] ?? '—'}</td>
                  <td style="text-align:center"><strong>${f.promedio ? f.promedio.toFixed(1) : '—'}</strong></td>
                  <td style="text-align:center">${f.creditos || '—'}</td>
                  <td>${statusBadge(f.estado)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

async function renderKardexDirecto(container, alumnoId) {
  container.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;
  const k = await KardexService.porAlumno(alumnoId);
  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-file-lines"></i> Mi kárdex</h1>
        <p class="page-sub">Historial académico acumulado</p>
      </div>
      <button class="btn btn-secondary" id="btnPrint"><i class="fas fa-print"></i> Imprimir</button>
    </div>
    <div class="card" style="margin-bottom:var(--sp-4)">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--sp-4)">
        <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Alumno</div><div style="font-weight:600">${escapeHtml(k.alumno.nombre + ' ' + k.alumno.apellidos)}</div></div>
        <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Matrícula</div><div style="font-weight:600">${escapeHtml(k.alumno.matricula)}</div></div>
        <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Grado</div><div style="font-weight:600">${escapeHtml(k.alumno.grado)}</div></div>
        <div><div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase">Estado</div><div>${statusBadge(k.estado)}</div></div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card success"><div class="stat-icon"><i class="fas fa-chart-line"></i></div><div><div class="stat-value">${k.promedioGeneral.toFixed(2)}</div><div class="stat-label">Promedio</div></div></div>
      <div class="stat-card"><div class="stat-icon"><i class="fas fa-book"></i></div><div><div class="stat-value">${k.materiasCursadas}</div><div class="stat-label">Materias</div></div></div>
      <div class="stat-card success"><div class="stat-icon"><i class="fas fa-circle-check"></i></div><div><div class="stat-value">${k.materiasAprobadas}</div><div class="stat-label">Aprobadas</div></div></div>
      <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-award"></i></div><div><div class="stat-value">${k.creditosAprobados}/${k.creditosCursados}</div><div class="stat-label">Créditos</div></div></div>
    </div>
    <div class="table-wrap"><div class="table-scroll"><table class="table">
      <thead><tr><th>Clave</th><th>Materia</th><th style="text-align:center">P1</th><th style="text-align:center">P2</th><th style="text-align:center">P3</th><th style="text-align:center">Promedio</th><th style="text-align:center">Créditos</th><th>Estado</th></tr></thead>
      <tbody>${k.filas.map((f) => `
        <tr>
          <td><code style="font-size:.8em">${escapeHtml(f.materia?.clave || '—')}</code></td>
          <td><strong>${escapeHtml(f.materia?.nombre || '—')}</strong></td>
          <td style="text-align:center">${f.notas[1] ?? '—'}</td>
          <td style="text-align:center">${f.notas[2] ?? '—'}</td>
          <td style="text-align:center">${f.notas[3] ?? '—'}</td>
          <td style="text-align:center"><strong>${f.promedio ? f.promedio.toFixed(1) : '—'}</strong></td>
          <td style="text-align:center">${f.creditos || '—'}</td>
          <td>${statusBadge(f.estado)}</td>
        </tr>`).join('')}</tbody>
    </table></div></div>
  `;
  container.querySelector('#btnPrint')?.addEventListener('click', () => window.print());
}