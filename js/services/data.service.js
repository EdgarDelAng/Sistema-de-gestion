import { delay } from '../core/api.js';

const KEY = 'colegio_db_v5';

// ============================================================
// UTILIDADES PARA GENERAR DATOS
// ============================================================
const NOMBRES_M = ['Juan','José','Luis','Carlos','Miguel','Jorge','Pedro','Diego','Santiago','Emilio','Matías','Daniel','Alejandro','Ricardo','Fernando','Andrés','Iván','Héctor','Rafael','Alberto','Pablo','Sergio','Adrián','Bruno','Marco','Raúl','Enrique','Felipe','Óscar','Rubén'];
const NOMBRES_F = ['María','Ana','Lucía','Sofía','Isabella','Valentina','Camila','Renata','Valeria','Ximena','Daniela','Fernanda','Paula','Andrea','Mariana','Natalia','Regina','Romina','Victoria','Julieta','Carolina','Alejandra','Gabriela','Verónica','Cecilia','Beatriz','Lorena','Silvia','Patricia','Adriana'];
const APELLIDOS = ['García','López','Martínez','González','Rodríguez','Pérez','Sánchez','Ramírez','Torres','Flores','Rivera','Gómez','Díaz','Cruz','Morales','Reyes','Ortiz','Gutiérrez','Chávez','Ramos','Vargas','Castillo','Jiménez','Mendoza','Rojas','Navarro','Guerrero','Contreras','Aguilar','Salazar'];

const AREAS = ['Matemáticas','Lengua','Ciencias','Historia','Inglés','Arte','Educación Física','Tecnología'];
const BANCOS = ['BBVA','Banorte','Santander','HSBC','Citibanamex','Banco Azteca','Scotiabank'];
const TIPOS_CONTRATO = ['Tiempo completo','Medio tiempo','Por horas'];

