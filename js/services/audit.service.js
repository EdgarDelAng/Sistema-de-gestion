const KEY='colegio_audit_v2';

const DEMO=[
  {id:1001,fecha:'2026-10-03T14:42:00',usuario:'Carlos Ramírez',rol:'admin',action:'inició sesión',entity:'sesión',detail:'Acceso administrativo al sistema'},
  {id:1002,fecha:'2026-10-03T13:18:00',usuario:'Mariana Torres',rol:'profesor',action:'registró',entity:'asistencia',detail:'Asistencia del grupo 3° A'},
  {id:1003,fecha:'2026-10-03T12:54:00',usuario:'Carlos Ramírez',rol:'admin',action:'actualizó',entity:'alumno',detail:'Expediente de Sofía García López'},
  {id:1004,fecha:'2026-10-03T11:37:00',usuario:'Mariana Torres',rol:'profesor',action:'capturó',entity:'calificaciones',detail:'Matemáticas · 3° A · Segundo parcial'},
  {id:1005,fecha:'2026-10-03T10:16:00',usuario:'Carlos Ramírez',rol:'admin',action:'generó',entity:'documento',detail:'Constancia de estudios · A2026-0017'},
  {id:1006,fecha:'2026-10-02T16:22:00',usuario:'Carlos Ramírez',rol:'admin',action:'publicó',entity:'aviso',detail:'Recordatorio de entrega de calificaciones'},
  {id:1007,fecha:'2026-10-02T15:05:00',usuario:'Control Escolar',rol:'control',action:'validó',entity:'inscripción',detail:'Expediente y documentación completa'},
  {id:1008,fecha:'2026-10-02T12:31:00',usuario:'Carlos Ramírez',rol:'admin',action:'actualizó',entity:'grupo',detail:'Tutor asignado al grupo 4° B'},
  {id:1009,fecha:'2026-10-01T09:48:00',usuario:'Mariana Torres',rol:'profesor',action:'actualizó',entity:'calificaciones',detail:'Corrección de evaluación · Ciencias'},
  {id:1010,fecha:'2026-10-01T08:12:00',usuario:'Carlos Ramírez',rol:'admin',action:'creó',entity:'calendario',detail:'Consejo técnico escolar · 16 oct'},
  {id:1011,fecha:'2026-09-30T14:20:00',usuario:'Control Escolar',rol:'control',action:'cambió grupo',entity:'alumno',detail:'Movimiento de 2° A a 2° B'},
  {id:1012,fecha:'2026-09-30T11:03:00',usuario:'Carlos Ramírez',rol:'admin',action:'actualizó',entity:'configuración',detail:'Preferencias institucionales'}
];
const read=()=>{try{const raw=localStorage.getItem(KEY);if(!raw){localStorage.setItem(KEY,JSON.stringify(DEMO));return [...DEMO]}const data=JSON.parse(raw);return Array.isArray(data)?data:[...DEMO]}catch{return [...DEMO]}};
const write=(v)=>localStorage.setItem(KEY,JSON.stringify(v.slice(0,500)));
export const AuditService={
  log(action,entity,detail='',meta={}){let user=null;try{user=JSON.parse(sessionStorage.getItem('sesion_escolar')||localStorage.getItem('sesion_escolar')||'null')?.user}catch{}const items=read();items.unshift({id:Date.now()+Math.random(),fecha:new Date().toISOString(),usuario:user?.nombre||'Sistema',rol:user?.rol||'sistema',action,entity,detail,meta});write(items);try{window.dispatchEvent(new CustomEvent('school:audit-changed'))}catch{}return items[0]},
  list(limit=100){return read().slice(0,limit)},
  clear(){write([...DEMO])},
  resetDemo(){write([...DEMO]);return [...DEMO]}
};
