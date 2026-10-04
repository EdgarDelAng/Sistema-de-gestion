// ============================================================
// auth.service.js — Login autónomo (sin dependencias externas)
// ============================================================
import { delay } from '../core/api.js';

// ============================================================
// USUARIOS DEL SISTEMA — Todo hardcodeado aquí
// Admin: admin / admin123
// Alumno: alumno / alumno123
// Profesores: 10001 a 10018 / profesor123
// ============================================================

const ADMIN = {
  usuario: 'admin',
  email: 'admin@colegio.edu',
  password: 'admin123',
  user: {
    id: 1,
    usuario: 'admin',
    nombre: 'Carlos Ramírez',
    rol: 'admin',
    email: 'admin@colegio.edu',
    iniciales: 'CR'
  }
};

const ALUMNO = {
  usuario: 'alumno',
  email: 'lucia@colegio.edu',
  password: 'alumno123',
  user: {
    id: 3,
    usuario: 'alumno',
    matricula: '20001',
    nombre: 'Lucía Méndez',
    rol: 'alumno',
    alumnoId: 1,
    email: 'lucia@colegio.edu',
    iniciales: 'LM'
  }
};

// Los 18 profesores con matrícula 10001-10018
const PROFESORES = [
  { id: 1,  nombre: 'María',     apellidos: 'González Ruiz',     area: 'Matemáticas',      email: 'maria.gonzalez@colegio.edu' },
  { id: 2,  nombre: 'Carlos',    apellidos: 'Rodríguez Luna',    area: 'Matemáticas',      email: 'carlos.rodriguez@colegio.edu' },
  { id: 3,  nombre: 'Ana',       apellidos: 'Martínez Vega',     area: 'Matemáticas',      email: 'ana.martinez@colegio.edu' },
  { id: 4,  nombre: 'Jorge',     apellidos: 'Pérez Mora',        area: 'Lengua',           email: 'jorge.perez@colegio.edu' },
  { id: 5,  nombre: 'Laura',     apellidos: 'Fernández Silva',   area: 'Lengua',           email: 'laura.fernandez@colegio.edu' },
  { id: 6,  nombre: 'Pedro',     apellidos: 'Sánchez Ortiz',     area: 'Lengua',           email: 'pedro.sanchez@colegio.edu' },
  { id: 7,  nombre: 'Sofía',     apellidos: 'Flores Torres',     area: 'Ciencias',         email: 'sofia.flores@colegio.edu' },
  { id: 8,  nombre: 'Diego',     apellidos: 'Rivera Gómez',      area: 'Ciencias',         email: 'diego.rivera@colegio.edu' },
  { id: 9,  nombre: 'Valentina', apellidos: 'Díaz Cruz',         area: 'Ciencias',         email: 'valentina.diaz@colegio.edu' },
  { id: 10, nombre: 'Luis',      apellidos: 'Morales Reyes',     area: 'Historia',         email: 'luis.morales@colegio.edu' },
  { id: 11, nombre: 'Camila',    apellidos: 'Ortiz Gutiérrez',   area: 'Historia',         email: 'camila.ortiz@colegio.edu' },
  { id: 12, nombre: 'Santiago',  apellidos: 'Vargas Castillo',   area: 'Inglés',           email: 'santiago.vargas@colegio.edu' },
  { id: 13, nombre: 'Renata',    apellidos: 'Jiménez Mendoza',   area: 'Inglés',           email: 'renata.jimenez@colegio.edu' },
  { id: 14, nombre: 'Matías',    apellidos: 'Rojas García',      area: 'Arte',             email: 'matias.rojas@colegio.edu' },
  { id: 15, nombre: 'Valeria',   apellidos: 'Navarro López',     area: 'Educación Física', email: 'valeria.navarro@colegio.edu' },
  { id: 16, nombre: 'Emilio',    apellidos: 'Guerrero Martínez', area: 'Educación Física', email: 'emilio.guerrero@colegio.edu' },
  { id: 17, nombre: 'Daniela',   apellidos: 'Contreras Aguilar', area: 'Tecnología',       email: 'daniela.contreras@colegio.edu' },
  { id: 18, nombre: 'Bruno',     apellidos: 'Salazar Rojas',     area: 'Tecnología',       email: 'bruno.salazar@colegio.edu' }
];

// Contraseña universal de profesores
const PASSWORD_PROFESOR = 'profesor123';

// ============================================================
// Normaliza texto (sin acentos, sin espacios, minúsculas)
// ============================================================

function applyProfileOverride(user) {
  try {
    const key = `colegio_profile_${user.rol}_${user.usuario}`;
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved ? { ...user, ...saved } : user;
  } catch {
    return user;
  }
}