// ============================================================
// GENERADOR DE SEED v5
// ============================================================
function generarSeed() {

  // ---------- GRUPOS: 1° a 6°, A y B = 12 grupos ----------
  const grupos = [];
  const grados = ['1°','2°','3°','4°','5°','6°'];
  let gid = 1;
  grados.forEach((grado) => {
    ['A','B'].forEach((letra) => {
      grupos.push({
        id: gid,
        nombre: `${grado} ${letra}`,
        tutorId: null, // se asigna después
        aula: String(100 + gid),
        capacidad: 35,
        turno: 'matutino',
        ciclo: '2026-2027',
        periodo: 'Agosto-Diciembre 2026',
        estado: 'activo'
      });
      gid++;
    });
  });

  // ---------- ALUMNOS: 10 por grupo = 120 ----------
  const alumnos = [];
  let aid = 1;
  grupos.forEach((grupo) => {
    const grado = grupo.nombre.split(' ')[0];
    for (let i = 0; i < 10; i++) {
      const idxGlobal = aid - 1;
      const esMujer = idxGlobal % 2 === 0;
      const nombre = esMujer
        ? NOMBRES_F[idxGlobal % NOMBRES_F.length]
        : NOMBRES_M[idxGlobal % NOMBRES_M.length];
      const ap1 = APELLIDOS[(idxGlobal * 3) % APELLIDOS.length];
      const ap2 = APELLIDOS[(idxGlobal * 7 + 5) % APELLIDOS.length];
      const anioNac = 2010 + (6 - parseInt(grado));
      const mes = String((idxGlobal % 12) + 1).padStart(2, '0');
      const dia = String((idxGlobal % 27) + 1).padStart(2, '0');

      alumnos.push({
        id: aid,
        matricula: String(20000 + aid),        // 20001, 20002, 20003, ...
        nombre,
        apellidos: `${ap1} ${ap2}`,
        grado,
        grupoId: grupo.id,
        email: `${nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}${aid}@colegio.edu`,
        telefono: `555-${String(1000 + aid).slice(-4)}`,
        tutor: `${NOMBRES_M[(aid * 5) % NOMBRES_M.length]} ${ap1}`,
        direccion: `Calle ${nombre} #${100 + aid}, Col. Centro`,
        estado: 'activo',
        fechaNac: `${anioNac}-${mes}-${dia}`,
        turno: 'matutino'
      });
      aid++;
    }
  });

  // ---------- PROFESORES: 18 repartidos en 8 áreas ----------
  const asignacionesProfes = [
    { area: 'Matemáticas',      especialidad: 'Álgebra',            genero: 'F', tipoContrato: 'Tiempo completo' },
    { area: 'Matemáticas',      especialidad: 'Geometría',          genero: 'M', tipoContrato: 'Tiempo completo' },
    { area: 'Matemáticas',      especialidad: 'Cálculo',            genero: 'F', tipoContrato: 'Medio tiempo' },
    { area: 'Lengua',           especialidad: 'Literatura',         genero: 'M', tipoContrato: 'Tiempo completo' },
    { area: 'Lengua',           especialidad: 'Redacción',          genero: 'F', tipoContrato: 'Tiempo completo' },
    { area: 'Lengua',           especialidad: 'Ortografía',         genero: 'F', tipoContrato: 'Medio tiempo' },
    { area: 'Ciencias',         especialidad: 'Biología',           genero: 'F', tipoContrato: 'Tiempo completo' },
    { area: 'Ciencias',         especialidad: 'Química',            genero: 'M', tipoContrato: 'Tiempo completo' },
    { area: 'Ciencias',         especialidad: 'Física',             genero: 'M', tipoContrato: 'Medio tiempo' },
    { area: 'Historia',         especialidad: 'Historia Universal', genero: 'M', tipoContrato: 'Tiempo completo' },
    { area: 'Historia',         especialidad: 'Historia de México', genero: 'F', tipoContrato: 'Por horas' },
    { area: 'Inglés',           especialidad: 'Conversación',       genero: 'F', tipoContrato: 'Tiempo completo' },
    { area: 'Inglés',           especialidad: 'Gramática',          genero: 'M', tipoContrato: 'Medio tiempo' },
    { area: 'Arte',             especialidad: 'Música',             genero: 'F', tipoContrato: 'Por horas' },
    { area: 'Educación Física', especialidad: 'Deportes',           genero: 'M', tipoContrato: 'Tiempo completo' },
    { area: 'Educación Física', especialidad: 'Acondicionamiento',  genero: 'F', tipoContrato: 'Medio tiempo' },
    { area: 'Tecnología',       especialidad: 'Programación',       genero: 'M', tipoContrato: 'Tiempo completo' },
    { area: 'Tecnología',       especialidad: 'Ofimática',          genero: 'F', tipoContrato: 'Por horas' }
  ];

  const profesores = asignacionesProfes.map((cfg, idx) => {
    const id = idx + 1;
    const esMujer = cfg.genero === 'F';
    const nombre = esMujer
      ? NOMBRES_F[(idx * 3 + 2) % NOMBRES_F.length]
      : NOMBRES_M[(idx * 3 + 1) % NOMBRES_M.length];
    const ap1 = APELLIDOS[(idx * 5 + 1) % APELLIDOS.length];
    const ap2 = APELLIDOS[(idx * 7 + 3) % APELLIDOS.length];

    // Horas según contrato
    const horasSemanales = cfg.tipoContrato === 'Tiempo completo' ? 40
                         : cfg.tipoContrato === 'Medio tiempo' ? 20
                         : 8 + (idx % 3) * 4; // 8, 12 o 16 horas

    // Sueldo por hora según contrato (más horas = mejor tarifa)
    const sueldoPorHora = cfg.tipoContrato === 'Tiempo completo' ? 220 + (idx % 5) * 15
                        : cfg.tipoContrato === 'Medio tiempo' ? 200 + (idx % 5) * 12
                        : 180 + (idx % 5) * 10;

    // Sueldo quincenal = sueldoPorHora × horasSemanales × (52 semanas / 24 quincenas)
    const sueldoQuincenal = Math.round(sueldoPorHora * horasSemanales * 52 / 24);

    // Fecha de ingreso variada
    const anioIngreso = 2018 + (idx % 6);
    const mesIngreso = String(((idx * 3) % 12) + 1).padStart(2, '0');
    const diaIngreso = String(((idx * 7) % 27) + 1).padStart(2, '0');

    // RFC (formato simplificado de ejemplo)
    const rfc = `${ap1.slice(0,2).toUpperCase()}${ap2.slice(0,1).toUpperCase()}${nombre.slice(0,1).toUpperCase()}${String(anioIngreso).slice(2)}${mesIngreso}${diaIngreso}XXX`;

    // Últimos 3 pagos quincenales
    const pagos = [
      { periodo: '01 al 15 de septiembre 2026', monto: sueldoQuincenal, estado: 'Pagado' },
      { periodo: '16 al 31 de agosto 2026',     monto: sueldoQuincenal, estado: 'Pagado' },
      { periodo: '01 al 15 de agosto 2026',     monto: sueldoQuincenal, estado: 'Pagado' }
    ];

    return {
      id,
            numEmpleado: String(10000 + id),        // 10001, 10002, 10003, ...
      matricula: String(10000 + id),           // Misma matrícula de 5 dígitos
      nombre,
      apellidos: `${ap1} ${ap2}`,
      area: cfg.area,
      especialidad: cfg.especialidad,
      email: `${nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}.${ap1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}@colegio.edu`,
      telefono: `555-${String(2000 + id).slice(-4)}`,
      horario: cfg.tipoContrato === 'Tiempo completo' ? 'Lun-Vie 8:00-16:00'
             : cfg.tipoContrato === 'Medio tiempo' ? 'Lun-Vie 8:00-12:00'
             : 'Horario flexible',
      estado: 'activo',
      // ---- DATOS FINANCIEROS ----
      tipoContrato: cfg.tipoContrato,
      horasSemanales,
      sueldoPorHora,
      sueldoQuincenal,
      fechaIngreso: `${anioIngreso}-${mesIngreso}-${diaIngreso}`,
      rfc,
      banco: BANCOS[idx % BANCOS.length],
      cuenta: `****${String(1000 + id).slice(-4)}`,
      pagos
    };
  });

  // ---------- MATERIAS BASE ----------
 const materias = [
  { id: 1, nombre: 'Matemáticas',      clave: 'MAT-101', creditos: 5, horas: 5, semestre: 1, area: 'Ciencias básicas', tipo: 'Obligatoria', estado: 'activa' },
  { id: 2, nombre: 'Lengua',           clave: 'LEN-101', creditos: 4, horas: 4, semestre: 1, area: 'Humanidades',     tipo: 'Obligatoria', estado: 'activa' },
  { id: 3, nombre: 'Ciencias',         clave: 'CIE-101', creditos: 5, horas: 5, semestre: 1, area: 'Ciencias básicas', tipo: 'Obligatoria', estado: 'activa' },
  { id: 4, nombre: 'Historia',         clave: 'HIS-101', creditos: 3, horas: 3, semestre: 1, area: 'Humanidades',     tipo: 'Obligatoria', estado: 'activa' },
  { id: 5, nombre: 'Inglés',           clave: 'ING-101', creditos: 4, horas: 4, semestre: 1, area: 'Idiomas',         tipo: 'Obligatoria', estado: 'activa' },
  { id: 6, nombre: 'Arte',             clave: 'ART-101', creditos: 2, horas: 2, semestre: 1, area: 'Cultural',        tipo: 'Optativa',    estado: 'activa' },
  { id: 7, nombre: 'Educación Física', clave: 'EDF-101', creditos: 2, horas: 2, semestre: 1, area: 'Deportes',        tipo: 'Obligatoria', estado: 'activa' },
  { id: 8, nombre: 'Tecnología',       clave: 'TEC-101', creditos: 3, horas: 3, semestre: 1, area: 'Tecnología',      tipo: 'Taller',      estado: 'activa' }
];

  // ---------- DISTRIBUCIÓN DE PROFESORES POR MATERIA Y GRUPO ----------
  // Cada profesor imparte ciertos grupos de una materia → cantidad variable de alumnos
  // Mapeamos: { materiaId, profesorIds: [lista rotativa] }
  const mapaProfesPorMateria = {
    1: [1, 2, 3],       // Matemáticas: 3 profes
    2: [4, 5, 6],       // Lengua: 3 profes
    3: [7, 8, 9],       // Ciencias: 3 profes
    4: [10, 11],        // Historia: 2 profes
    5: [12, 13],        // Inglés: 2 profes
    6: [14],            // Arte: 1 profe (todos los grupos)
    7: [15, 16],        // Ed. Física: 2 profes
    8: [17, 18]         // Tecnología: 2 profes
  };

  // materiaGrupo: cada combinación (materia, grupo) tiene un profesorId
  const materiaGrupo = [];
  grupos.forEach((grupo) => {
    materias.forEach((materia) => {
      const profesDeMateria = mapaProfesPorMateria[materia.id] || [];
      if (!profesDeMateria.length) return;
      // Rotar según el índice del grupo para repartir la carga
      const idx = (grupo.id - 1) % profesDeMateria.length;
      materiaGrupo.push({
        materiaId: materia.id,
        grupoId: grupo.id,
        profesorId: profesDeMateria[idx]
      });
    });
  });

  // ---------- ASIGNAR TUTORES A LOS GRUPOS ----------
  // Cada grupo tiene un tutor (1 de los profesores de tiempo completo)
  const profesTutores = profesores.filter((p) => p.tipoContrato === 'Tiempo completo').map((p) => p.id);
  grupos.forEach((g, i) => {
    g.tutorId = profesTutores[i % profesTutores.length];
  });

  // ---------- CALIFICACIONES ----------
  const calificaciones = [];
  let cid = 1;
  alumnos.forEach((a) => {
    materias.forEach((m) => {
      [1, 2, 3].forEach((periodo) => {
        const seedVal = (a.id * 3 + m.id * 7 + periodo * 11) % 45;
        const nota = Math.round((5.5 + (seedVal / 44) * 4.5) * 10) / 10;
        calificaciones.push({ id: cid++, alumnoId: a.id, materiaId: m.id, periodo, nota });
      });
    });
  });

  // ---------- ASISTENCIAS ----------
  const asistencias = [];
  const fechasBase = ['2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19'];
  let asid = 1;
  alumnos.forEach((a) => {
    materias.forEach((m) => {
      fechasBase.forEach((fecha, idx) => {
        const seedVal = (a.id + m.id + idx) % 100;
        const estado = seedVal < 88 ? 'presente' : seedVal < 94 ? 'retardo' : 'falta';
        asistencias.push({ id: asid++, alumnoId: a.id, materiaId: m.id, fecha, estado });
      });
    });
  });

  // ---------- HORARIOS ----------
  const horarios = [];
  let hid = 1;
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
  const horasBase = ['08:00','09:00','10:00','11:00','12:00'];
  grupos.forEach((g) => {
    dias.forEach((dia, idxDia) => {
      horasBase.forEach((hora, idxHora) => {
        const matIdx = (idxDia + idxHora) % materias.length;
        const materia = materias[matIdx];
        const asig = materiaGrupo.find((mg) => mg.materiaId === materia.id && mg.grupoId === g.id);
        if (!asig) return;
        const horaFin = String(parseInt(hora) + 1).padStart(2, '0') + ':00';
        horarios.push({
          id: hid++,
          dia, horaInicio: hora, horaFin,
          materiaId: materia.id,
          grupoId: g.id,
          profesorId: asig.profesorId,
          aula: g.aula
        });
      });
    });
  });

  // ---------- RESTO ----------
  const avisos = [
    { id: 1, titulo: 'Reunión de padres de familia', contenido: 'Viernes 11 de septiembre a las 18:00 hrs en el auditorio principal.', fecha: '2026-09-05', fechaExpiracion: '2026-09-12', prioridad: 'Importante', autor: 'Dirección', dirigidoA: 'todos', adjunto: 'Convocatoria.pdf' },
    { id: 2, titulo: 'Inicio de evaluaciones', contenido: 'Las evaluaciones del primer parcial comienzan el 21 de septiembre.', fecha: '2026-09-03', fechaExpiracion: '2026-09-21', prioridad: 'Urgente', autor: 'Coordinación', dirigidoA: 'alumnos', adjunto: '' },
    { id: 3, titulo: 'Suspensión de clases', contenido: 'Lunes 28 de septiembre por capacitación docente.', fecha: '2026-09-01', fechaExpiracion: '2026-09-28', prioridad: 'Normal', autor: 'Dirección', dirigidoA: 'todos', adjunto: '' }
  ];

  const usuarios = [
    { id: 1, usuario: 'admin',    nombre: 'Carlos Ramírez', email: 'admin@colegio.edu', rol: 'admin',    estado: 'activo', ultimoAcceso: '2026-09-12 09:14' },
    { id: 2, usuario: 'profesor', nombre: 'María González', email: 'maria@colegio.edu', rol: 'profesor', estado: 'activo', ultimoAcceso: '2026-09-12 08:30' },
    { id: 3, usuario: 'alumno',   nombre: 'Lucía Méndez',   email: 'lucia@colegio.edu', rol: 'alumno',   estado: 'activo', ultimoAcceso: '2026-09-11 15:22' }
  ];

  const inscripciones = alumnos.map((a, i) => ({
    id: i + 1, alumnoId: a.id, grupoId: a.grupoId,
    ciclo: '2026-2027', periodo: 'Agosto-Diciembre 2026',
    fechaInscripcion: '2026-08-15', estado: 'Inscrito',
    folio: 'INS-2026-' + String(i + 1).padStart(4, '0')
  }));

    const tramites = [
    { id: 1, alumnoId: 1, tipo: 'Constancia de estudios',     fechaSolicitud: '2026-09-01', estado: 'Disponible',  folio: 'TRA-2026-0001', observaciones: '' },
    { id: 2, alumnoId: 1, tipo: 'Kárdex',                     fechaSolicitud: '2026-09-05', estado: 'En revisión', folio: 'TRA-2026-0002', observaciones: 'En espera de firma de coordinación' },
    { id: 3, alumnoId: 1, tipo: 'Constancia de calificaciones',fechaSolicitud: '2026-09-08', estado: 'Solicitado',  folio: 'TRA-2026-0003', observaciones: '' },
    { id: 4, alumnoId: 2, tipo: 'Constancia de estudios',     fechaSolicitud: '2026-09-02', estado: 'Solicitado',  folio: 'TRA-2026-0004', observaciones: '' }
  ];

  const documentos = [
    { id: 1, alumnoId: 1, nombre: 'Boleta 1er Parcial',       tipo: 'Boleta',       fecha: '2026-09-10', tamano: '142 KB', url: '#' },
    { id: 2, alumnoId: 1, nombre: 'Kárdex acumulado',         tipo: 'Kárdex',       fecha: '2026-09-08', tamano: '210 KB', url: '#' },
    { id: 3, alumnoId: 1, nombre: 'Constancia de estudios',   tipo: 'Constancia',   fecha: '2026-09-01', tamano: '98 KB',  url: '#' },
    { id: 4, alumnoId: 1, nombre: 'Comprobante de inscripción',tipo: 'Comprobante', fecha: '2026-08-15', tamano: '76 KB',  url: '#' }
  ];
  // ---------- ASISTENCIA DE PROFESORES ----------
  const asistenciasProfesores = [];
  const fechasProfes = ['2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19'];
  let aspId = 1;
  profesores.forEach((p) => {
    fechasProfes.forEach((fecha, idx) => {
      const seedVal = (p.id * 13 + idx * 7) % 100;
      // 92% presente, 4% retardo, 4% falta justificada
      const estado = seedVal < 92 ? 'presente' : seedVal < 96 ? 'retardo' : 'justificada';
      asistenciasProfesores.push({
        id: aspId++,
        profesorId: p.id,
        fecha,
        estado,
        horaEntrada: estado === 'presente' ? '07:55' : estado === 'retardo' ? '08:15' : null,
        horaSalida: estado !== 'falta' ? '16:00' : null,
        observaciones: estado === 'justificada' ? 'Justificante médico presentado' : ''
      });
    });
  });
  
  const notificaciones = [
    { id: 1, usuarioId: 3, titulo: 'Nueva calificación publicada', desc: 'Matemáticas · Parcial 3', fecha: '2026-09-12T09:20:00', leida: false, tipo: 'academico' },
    { id: 2, usuarioId: 1, titulo: 'Nuevo aviso publicado', desc: 'Suspensión el 28 de septiembre', fecha: '2026-09-01T12:00:00', leida: false, tipo: 'aviso' }
  ];

  const calendario = [
    { id: 1, titulo: 'Inicio de clases', fecha: '2026-08-17', tipo: 'inicio', descripcion: 'Inicio del ciclo 2026-2027' },
    { id: 2, titulo: 'Reunión de padres', fecha: '2026-09-11', tipo: 'reunion', descripcion: '18:00 · Auditorio' },
    { id: 3, titulo: '1er Parcial - Exámenes', fecha: '2026-09-21', tipo: 'examen', descripcion: 'Comienzan las evaluaciones' },
    { id: 4, titulo: 'Suspensión de clases', fecha: '2026-09-28', tipo: 'suspension', descripcion: 'Capacitación docente' },
    { id: 5, titulo: 'Entrega de calificaciones', fecha: '2026-10-05', tipo: 'entrega', descripcion: 'Primer parcial' }
  ];

  const config = {
    nombreColegio: 'Colegio Papu',
    direccion: 'Av. Principal 123',
    telefono: '+123 456 7890',
    email: 'info@colegiopapu.edu',
    cicloEscolar: '2026-2027',
    escalaMinima: 6,
    periodos: 3
  };

   return {
    alumnos, profesores, materias, grupos, materiaGrupo,
    calificaciones, asistencias, asistenciasProfesores, horarios, avisos, usuarios,
    inscripciones, tramites, documentos, notificaciones, calendario, config,
    nextId: {
      alumno: 121, profesor: 19, materia: 9, grupo: 13,
      calificacion: calificaciones.length + 1,
      asistencia: asistencias.length + 1,
      asistenciaProfesor: asistenciasProfesores.length + 1,
      horario: horarios.length + 1,
      aviso: 4, usuario: 4, inscripcion: inscripciones.length + 1,
      tramite: 3, documento: 2, notificacion: 3, calendario: 6
    }
  };
}

