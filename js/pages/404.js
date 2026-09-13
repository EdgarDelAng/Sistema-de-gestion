export function render404(container) {
  container.innerHTML = `
    <div class="error-page">
      <div class="err-icon" style="background:var(--c-info-bg);color:var(--c-info)">
        <i class="fas fa-compass"></i>
      </div>
      <div class="err-code">404</div>
      <h2>Página no encontrada</h2>
      <p>La sección que buscas no existe o fue movida. Verifica la dirección o regresa al inicio.</p>
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