function norm(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const PWD_STORAGE = 'colegio_passwords_v1';
function passwordMatches(usuario, provided, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(PWD_STORAGE) || '{}');
    const stored = saved?.[String(usuario)];
    if (stored) return stored === btoa(provided);
  } catch {}
  return provided === fallback;
}

// ============================================================
// SERVICIO
// ============================================================
export const AuthService = {
  async login(usuarioInput, passwordInput) {
    await delay(250);

    const u = norm(usuarioInput);
    const p = String(passwordInput || '').trim();
    if (!u || !p) throw new Error('Completa usuario y contraseña');

    // 1) Administrador
    if (u === 'admin' || u === norm(ADMIN.email)) {
      if (!passwordMatches(ADMIN.user.usuario, p, ADMIN.password)) {
        throw new Error('Usuario o contraseña incorrectos');
      }
      return { user: applyProfileOverride({ ...ADMIN.user, token: 'mock-' + Date.now() }) };
    }

    // 2) Alumno: cualquier matrícula/correo existente + atajo "alumno".
    try {
      const { AlumnosService } = await import('./data.service.js');
      const alumnos = await AlumnosService.todos();
      const alumno = u === 'alumno'
        ? alumnos[0]
        : alumnos.find(a => norm(a.matricula) === u || norm(a.email) === u);

      if (alumno) {
        const usuarioReal = String(alumno.matricula);
        if (!passwordMatches(usuarioReal, p, ALUMNO.password)) {
          throw new Error('Usuario o contraseña incorrectos');
        }
        const nombreCompleto = `${alumno.nombre} ${alumno.apellidos || ''}`.trim();
        const iniciales = nombreCompleto.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
        return { user: applyProfileOverride({
          id: 200000 + Number(alumno.id),
          usuario: usuarioReal,
          matricula: usuarioReal,
          nombre: nombreCompleto,
          rol: 'alumno',
          alumnoId: Number(alumno.id),
          email: alumno.email,
          iniciales,
          token: 'mock-alumno-' + Date.now()
        }) };
      }
    } catch (err) {
      if (err?.message === 'Usuario o contraseña incorrectos') throw err;
      console.error('No fue posible consultar alumnos para login:', err);
    }

    // 3) Profesor: matrícula/correo/nombre de cualquier profesor existente + atajo "profesor".
    let prof = null;
    try {
      const { ProfesoresService } = await import('./data.service.js');
      const profesores = await ProfesoresService.todos();
      prof = u === 'profesor' ? profesores[0] : profesores.find((pr) => {
        const matricula = norm(pr.matricula || String(10000 + Number(pr.id)));
        const nombreUsuario = norm(`${pr.nombre}.${String(pr.apellidos || '').split(' ')[0]}`);
        return matricula === u || norm(pr.email) === u || nombreUsuario === u ||
          norm(`${pr.nombre} ${pr.apellidos || ''}`) === u;
      });
    } catch (err) {
      console.error('No fue posible consultar profesores para login:', err);
    }

    // Compatibilidad con instalaciones demo antiguas.
    if (!prof) {
      prof = PROFESORES.find((pr) =>
        String(10000 + pr.id) === u ||
        norm(pr.email) === u ||
        norm(`${pr.nombre} ${pr.apellidos}`) === u
      );
    }

    if (prof) {
      const usuarioReal = String(prof.matricula || (10000 + Number(prof.id)));
      if (!passwordMatches(usuarioReal, p, PASSWORD_PROFESOR)) {
        throw new Error('Usuario o contraseña incorrectos');
      }
      return { user: applyProfileOverride(this._construirUserProfesor(prof)) };
    }

    throw new Error('Usuario o contraseña incorrectos');
  },

  _construirUserProfesor(prof) {
    const iniciales = (prof.nombre[0] + prof.apellidos[0]).toUpperCase();
    return {
      id: 100 + prof.id,
      usuario: String(prof.matricula || (10000 + Number(prof.id))),
      matricula: String(prof.matricula || (10000 + Number(prof.id))),
      nombre: `${prof.nombre} ${prof.apellidos}`,
      rol: 'profesor',
      profesorId: prof.id,
      email: prof.email,
      area: prof.area,
      iniciales,
      token: 'mock-prof-' + Date.now()
    };
  },

  async logout() {
    await delay(150);
  },

  // Para consultar la lista desde otras partes
  getProfesores() {
    return PROFESORES.map((p) => ({
      matricula: String(10000 + p.id),
      nombre: `${p.nombre} ${p.apellidos}`,
      area: p.area,
      password: PASSWORD_PROFESOR
    }));
  }
};