// ============================================================
// CARGA Y PERSISTENCIA
// ============================================================
let DB = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.alumnos || parsed.alumnos.length < 100 || !parsed.profesores || parsed.profesores.length < 15) {
        console.warn('Base vieja detectada, regenerando…');
        const fresh = generarSeed();
        localStorage.setItem(KEY, JSON.stringify(fresh));
        return fresh;
      }
      return parsed;
    }
  } catch (e) { console.warn('Error loading DB, usando seed:', e); }
  const fresh = generarSeed();
  try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch {}
  return fresh;
})();

function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { console.warn('Save error:', e); } }
function reset() { DB = generarSeed(); save(); }

const byId = (arr, id) => (arr || []).find((x) => x.id === Number(id));

function paginar(items, page, perPage) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return { items: items.slice(start, start + perPage), total, page, perPage, totalPages };
}

function applySort(arr, key, dir = 'asc') {
  return [...arr].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * (dir === 'asc' ? 1 : -1);
    return String(va).localeCompare(String(vb), 'es') * (dir === 'asc' ? 1 : -1);
  });
}

function nextIdFor(k) { const v = DB.nextId[k] || 1; DB.nextId[k] = v + 1; return v; }

function promedioAlumno(alumnoId, materiaId = null) {
  const notas = (DB.calificaciones || []).filter((c) =>
    c.alumnoId === Number(alumnoId) && (materiaId == null || c.materiaId === Number(materiaId))
  ).map((c) => c.nota).filter((n) => typeof n === 'number');
  if (!notas.length) return 0;
  return notas.reduce((a, b) => a + b, 0) / notas.length;
}

