import { renderDataTable } from '../components/data-table.js';
import { UsuariosService } from '../services/data.service.js';
import { UI, escapeHtml } from '../core/ui.js';
import { RolesService } from '../services/school-ops.service.js';

export async function renderUsuarios(container) {
  await renderDataTable(container, {
    titulo: 'Usuarios del sistema',
    subtitulo: 'Cuentas con acceso al sistema escolar',
    icono: 'fa-user-shield',
    searchPlaceholder: 'Buscar usuario o correo…',
    puedeCrear: true,
    crearLabel: 'Nuevo usuario',
    columnas: [
      { key: 'usuario', label: 'Usuario', render: (u) => `<code>${escapeHtml(u.usuario)}</code>` },
      { key: 'nombre', label: 'Nombre', sortable: true, render: (u) => `<strong>${escapeHtml(u.nombre)}</strong>` },
      { key: 'email', label: 'Correo' },
      { key: 'rol', label: 'Rol', render: (u) => {
        const col = { admin: 'danger', profesor: 'warning', alumno: 'info' }[u.rol] || 'neutral';
        return `<span class="badge badge-${col}" style="text-transform:capitalize">${u.rol}</span>`;
      }},
      { key: 'ultimoAcceso', label: 'Último acceso' },
      { key: 'estado', label: 'Estado', render: (u) =>
        `<span class="badge badge-${u.estado === 'activo' ? 'success' : 'neutral'}">${u.estado}</span>` }
    ],
    servicio: {
      listar: async (f) => {
        const todos = await UsuariosService.todos();
        let items = [...todos];
        if (f.search) {
          const q = f.search.toLowerCase();
          items = items.filter((u) => `${u.usuario} ${u.nombre} ${u.email}`.toLowerCase().includes(q));
        }
        const total = items.length;
        const totalPages = Math.max(1, Math.ceil(total / f.perPage));
        const start = (f.page - 1) * f.perPage;
        return { items: items.slice(start, start + f.perPage), total, page: f.page, perPage: f.perPage, totalPages };
      }
    },
    onCrear: () => formUsuario(),
    onEditar: (id) => formUsuario(id),
    onEliminar: async (id, reload) => {
      const ok = await UI.confirm({ title: 'Eliminar usuario', message: '¿Eliminar esta cuenta?', danger: true, confirmText: 'Eliminar' });
      if (!ok) return;
      await UsuariosService.eliminar(id);
      UI.toast('Usuario eliminado', 'success');
      reload();
    }
  });
  const head = container.querySelector('.page-head');
  if (head) { const actions=head.querySelector('div:last-child')||head; const btn=document.createElement('button'); btn.className='btn btn-secondary'; btn.innerHTML='<i class="fas fa-key"></i> Roles y permisos'; btn.onclick=()=>abrirRoles(); actions.appendChild(btn); }
}

async function abrirRoles(){
 const roles=await RolesService.listar(); const permisos=[['alumnos.ver','Consultar alumnos'],['alumnos.crear','Crear alumnos'],['alumnos.editar','Editar alumnos'],['alumnos.baja','Bajas'],['inscripciones.gestionar','Gestionar inscripciones'],['calificaciones.ver','Consultar calificaciones'],['calificaciones.editar','Capturar calificaciones'],['asistencia.ver','Consultar asistencia'],['asistencia.editar','Capturar asistencia'],['reportes.ver','Consultar reportes'],['reportes.exportar','Exportar reportes'],['usuarios.gestionar','Gestionar usuarios'],['configuracion.editar','Editar configuración']];
 const {overlay,close}=UI.modal({title:'Roles y permisos',size:'lg',body:`<div class="role-tabs">${Object.entries(roles).map(([id,r],i)=>`<button class="${i?'':'active'}" data-role-tab="${id}">${escapeHtml(r.nombre)}</button>`).join('')}</div><div id="roleEditor"></div>`,footer:`<button class="btn btn-secondary" data-action="close">Cerrar</button><button class="btn btn-primary" id="saveRole">Guardar permisos</button>`}); let current=Object.keys(roles)[0]; const paint=()=>{const r=roles[current]; overlay.querySelector('#roleEditor').innerHTML=`<div class="role-editor-head"><div><h3>${escapeHtml(r.nombre)}</h3><p>${escapeHtml(r.descripcion||'')}</p></div><span class="badge badge-neutral">${r.permisos.length} permisos</span></div><div class="permission-grid">${permisos.map(([id,label])=>`<label class="permission-item"><input type="checkbox" value="${id}" ${r.permisos.includes(id)?'checked':''}><span><strong>${label}</strong><small>${id}</small></span></label>`).join('')}</div>`}; paint(); overlay.querySelectorAll('[data-role-tab]').forEach(b=>b.onclick=()=>{overlay.querySelectorAll('[data-role-tab]').forEach(x=>x.classList.toggle('active',x===b));current=b.dataset.roleTab;paint()}); overlay.querySelector('#saveRole').onclick=async()=>{roles[current].permisos=[...overlay.querySelectorAll('#roleEditor input:checked')].map(x=>x.value);await RolesService.guardar(current,{permisos:roles[current].permisos});UI.toast('Permisos actualizados','success');close()};
}

async function formUsuario(id = null) {
  const u = id ? await UsuariosService.obtener(id) : { usuario: '', nombre: '', email: '', rol: 'profesor', estado: 'activo' };
  const { overlay, close } = UI.modal({
    title: id ? 'Editar usuario' : 'Nuevo usuario',
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
        <div class="field"><label>Usuario *</label><input class="input" id="u_usuario" value="${escapeHtml(u.usuario)}"></div>
        <div class="field"><label>Nombre *</label><input class="input" id="u_nombre" value="${escapeHtml(u.nombre)}"></div>
        <div class="field" style="grid-column:1/-1"><label>Correo *</label><input class="input" type="email" id="u_email" value="${escapeHtml(u.email)}"></div>
        <div class="field"><label>Rol *</label>
          <select class="select" id="u_rol">
            <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador</option>
            <option value="profesor" ${u.rol === 'profesor' ? 'selected' : ''}>Profesor</option>
            <option value="alumno" ${u.rol === 'alumno' ? 'selected' : ''}>Alumno</option>
          </select>
        </div>
        <div class="field"><label>Estado</label>
          <select class="select" id="u_estado">
            <option value="activo" ${u.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${u.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" data-action="close">Cancelar</button>
      <button class="btn btn-primary" id="saveBtn"><i class="fas fa-floppy-disk"></i> ${id ? 'Actualizar' : 'Crear'}</button>`
  });
  overlay.querySelector('#saveBtn').addEventListener('click', async (e) => {
    const data = {
      usuario: overlay.querySelector('#u_usuario').value.trim(),
      nombre: overlay.querySelector('#u_nombre').value.trim(),
      email: overlay.querySelector('#u_email').value.trim(),
      rol: overlay.querySelector('#u_rol').value,
      estado: overlay.querySelector('#u_estado').value,
      ultimoAcceso: u.ultimoAcceso || 'Nunca'
    };
    if (!data.usuario || !data.nombre || !data.email) { UI.toast('Completa los campos obligatorios', 'warning'); return; }
    const btn = e.currentTarget;
    UI.buttonLoading(btn, true);
    try {
      if (id) await UsuariosService.actualizar(id, data);
      else await UsuariosService.crear(data);
      UI.toast(id ? 'Usuario actualizado' : 'Usuario creado', 'success');
      close();
      renderUsuarios(document.getElementById('view'));
    } catch (err) { UI.toast(err.message, 'error'); UI.buttonLoading(btn, false); }
  });
}