import { UI } from '../core/ui.js';
import { Auth } from '../core/auth.js';
import { AuthService } from '../services/auth.service.js';

if (Auth.init()) {
  location.replace('app.html');
} else {
  initLoginPage();
}

function initLoginPage() {
  const form       = document.getElementById('loginForm');
  const usuario    = document.getElementById('usuario');
  const password   = document.getElementById('password');
  const submitBtn  = document.getElementById('submitBtn');
  const pwdToggle  = document.getElementById('pwdToggle');
  const loginMsg   = document.getElementById('loginMsg');
  const loginMsgTx = document.getElementById('loginMsgText');
  const forgotBtn  = document.getElementById('forgotBtn');

  pwdToggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    pwdToggle.innerHTML = show
      ? '<i class="fas fa-eye-slash"></i>'
      : '<i class="fas fa-eye"></i>';
    pwdToggle.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    password.focus();
  });

  function showError(msg) {
    loginMsgTx.textContent = msg;
    loginMsg.classList.remove('show');
    void loginMsg.offsetWidth;
    loginMsg.classList.add('show');
  }
  function hideError() { loginMsg.classList.remove('show'); }

  // Recuperar contraseña
  forgotBtn.addEventListener('click', () => {
    const { overlay, close } = UI.modal({
      title: 'Recuperar contraseña',
      body: `
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.6;margin-bottom:var(--sp-4)">
          Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <div class="field">
          <label for="recoveryEmail">Correo institucional</label>
          <div class="input-icon">
            <i class="fas fa-envelope"></i>
            <input type="email" class="input" id="recoveryEmail" placeholder="usuario@institucion.edu">
          </div>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="sendRecovery">
          <i class="fas fa-paper-plane"></i> Enviar enlace
        </button>`
    });

    overlay.querySelector('#sendRecovery').addEventListener('click', async (e) => {
      const email = overlay.querySelector('#recoveryEmail').value.trim();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        UI.toast('Ingresa un correo válido', 'warning');
        return;
      }
      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      await new Promise((r) => setTimeout(r, 900));
      close();
      UI.toast('Si el correo está registrado, recibirás un enlace.', 'success');
    });
  });

  // Aviso de privacidad / ayuda / contacto
  document.getElementById('privacyLink').addEventListener('click', () => {
    UI.modal({
      title: 'Aviso de privacidad',
      size: 'modal-lg',
      body: `
        <div style="color:var(--text-secondary);line-height:1.75;font-size:var(--fs-sm)">
          <p style="margin-bottom:var(--sp-3)">Los datos personales recabados a través de este sistema son utilizados exclusivamente para fines académicos y administrativos de la institución.</p>
          <p style="margin-bottom:var(--sp-3)">El acceso a la información está restringido según el rol del usuario (administrador, profesor o alumno), y todas las acciones realizadas quedan registradas para fines de auditoría.</p>
          <p>Para ejercer sus derechos de acceso, rectificación, cancelación u oposición (ARCO), contacte a Servicios Escolares.</p>
        </div>`
    });
  });

  document.getElementById('helpLink').addEventListener('click', () => {
    UI.modal({
      title: 'Ayuda de acceso',
      body: `
        <div style="color:var(--text-secondary);line-height:1.75;font-size:var(--fs-sm)">
          <p style="margin-bottom:var(--sp-3)">Si tienes problemas para acceder al sistema:</p>
          <ul style="padding-left:var(--sp-4);list-style:disc;display:flex;flex-direction:column;gap:6px">
            <li>Verifica que tu usuario o matrícula esté bien escrita.</li>
            <li>Las contraseñas distinguen mayúsculas y minúsculas.</li>
            <li>Si olvidaste tu contraseña usa la opción de recuperación.</li>
            <li>Para soporte adicional contacta a Servicios Escolares.</li>
          </ul>
        </div>`
    });
  });

  document.getElementById('contactLink').addEventListener('click', () => {
    UI.modal({
      title: 'Contacto',
      body: `
        <div style="color:var(--text-secondary);line-height:1.9;font-size:var(--fs-sm)">
          <div><strong style="color:var(--text-primary)">Servicios Escolares</strong></div>
          <div><i class="fas fa-envelope" style="width:18px;color:var(--c-brand-500)"></i> soporte@institucion.edu</div>
          <div><i class="fas fa-phone" style="width:18px;color:var(--c-brand-500)"></i> +52 (81) 0000 0000</div>
          <div><i class="fas fa-clock" style="width:18px;color:var(--c-brand-500)"></i> Lun a Vie · 8:00 - 16:00</div>
        </div>`
    });
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const u = usuario.value.trim();
    const p = password.value;

    if (!u || !p) {
      showError('Completa el usuario y la contraseña.');
      (!u ? usuario : password).focus();
      return;
    }

    UI.buttonLoading(submitBtn, true);
    try {
      const { user } = await AuthService.login(u, p);
      Auth.save(user, false);
      UI.toast(`Bienvenido, ${user.nombre}`, 'success', 1400);
      setTimeout(() => location.replace('app.html'), 400);
    } catch (err) {
      showError(err.message || 'Credenciales inválidas');
      password.value = '';
      password.focus();
      UI.buttonLoading(submitBtn, false);
    }
  });
}