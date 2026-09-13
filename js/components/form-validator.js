// ============================================================
// form-validator.js — Validación visual reutilizable
// ============================================================

export const Validators = {
  required: (v) => (!v || !String(v).trim()) ? 'Este campo es obligatorio' : null,
  email: (v) => (v && !/^\S+@\S+\.\S+$/.test(v)) ? 'Correo electrónico inválido' : null,
  phone: (v) => (v && !/^[\d\s+\-()]{7,20}$/.test(v)) ? 'Teléfono inválido' : null,
  curp: (v) => (v && !/^[A-Z]{4}\d{6}[HM][A-Z]{5}\d{2}$/i.test(v)) ? 'CURP inválida' : null,
  min: (n) => (v) => (v !== '' && Number(v) < n) ? `Valor mínimo: ${n}` : null,
  max: (n) => (v) => (v !== '' && Number(v) > n) ? `Valor máximo: ${n}` : null,
  number: (v) => (v && isNaN(Number(v))) ? 'Debe ser un número' : null,
  minLength: (n) => (v) => (v && v.length < n) ? `Mínimo ${n} caracteres` : null
};

/**
 * Muestra error inline en un input. Uso:
 *   Validacion.marcar(input, 'mensaje')  → marca error
 *   Validacion.limpiar(input)             → limpia error
 */
export const Validacion = {
  marcar(input, mensaje) {
    if (!input) return;
    const field = input.closest('.field');
    if (!field) return;
    field.classList.add('has-error');
    let err = field.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      err.innerHTML = '<i class="fas fa-circle-exclamation"></i><span></span>';
      field.appendChild(err);
    }
    err.querySelector('span').textContent = mensaje || 'Error';
    input.setAttribute('aria-invalid', 'true');
  },

  limpiar(input) {
    if (!input) return;
    const field = input.closest('.field');
    if (!field) return;
    field.classList.remove('has-error');
    field.querySelector('.field-error')?.remove();
    input.removeAttribute('aria-invalid');
  },

  limpiarTodo(scope) {
    (scope || document).querySelectorAll('.field.has-error').forEach((f) => f.classList.remove('has-error'));
    (scope || document).querySelectorAll('.field-error').forEach((f) => f.remove());
  },

  /**
   * Valida un objeto de reglas:
   *   Validacion.validar(overlay, {
   *     'f_nombre':      [Validators.required],
   *     'f_email':       [Validators.email],
   *     'f_edad':        [Validators.number, Validators.min(1), Validators.max(100)]
   *   })
   * Devuelve true si todo válido, false si hay errores.
   */
  validar(scope, reglas) {
    let valido = true;
    let primerError = null;

    Object.entries(reglas).forEach(([id, regs]) => {
      const input = scope.querySelector('#' + id) || scope.querySelector(`[name="${id}"]`);
      if (!input) return;
      Validacion.limpiar(input);
      const val = input.value;
      for (const reg of regs) {
        const err = reg(val);
        if (err) {
          Validacion.marcar(input, err);
          if (!primerError) primerError = input;
          valido = false;
          break;
        }
      }
    });

    if (!valido) primerError?.focus();
    return valido;
  },

  /**
   * Enlaza validación en vivo: al perder foco valida, al escribir limpia el error.
   */
  bind(scope, reglas) {
    Object.entries(reglas).forEach(([id, regs]) => {
      const input = scope.querySelector('#' + id) || scope.querySelector(`[name="${id}"]`);
      if (!input) return;
      input.addEventListener('blur', () => {
        Validacion.limpiar(input);
        const val = input.value;
        for (const reg of regs) {
          const err = reg(val);
          if (err) { Validacion.marcar(input, err); return; }
        }
      });
      input.addEventListener('input', () => Validacion.limpiar(input));
    });
  }
};