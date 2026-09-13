import { ConfigService } from '../services/data.service.js';
import { UI, escapeHtml } from '../core/ui.js';
import { Auth } from '../core/auth.js';

export async function renderConfiguracion(container) {
  const cfg = await ConfigService.obtener();

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-gear"></i> Configuración</h1>
        <p class="page-sub">Parámetros del sistema escolar</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:var(--sp-5)">
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-building"></i> Información institucional</h3></div>
        <div class="field"><label>Nombre del colegio</label><input class="input" id="c_nombre" value="${escapeHtml(cfg.nombreColegio)}"></div>
        <div class="field"><label>Dirección</label><input class="input" id="c_dir" value="${escapeHtml(cfg.direccion)}"></div>
        <div class="field"><label>Teléfono</label><input class="input" id="c_tel" value="${escapeHtml(cfg.telefono)}"></div>
        <div class="field"><label>Correo</label><input class="input" type="email" id="c_email" value="${escapeHtml(cfg.email)}"></div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-calendar"></i> Parámetros académicos</h3></div>
        <div class="field"><label>Ciclo escolar</label><input class="input" id="c_ciclo" value="${escapeHtml(cfg.cicloEscolar)}"></div>
        <div class="field"><label>Escala mínima aprobatoria</label><input class="input" type="number" min="1" max="10" id="c_escala" value="${cfg.escalaMinima}"></div>
        <div class="field"><label>Número de periodos</label><input class="input" type="number" min="1" max="4" id="c_periodos" value="${cfg.periodos}"></div>
      </div>

      <div class="card" style="grid-column:1/-1;border:1px solid var(--c-danger-bg)">
        <div class="card-header"><h3 class="card-title" style="color:var(--c-danger)"><i class="fas fa-triangle-exclamation"></i> Zona de peligro</h3></div>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-bottom:var(--sp-4)">
          Restablece la base de datos local a su estado inicial. Se perderán todos los cambios realizados.
        </p>
        <button class="btn btn-danger" id="btnReset"><i class="fas fa-rotate-left"></i> Restablecer datos de prueba</button>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:var(--sp-3);margin-top:var(--sp-5)">
      <button class="btn btn-secondary" id="btnCancelar">Cancelar</button>
      <button class="btn btn-primary" id="btnGuardar"><i class="fas fa-floppy-disk"></i> Guardar cambios</button>
    </div>
  `;

  container.querySelector('#btnGuardar').addEventListener('click', async (e) => {
    const data = {
      nombreColegio: container.querySelector('#c_nombre').value.trim(),
      direccion: container.querySelector('#c_dir').value.trim(),
      telefono: container.querySelector('#c_tel').value.trim(),
      email: container.querySelector('#c_email').value.trim(),
      cicloEscolar: container.querySelector('#c_ciclo').value.trim(),
      escalaMinima: Number(container.querySelector('#c_escala').value) || 6,
      periodos: Number(container.querySelector('#c_periodos').value) || 3
    };
    const btn = e.currentTarget;
    UI.buttonLoading(btn, true);
    try {
      await ConfigService.guardar(data);
      UI.toast('Configuración guardada', 'success');
    } catch (err) { UI.toast(err.message, 'error'); }
    UI.buttonLoading(btn, false);
  });

  container.querySelector('#btnCancelar').addEventListener('click', () => renderConfiguracion(container));

  container.querySelector('#btnReset').addEventListener('click', async () => {
    const ok = await UI.confirm({
      title: 'Restablecer datos',
      message: '¿Restablecer toda la base de datos local a su estado inicial? Esto borrará todos los cambios.',
      danger: true, confirmText: 'Sí, restablecer'
    });
    if (!ok) return;
    ConfigService.reset();
    UI.toast('Datos restablecidos', 'success');
    setTimeout(() => location.reload(), 800);
  });
}