// ============================================================
// CRUD GENÉRICO
// ============================================================
function makeCrud(tabla, idKey) {
  return {
    async listar(f = {}) {
      await delay(120);
      let items = [...(DB[tabla] || [])];
      if (typeof f._filter === 'function') items = items.filter(f._filter);
      if (f.sort) items = applySort(items, f.sort, f.dir);
      if (f.page) return paginar(items, f.page, f.perPage || 10);
      return items;
    },
    async todos() { await delay(60); return [...(DB[tabla] || [])]; },
    async obtener(id) {
      await delay(80);
      const item = byId(DB[tabla], id);
      if (!item) throw new Error('Registro no encontrado');
      return { ...item };
    },
    async crear(data) {
      await delay(150);
      const nuevo = { id: nextIdFor(idKey), ...data };
      if (!DB[tabla]) DB[tabla] = [];
      DB[tabla].push(nuevo);
      save();
      return { ...nuevo };
    },
    async actualizar(id, data) {
      await delay(150);
      const idx = (DB[tabla] || []).findIndex((x) => x.id === Number(id));
      if (idx === -1) throw new Error('Registro no encontrado');
      DB[tabla][idx] = { ...DB[tabla][idx], ...data };
      save();
      return { ...DB[tabla][idx] };
    },
    async eliminar(id) {
      await delay(120);
      DB[tabla] = (DB[tabla] || []).filter((x) => x.id !== Number(id));
      save();
      return { ok: true };
    }
  };
}

