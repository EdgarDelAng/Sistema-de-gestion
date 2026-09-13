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
function norm(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ============================================================
// SERVICIO
// ============================================================
export const AuthService = {
  async login(usuarioInput, passwordInput) {
    await delay(400);

    const u = norm(usuarioInput);
    const p = String(passwordInput || '').trim();

    console.log('═══════════════════════════════════════');
    console.log('🔐 LOGIN:', { usuarioOriginal: usuarioInput, normalizado: u, password: p ? '(ingresada)' : '(vacía)' });

    if (!u || !p) {
      console.warn('❌ Campos vacíos');
      throw new Error('Completa usuario y contraseña');
    }

    // ═══════════════════════════════════════════════════════
    // 1) ADMIN
    // ═══════════════════════════════════════════════════════
    if (
      (u === 'admin' || u === norm(ADMIN.email)) &&
      p === ADMIN.password
    ) {
      console.log('✅ LOGIN: ADMIN');
      return { user: { ...ADMIN.user, token: 'mock-' + Date.now() } };
    }

    // ═══════════════════════════════════════════════════════
    // 2) ALUMNO
    // ═══════════════════════════════════════════════════════
    if (
      (u === 'alumno' || u === norm(ALUMNO.email) || u === '20001') &&
      p === ALUMNO.password
    ) {
      console.log('✅ LOGIN: ALUMNO');
      return { user: { ...ALUMNO.user, token: 'mock-' + Date.now() } };
    }

    // ═══════════════════════════════════════════════════════
    // 3) PROFESOR
    // ═══════════════════════════════════════════════════════
    if (p === PASSWORD_PROFESOR) {
      // Buscar profesor por: matrícula, nombre, apellido, email, o "profesor" (atajo)
      
      // Atajo universal
      if (u === 'profesor') {
        const prof = PROFESORES[0];
        console.log('✅ LOGIN: PROFESOR (atajo universal) →', prof.nombre, prof.apellidos);
        return { user: this._construirUserProfesor(prof) };
      }

      const prof = PROFESORES.find((pr) => {
        const matricula = String(10000 + pr.id);                       // "10001"
        const nombreUsuario = norm(pr.nombre + '.' + pr.apellidos.split(' ')[0]);  // "maria.gonzalez"
        const emailNorm = norm(pr.email);                               // "mariagonzalez@colegioedu"
        const primerNombre = norm(pr.nombre.split(' ')[0]);             // "maria"
        const primerApellido = norm(pr.apellidos.split(' ')[0]);        // "gonzalez"
        const nombreCompleto = norm(pr.nombre + ' ' + pr.apellidos);    // "mariagonzalezruiz"

        return (
          matricula === u ||
          nombreUsuario === u ||
          emailNorm === u ||
          primerNombre === u ||
          primerApellido === u ||
          nombreCompleto === u
        );
      });

      if (prof) {
        console.log('✅ LOGIN: PROFESOR →', prof.nombre, prof.apellidos, '| Matrícula:', 10000 + prof.id);
        return { user: this._construirUserProfesor(prof) };
      }

      // Debug: mostrar opciones
      console.warn('❌ No se encontró profesor con:', u);
      console.log('📋 Usuarios disponibles para profesores:');
      console.log('   • Atajo universal: "profesor"');
      console.log('   • Matrículas: "10001" al "10018"');
      console.log('   • Ejemplos de usuario.nombre:', PROFESORES.slice(0, 3).map(p => norm(p.nombre + '.' + p.apellidos.split(' ')[0])));
      console.log('   • Contraseña: "profesor123"');
    } else {
      console.warn('❌ Contraseña incorrecta para profesor');
    }

    throw new Error('Usuario o contraseña incorrectos');
  },

  _construirUserProfesor(prof) {
    const iniciales = (prof.nombre[0] + prof.apellidos[0]).toUpperCase();
    return {
      id: 100 + prof.id,
      usuario: String(10000 + prof.id),
      matricula: String(10000 + prof.id),
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