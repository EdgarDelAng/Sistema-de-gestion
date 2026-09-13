import { KardexService, ConfigService } from '../services/data.service.js';
import { Auth } from '../core/auth.js';
import { escapeHtml, UI } from '../core/ui.js';
import { PeriodSelector } from '../components/period-selector.js';

export async function renderBoleta(container) {
  // ⬇️ Alumno solo ve su propia boleta
  const alumnoId = Auth.user.alumnoId || 1;
  const k = await KardexService.porAlumno(alumnoId);
  const cfg = await ConfigService.obtener();
  const sel = PeriodSelector.current;
  const folio = 'BOL-' + sel.ciclo.replace('-', '') + '-' + String(alumnoId).padStart(5, '0');

  container.innerHTML = `
    <div class="page-head no-print">
      <div>
        <h1 class="page-title"><i class="fas fa-file-invoice"></i> Mi boleta</h1>
        <p class="page-sub">Periodo: ${escapeHtml(sel.periodo)}</p>
      </div>
      <div style="display:flex;gap:var(--sp-2)">
        <button class="btn btn-secondary" id="btnPdf"><i class="fas fa-file-pdf"></i> PDF</button>
        <button class="btn btn-primary" id="btnPrint"><i class="fas fa-print"></i> Imprimir</button>
      </div>
    </div>

    <div class="card" id="boleta" style="max-width:820px;margin:0 auto;padding:var(--sp-6)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:var(--sp-4);border-bottom:2px solid var(--c-brand-900);margin-bottom:var(--sp-5)">
        <div style="display:flex;gap:var(--sp-4);align-items:center">
          <div style="width:60px;height:60px;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));border-radius:var(--r-lg);display:grid;place-items:center;color:#fff;font-size:1.6rem">
            <i class="fas fa-school" aria-hidden="true"></i>
          </div>
          <div>
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900);letter-spacing:-.02em">${escapeHtml(cfg.nombreColegio)}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px">${escapeHtml(cfg.direccion)}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">Tel: ${escapeHtml(cfg.telefono)} · ${escapeHtml(cfg.email)}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Folio</div>
          <div style="font-weight:700;color:var(--c-brand-900)">${escapeHtml(folio)}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--sp-2)">Fecha de emisión</div>
          <div style="font-weight:600">${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:var(--sp-5)">
        <div style="font-size:var(--fs-md);font-weight:800;color:var(--c-brand-900);text-transform:uppercase;letter-spacing:.08em">Boleta de Calificaciones</div>
        <div style="font-size:var(--fs-xs);color:var(--text-secondary);margin-top:4px">Ciclo escolar ${escapeHtml(sel.ciclo)} · ${escapeHtml(sel.periodo)}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);padding:var(--sp-4);background:var(--bg-muted);border-radius:var(--r-md);margin-bottom:var(--sp-5);font-size:var(--fs-sm)">
        <div><span style="color:var(--text-muted)">Alumno: </span><strong>${escapeHtml(k.alumno.nombre + ' ' + k.alumno.apellidos)}</strong></div>
        <div><span style="color:var(--text-muted)">Matrícula: </span><strong>${escapeHtml(k.alumno.matricula)}</strong></div>
        <div><span style="color:var(--text-muted)">Grado: </span><strong>${escapeHtml(k.alumno.grado)}</strong></div>
        <div><span style="color:var(--text-muted)">Grupo: </span><strong>${escapeHtml(String(k.alumno.grupoId || '—'))}</strong></div>
      </div>

      <table class="table" style="margin-bottom:var(--sp-5)">
        <thead>
          <tr>
            <th>Clave</th>
            <th>Materia</th>
            <th style="text-align:center">P1</th>
            <th style="text-align:center">P2</th>
            <th style="text-align:center">P3</th>
            <th style="text-align:center">Final</th>
            <th style="text-align:center">Créditos</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${k.filas.map((f) => `
            <tr>
              <td><code style="font-size:.8em">${escapeHtml(f.materia?.clave || '—')}</code></td>
              <td>${escapeHtml(f.materia?.nombre || '—')}</td>
              <td style="text-align:center">${f.notas[1] ?? '—'}</td>
              <td style="text-align:center">${f.notas[2] ?? '—'}</td>
              <td style="text-align:center">${f.notas[3] ?? '—'}</td>
              <td style="text-align:center"><strong>${f.promedio ? f.promedio.toFixed(1) : '—'}</strong></td>
              <td style="text-align:center">${f.creditos || '—'}</td>
              <td>${f.estado}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-4);padding:var(--sp-4);background:linear-gradient(135deg,var(--c-brand-900),var(--c-brand-700));border-radius:var(--r-md);color:#fff;margin-bottom:var(--sp-5)">
        <div style="text-align:center">
          <div style="font-size:var(--fs-xs);opacity:.75;text-transform:uppercase;letter-spacing:.06em">Promedio general</div>
          <div style="font-size:var(--fs-2xl);font-weight:800;margin-top:4px">${k.promedioGeneral.toFixed(2)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:var(--fs-xs);opacity:.75;text-transform:uppercase;letter-spacing:.06em">Materias aprobadas</div>
          <div style="font-size:var(--fs-2xl);font-weight:800;margin-top:4px">${k.materiasAprobadas}/${k.materiasCursadas}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:var(--fs-xs);opacity:.75;text-transform:uppercase;letter-spacing:.06em">Créditos</div>
          <div style="font-size:var(--fs-2xl);font-weight:800;margin-top:4px">${k.creditosAprobados}/${k.creditosCursados}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-5);margin-top:var(--sp-8);font-size:var(--fs-xs);color:var(--text-secondary);text-align:center">
        <div><div style="border-top:1px solid var(--text-secondary);padding-top:var(--sp-2);margin-top:var(--sp-6)">Tutor / Coordinación</div></div>
        <div><div style="border-top:1px solid var(--text-secondary);padding-top:var(--sp-2);margin-top:var(--sp-6)">Dirección Académica</div></div>
        <div><div style="border-top:1px solid var(--text-secondary);padding-top:var(--sp-2);margin-top:var(--sp-6)">Sello institucional</div></div>
      </div>

      <div style="text-align:center;margin-top:var(--sp-6);font-size:var(--fs-xs);color:var(--text-muted)">
        Documento oficial · Generado el ${new Date().toLocaleString('es-MX')}
      </div>
    </div>
  `;

  container.querySelector('#btnPrint').addEventListener('click', () => window.print());
  container.querySelector('#btnPdf').addEventListener('click', () => {
    UI.toast('Generando PDF…', 'info', 900);
    setTimeout(() => window.print(), 500);
  });
}