// ============================================================
// ALUMNOS
// ============================================================
export const AlumnosService = {
  ...makeCrud('alumnos', 'alumno'),
  async listar(f = {}) {
    await delay(120);
    let items = [...(DB.alumnos || [])];
    if (f.search) {
      const q = f.search.toLowerCase();
      items = items.filter((a) => `${a.nombre} ${a.apellidos} ${a.matricula}`.toLowerCase().includes(q));
    }
    if (f.grado) items = items.filter((a) => a.grado === f.grado);
    if (f.grupoId) items = items.filter((a) => a.grupoId === Number(f.grupoId));
    if (f.estado) items = items.filter((a) => a.estado === f.estado);
    items = items.map((a) => ({ ...a, promedio: promedioAlumno(a.id) }));
    if (f.sort) items = applySort(items, f.sort, f.dir);
    return paginar(items, f.page || 1, f.perPage || 10);
  },
  async obtener(id) {
    await delay(80);
    const a = byId(DB.alumnos, id);
    if (!a) throw new Error('Alumno no encontrado');
    return { ...a, promedio: promedioAlumno(a.id) };
  },
  async porGrupo(grupoId) { await delay(80); return (DB.alumnos || []).filter((a) => a.grupoId === Number(grupoId)); },
  async crear(data) {
    await delay(200);
    const id = nextIdFor('alumno');
    const matricula = 'A2026-' + String(id).padStart(4, '0');
    const nuevo = { id, matricula, estado: 'activo', turno: 'matutino', ...data };
    DB.alumnos.push(nuevo);
    save();
    return { ...nuevo };
  },
  async actualizar(id, data) {
    await delay(200);
    const idx = DB.alumnos.findIndex((a) => a.id === Number(id));
    if (idx === -1) throw new Error('Alumno no encontrado');
    DB.alumnos[idx] = { ...DB.alumnos[idx], ...data };
    save();
    return { ...DB.alumnos[idx] };
  },
  async eliminar(id) {
    await delay(150);
    DB.calificaciones = (DB.calificaciones || []).filter((c) => c.alumnoId !== Number(id));
    DB.asistencias = (DB.asistencias || []).filter((a) => a.alumnoId !== Number(id));
    DB.inscripciones = (DB.inscripciones || []).filter((i) => i.alumnoId !== Number(id));
    DB.alumnos = DB.alumnos.filter((a) => a.id !== Number(id));
    save();
    return { ok: true };
  }
};

