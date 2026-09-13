import { UI, escapeHtml } from '../core/ui.js';
import {
  AlumnosService, GruposService, KardexService,
  AsistenciaService, HorariosService
} from '../services/data.service.js';
import { statusBadge } from '../components/status-badge.js';
import { emptyState } from '../components/loading.js';
import { Auth } from '../core/auth.js';
import { Validators, Validacion } from '../components/form-validator.js';

const GRADOS = ['1°','2°','3°','4°','5°','6°'];

export async function renderAlumnos(container) {
   const esProfesor = Auth.hasRole('profesor');
  const esAdmin = Auth.hasRole('admin');
  const esAlumno = Auth.hasRole('alumno');
  const puedeEditar = esAdmin;

  // ⬇️ Si es alumno, mostrar SOLO su propia ficha
  if (esAlumno) {
    return renderMiFichaAlumno(container);
  }// ⬅️ Solo admin puede editar/eliminar

  let grupoSeleccionado = null;

  // Cargar grupos (filtrando si es profesor)
  let grupos = await GruposService.todos();
  if (esProfesor) {
    const horarios = await HorariosService.porProfesor(Auth.user.profesorId);
    const misGruposIds = [...new Set(horarios.map((h) => h.grupoId))];
    grupos = grupos.filter((g) => misGruposIds.includes(g.id));
  }

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-user-graduate"></i> ${esProfesor ? 'Mis alumnos' : 'Alumnos'}</h1>
        <p class="page-sub">${esProfesor ? 'Consulta los alumnos de tus grupos' : 'Selecciona un grupo para ver sus alumnos'}</p>
      </div>
      ${puedeEditar ? `
        <button class="btn btn-primary" id="btnNuevoAlumno">
          <i class="fas fa-plus"></i> Nuevo alumno
        </button>` : ''}
    </div>

    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-users"></i> ${esProfesor ? 'Mis grupos' : 'Grupos'}</h3>
        <span style="font-size:var(--fs-xs);color:var(--text-muted)">${grupos.length} grupo${grupos.length !== 1 ? 's' : ''}</span>
      </div>
      <div id="gruposGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--sp-3)"></div>
    </div>

    <div id="alumnosWrap"></div>
  `;

  const gruposGrid = container.querySelector('#gruposGrid');
  const alumnosWrap = container.querySelector('#alumnosWrap');

  if (!grupos.length) {
    gruposGrid.innerHTML = `<div style="grid-column:1/-1">${emptyState({
      icon: 'fa-users',
      title: 'Sin grupos asignados',
      message: esProfesor ? 'No tienes grupos asignados actualmente.' : 'No hay grupos creados.'
    })}</div>`;
    return;
  }

  // Cargar conteo de alumnos en paralelo
  const conteos = await Promise.all(
    grupos.map(async (g) => ({ id: g.id, count: (await AlumnosService.porGrupo(g.id)).length }))
  );
  const conteoPorGrupo = Object.fromEntries(conteos.map((c) => [c.id, c.count]));

  gruposGrid.innerHTML = grupos.map((g) => `
    <div class="grupo-card" data-grupo="${g.id}">
      <div class="grupo-icon"><i class="fas fa-users"></i></div>
      <div class="grupo-info">
        <div class="grupo-name">${escapeHtml(g.nombre)}</div>
        <div class="grupo-meta">${conteoPorGrupo[g.id] || 0} alumnos · Aula ${escapeHtml(g.aula || '—')}</div>
      </div>
    </div>`).join('');

  gruposGrid.querySelectorAll('[data-grupo]').forEach((card) => {
    card.addEventListener('click', async () => {
      gruposGrid.querySelectorAll('.grupo-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      grupoSeleccionado = Number(card.dataset.grupo);
      await renderTablaAlumnos();
    });
  });

  const btnNuevo = container.querySelector('#btnNuevoAlumno');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', () => abrirFormulario(null, grupos, async () => {
      await renderAlumnos(container);
    }));
  }

  async function renderTablaAlumnos() {
    if (!grupoSeleccionado) return;
    const grupo = grupos.find((g) => g.id === grupoSeleccionado);
    alumnosWrap.innerHTML = `<div class="skeleton-block" style="height:200px"></div>`;

    const alumnos = await AlumnosService.porGrupo(grupoSeleccionado);

    if (!alumnos.length) {
      alumnosWrap.innerHTML = `
        <div class="card">
          ${emptyState({
            icon: 'fa-user-graduate',
            title: `Sin alumnos en ${grupo.nombre}`,
            message: 'Este grupo aún no tiene alumnos asignados.',
            actionLabel: puedeEditar ? 'Nuevo alumno' : '',
            onAction: puedeEditar ? () => abrirFormulario(null, grupos, () => renderTablaAlumnos()) : null
          })}
        </div>`;
      return;
    }

    // Cargar promedios en paralelo
    const conPromedios = await Promise.all(
      alumnos.map(async (a) => {
        try {
          const k = await KardexService.porAlumno(a.id);
          return { ...a, promedio: k.promedioGeneral };
        } catch { return { ...a, promedio: 0 }; }
      })
    );

    alumnosWrap.innerHTML = `
      <div class="table-wrap">
        <div class="table-toolbar">
          <div style="display:flex;align-items:center;gap:var(--sp-2);font-weight:700;color:var(--c-brand-900)">
            <i class="fas fa-users" style="color:var(--c-brand-500)"></i>
            ${escapeHtml(grupo.nombre)} · ${alumnos.length} alumnos
          </div>
          <div class="input-icon" style="flex:1;max-width:260px">
            <i class="fas fa-search"></i>
            <input type="search" class="input" id="buscarAlumnosGrupo" placeholder="Buscar alumno…">
          </div>
        </div>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nombre</th>
                <th style="text-align:center">Edad</th>
                <th style="text-align:center">Promedio</th>
                <th>Estado</th>
                <th style="text-align:right">Acciones</th>
              </tr>
            </thead>
            <tbody id="tbodyAlumnos">
              ${conPromedios.map((a) => filaAlumno(a)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    engancharFilas(conPromedios);

    alumnosWrap.querySelector('#buscarAlumnosGrupo').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const tbody = alumnosWrap.querySelector('#tbodyAlumnos');
      const filtered = conPromedios.filter((a) =>
        `${a.nombre} ${a.apellidos} ${a.matricula}`.toLowerCase().includes(q)
      );
      tbody.innerHTML = filtered.length
        ? filtered.map((a) => filaAlumno(a)).join('')
        : `<tr><td colspan="6">${emptyState({ icon: 'fa-search', title: 'Sin resultados' })}</td></tr>`;
      engancharFilas(filtered);
    });

    function engancharFilas(lista) {
      alumnosWrap.querySelectorAll('[data-ver]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          verDetalleAlumno(Number(btn.dataset.ver));
        });
      });
      alumnosWrap.querySelectorAll('[data-editar]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          abrirFormulario(Number(btn.dataset.editar), grupos, () => renderTablaAlumnos());
        });
      });
      alumnosWrap.querySelectorAll('[data-eliminar]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          confirmarEliminar(Number(btn.dataset.eliminar), async () => {
            await renderAlumnos(container);
          });
        });
      });
      alumnosWrap.querySelectorAll('tbody tr[data-id]').forEach((tr) => {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', (e) => {
          if (e.target.closest('[data-ver], [data-editar], [data-eliminar]')) return;
          verDetalleAlumno(Number(tr.dataset.id));
        });
      });
    }
  }

  function filaAlumno(a) {
    const initials = (a.nombre[0] + a.apellidos[0]).toUpperCase();
    const prom = a.promedio || 0;
    const promClass = prom >= 8 ? 'success' : prom >= 6 ? 'warning' : 'danger';
    return `
      <tr data-id="${a.id}">
        <td><code style="font-size:.8em;color:var(--text-secondary)">${escapeHtml(a.matricula)}</code></td>
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-weight:700;font-size:.68rem;flex-shrink:0">
              ${initials}
            </div>
            <strong>${escapeHtml(a.nombre + ' ' + a.apellidos)}</strong>
          </div>
        </td>
        <td style="text-align:center">${a.fechaNac ? calcularEdad(a.fechaNac) : '—'}</td>
        <td style="text-align:center">
          <span class="badge badge-${promClass}">${prom ? prom.toFixed(1) : '—'}</span>
        </td>
        <td>${statusBadge(a.estado)}</td>
        <td style="text-align:right">
          <div class="table-actions">
            <button class="btn-icon" data-ver="${a.id}" title="Ver información"><i class="fas fa-eye"></i></button>
            ${puedeEditar ? `
              <button class="btn-icon" data-editar="${a.id}" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon danger" data-eliminar="${a.id}" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
  }

  // ============================================================
  // DETALLE DEL ALUMNO
  // ============================================================
  async function verDetalleAlumno(id) {
    const { overlay } = UI.modal({
      title: 'Cargando información…',
      size: 'modal-lg',
      body: `<div class="skeleton-block" style="height:300px"></div>`
    });

    try {
      const [alumno, kardex, asistencia] = await Promise.all([
        AlumnosService.obtener(id),
        KardexService.porAlumno(id).catch(() => null),
        AsistenciaService.historial({ alumnoId: id }).catch(() => [])
      ]);

      const grupo = grupos.find((g) => g.id === alumno.grupoId);
      const initials = (alumno.nombre[0] + alumno.apellidos[0]).toUpperCase();

      overlay.querySelector('.modal-header h2').innerHTML =
        `<i class="fas fa-user-graduate"></i> ${esProfesor ? 'Expediente académico' : 'Información del alumno'}`;

      // Tabs según el rol
      const tabsDisponibles = esProfesor
        ? [
            { id: 'acad',  label: 'Académico',   icon: 'fa-graduation-cap' },
            { id: 'asist', label: 'Asistencia',  icon: 'fa-clipboard-check' }
          ]
        : [
            { id: 'info',  label: 'Datos personales', icon: 'fa-circle-info' },
            { id: 'acad',  label: 'Académico',         icon: 'fa-graduation-cap' },
            { id: 'asist', label: 'Asistencia',        icon: 'fa-clipboard-check' }
          ];

      overlay.querySelector('.modal-body').innerHTML = `
        <div style="display:flex;gap:var(--sp-4);align-items:center;padding-bottom:var(--sp-4);border-bottom:1px solid var(--border);margin-bottom:var(--sp-4)">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
            ${initials}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--fs-lg);font-weight:800;color:var(--c-brand-900)">
              ${escapeHtml(alumno.nombre + ' ' + alumno.apellidos)}
            </div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px">
              <code style="font-size:.9em">${escapeHtml(alumno.matricula)}</code>
              · ${escapeHtml(alumno.grado)}${grupo ? ' · ' + escapeHtml(grupo.nombre) : ''}
            </div>
            ${esProfesor ? `
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px">
                <i class="fas fa-lock"></i> Información personal restringida
              </div>` : ''}
          </div>
          <div style="text-align:right">
            ${statusBadge(alumno.estado)}
            <div style="margin-top:6px;font-size:var(--fs-xs);color:var(--text-muted)">Promedio</div>
            <div style="font-size:var(--fs-xl);font-weight:800;color:var(--c-brand-500)">
              ${alumno.promedio ? alumno.promedio.toFixed(1) : '—'}
            </div>
          </div>
        </div>

        <div style="display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:var(--sp-4);overflow-x:auto">
          ${tabsDisponibles.map((t, i) => `
            <button class="alumno-tab" data-tab="${t.id}" style="padding:10px 16px;font-size:var(--fs-sm);font-weight:600;color:${i === 0 ? 'var(--c-brand-500)' : 'var(--text-secondary)'};border-bottom:2px solid ${i === 0 ? 'var(--c-brand-500)' : 'transparent'};background:none;cursor:pointer;white-space:nowrap;transition:all .15s">
              <i class="fas ${t.icon}"></i> ${t.label}
            </button>`).join('')}
        </div>

        <div id="tabContent"></div>
      `;

      const content = overlay.querySelector('#tabContent');
      const tabs = overlay.querySelectorAll('.alumno-tab');

      const activar = (tab) => {
        tabs.forEach((t) => {
          const activo = t.dataset.tab === tab;
          t.style.color = activo ? 'var(--c-brand-500)' : 'var(--text-secondary)';
          t.style.borderBottomColor = activo ? 'var(--c-brand-500)' : 'transparent';
        });
        if (tab === 'info' && !esProfesor) content.innerHTML = tabInfo(alumno, grupo);
        if (tab === 'acad') content.innerHTML = tabAcademico(kardex);
        if (tab === 'asist') content.innerHTML = tabAsistencia(asistencia);
      };

      tabs.forEach((t) => t.addEventListener('click', () => activar(t.dataset.tab)));
      activar(esProfesor ? 'acad' : 'info');
    } catch (err) {
      UI.toast(err.message, 'error');
      overlay.querySelector('.modal-body').innerHTML = `<p style="color:var(--c-danger)">Error al cargar la información.</p>`;
    }
  }

  function tabInfo(a, grupo) {
    const bloques = [
      ['Matrícula', a.matricula, 'fa-id-card'],
      ['Nombre completo', `${a.nombre} ${a.apellidos}`, 'fa-user'],
      ['Fecha de nacimiento', a.fechaNac || '—', 'fa-cake-candles'],
      ['Edad', a.fechaNac ? `${calcularEdad(a.fechaNac)} años` : '—', 'fa-cake-candles'],
      ['Grado', a.grado, 'fa-graduation-cap'],
      ['Grupo', grupo ? grupo.nombre : 'Sin asignar', 'fa-users'],
      ['Turno', a.turno || '—', 'fa-clock'],
      ['Estado', a.estado, 'fa-circle-info'],
      ['Correo', a.email || '—', 'fa-envelope'],
      ['Teléfono', a.telefono || '—', 'fa-phone'],
      ['Tutor', a.tutor || '—', 'fa-user-tie'],
      ['Dirección', a.direccion || '—', 'fa-location-dot']
    ];
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--sp-3)">
        ${bloques.map(([lbl, val, ico]) => `
          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:4px">
              <i class="fas ${ico}"></i> ${lbl}
            </div>
            <div style="font-weight:600;margin-top:4px">${escapeHtml(String(val))}</div>
          </div>`).join('')}
      </div>`;
  }

  function tabAcademico(k) {
    if (!k || !k.filas.length) {
      return emptyState({ icon: 'fa-chart-bar', title: 'Sin calificaciones registradas' });
    }
    return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-chart-line"></i></div><div><div class="stat-value">${k.promedioGeneral.toFixed(2)}</div><div class="stat-label">Promedio</div></div></div>
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-book"></i></div><div><div class="stat-value">${k.materiasCursadas}</div><div class="stat-label">Cursadas</div></div></div>
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-circle-check"></i></div><div><div class="stat-value">${k.materiasAprobadas}</div><div class="stat-label">Aprobadas</div></div></div>
        <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-award"></i></div><div><div class="stat-value">${k.creditosAprobados}/${k.creditosCursados}</div><div class="stat-label">Créditos</div></div></div>
      </div>
      <div class="table-scroll">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead><tr><th>Materia</th><th style="text-align:center">P1</th><th style="text-align:center">P2</th><th style="text-align:center">P3</th><th style="text-align:center">Prom.</th><th>Estado</th></tr></thead>
          <tbody>
            ${k.filas.map((f) => `
              <tr>
                <td><strong>${escapeHtml(f.materia?.nombre || '—')}</strong></td>
                <td style="text-align:center">${f.notas[1] ?? '—'}</td>
                <td style="text-align:center">${f.notas[2] ?? '—'}</td>
                <td style="text-align:center">${f.notas[3] ?? '—'}</td>
                <td style="text-align:center"><strong>${f.promedio ? f.promedio.toFixed(1) : '—'}</strong></td>
                <td>${statusBadge(f.estado)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function tabAsistencia(asist) {
    if (!asist.length) {
      return emptyState({ icon: 'fa-clipboard-check', title: 'Sin registros de asistencia' });
    }
    const total = asist.length;
    const presentes = asist.filter((a) => a.estado === 'presente').length;
    const faltas = asist.filter((a) => a.estado === 'falta').length;
    const retardos = asist.filter((a) => a.estado === 'retardo').length;
    const pct = total ? Math.round(((presentes + retardos * 0.5) / total) * 100) : 0;
    return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4)">
        <div class="stat-card success"><div class="stat-icon"><i class="fas fa-check"></i></div><div><div class="stat-value">${presentes}</div><div class="stat-label">Presentes</div></div></div>
        <div class="stat-card danger"><div class="stat-icon"><i class="fas fa-xmark"></i></div><div><div class="stat-value">${faltas}</div><div class="stat-label">Faltas</div></div></div>
        <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-clock"></i></div><div><div class="stat-value">${retardos}</div><div class="stat-label">Retardos</div></div></div>
        <div class="stat-card ${pct >= 90 ? 'success' : pct >= 80 ? 'warning' : 'danger'}"><div class="stat-icon"><i class="fas fa-percent"></i></div><div><div class="stat-value">${pct}%</div><div class="stat-label">Asistencia</div></div></div>
      </div>
      <div class="table-scroll" style="max-height:340px;overflow-y:auto">
        <table class="table" style="font-size:var(--fs-sm)">
          <thead><tr><th>Fecha</th><th>Materia</th><th>Estado</th></tr></thead>
          <tbody>
            ${asist.slice(0, 30).map((a) => `
              <tr>
                <td>${a.fecha}</td>
                <td>${escapeHtml(a.materiaNombre)}</td>
                <td>${statusBadge(a.estado)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ============================================================
  // FORMULARIO CREAR / EDITAR (solo admin)
  // ============================================================
  async function abrirFormulario(id, grupos, onSave) {
    let alumno = null;
    if (id) {
      try { alumno = await AlumnosService.obtener(id); }
      catch (e) { UI.toast(e.message, 'error'); return; }
    }

    const esEdicion = !!alumno;
    const data = alumno || {
      nombre: '', apellidos: '', grado: '1°', grupoId: null,
      fechaNac: '', email: '', telefono: '', tutor: '', direccion: '', turno: 'matutino', estado: 'activo'
    };

    const { overlay, close } = UI.modal({
      title: esEdicion ? 'Editar alumno' : 'Nuevo alumno',
      size: 'modal-lg',
      body: `
        <div class="form-grid-2">
          <div class="field">
            <label>Nombre <span class="req">*</span></label>
            <input class="input" id="f_nombre" value="${escapeHtml(data.nombre)}" maxlength="60">
          </div>
          <div class="field">
            <label>Apellidos <span class="req">*</span></label>
            <input class="input" id="f_apellidos" value="${escapeHtml(data.apellidos)}" maxlength="80">
          </div>
          <div class="field">
            <label>Grado <span class="req">*</span></label>
            <select class="select" id="f_grado">
              ${GRADOS.map((g) => `<option value="${g}" ${data.grado === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Grupo <span class="req">*</span></label>
            <select class="select" id="f_grupo">
              <option value="">Selecciona grupo…</option>
              ${grupos.map((g) => `<option value="${g.id}" ${data.grupoId === g.id ? 'selected' : ''}>${escapeHtml(g.nombre)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Fecha de nacimiento</label>
            <input class="input" type="date" id="f_fechaNac" value="${data.fechaNac || ''}">
          </div>
          <div class="field">
            <label>Turno</label>
            <select class="select" id="f_turno">
              <option value="matutino" ${data.turno !== 'vespertino' ? 'selected' : ''}>Matutino</option>
              <option value="vespertino" ${data.turno === 'vespertino' ? 'selected' : ''}>Vespertino</option>
            </select>
          </div>
          <div class="field">
            <label>Correo</label>
            <input class="input" type="email" id="f_email" value="${escapeHtml(data.email || '')}">
          </div>
          <div class="field">
            <label>Teléfono</label>
            <input class="input" id="f_telefono" value="${escapeHtml(data.telefono || '')}" inputmode="tel">
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Tutor</label>
            <input class="input" id="f_tutor" value="${escapeHtml(data.tutor || '')}">
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Dirección</label>
            <input class="input" id="f_direccion" value="${escapeHtml(data.direccion || '')}">
          </div>
          <div class="field">
            <label>Estado</label>
            <select class="select" id="f_estado">
              <option value="activo" ${data.estado !== 'inactivo' ? 'selected' : ''}>Activo</option>
              <option value="inactivo" ${data.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="saveBtn">
          <i class="fas fa-floppy-disk"></i> ${esEdicion ? 'Actualizar' : 'Crear alumno'}
        </button>`
    });

    overlay.querySelector('#f_grupo').addEventListener('change', (e) => {
      const g = grupos.find((x) => x.id === Number(e.target.value));
      if (g) {
        const grado = g.nombre.split(' ')[0];
        overlay.querySelector('#f_grado').value = grado;
      }
    });

    Validacion.bind(overlay, {
      f_nombre: [Validators.required, Validators.minLength(3)],
      f_apellidos: [Validators.required, Validators.minLength(3)],
      f_email: [Validators.email],
      f_telefono: [Validators.phone]
    });

    overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
      const valido = Validacion.validar(overlay, {
        f_nombre: [Validators.required, Validators.minLength(3)],
        f_apellidos: [Validators.required, Validators.minLength(3)],
        f_email: [Validators.email],
        f_telefono: [Validators.phone]
      });
      if (!valido) { UI.toast('Revisa los campos marcados en rojo', 'warning'); return; }

      const payload = {
        nombre: overlay.querySelector('#f_nombre').value.trim(),
        apellidos: overlay.querySelector('#f_apellidos').value.trim(),
        grado: overlay.querySelector('#f_grado').value,
        grupoId: overlay.querySelector('#f_grupo').value ? Number(overlay.querySelector('#f_grupo').value) : null,
        fechaNac: overlay.querySelector('#f_fechaNac').value,
        turno: overlay.querySelector('#f_turno').value,
        email: overlay.querySelector('#f_email').value.trim(),
        telefono: overlay.querySelector('#f_telefono').value.trim(),
        tutor: overlay.querySelector('#f_tutor').value.trim(),
        direccion: overlay.querySelector('#f_direccion').value.trim(),
        estado: overlay.querySelector('#f_estado').value
      };

      if (!payload.grupoId) { UI.toast('Selecciona un grupo', 'warning'); return; }

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      try {
        if (esEdicion) await AlumnosService.actualizar(id, payload);
        else await AlumnosService.crear(payload);
        UI.toast(esEdicion ? 'Alumno actualizado' : 'Alumno creado', 'success');
        close();
        onSave?.();
      } catch (err) {
        UI.toast(err.message, 'error');
        UI.buttonLoading(btn, false);
      }
    });
  }

  async function confirmarEliminar(id, onSave) {
    const alumno = await AlumnosService.obtener(id);
    const ok = await UI.confirm({
      title: 'Eliminar alumno',
      message: `¿Eliminar a ${alumno.nombre} ${alumno.apellidos}? Se borrarán también sus calificaciones, asistencias, trámites y documentos. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    try {
      await AlumnosService.eliminar(id);
      UI.toast('Alumno eliminado', 'success');
      onSave?.();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  function calcularEdad(fechaNac) {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  // ============================================================
// VISTA DE "MI FICHA DE ALUMNO" — Solo para el rol alumno
// ============================================================
async function renderMiFichaAlumno(container) {
  const alumnoId = Auth.user.alumnoId;
  if (!alumnoId) {
    container.innerHTML = `
      <div class="card" style="padding:var(--sp-6);text-align:center">
        <i class="fas fa-triangle-exclamation" style="font-size:2.5rem;color:var(--c-danger);opacity:.5"></i>
        <h3 style="margin-top:var(--sp-3);color:var(--c-brand-900)">Sin ficha de alumno</h3>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-top:var(--sp-2)">
          Tu cuenta no está vinculada a un alumno. Contacta a Servicios Escolares.
        </p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="skeleton-block" style="height:400px"></div>`;

  const [alumno, kardex, grupo, asistencia] = await Promise.all([
    AlumnosService.obtener(alumnoId),
    KardexService.porAlumno(alumnoId).catch(() => null),
    GruposService.obtener(0).catch(() => null),
    AsistenciaService.historial({ alumnoId }).catch(() => [])
  ]);

  const miGrupo = alumno.grupoId ? (await GruposService.obtener(alumno.grupoId).catch(() => null)) : null;
  const initials = (alumno.nombre[0] + alumno.apellidos[0]).toUpperCase();

  const edad = alumno.fechaNac ? (() => {
    const hoy = new Date();
    const nac = new Date(alumno.fechaNac);
    let e = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
    return e;
  })() : null;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-user-graduate"></i> Mi información</h1>
        <p class="page-sub">Tus datos personales y académicos</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-4);background:linear-gradient(135deg, rgba(37,99,235,.08), rgba(20,184,166,.08))">
      <div style="display:flex;gap:var(--sp-4);align-items:center;flex-wrap:wrap">
        <div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-500),var(--c-accent-500));color:#fff;display:grid;place-items:center;font-size:2rem;font-weight:800;flex-shrink:0">
          ${initials}
        </div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:var(--fs-xl);font-weight:800;color:var(--c-brand-900)">
            ${escapeHtml(alumno.nombre + ' ' + alumno.apellidos)}
          </div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:4px">
            <code>${escapeHtml(alumno.matricula)}</code>
            · ${escapeHtml(alumno.grado)}
            ${miGrupo ? '· ' + escapeHtml(miGrupo.nombre) : ''}
          </div>
          <div style="margin-top:var(--sp-3);display:flex;gap:var(--sp-2);flex-wrap:wrap">
            ${statusBadge(alumno.estado)}
            <span class="badge badge-info">Turno ${escapeHtml(alumno.turno || 'matutino')}</span>
          </div>
        </div>
        ${kardex ? `
          <div style="text-align:right">
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">Promedio general</div>
            <div style="font-size:var(--fs-3xl);font-weight:800;color:var(--c-brand-500)">
              ${kardex.promedioGeneral.toFixed(2)}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card success">
        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
        <div><div class="stat-value">${kardex ? kardex.promedioGeneral.toFixed(2) : '—'}</div><div class="stat-label">Promedio</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-book"></i></div>
        <div><div class="stat-value">${kardex ? kardex.materiasCursadas : 0}</div><div class="stat-label">Materias</div></div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><i class="fas fa-circle-check"></i></div>
        <div><div class="stat-value">${kardex ? kardex.materiasAprobadas : 0}</div><div class="stat-label">Aprobadas</div></div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><i class="fas fa-award"></i></div>
        <div><div class="stat-value">${kardex ? `${kardex.creditosAprobados}/${kardex.creditosCursados}` : '0/0'}</div><div class="stat-label">Créditos</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-id-card"></i> Datos personales</h3></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--sp-3)">
        ${[
          ['Matrícula', alumno.matricula, 'fa-id-card'],
          ['Nombre completo', `${alumno.nombre} ${alumno.apellidos}`, 'fa-user'],
          ['Fecha de nacimiento', alumno.fechaNac || '—', 'fa-cake-candles'],
          ['Edad', edad ? `${edad} años` : '—', 'fa-hourglass-half'],
          ['Grado', alumno.grado, 'fa-graduation-cap'],
          ['Grupo', miGrupo ? miGrupo.nombre : 'Sin asignar', 'fa-users'],
          ['Turno', alumno.turno || '—', 'fa-clock'],
          ['Correo', alumno.email || '—', 'fa-envelope'],
          ['Teléfono', alumno.telefono || '—', 'fa-phone'],
          ['Tutor', alumno.tutor || '—', 'fa-user-tie'],
          ['Dirección', alumno.direccion || '—', 'fa-location-dot'],
          ['Estado', alumno.estado, 'fa-circle-info']
        ].map(([lbl, val, ico]) => `
          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:4px">
              <i class="fas ${ico}"></i> ${lbl}
            </div>
            <div style="font-weight:600;margin-top:4px">${escapeHtml(String(val))}</div>
          </div>`).join('')}
      </div>
    </div>

    ${kardex && kardex.filas.length ? `
      <div class="card" style="margin-top:var(--sp-4)">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-chart-bar"></i> Mis calificaciones</h3></div>
        <div class="table-scroll">
          <table class="table" style="font-size:var(--fs-sm)">
            <thead><tr><th>Materia</th><th style="text-align:center">P1</th><th style="text-align:center">P2</th><th style="text-align:center">P3</th><th style="text-align:center">Prom.</th><th>Estado</th></tr></thead>
            <tbody>
              ${kardex.filas.map((f) => `
                <tr>
                  <td><strong>${escapeHtml(f.materia?.nombre || '—')}</strong></td>
                  <td style="text-align:center">${f.notas[1] ?? '—'}</td>
                  <td style="text-align:center">${f.notas[2] ?? '—'}</td>
                  <td style="text-align:center">${f.notas[3] ?? '—'}</td>
                  <td style="text-align:center"><strong>${f.promedio ? f.promedio.toFixed(1) : '—'}</strong></td>
                  <td>${statusBadge(f.estado)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <div class="card" style="margin-top:var(--sp-4);padding:var(--sp-3) var(--sp-4);background:var(--bg-muted);border:none">
      <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted)">
        <i class="fas fa-lock" style="color:var(--c-brand-500)"></i>
        Esta es una vista de solo lectura. Para modificar tu información, contacta a Servicios Escolares.
      </div>
    </div>
  `;
}
}