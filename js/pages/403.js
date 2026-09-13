import { Auth } from '../core/auth.js';

export function render403(container, data = {}) {
  const intento = data.intento || '';
  container.innerHTML = `
    <div class="error-page">
      <div class="err-icon"><i class="fas fa-lock"></i></div>
      <div class="err-code">403</div>
      <h2>Acceso restringido</h2>
      <p>No tienes permisos para consultar esta sección${intento ? ` (<code>${intento}</code>)` : ''}. Si crees que es un error, contacta al administrador del sistema.</p>
      <div style="display:flex;gap:var(--sp-2)">
        <button class="btn btn-primary" onclick="location.hash='#/inicio'">
          <i class="fas fa-house"></i> Volver al inicio
        </button>
        <button class="btn btn-secondary" onclick="history.back()">
          <i class="fas fa-arrow-left"></i> Regresar
        </button>
      </div>
    </div>
  `;
}