// ============================================================
// PROFESORES (con datos financieros)
// ============================================================
export const ProfesoresService = {
  ...makeCrud('profesores', 'profesor'),
  async obtener(id) {
    await delay(80);
    const p = byId(DB.profesores, id);
    if (!p) throw new Error('Profesor no encontrado');
    return { ...p };
  },
  async conCargaAcademica(id) {
    await delay(100);
    const p = byId(DB.profesores, id);
    if (!p) throw new Error('Profesor no encontrado');
    const asignaciones = (DB.materiaGrupo || []).filter((mg) => mg.profesorId === Number(id));
    const gruposIds = [...new Set(asignaciones.map((a) => a.grupoId))];
    const materiasIds = [...new Set(asignaciones.map((a) => a.materiaId))];
    const grupos = gruposIds.map((gid) => byId(DB.grupos, gid)).filter(Boolean);
    const materias = materiasIds.map((mid) => byId(DB.materias, mid)).filter(Boolean);
    const alumnos = (DB.alumnos || []).filter((a) => gruposIds.includes(a.grupoId));
    const clases = (DB.horarios || []).filter((h) => h.profesorId === Number(id));
    return { profesor: { ...p }, grupos, materias, alumnos, clases, asignaciones };
  }
};

// ============================================================
// GRUPOS, MATERIAS, INSCRIPCIONES, USUARIOS
// ============================================================
export const GruposService = makeCrud('grupos', 'grupo');
export const InscripcionesService = makeCrud('inscripciones', 'inscripcion');
export const UsuariosService = makeCrud('usuarios', 'usuario');
export const TramitesService = {
  ...makeCrud('tramites', 'tramite'),
  async porAlumno(alumnoId) {
    await delay(120);
    return (DB.tramites || [])
      .filter((t) => t.alumnoId === Number(alumnoId))
      .sort((a, b) => (b.fechaSolicitud || '').localeCompare(a.fechaSolicitud || ''));
  }
};
export const DocumentosService = {
  ...makeCrud('documentos', 'documento'),
  async porAlumno(alumnoId) {
    await delay(120);
    return (DB.documentos || [])
      .filter((d) => d.alumnoId === Number(alumnoId))
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }
};
export const CalendarioService = makeCrud('calendario', 'calendario');

export const MateriasService = {
  ...makeCrud('materias', 'materia'),
  async conProfesores(id) {
    await delay(80);
    const asignaciones = (DB.materiaGrupo || []).filter((mg) => mg.materiaId === Number(id));
    return asignaciones.map((a) => ({
      grupo: byId(DB.grupos, a.grupoId),
      profesor: byId(DB.profesores, a.profesorId)
    }));
  }
};

// ============================================================
// CALIFICACIONES
// ============================================================
export const CalificacionesService = {
  ...makeCrud('calificaciones', 'calificacion'),
  async porGrupoMateria(grupoId, materiaId) {
    await delay(150);
    const alumnos = (DB.alumnos || []).filter((a) => a.grupoId === Number(grupoId));
    return alumnos.map((a) => {
      const notas = {};
      let suma = 0, count = 0;
      [1, 2, 3].forEach((p) => {
        const c = (DB.calificaciones || []).find((x) =>
          x.alumnoId === a.id && x.materiaId === Number(materiaId) && x.periodo === p
        );
        notas[p] = c ? c.nota : null;
        if (c) { suma += c.nota; count++; }
      });
      const prom = count ? suma / count : 0;
      return { alumno: a, notas, promedio: prom, estado: prom >= (DB.config.escalaMinima || 6) ? 'Aprobado' : (count ? 'Reprobado' : 'Sin notas') };
    });
  },
  async porAlumno(alumnoId) {
    await delay(150);
    const califs = (DB.calificaciones || []).filter((c) => c.alumnoId === Number(alumnoId));
    const porMateria = {};
    califs.forEach((c) => {
      if (!porMateria[c.materiaId]) porMateria[c.materiaId] = { notas: {}, materia: byId(DB.materias, c.materiaId) };
      porMateria[c.materiaId].notas[c.periodo] = c.nota;
    });
    return Object.values(porMateria).map((m) => {
      const notas = Object.values(m.notas);
      const prom = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
      return { materia: m.materia, notas: m.notas, promedio: prom, estado: prom >= (DB.config.escalaMinima || 6) ? 'Aprobado' : 'Reprobado' };
    });
  },
  async guardarNotas(alumnoId, materiaId, notas) {
    await delay(150);
    Object.entries(notas).forEach(([periodo, nota]) => {
      if (nota === '' || nota == null) return;
      const num = parseFloat(nota);
      if (isNaN(num)) return;
      const existente = (DB.calificaciones || []).find((c) =>
        c.alumnoId === Number(alumnoId) && c.materiaId === Number(materiaId) && c.periodo === Number(periodo)
      );
      if (existente) existente.nota = num;
      else DB.calificaciones.push({ id: nextIdFor('calificacion'), alumnoId: Number(alumnoId), materiaId: Number(materiaId), periodo: Number(periodo), nota: num });
    });
    save();
    return { ok: true };
  }
};

