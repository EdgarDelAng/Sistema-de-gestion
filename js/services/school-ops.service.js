import { _db, AlumnosService, GruposService, InscripcionesService, DocumentosService, NotificacionesService } from './data.service.js';
import { AuditService } from './audit.service.js';

const KEY = 'colegio_ops_v2';
const defaults = {
  ciclos: [
    { id:'2026-2027', nombre:'2026-2027', inicio:'2026-08-17', fin:'2027-07-09', estado:'activo', periodos:[
      { id:'ago-dic-2026', nombre:'Agosto-Diciembre 2026', inicio:'2026-08-17', fin:'2026-12-18', estado:'abierto' },
      { id:'ene-jun-2027', nombre:'Enero-Junio 2027', inicio:'2027-01-11', fin:'2027-06-25', estado:'programado' }
    ]},
    { id:'2025-2026', nombre:'2025-2026', inicio:'2025-08-18', fin:'2026-07-10', estado:'cerrado', periodos:[
      { id:'ago-dic-2025', nombre:'Agosto-Diciembre 2025', inicio:'2025-08-18', fin:'2025-12-19', estado:'cerrado' },
      { id:'ene-jun-2026', nombre:'Enero-Junio 2026', inicio:'2026-01-12', fin:'2026-06-26', estado:'cerrado' }
    ]}
  ],
  roles: {
    admin: { nombre:'Administrador', descripcion:'Acceso total a operación y configuración.', permisos:['alumnos.ver','alumnos.crear','alumnos.editar','alumnos.baja','inscripciones.gestionar','calificaciones.ver','calificaciones.editar','asistencia.ver','asistencia.editar','reportes.ver','reportes.exportar','usuarios.gestionar','configuracion.editar'] },
    profesor: { nombre:'Profesor', descripcion:'Gestión académica de grupos asignados.', permisos:['alumnos.ver','calificaciones.ver','calificaciones.editar','asistencia.ver','asistencia.editar','reportes.ver'] },
    alumno: { nombre:'Alumno', descripcion:'Consulta de información académica personal.', permisos:['calificaciones.ver','asistencia.ver','reportes.ver'] },
    control: { nombre:'Control escolar', descripcion:'Inscripciones, expedientes y documentos.', permisos:['alumnos.ver','alumnos.crear','alumnos.editar','inscripciones.gestionar','reportes.ver','reportes.exportar'] }
  },
  seguridad: { expiracionMin:60, intentosMax:5, requerirCambioInicial:true, registrarAccesos:true },
  comunicacion: { firma:'Dirección Escolar', permitirProgramacion:true, confirmarLectura:true },
  onboarding: { completado:false }
};
function load(){ try { return { ...structuredClone(defaults), ...(JSON.parse(localStorage.getItem(KEY)||'{}')) }; } catch { return structuredClone(defaults); } }
function save(v){ localStorage.setItem(KEY, JSON.stringify(v)); }
let state=load();
const today=()=>new Date().toISOString().slice(0,10);

export const CiclosService = {
  async listar(){ return structuredClone(state.ciclos); },
  async activo(){ return structuredClone(state.ciclos.find(c=>c.estado==='activo')||state.ciclos[0]); },
  async guardar(ciclo){ const i=state.ciclos.findIndex(c=>c.id===ciclo.id); if(i>=0) state.ciclos[i]={...state.ciclos[i],...ciclo}; else state.ciclos.unshift(ciclo); save(state); AuditService.log('actualizó','ciclo escolar',ciclo.nombre); return ciclo; },
  async setActivo(id){ state.ciclos=state.ciclos.map(c=>({...c,estado:c.id===id?'activo':(c.estado==='activo'?'cerrado':c.estado)})); save(state); AuditService.log('activó','ciclo escolar',id); }
};

export const RolesService = {
  async listar(){ return structuredClone(state.roles); },
  async guardar(id,data){ state.roles[id]={...state.roles[id],...data}; save(state); AuditService.log('actualizó','rol',id); return state.roles[id]; },
  async seguridad(){ return {...state.seguridad}; },
  async guardarSeguridad(data){ state.seguridad={...state.seguridad,...data}; save(state); AuditService.log('actualizó','seguridad','Políticas de acceso'); }
};

