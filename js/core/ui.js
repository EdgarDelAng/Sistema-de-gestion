// ============================================================
// ui.js — Toasts, modales, confirmaciones, skeleton
// ============================================================

const toastContainer = () => {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
};

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

export const UI = {
  // ----------------------------------------------------------
  // TOAST
  // ----------------------------------------------------------
  toast(message, type = 'info', duration = 3200) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
    toastContainer().appendChild(el);

    const remove = () => {
      if (el.dataset.removing) return;
      el.dataset.removing = '1';
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 200);
    };
    el.addEventListener('click', remove);
    setTimeout(remove, duration);
  },

  // ----------------------------------------------------------
  // MODAL
  // Devuelve { overlay, close, closed }
  // ----------------------------------------------------------
  modal({ title, body, footer, size = '' }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="modal ${size}" role="document">
        <div class="modal-header">
          <h2><i class="fas fa-circle-info"></i> ${escapeHtml(title)}</h2>
          <button class="modal-close" aria-label="Cerrar"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      </div>
    `;

    const bodyEl = overlay.querySelector('.modal-body');
    const footerEl = overlay.querySelector('.modal-footer');
    bodyEl.innerHTML = body || '';
    footerEl.innerHTML = footer || '<button class="btn btn-secondary" data-action="close">Cerrar</button>';

    let resolveClosed;
    const closed = new Promise((r) => { resolveClosed = r; });
    let isClosed = false;

    const close = (result = null) => {
      if (isClosed) return;
      isClosed = true;
      overlay.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        overlay.remove();
        resolveClosed(result);
      }, 200);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') { close(null); return; }
      if (e.key === 'Tab') {
        const focusables = overlay.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    overlay.querySelector('.modal-close').addEventListener('click', () => close(null));
    overlay.querySelectorAll('[data-action="close"]').forEach((b) =>
      b.addEventListener('click', () => close(null))
    );
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    setTimeout(() => {
      const firstInput = overlay.querySelector('input, select, textarea, button:not(.modal-close)');
      firstInput?.focus();
    }, 120);

    return { overlay, close, closed };
  },

  // ----------------------------------------------------------
  // CONFIRM — devuelve Promise<boolean>
  // ----------------------------------------------------------
  confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = (val) => {
        if (resolved) return;
        resolved = true;
        resolve(val);
      };

      const { overlay, close } = UI.modal({
        title,
        body: `<p style="color:var(--text-secondary);line-height:1.6">${escapeHtml(message)}</p>`,
        footer: `
          <button class="btn btn-secondary" data-cancel>${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>
            ${escapeHtml(confirmText)}
          </button>`
      });

      // Cambiar icono según tipo
      overlay.querySelector('.modal-header h2').innerHTML =
        `<i class="fas ${danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}"
            style="color:${danger ? 'var(--c-danger)' : 'var(--c-brand-500)'}"></i> ${escapeHtml(title)}`;

      overlay.querySelector('[data-cancel]').addEventListener('click', () => {
        safeResolve(false);
        close(false);
      });
      overlay.querySelector('[data-confirm]').addEventListener('click', () => {
        safeResolve(true);
        close(true);
      });

      // Cualquier cierre que no sea por los botones => false
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) safeResolve(false);
      });
      overlay.querySelector('.modal-close').addEventListener('click', () => safeResolve(false));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') safeResolve(false);
      });

      setTimeout(() => overlay.querySelector('[data-confirm]')?.focus(), 120);
    });
  },

  // ----------------------------------------------------------
  // SKELETON de filas de tabla
  // ----------------------------------------------------------
  skeletonRows(cols, rows = 6) {
    let html = '';
    for (let r = 0; r < rows; r++) {
      html += '<tr class="skeleton-row">';
      for (let c = 0; c < cols; c++) {
        const w = 40 + Math.random() * 50;
        html += `<td><div class="skeleton" style="width:${w}%"></div></td>`;
      }
      html += '</tr>';
    }
    return html;
  },

  // ----------------------------------------------------------
  // LOADING en botón
  // ----------------------------------------------------------
  buttonLoading(btn, loading = true) {
    if (!btn) return;
    if (loading) {
      if (!btn.dataset.original) btn.dataset.original = btn.innerHTML;
      btn.classList.add('is-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      if (btn.dataset.original) {
        btn.innerHTML = btn.dataset.original;
        delete btn.dataset.original;
      }
    }
  }
};

export { escapeHtml };