// ============================================================
// ASISTENCIA
// ============================================================
export const AsistenciaService = {
  ...makeCrud('asistencias', 'asistencia'),
  async porGrupoFecha(grupoId, fecha) {
    await delay(150);
    const alumnos = (DB.alumnos || []).filter((a) => a.grupoId === Number(grupoId));
    const registros = (DB.asistencias || []).filter((a) => a.fecha === fecha);
    return alumnos.map((a) => {
      const r = registros.find((x) => x.alumnoId === a.id);
      return { alumno: a, estado: r ? r.estado : 'sin-registro', materiaId: r?.materiaId || null };
    });
  },
  async porGrupoFechaMateria(grupoId, fecha, materiaId) {
    await delay(150);
    const alumnos = (DB.alumnos || []).filter((a) => a.grupoId === Number(grupoId));
    return alumnos.map((a) => {
      const existing = (DB.asistencias || []).find((x) =>
        x.alumnoId === a.id && x.materiaId === Number(materiaId) && x.fecha === fecha
      );
      return { alumno: a, estado: existing ? existing.estado : 'presente' };
    });
  },
  async guardarLista(grupoId, fecha, materiaId, lista) {
    await delay(180);
    lista.forEach(({ alumnoId, estado }) => {
      const existente = (DB.asistencias || []).find((a) =>
        a.alumnoId === Number(alumnoId) && a.materiaId === Number(materiaId) && a.fecha === fecha
      );
      if (existente) existente.estado = estado;
      else DB.asistencias.push({ id: nextIdFor('asistencia'), alumnoId: Number(alumnoId), materiaId: Number(materiaId), fecha, estado });
    });
    save();
    return { ok: true };
  },
  async historial(f = {}) {
    await delay(150);
    let items = [...(DB.asistencias || [])];
    if (f.alumnoId) items = items.filter((a) => a.alumnoId === Number(f.alumnoId));
    if (f.grupoId) {
      const alums = (DB.alumnos || []).filter((a) => a.grupoId === Number(f.grupoId)).map((a) => a.id);
      items = items.filter((a) => alums.includes(a.alumnoId));
    }
    if (f.desde) items = items.filter((a) => a.fecha >= f.desde);
    if (f.hasta) items = items.filter((a) => a.fecha <= f.hasta);
    items.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return items.map((a) => ({
      ...a,
      alumnoNombre: (() => { const al = byId(DB.alumnos, a.alumnoId); return al ? `${al.nombre} ${al.apellidos}` : '—'; })(),
      materiaNombre: (() => { const m = byId(DB.materias, a.materiaId); return m ? m.nombre : '—'; })()
    }));
  }
};
export const AsistenciaProfesoresService = {
  ...makeCrud('asistenciasProfesores', 'asistenciaProfesor'),
  async porFecha(fecha) {
    await delay(120);
    const profesores = [...(DB.profesores || [])];
    const registros = (DB.asistenciasProfesores || []).filter((a) => a.fecha === fecha);
    return profesores.map((p) => {
      const r = registros.find((x) => x.profesorId === p.id);
      return {
        profesor: p,
        estado: r ? r.estado : 'sin-registro',
        horaEntrada: r?.horaEntrada || null,
        horaSalida: r?.horaSalida || null,
        observaciones: r?.observaciones || ''
      };
    });
  },
  async guardarLista(fecha, lista) {
    await delay(180);
    lista.forEach(({ profesorId, estado, horaEntrada, horaSalida, observaciones }) => {
      const existente = (DB.asistenciasProfesores || []).find((a) =>
        a.profesorId === Number(profesorId) && a.fecha === fecha
      );
      if (existente) {
        existente.estado = estado;
        existente.horaEntrada = horaEntrada;
        existente.horaSalida = horaSalida;
        existente.observaciones = observaciones;
      } else {
        DB.asistenciasProfesores.push({
          id: nextIdFor('asistenciaProfesor'),
          profesorId: Number(profesorId),
          fecha, estado, horaEntrada, horaSalida, observaciones
        });
      }
    });
    save();
    return { ok: true };
  },
  async historial(f = {}) {
    await delay(120);
    let items = [...(DB.asistenciasProfesores || [])];
    if (f.profesorId) items = items.filter((a) => a.profesorId === Number(f.profesorId));
    if (f.desde) items = items.filter((a) => a.fecha >= f.desde);
    if (f.hasta) items = items.filter((a) => a.fecha <= f.hasta);
    items.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return items.map((a) => ({
      ...a,
      profesorNombre: (() => {
        const p = byId(DB.profesores, a.profesorId);
        return p ? `${p.nombre} ${p.apellidos}` : '—';
      })()
    }));
  },
  async resumenPorProfesor(profesorId) {
    await delay(120);
    const mias = (DB.asistenciasProfesores || []).filter((a) => a.profesorId === Number(profesorId));
    const total = mias.length;
    const presente = mias.filter((a) => a.estado === 'presente').length;
    const retardo = mias.filter((a) => a.estado === 'retardo').length;
    const justificada = mias.filter((a) => a.estado === 'justificada').length;
    const falta = mias.filter((a) => a.estado === 'falta').length;
    return {
      total, presente, retardo, justificada, falta,
      porcentaje: total ? Math.round(((presente + retardo * 0.5 + justificada * 0.5) / total) * 100) : 0
    };
  }
};
// ============================================================
// HORARIOS
// ============================================================
export const HorariosService = {
  ...makeCrud('horarios', 'horario'),
  async porGrupo(grupoId) { await delay(120); return (DB.horarios || []).filter((h) => h.grupoId === Number(grupoId)); },
  async porProfesor(profesorId) { await delay(120); return (DB.horarios || []).filter((h) => h.profesorId === Number(profesorId)); }
};

