// Badges con icono + color (no depender solo del color)

const MAP = {
  // Estados académicos
  'Aprobado':     { cls: 'success', icon: 'fa-check' },
  'Reprobado':    { cls: 'danger',  icon: 'fa-xmark' },
  'Regular':      { cls: 'success', icon: 'fa-circle-check' },
  'En observación': { cls: 'warning', icon: 'fa-eye' },
  'Riesgo académico': { cls: 'danger', icon: 'fa-triangle-exclamation' },
  'Sin notas':    { cls: 'neutral', icon: 'fa-minus' },

  // Estados generales
  'activo':       { cls: 'success', icon: 'fa-circle-check' },
  'inactivo':     { cls: 'neutral', icon: 'fa-circle-pause' },
  'Activo':       { cls: 'success', icon: 'fa-circle-check' },
  'Inactivo':     { cls: 'neutral', icon: 'fa-circle-pause' },

  // Asistencia
  'presente':     { cls: 'success', icon: 'fa-check' },
  'falta':        { cls: 'danger',  icon: 'fa-xmark' },
  'retardo':      { cls: 'warning', icon: 'fa-clock' },
  'justificada':  { cls: 'info',    icon: 'fa-file-medical' },
  'injustificada':{ cls: 'danger',  icon: 'fa-circle-exclamation' },

  // Prioridad avisos
  'Normal':       { cls: 'neutral', icon: 'fa-circle-info' },
  'Importante':   { cls: 'warning', icon: 'fa-exclamation' },
  'Urgente':      { cls: 'danger',  icon: 'fa-bolt' },

  // Trámites
  'Solicitado':   { cls: 'info',    icon: 'fa-paper-plane' },
  'En revisión':  { cls: 'warning', icon: 'fa-hourglass-half' },
  'Disponible':   { cls: 'success', icon: 'fa-circle-check' },
  'Rechazado':    { cls: 'danger',  icon: 'fa-xmark' },

  // Inscripciones
  'Preinscrito':  { cls: 'info',    icon: 'fa-user-plus' },
  'Inscrito':     { cls: 'success', icon: 'fa-user-check' },
  'Baja':         { cls: 'danger',  icon: 'fa-user-xmark' },
  'Finalizado':   { cls: 'neutral', icon: 'fa-flag-checkered' }
};

export function statusBadge(estado) {
  const cfg = MAP[estado] || { cls: 'neutral', icon: 'fa-circle' };
  return `<span class="badge badge-${cfg.cls}"><i class="fas ${cfg.icon}"></i>${estado}</span>`;
}