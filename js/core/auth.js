const SESSION_KEY = 'sesion_escolar';

export const ROLES = {
  ADMIN: 'admin',
  PROFESOR: 'profesor',
  ALUMNO: 'alumno'
};

// Permisos por rol (secciones visibles y accesibles)
const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'inicio', 'alumnos', 'profesores', 'materias', 'grupos', 'inscripciones',
    'calificaciones', 'asistencia', 'horarios', 'kardex',
    'avisos', 'notificaciones',
    'reportes',
    'usuarios', 'configuracion',
    'ayuda'
  ],
  [ROLES.PROFESOR]: [
    'inicio',
    'mis-grupos',
    'calificaciones', 'asistencia', 'horarios',
    'avisos', 'notificaciones',
    'mi-perfil',
    'ayuda'
  ],
  [ROLES.ALUMNO]: [
    'inicio',
    'mis-calificaciones', 'mi-horario', 'mi-asistencia', 'mi-kardex',
    'boleta', 'tramites', 'documentos',
    'avisos', 'notificaciones',
    'mi-perfil',
    'ayuda'
  ]
};

export const Auth = {
  user: null,

  init() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.expira && Date.now() > data.expira) {
        this.logout();
        return false;
      }
      this.user = data.user;
      return true;
    } catch {
      return false;
    }
  },

  save(user, remember = false) {
    this.user = user;
    const payload = JSON.stringify({
      user,
      expira: Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000)
    });
    if (remember) localStorage.setItem(SESSION_KEY, payload);
    else sessionStorage.setItem(SESSION_KEY, payload);
  },

  logout() {
    this.user = null;
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated() { return !!this.user; },
  hasRole(role) { return this.user?.rol === role; },

  can(section) {
    if (!this.user) return false;
    return (PERMISSIONS[this.user.rol] || []).includes(section);
  },

  getDefaultSection() { return 'inicio'; }
};