// ============================================================
// AVISOS
// ============================================================
export const AvisosService = {
  ...makeCrud('avisos', 'aviso'),
  async listar(f = {}) {
    await delay(120);
    let items = [...(DB.avisos || [])];
    if (f.rol) items = items.filter((a) => a.dirigidoA === 'todos' || a.dirigidoA === f.rol);
    items.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return items;
  }
};

// ============================================================
// NOTIFICACIONES
// ============================================================
export const NotificacionesService = {
  ...makeCrud('notificaciones', 'notificacion'),
  async porUsuario(usuarioId) {
    await delay(120);
    return (DB.notificaciones || []).filter((n) => n.usuarioId === Number(usuarioId)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  },
  async contarNoLeidas(usuarioId) {
    return (DB.notificaciones || []).filter((n) => n.usuarioId === Number(usuarioId) && !n.leida).length;
  },
  async marcarLeida(id) {
    const n = byId(DB.notificaciones, id);
    if (n) { n.leida = true; save(); }
    return { ok: true };
  },
  async marcarTodasLeidas(usuarioId) {
    (DB.notificaciones || []).forEach((n) => { if (n.usuarioId === Number(usuarioId)) n.leida = true; });
    save();
    return { ok: true };
  }
};

// ============================================================
// KÁRDEX
// ============================================================
export const KardexService = {
  async porAlumno(alumnoId) {
    await delay(150);
    const alumno = byId(DB.alumnos, alumnoId);
    if (!alumno) throw new Error('Alumno no encontrado');
    const califs = (DB.calificaciones || []).filter((c) => c.alumnoId === Number(alumnoId));
    const porMateria = {};
    califs.forEach((c) => {
      if (!porMateria[c.materiaId]) porMateria[c.materiaId] = { materia: byId(DB.materias, c.materiaId), notas: {} };
      porMateria[c.materiaId].notas[c.periodo] = c.nota;
    });
    const filas = Object.values(porMateria).map((m) => {
      const notas = Object.values(m.notas);
      const prom = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
      return {
        materia: m.materia, notas: m.notas, promedio: prom,
        estado: prom >= (DB.config.escalaMinima || 6) ? 'Aprobado' : 'Reprobado',
        creditos: m.materia?.creditos || 0
      };
    });
    const creditosCursados = filas.reduce((a, f) => a + (f.creditos || 0), 0);
    const creditosAprobados = filas.filter((f) => f.estado === 'Aprobado').reduce((a, f) => a + (f.creditos || 0), 0);
    const promedioGeneral = filas.length ? filas.reduce((a, f) => a + f.promedio, 0) / filas.length : 0;
    return {
      alumno, filas, creditosCursados, creditosAprobados, promedioGeneral,
      materiasCursadas: filas.length,
      materiasAprobadas: filas.filter((f) => f.estado === 'Aprobado').length,
      estado: promedioGeneral >= (DB.config.escalaMinima || 6) ? 'Regular' : (promedioGeneral > 0 ? 'Riesgo académico' : 'Sin datos')
    };
  }
};

// ============================================================
// CONFIGURACIÓN
// ============================================================
export const ConfigService = {
  async obtener() { await delay(60); return { ...DB.config }; },
  async guardar(data) { await delay(150); DB.config = { ...DB.config, ...data }; save(); return { ...DB.config }; },
  reset() { reset(); }
};

// ============================================================
// CATÁLOGOS
// ============================================================
export const CatalogosService = {
  async grados() { return ['1°','2°','3°','4°','5°','6°']; },
  async grupos() { await delay(40); return [...(DB.grupos || [])]; },
  async profesores() { await delay(40); return [...(DB.profesores || [])]; },
  async materias() { await delay(40); return [...(DB.materias || [])]; },
  async alumnos() { await delay(40); return [...(DB.alumnos || [])]; },
  async config() { return { ...DB.config }; }
};

// ============================================================
// STATS
// ============================================================
export const StatsService = {
  async resumen() {
    await delay(100);
    const promedios = (DB.alumnos || []).map((a) => promedioAlumno(a.id)).filter((p) => p > 0);
    const promedioGeneral = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;
    const nominaQuincenal = (DB.profesores || []).reduce((a, p) => a + (p.sueldoQuincenal || 0), 0);
    return {
      alumnos: (DB.alumnos || []).length,
      alumnosActivos: (DB.alumnos || []).filter((a) => a.estado === 'activo').length,
      profesores: (DB.profesores || []).length,
      materias: (DB.materias || []).length,
      grupos: (DB.grupos || []).length,
      avisos: (DB.avisos || []).length,
      usuarios: (DB.usuarios || []).length,
      promedioGeneral,
      nominaQuincenal
    };
  },
  async topAlumnos(limit = 5) {
    await delay(100);
    return (DB.alumnos || [])
      .map((a) => ({ ...a, promedio: promedioAlumno(a.id) }))
      .filter((a) => a.promedio > 0)
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, limit);
  },
  async alumnosEnRiesgo(limit = 5) {
    await delay(100);
    return (DB.alumnos || [])
      .map((a) => ({ ...a, promedio: promedioAlumno(a.id) }))
      .filter((a) => a.promedio > 0 && a.promedio < (DB.config.escalaMinima || 6))
      .sort((a, b) => a.promedio - b.promedio)
      .slice(0, limit);
  }
};

export const _db = () => DB;
export const _reset = reset;