import {
  GruposService, AlumnosService, AsistenciaService,
  ProfesoresService, AsistenciaProfesoresService
} from '../services/data.service.js';
import { UI, escapeHtml } from '../core/ui.js';
import { emptyState } from '../components/loading.js';
import { statusBadge } from '../components/status-badge.js';
import { Auth } from '../core/auth.js';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export async function renderAsistencia(container) {
  // ⬇️ Si es alumno, mostrar SOLO su asistencia
  if (Auth.hasRole('alumno')) {
    return renderMiAsistencia(container);
  }

  const puedeEditar = Auth.hasRole('admin') || Auth.hasRole('profesor');
  let tabActual = 'alumnos';

  const stateA = { grupoId: null, dia: null, fecha: null };
  const stateP = { fecha: null };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-clipboard-check"></i> Control de Asistencia</h1>
        <p class="page-sub">Registro diario de asistencia para alumnos y personal docente</p>
      </div>
    </div>

    <div class="panel-tabs">
      <button class="panel-tab active" data-tab="alumnos">
        <i class="fas fa-user-graduate"></i> Asistencia de alumnos
      </button>
      ${Auth.hasRole('admin') ? `
        <button class="panel-tab" data-tab="profesores">
          <i class="fas fa-chalkboard-teacher"></i> Asistencia de profesores
        </button>` : ''}
    </div>

    <div id="viewWrap"></div>
  `;

  const viewWrap = container.querySelector('#viewWrap');

  async function renderAlumnos() {
    let grupos = await GruposService.todos();
    if (Auth.hasRole('profesor')) {
      const { HorariosService } = await import('../services/data.service.js');
      const horarios = await HorariosService.porProfesor(Auth.user.profesorId);
      const misGruposIds = [...new Set(horarios.map((h) => h.grupoId))];
      grupos = grupos.filter((g) => misGruposIds.includes(g.id));
    }

    const alumnos = await AlumnosService.todos();

    viewWrap.innerHTML = `
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-users"></i> Selecciona un grupo</h3>
        </div>
        <div id="gruposGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--sp-3)">
          ${grupos.map((g) => {
            const count = alumnos.filter((a) => a.grupoId === g.id).length;
            return `
              <div class="grupo-card" data-grupo="${g.id}">
                <div class="grupo-icon"><i class="fas fa-users"></i></div>
                <div class="grupo-info">
                  <div class="grupo-name">${escapeHtml(g.nombre)}</div>
                  <div class="grupo-meta">${count} alumnos · Aula ${escapeHtml(g.aula || '—')}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
      <div id="diasWrap"></div>
      <div id="listaWrap"></div>
    `;

    const gruposGrid = viewWrap.querySelector('#gruposGrid');
    const diasWrap = viewWrap.querySelector('#diasWrap');
    const listaWrap = viewWrap.querySelector('#listaWrap');

    gruposGrid.querySelectorAll('[data-grupo]').forEach((card) => {
      card.addEventListener('click', () => {
        gruposGrid.querySelectorAll('.grupo-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        stateA.grupoId = Number(card.dataset.grupo);
        stateA.dia = null;
        stateA.fecha = null;
        listaWrap.innerHTML = '';
        renderDias();
      });
    });

    function renderDias() {
      const grupo = grupos.find((g) => g.id === stateA.grupoId);
      if (!grupo) return;
      diasWrap.innerHTML = `
        <div class="card" style="margin-bottom:var(--sp-4)">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-calendar-day"></i> Selecciona un día · ${escapeHtml(grupo.nombre)}</h3>
            <span class="badge badge-info">Semana actual</span>
          </div>
          <div class="dias-grid">
            ${DIAS.map((d) => `<button class="dia-btn" data-dia="${d}"><div style="font-weight:700">${d}</div><div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px" data-fecha="${d}"></div></button>`).join('')}
          </div>
        </div>
      `;
      DIAS.forEach((d) => {
        const span = diasWrap.querySelector(`[data-fecha="${d}"]`);
        if (span) span.textContent = formatoFecha(diaToFecha(d));
      });
      diasWrap.querySelectorAll('[data-dia]').forEach((btn) => {
        btn.addEventListener('click', () => {
          diasWrap.querySelectorAll('.dia-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          stateA.dia = btn.dataset.dia;
          stateA.fecha = diaToFecha(stateA.dia);
          renderLista();
        });
      });
    }

    async function renderLista() {
      if (!stateA.grupoId || !stateA.dia) return;
      listaWrap.innerHTML = `<div class="skeleton-block" style="height:300px"></div>`;

      const grupo = grupos.find((g) => g.id === stateA.grupoId);
      const items = await AsistenciaService.porGrupoFecha(stateA.grupoId, stateA.fecha);

      if (!items.length) {
        listaWrap.innerHTML = `<div class="card">${emptyState({ icon: 'fa-users', title: `Sin alumnos en ${grupo.nombre}` })}</div>`;
        return;
      }

      const presentes = items.filter((x) => x.estado === 'presente').length;
      const faltas = items.filter((x) => x.estado === 'falta').length;
      const retardos = items.filter((x) => x.estado === 'retardo').length;
      const justificadas = items.filter((x) => x.estado === 'justificada').length;
      const pct = items.length ? Math.round(((presentes + retardos * 0.5 + justificadas * 0.5) / items.length) * 100) : 0;

      listaWrap.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-clipboard-check"></i> ${escapeHtml(grupo.nombre)} · ${stateA.dia} · ${formatoFecha(stateA.fecha)}</h3>
            ${puedeEditar ? `<button class="btn btn-primary" id="btnGuardar"><i class="fas fa-floppy-disk"></i> Guardar asistencia</button>` : ''}
          </div>
          <div class="stats-grid" style="margin-bottom:var(--sp-4)">
            <div class="stat-card success"><div class="stat-icon"><i class="fas fa-check"></i></div><div><div class="stat-value">${presentes}</div><div class="stat-label">Presentes</div></div></div>
            <div class="stat-card danger"><div class="stat-icon"><i class="fas fa-xmark"></i></div><div><div class="stat-value">${faltas}</div><div class="stat-label">Faltas</div></div></div>
            <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-clock"></i></div><div><div class="stat-value">${retardos}</div><div class="stat-label">Retardos</div></div></div>
            <div class="stat-card info"><div class="stat-icon"><i class="fas fa-file-medical"></i></div><div><div class="stat-value">${justificadas}</div><div class="stat-label">Justificadas</div></div></div>
            <div class="stat-card ${pct >= 90 ? 'success' : pct >= 80 ? 'warning' : 'danger'}"><div class="stat-icon"><i class="fas fa-percent"></i></div><div><div class="stat-value">${pct}%</div><div class="stat-label">Asistencia</div></div></div>
          </div>
          <div id="filasAsistencia">
            ${items.map((x) => filaAlumno(x)).join('')}
          </div>
        </div>
      `;

      const estados = {};
      items.forEach((x) => { estados[x.alumno.id] = x.estado === 'sin-registro' ? 'presente' : x.estado; });

      listaWrap.querySelectorAll('[data-set]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const alumnoId = Number(btn.dataset.alumno);
          const nuevoEstado = btn.dataset.set;
          estados[alumnoId] = nuevoEstado;
          const fila = listaWrap.querySelector(`.asist-row[data-alumno="${alumnoId}"]`);
          fila.querySelectorAll('[data-set]').forEach((b) => {
            b.classList.remove('btn-success', 'btn-primary', 'btn-warning', 'btn-danger', 'btn-info');
            b.classList.add('btn-secondary');
          });
          const claseActiva = { presente: 'btn-success', retardo: 'btn-primary', justificada: 'btn-info', falta: 'btn-danger' }[nuevoEstado];
          btn.classList.remove('btn-secondary');
          btn.classList.add(claseActiva);
          fila.classList.remove('presente', 'falta', 'retardo', 'justificada');
          fila.classList.add(nuevoEstado);
          fila.style.background = '';
          fila.style.borderLeftColor = '';
        });
      });

      const btnGuardar = listaWrap.querySelector('#btnGuardar');
      if (btnGuardar) {
        btnGuardar.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          UI.buttonLoading(btn, true);
          try {
            const lista = Object.entries(estados).map(([alumnoId, estado]) => ({ alumnoId: Number(alumnoId), estado }));
            await AsistenciaService.guardarLista(stateA.grupoId, stateA.fecha, 1, lista);
            UI.toast('Asistencia guardada', 'success');
            renderLista();
          } catch (err) { UI.toast(err.message, 'error'); }
          UI.buttonLoading(btn, false);
        });
      }
    }

    function filaAlumno(x) {
      const initials = (x.alumno.nombre[0] + x.alumno.apellidos[0]).toUpperCase();
      const estado = x.estado === 'sin-registro' ? 'falta' : x.estado;
      return `
        <div class="asist-row ${estado}" data-alumno="${x.alumno.id}" style="${x.estado === 'sin-registro' ? 'background:var(--bg-muted);border-left-color:var(--text-muted)' : ''}">
          <div class="avatar-mini">${initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--c-brand-900);font-size:var(--fs-base)">${escapeHtml(x.alumno.nombre + ' ' + x.alumno.apellidos)}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">${escapeHtml(x.alumno.matricula)}</div>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
            <button class="btn btn-sm ${x.estado === 'presente' ? 'btn-success' : 'btn-secondary'}" data-set="presente" data-alumno="${x.alumno.id}"><i class="fas fa-check"></i> Presente</button>
            <button class="btn btn-sm ${x.estado === 'retardo' ? 'btn-primary' : 'btn-secondary'}" data-set="retardo" data-alumno="${x.alumno.id}"><i class="fas fa-clock"></i> Retardo</button>
            <button class="btn btn-sm ${x.estado === 'justificada' ? 'btn-info' : 'btn-secondary'}" data-set="justificada" data-alumno="${x.alumno.id}"><i class="fas fa-file-medical"></i> Justificada</button>
            <button class="btn btn-sm ${x.estado === 'falta' ? 'btn-danger' : 'btn-secondary'}" data-set="falta" data-alumno="${x.alumno.id}"><i class="fas fa-xmark"></i> Falta</button>
          </div>
        </div>`;
    }
  }

  async function renderProfesores() {
    const hoy = new Date().toISOString().slice(0, 10);
    viewWrap.innerHTML = `
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-calendar-day"></i> Asistencia del personal docente</h3></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--sp-3);align-items:end">
          <div class="field" style="margin:0"><label>Fecha</label><input class="input" type="date" id="p_fecha" value="${hoy}"></div>
          <button class="btn btn-primary" id="btnCargarProfes"><i class="fas fa-search"></i> Cargar lista</button>
          ${puedeEditar ? `<button class="btn btn-success" id="btnGuardarProfes" disabled><i class="fas fa-floppy-disk"></i> Guardar</button>` : ''}
        </div>
      </div>
      <div id="listaProfesWrap"></div>
    `;

    const fechaInput = viewWrap.querySelector('#p_fecha');
    const btnCargar = viewWrap.querySelector('#btnCargarProfes');
    const btnGuardar = viewWrap.querySelector('#btnGuardarProfes');
    const listaWrap = viewWrap.querySelector('#listaProfesWrap');

    await cargarProfes(hoy);
    btnCargar.addEventListener('click', () => cargarProfes(fechaInput.value));

    async function cargarProfes(fecha) {
      listaWrap.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;
      const items = await AsistenciaProfesoresService.porFecha(fecha);

      if (!items.length) {
        listaWrap.innerHTML = `<div class="card">${emptyState({ icon: 'fa-chalkboard-teacher', title: 'Sin profesores' })}</div>`;
        return;
      }

      const presentes = items.filter((x) => x.estado === 'presente').length;
      const retardos = items.filter((x) => x.estado === 'retardo').length;
      const faltas = items.filter((x) => x.estado === 'falta').length;
      const justificadas = items.filter((x) => x.estado === 'justificada').length;
      const pct = items.length ? Math.round(((presentes + retardos * 0.5 + justificadas * 0.5) / items.length) * 100) : 0;

      listaWrap.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-users"></i> Plantilla docente · ${formatoFecha(fecha)}</h3>
            <span class="badge badge-info">${items.length} profesores</span>
          </div>
          <div class="stats-grid" style="margin-bottom:var(--sp-4)">
            <div class="stat-card success"><div class="stat-icon"><i class="fas fa-check"></i></div><div><div class="stat-value">${presentes}</div><div class="stat-label">Presentes</div></div></div>
            <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-clock"></i></div><div><div class="stat-value">${retardos}</div><div class="stat-label">Retardos</div></div></div>
            <div class="stat-card info"><div class="stat-icon"><i class="fas fa-file-medical"></i></div><div><div class="stat-value">${justificadas}</div><div class="stat-label">Justificadas</div></div></div>
            <div class="stat-card danger"><div class="stat-icon"><i class="fas fa-xmark"></i></div><div><div class="stat-value">${faltas}</div><div class="stat-label">Faltas</div></div></div>
            <div class="stat-card ${pct >= 90 ? 'success' : pct >= 80 ? 'warning' : 'danger'}"><div class="stat-icon"><i class="fas fa-percent"></i></div><div><div class="stat-value">${pct}%</div><div class="stat-label">Asistencia</div></div></div>
          </div>
          <div id="filasProfes">${items.map((x) => filaProfesor(x)).join('')}</div>
        </div>
      `;

      const estados = {};
      items.forEach((x) => { estados[x.profesor.id] = x.estado === 'sin-registro' ? 'presente' : x.estado; });

      if (btnGuardar) btnGuardar.disabled = false;

      listaWrap.querySelectorAll('[data-set-prof]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const profId = Number(btn.dataset.prof);
          const nuevoEstado = btn.dataset.setProf;
          estados[profId] = nuevoEstado;
          const fila = listaWrap.querySelector(`.prof-row[data-prof="${profId}"]`);
          fila.querySelectorAll('[data-set-prof]').forEach((b) => {
            b.classList.remove('btn-success', 'btn-primary', 'btn-info', 'btn-danger');
            b.classList.add('btn-secondary');
          });
          const clase = { presente: 'btn-success', retardo: 'btn-primary', justificada: 'btn-info', falta: 'btn-danger' }[nuevoEstado];
          btn.classList.remove('btn-secondary');
          btn.classList.add(clase);
          fila.classList.remove('presente', 'falta', 'retardo', 'justificada');
          fila.classList.add(nuevoEstado);
          fila.style.background = '';
          fila.style.borderLeftColor = '';
        });
      });

      if (btnGuardar) {
        const newBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(newBtn, btnGuardar);
        newBtn.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          UI.buttonLoading(btn, true);
          try {
            const lista = Object.entries(estados).map(([profesorId, estado]) => ({ profesorId: Number(profesorId), estado, horaEntrada: null, horaSalida: null, observaciones: '' }));
            await AsistenciaProfesoresService.guardarLista(fecha, lista);
            UI.toast('Asistencia guardada', 'success');
            cargarProfes(fecha);
          } catch (err) { UI.toast(err.message, 'error'); }
          UI.buttonLoading(btn, false);
        });
      }
    }

    function filaProfesor(x) {
      const p = x.profesor;
      const initials = (p.nombre[0] + p.apellidos[0]).toUpperCase();
      const estado = x.estado === 'sin-registro' ? 'falta' : x.estado;
      return `
        <div class="prof-row asist-row ${estado}" data-prof="${p.id}" style="${x.estado === 'sin-registro' ? 'background:var(--bg-muted);border-left-color:var(--text-muted)' : ''}">
          <div class="avatar-mini" style="background:linear-gradient(135deg,var(--c-accent-500),var(--c-brand-500))">${initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--c-brand-900);font-size:var(--fs-base)">${escapeHtml(p.nombre + ' ' + p.apellidos)}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-top:2px">
              <span><code>${escapeHtml(p.numEmpleado)}</code></span>
              <span>· ${escapeHtml(p.area)}</span>
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
            <button class="btn btn-sm ${x.estado === 'presente' ? 'btn-success' : 'btn-secondary'}" data-set-prof="presente" data-prof="${p.id}"><i class="fas fa-check"></i> Presente</button>
            <button class="btn btn-sm ${x.estado === 'retardo' ? 'btn-primary' : 'btn-secondary'}" data-set-prof="retardo" data-prof="${p.id}"><i class="fas fa-clock"></i> Retardo</button>
            <button class="btn btn-sm ${x.estado === 'justificada' ? 'btn-info' : 'btn-secondary'}" data-set-prof="justificada" data-prof="${p.id}"><i class="fas fa-file-medical"></i> Justificada</button>
            <button class="btn btn-sm ${x.estado === 'falta' ? 'btn-danger' : 'btn-secondary'}" data-set-prof="falta" data-prof="${p.id}"><i class="fas fa-xmark"></i> Falta</button>
          </div>
        </div>`;
    }
  }

  container.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.panel-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      tabActual = tab.dataset.tab;
      if (tabActual === 'alumnos') renderAlumnos();
      else renderProfesores();
    });
  });

  await renderAlumnos();
}

function diaToFecha(dia) {
  const map = { Lunes: 1, Martes: 2, 'Miércoles': 3, Jueves: 4, Viernes: 5 };
  const hoy = new Date();
  const diaActual = hoy.getDay() === 0 ? 7 : hoy.getDay();
  const diff = map[dia] - diaActual;
  const fecha = new Date(hoy);
  fecha.setDate(hoy.getDate() + diff);
  return fecha.toISOString().slice(0, 10);
}

function formatoFecha(fechaISO) {
  const f = new Date(fechaISO + 'T12:00:00');
  return f.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ============================================================
// VISTA DE "MI ASISTENCIA" — Solo para alumno
// ============================================================
async function renderMiAsistencia(container) {
  const alumnoId = Auth.user.alumnoId;
  if (!alumnoId) {
    container.innerHTML = `<div class="card" style="padding:var(--sp-6);text-align:center">
      <i class="fas fa-triangle-exclamation" style="font-size:2.5rem;color:var(--c-danger);opacity:.5"></i>
      <h3 style="margin-top:var(--sp-3);color:var(--c-brand-900)">Sin ficha de alumno</h3>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;

  const [alumno, asistencia] = await Promise.all([
    AlumnosService.obtener(alumnoId),
    AsistenciaService.historial({ alumnoId }).catch(() => [])
  ]);

  const total = asistencia.length;
  const presentes = asistencia.filter((a) => a.estado === 'presente').length;
  const faltas = asistencia.filter((a) => a.estado === 'falta').length;
  const retardos = asistencia.filter((a) => a.estado === 'retardo').length;
  const justificadas = asistencia.filter((a) => a.estado === 'justificada').length;
  const pct = total ? Math.round(((presentes + retardos * 0.5 + justificadas * 0.5) / total) * 100) : 0;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-clipboard-check"></i> Mi asistencia</h1>
        <p class="page-sub">Consulta tu historial de asistencia</p>
      </div>
      <button class="btn btn-secondary" id="btnPrint"><i class="fas fa-print"></i> Imprimir</button>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4);background:linear-gradient(135deg, rgba(37,99,235,.08), rgba(20,184,166,.08))">
      <div style="display:flex;gap:var(--sp-4);align-items:center;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
          ${(alumno.nombre[0] + alumno.apellidos[0]).toUpperCase()}
        </div>
        <div style="flex:1">
          <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">${escapeHtml(alumno.nombre + ' ' + alumno.apellidos)}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
            <code>${escapeHtml(alumno.matricula)}</code> · ${escapeHtml(alumno.grado)}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">Asistencia general</div>
          <div style="font-size:var(--fs-3xl);font-weight:800;color:${pct >= 90 ? 'var(--c-success-fg)' : pct >= 80 ? 'var(--c-warning-fg)' : 'var(--c-danger-fg)'}">
            ${pct}%
          </div>
        </div>
      </div>
    </div>

    ${total === 0 ? `
      <div class="card">${emptyState({ icon: 'fa-clipboard-check', title: 'Sin registros de asistencia', message: 'Aún no tienes registros.' })}</div>
    ` : `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-check"></i></div><div><div class="stat-value">${presentes}</div><div class="stat-label">Presentes</div></div></div>
        <div class="stat-card danger"><div class="stat-icon"><i class="fas fa-xmark"></i></div><div><div class="stat-value">${faltas}</div><div class="stat-label">Faltas</div></div></div>
        <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-clock"></i></div><div><div class="stat-value">${retardos}</div><div class="stat-label">Retardos</div></div></div>
        <div class="stat-card info"><div class="stat-icon"><i class="fas fa-file-medical"></i></div><div><div class="stat-value">${justificadas}</div><div class="stat-label">Justificadas</div></div></div>
      </div>

      <div class="table-wrap">
        <div class="table-toolbar">
          <div style="display:flex;align-items:center;gap:var(--sp-2);font-weight:700;color:var(--c-brand-900)">
            <i class="fas fa-list" style="color:var(--c-brand-500)"></i>
            Historial · ${total} registros
          </div>
        </div>
        <div class="table-scroll" style="max-height:500px;overflow-y:auto">
          <table class="table" style="font-size:var(--fs-sm)">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Materia</th>
                <th style="text-align:center">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${asistencia.map((a) => `
                <tr>
                  <td>${escapeHtml(a.fecha)}</td>
                  <td>${escapeHtml(a.materiaNombre)}</td>
                  <td style="text-align:center">${statusBadge(a.estado)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `}

    <div class="card" style="margin-top:var(--sp-4);padding:var(--sp-3) var(--sp-4);background:var(--bg-muted);border:none">
      <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted)">
        <i class="fas fa-lock" style="color:var(--c-brand-500)"></i>
        Vista de solo lectura. Esta información es exclusivamente tuya.
      </div>
    </div>
  `;

  container.querySelector('#btnPrint')?.addEventListener('click', () => window.print());
}