export const TareasService = {
  async listar(){
    const db=_db(); const tareas=[];
    const riesgo=(db.alumnos||[]).filter(a=>{ const notas=(db.calificaciones||[]).filter(c=>c.alumnoId===a.id).map(c=>c.nota); return notas.length && notas.reduce((x,y)=>x+y,0)/notas.length < (db.config?.escalaMinima||6); });
    if(riesgo.length) tareas.push({id:'riesgo',tipo:'academico',prioridad:'alta',titulo:`${riesgo.length} alumnos requieren seguimiento`,detalle:'Promedio por debajo de la escala mínima.',ruta:'calificaciones'});
    const pendientes=(db.tramites||[]).filter(t=>!['Disponible','Entregado','Cancelado'].includes(t.estado));
    if(pendientes.length) tareas.push({id:'tramites',tipo:'tramite',prioridad:'media',titulo:`${pendientes.length} trámites pendientes`,detalle:'Solicitudes esperando revisión o entrega.',ruta:'tramites'});
    const docsAlumnos=new Set((db.documentos||[]).map(d=>d.alumnoId)); const sinDocs=(db.alumnos||[]).filter(a=>a.estado==='activo'&&!docsAlumnos.has(a.id));
    if(sinDocs.length) tareas.push({id:'docs',tipo:'documento',prioridad:'media',titulo:`${sinDocs.length} expedientes sin documentos`,detalle:'Revisa documentación de alumnos activos.',ruta:'alumnos'});
    const sinNotas=(db.alumnos||[]).filter(a=>!(db.calificaciones||[]).some(c=>c.alumnoId===a.id));
    if(sinNotas.length) tareas.push({id:'notas',tipo:'academico',prioridad:'alta',titulo:`${sinNotas.length} alumnos sin calificaciones`,detalle:'No tienen evaluaciones capturadas en el periodo.',ruta:'calificaciones'});
    return tareas;
  }
};

export const OperacionAlumnosService = {
  async cambiarGrupo(alumnoId,grupoId,motivo='Cambio administrativo'){
    const alumno=await AlumnosService.obtener(alumnoId); const grupo=await GruposService.obtener(grupoId);
    await AlumnosService.actualizar(alumnoId,{grupoId:grupo.id,grado:grupo.nombre.split(' ')[0]});
    AuditService.log('cambió de grupo','alumno',`${alumno.nombre} ${alumno.apellidos} → ${grupo.nombre} · ${motivo}`); return {alumno,grupo};
  },
  async baja(alumnoId,motivo,fecha=today()){
    const alumno=await AlumnosService.obtener(alumnoId); await AlumnosService.actualizar(alumnoId,{estado:'inactivo',fechaBaja:fecha,motivoBaja:motivo});
    const ins=(await InscripcionesService.todos()).filter(i=>i.alumnoId===Number(alumnoId)&&i.estado==='Inscrito');
    for(const i of ins) await InscripcionesService.actualizar(i.id,{estado:'Baja',fechaBaja:fecha,motivoBaja:motivo});
    AuditService.log('dio de baja','alumno',`${alumno.nombre} ${alumno.apellidos}`); return true;
  },
  async promover(alumnoId,nuevoGrupoId){
    const alumno=await AlumnosService.obtener(alumnoId); const grupo=await GruposService.obtener(nuevoGrupoId);
    await AlumnosService.actualizar(alumnoId,{grupoId:grupo.id,grado:grupo.nombre.split(' ')[0],estado:'activo'});
    AuditService.log('promovió','alumno',`${alumno.nombre} ${alumno.apellidos} → ${grupo.nombre}`); return true;
  }
};

export const DocumentosOficialesService = {
  async datosAlumno(alumnoId){ const db=_db(); const alumno=await AlumnosService.obtener(alumnoId); const grupo=(db.grupos||[]).find(g=>g.id===alumno.grupoId); const notas=(db.calificaciones||[]).filter(c=>c.alumnoId===alumno.id); return {db,alumno,grupo,notas}; },
  async registrar(alumnoId,nombre,tipo){ return DocumentosService.crear({alumnoId,nombre,tipo,fecha:today(),tamano:'Generado en sistema',url:'#'}); },
  printHTML(title,body){ const w=window.open('','_blank','width=980,height=760'); if(!w) return false; w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;color:#18201f;margin:42px}header{border-bottom:2px solid #0f766e;padding-bottom:16px;margin-bottom:26px}.brand{font-size:22px;font-weight:800}.muted{color:#66706e}.doc-title{text-align:center;margin:28px 0;font-size:24px}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{padding:10px;border-bottom:1px solid #dfe5e3;text-align:left}th{background:#f5f7f6}.sign{margin-top:70px;display:flex;justify-content:center}.sign div{width:280px;border-top:1px solid #333;text-align:center;padding-top:8px}@media print{button{display:none}}</style></head><body><header><div class="brand">${String(_db().config?.nombreColegio||'Sistema Escolar').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</div><div class="muted">Sistema de Control Escolar · Documento institucional</div></header>${body}<button onclick="print()">Imprimir / Guardar como PDF</button></body></html>`); w.document.close(); return true; }
};

export const ComunicacionService = {
  async programacion(){ return {...state.comunicacion}; },
  async guardar(data){ state.comunicacion={...state.comunicacion,...data}; save(state); },
  async notificarUsuarios(titulo,desc,roles=['admin','profesor','alumno']){ const db=_db(); for(const u of (db.usuarios||[]).filter(u=>roles.includes(u.rol))) await NotificacionesService.crear({usuarioId:u.id,titulo,desc,fecha:new Date().toISOString(),leida:false,tipo:'aviso'}); }
};
