import { Auth } from '../core/auth.js';
import { UI, escapeHtml } from '../core/ui.js';
import { KardexService, NotificacionesService } from '../services/data.service.js';
import { Validators, Validacion } from '../components/form-validator.js';

// Almacén local de contraseñas (solo demo; en backend va al servidor)
const PWD_STORAGE = 'colegio_passwords_v1';
const pwdStore = {
  get() { try { return JSON.parse(localStorage.getItem(PWD_STORAGE)) || {}; } catch { return {}; } },
  set(usuario, pwd) { const s = this.get(); s[usuario] = btoa(pwd); localStorage.setItem(PWD_STORAGE, JSON.stringify(s)); },
  check(usuario, pwd) {
    const s = this.get();
    // Si no hay contraseña guardada, usar la del mock
    if (!s[usuario]) {
      const defaults = { admin: 'admin123', profesor: 'profesor123', alumno: 'alumno123' };
      return defaults[usuario] === pwd;
    }
    return s[usuario] === btoa(pwd);
  }
};

export async function renderMiPerfil(container) {
  const u = Auth.user;
  const initials = u.iniciales || u.nombre.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

  let academia = null;
  if (u.rol === 'alumno') {
    try { academia = await KardexService.porAlumno(u.alumnoId || 1); } catch {}
  }

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-user"></i> Mi perfil</h1>
        <p class="page-sub">Información de tu cuenta y seguridad</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:300px 1fr;gap:var(--sp-5)" class="perfil-grid">
      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
        <div class="card" style="text-align:center;padding:var(--sp-6)">
          <div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--c-brand-400),var(--c-brand-600));color:#fff;display:grid;place-items:center;font-size:1.8rem;font-weight:800;margin:0 auto var(--sp-4)" aria-hidden="true">
            ${initials}
          </div>
          <div style="font-size:var(--fs-lg);font-weight:700;color:var(--c-brand-900)">${escapeHtml(u.nombre)}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:2px;text-transform:capitalize">
            ${escapeHtml(u.rol)}
          </div>
          <div style="margin-top:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-2);font-size:var(--fs-sm);text-align:left">
            <div><i class="fas fa-user" style="color:var(--c-brand-500);width:18px" aria-hidden="true"></i> ${escapeHtml(u.usuario)}</div>
            <div><i class="fas fa-envelope" style="color:var(--c-brand-500);width:18px" aria-hidden="true"></i> ${escapeHtml(u.email || '—')}</div>
          </div>
        </div>

        ${academia ? `
          <div class="card">
            <div class="card-header"><h3 class="card-title"><i class="fas fa-graduation-cap"></i> Resumen</h3></div>
            <div style="display:flex;flex-direction:column;gap:var(--sp-2);font-size:var(--fs-sm)">
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">Promedio</span><strong>${academia.promedioGeneral.toFixed(2)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">Materias</span><strong>${academia.materiasCursadas}</strong></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">Créditos</span><strong>${academia.creditosAprobados}</strong></div>
            </div>
          </div>
        ` : ''}
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
        <div class="card">
          <div class="card-header"><h3 class="card-title"><i class="fas fa-user-pen"></i> Datos personales</h3></div>
          <form id="formPerfil" class="form-grid-2">
            <div class="field">
              <label for="p_nombre">Nombre completo <span class="req">*</span></label>
              <input class="input" id="p_nombre" value="${escapeHtml(u.nombre)}" required maxlength="80">
            </div>
            <div class="field">
              <label for="p_email">Correo electrónico <span class="req">*</span></label>
              <input class="input" type="email" id="p_email" value="${escapeHtml(u.email || '')}" required>
            </div>
            <div class="field">
              <label for="p_tel">Teléfono</label>
              <input class="input" id="p_tel" value="${escapeHtml(u.telefono || '')}" placeholder="Sin registrar" inputmode="tel">
            </div>
            <div class="field">
              <label for="p_usuario">Usuario</label>
              <input class="input" id="p_usuario" value="${escapeHtml(u.usuario)}" readonly disabled>
              <div class="field-hint">El nombre de usuario no puede modificarse.</div>
            </div>
          </form>
          <div style="display:flex;justify-content:flex-end;gap:var(--sp-2);border-top:1px solid var(--border);padding-top:var(--sp-4)">
            <button class="btn btn-secondary" id="btnResetPerfil"><i class="fas fa-rotate-left"></i> Descartar</button>
            <button class="btn btn-primary" id="btnGuardarPerfil"><i class="fas fa-floppy-disk"></i> Guardar cambios</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title"><i class="fas fa-shield-halved"></i> Seguridad</h3></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--sp-3)">
            <div style="padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md);display:flex;flex-direction:column;gap:var(--sp-2)">
              <div style="display:flex;align-items:center;gap:var(--sp-2)">
                <i class="fas fa-key" style="color:var(--c-brand-500)" aria-hidden="true"></i>
                <strong style="font-size:var(--fs-sm)">Contraseña</strong>
              </div>
              <p style="font-size:var(--fs-xs);color:var(--text-secondary);margin:0">Última actualización: desconocida</p>
              <button class="btn btn-sm btn-primary" id="btnChangePwd" style="margin-top:auto">
                <i class="fas fa-key"></i> Cambiar
              </button>
            </div>

            <div style="padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md);display:flex;flex-direction:column;gap:var(--sp-2)">
              <div style="display:flex;align-items:center;gap:var(--sp-2)">
                <i class="fas fa-mobile-screen" style="color:var(--c-success)" aria-hidden="true"></i>
                <strong style="font-size:var(--fs-sm)">Doble factor</strong>
              </div>
              <p style="font-size:var(--fs-xs);color:var(--text-secondary);margin:0">Añade una capa extra de seguridad.</p>
              <button class="btn btn-sm btn-secondary" id="btn2FA" style="margin-top:auto">
                <i class="fas fa-plus"></i> Configurar
              </button>
            </div>

            <div style="padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md);display:flex;flex-direction:column;gap:var(--sp-2)">
              <div style="display:flex;align-items:center;gap:var(--sp-2)">
                <i class="fas fa-desktop" style="color:var(--c-info)" aria-hidden="true"></i>
                <strong style="font-size:var(--fs-sm)">Sesiones</strong>
              </div>
              <p style="font-size:var(--fs-xs);color:var(--text-secondary);margin:0">Dispositivos con sesión activa.</p>
              <button class="btn btn-sm btn-secondary" id="btnSessions" style="margin-top:auto">
                <i class="fas fa-list"></i> Ver (2)
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title"><i class="fas fa-bell"></i> Preferencias de notificaciones</h3></div>
          <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
            ${[
              { id: 'notif_acad', label: 'Calificaciones publicadas', desc: 'Recibir aviso cuando se publiquen nuevas notas', checked: true },
              { id: 'notif_aviso', label: 'Avisos institucionales', desc: 'Comunicados generales de la institución', checked: true },
              { id: 'notif_tram', label: 'Actualización de trámites', desc: 'Cuando el estado de un trámite cambie', checked: true },
              { id: 'notif_email', label: 'Resumen por correo', desc: 'Recibir un resumen semanal por email', checked: false }
            ].map((n) => `
              <label style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;transition:background .15s" class="pref-row">
                <input type="checkbox" id="${n.id}" ${n.checked ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--c-brand-500);flex-shrink:0">
                <div style="flex:1">
                  <div style="font-weight:600;font-size:var(--fs-sm)">${n.label}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted)">${n.desc}</div>
                </div>
              </label>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // ============ Datos personales ============
  Validacion.bind(container, {
    p_nombre: [Validators.required, Validators.minLength(3)],
    p_email: [Validators.required, Validators.email],
    p_tel: [Validators.phone]
  });

  container.querySelector('#btnGuardarPerfil').addEventListener('click', async (e) => {
    const valido = Validacion.validar(container, {
      p_nombre: [Validators.required, Validators.minLength(3)],
      p_email: [Validators.required, Validators.email],
      p_tel: [Validators.phone]
    });
    if (!valido) { UI.toast('Revisa los campos marcados en rojo', 'warning'); return; }

    const btn = e.currentTarget;
    UI.buttonLoading(btn, true);
    await new Promise((r) => setTimeout(r, 700));

    // Actualizar Auth.user
    Auth.user.nombre = container.querySelector('#p_nombre').value.trim();
    Auth.user.email = container.querySelector('#p_email').value.trim();
    Auth.user.telefono = container.querySelector('#p_tel').value.trim();
    Auth.user.iniciales = Auth.user.nombre.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

    // Persistir sesión
    Auth.save(Auth.user, false);

    UI.buttonLoading(btn, false);
    UI.toast('Perfil actualizado correctamente', 'success');

    // Actualizar header y sidebar
    document.getElementById('userName').textContent = Auth.user.nombre;
    document.getElementById('userAvatar').textContent = Auth.user.iniciales;
  });

  container.querySelector('#btnResetPerfil').addEventListener('click', () => renderMiPerfil(container));

  // ============ Cambio de contraseña ============
  container.querySelector('#btnChangePwd').addEventListener('click', () => {
    const { overlay, close } = UI.modal({
      title: 'Cambiar contraseña',
      body: `
        <div class="field">
          <label for="pwd_actual">Contraseña actual <span class="req">*</span></label>
          <div class="input-icon">
            <i class="fas fa-lock" aria-hidden="true"></i>
            <input class="input" type="password" id="pwd_actual" autocomplete="current-password">
          </div>
        </div>
        <div class="field">
          <label for="pwd_nueva">Nueva contraseña <span class="req">*</span></label>
          <input class="input" type="password" id="pwd_nueva" autocomplete="new-password" placeholder="Mínimo 8 caracteres">
        </div>
        <div class="field">
          <label for="pwd_conf">Confirmar nueva contraseña <span class="req">*</span></label>
          <input class="input" type="password" id="pwd_conf" autocomplete="new-password">
        </div>
        <div style="margin-top:var(--sp-3);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);font-size:var(--fs-xs);color:var(--text-secondary)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><i class="fas fa-info-circle" style="color:var(--c-brand-500)" aria-hidden="true"></i><strong>Requisitos:</strong></div>
          <ul style="padding-left:var(--sp-4);list-style:disc;display:flex;flex-direction:column;gap:2px">
            <li id="req_len">Mínimo 8 caracteres</li>
            <li id="req_may">Al menos una mayúscula</li>
            <li id="req_num">Al menos un número</li>
          </ul>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="savePwd"><i class="fas fa-check"></i> Cambiar contraseña</button>`
    });

    // Validador dinámico de fortaleza
    const checkReq = () => {
      const v = overlay.querySelector('#pwd_nueva').value;
      const ok = (id, cond) => {
        const el = overlay.querySelector('#' + id);
        if (cond) { el.style.color = 'var(--c-success)'; el.innerHTML = `✓ ${el.textContent.replace(/^[✓✗]\s*/, '')}`; }
        else { el.style.color = 'var(--text-muted)'; el.innerHTML = `• ${el.textContent.replace(/^[✓✗•]\s*/, '')}`; }
      };
      ok('req_len', v.length >= 8);
      ok('req_may', /[A-Z]/.test(v));
      ok('req_num', /\d/.test(v));
    };
    overlay.querySelector('#pwd_nueva').addEventListener('input', checkReq);
    checkReq();

    overlay.querySelector('#savePwd').addEventListener('click', async (e) => {
      const actual = overlay.querySelector('#pwd_actual').value;
      const nueva = overlay.querySelector('#pwd_nueva').value;
      const conf = overlay.querySelector('#pwd_conf').value;

      if (!actual || !nueva || !conf) { UI.toast('Completa todos los campos', 'warning'); return; }
      if (!pwdStore.check(Auth.user.usuario, actual)) { UI.toast('La contraseña actual es incorrecta', 'error'); return; }
      if (nueva.length < 8) { UI.toast('La nueva contraseña debe tener al menos 8 caracteres', 'warning'); return; }
      if (!/[A-Z]/.test(nueva)) { UI.toast('Debe incluir al menos una mayúscula', 'warning'); return; }
      if (!/\d/.test(nueva)) { UI.toast('Debe incluir al menos un número', 'warning'); return; }
      if (nueva !== conf) { UI.toast('Las contraseñas no coinciden', 'warning'); return; }
      if (nueva === actual) { UI.toast('La nueva contraseña debe ser diferente a la actual', 'warning'); return; }

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      await new Promise((r) => setTimeout(r, 800));

      pwdStore.set(Auth.user.usuario, nueva);
      close();
      UI.toast('Contraseña actualizada correctamente', 'success');

      // Notificación
      try {
        await NotificacionesService.crear({
          usuarioId: Auth.user.id,
          titulo: 'Contraseña actualizada',
          desc: 'Tu contraseña fue cambiada exitosamente.',
          fecha: new Date().toISOString(),
          leida: false,
          tipo: 'academico'
        });
      } catch {}
    });
  });

  // ============ 2FA ============
  container.querySelector('#btn2FA').addEventListener('click', () => {
    UI.modal({
      title: 'Autenticación en dos pasos',
      body: `
        <p style="color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.7;margin-bottom:var(--sp-4)">
          La autenticación en dos pasos añade una capa adicional de seguridad. Cuando la configures, además de tu contraseña deberás ingresar un código temporal generado por una aplicación como Google Authenticator o Authy.
        </p>
        <div style="background:var(--bg-muted);border-radius:var(--r-md);padding:var(--sp-4);text-align:center">
          <div style="width:120px;height:120px;background:#fff;border:1px solid var(--border);border-radius:var(--r-md);margin:0 auto;display:grid;place-items:center">
            <i class="fas fa-qrcode" style="font-size:3rem;color:var(--text-muted)" aria-hidden="true"></i>
          </div>
          <p style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--sp-3)">Código QR de ejemplo</p>
        </div>
        <div class="field" style="margin-top:var(--sp-4)">
          <label for="codigo2fa">Código de verificación</label>
          <input class="input" id="codigo2fa" maxlength="6" inputmode="numeric" placeholder="000000" style="text-align:center;font-size:1.2rem;letter-spacing:.5em">
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="save2fa"><i class="fas fa-check"></i> Verificar y activar</button>`
    }).then(() => {});
  });

  // ============ Sesiones ============
  container.querySelector('#btnSessions').addEventListener('click', () => {
    UI.modal({
      title: 'Sesiones activas',
      size: 'modal-lg',
      body: `
        <div class="list-item" style="border-left-color:var(--c-success);background:var(--c-success-bg)">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--c-success);color:#fff;display:grid;place-items:center;flex-shrink:0">
            <i class="fas fa-desktop" aria-hidden="true"></i>
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:var(--sp-2)">
              <div class="list-item-title" style="margin-bottom:0">Este dispositivo · Sesión actual</div>
              <span class="badge badge-success">Actual</span>
            </div>
            <div class="list-item-desc">${navigator.userAgent.includes('Mobile') ? 'Dispositivo móvil' : 'Escritorio'} · IP local · Última actividad ahora</div>
          </div>
        </div>
        <div class="list-item">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--bg-hover);color:var(--text-secondary);display:grid;place-items:center;flex-shrink:0">
            <i class="fas fa-mobile-screen" aria-hidden="true"></i>
          </div>
          <div style="flex:1">
            <div class="list-item-title">iPhone · Safari</div>
            <div class="list-item-desc">Última actividad hace 2 días · IP 192.168.1.45</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="this.closest('.list-item').remove()">
            <i class="fas fa-sign-out-alt"></i> Cerrar
          </button>
        </div>`,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cerrar</button>
        <button class="btn btn-danger" id="closeAllSessions"><i class="fas fa-power-off"></i> Cerrar todas las demás</button>`
    }).then((result) => {
      // Se engancha al click del botón especial (por si el modal se cierra sin usarlo)
      setTimeout(() => {
        document.getElementById('closeAllSessions')?.addEventListener('click', () => {
          UI.toast('Sesiones cerradas (demo)', 'success');
        });
      }, 150);
    });
  });

  // ============ Preferencias ============
  container.querySelectorAll('.pref-row').forEach((row) => {
    row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-muted)');
    row.addEventListener('mouseleave', () => row.style.background = '');
    row.querySelector('input').addEventListener('change', (e) => {
      const estado = e.target.checked ? 'activadas' : 'desactivadas';
      UI.toast(`Notificaciones ${estado}`, 'info', 1500);
    });
  });
}