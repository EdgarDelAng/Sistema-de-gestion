import { Auth } from '../core/auth.js';
import { renderDashboardAdmin } from './dashboard-admin.js';
import { renderDashboardProfesor } from './dashboard-profesor.js';
import { renderDashboardAlumno } from './dashboard-alumno.js';

export async function renderInicio(container, params) {
  const rol = Auth.user.rol;
  if (rol === 'admin') return renderDashboardAdmin(container, params);
  if (rol === 'profesor') return renderDashboardProfesor(container, params);
  if (rol === 'alumno') return renderDashboardAlumno(container, params);
  return renderDashboardAdmin(container, params);
}