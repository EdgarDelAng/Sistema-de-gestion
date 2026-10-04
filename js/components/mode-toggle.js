const THEME_KEY = 'tema';
const ACCENT_KEY = 'acento_sistema';
let userKey = '';

const storageKey = (base) => userKey ? `${base}_${userKey}` : base;

export const ModeToggle = {
  setUser(user) {
    userKey = user ? String(user.id ?? user.matricula ?? user.email ?? user.rol ?? '') : '';
    this.apply();
  },

  get current() { return localStorage.getItem(storageKey(THEME_KEY)) || localStorage.getItem(THEME_KEY) || 'light'; },
  get accent() { return localStorage.getItem(storageKey(ACCENT_KEY)) || localStorage.getItem(ACCENT_KEY) || 'green'; },

  set(theme) {
    localStorage.setItem(storageKey(THEME_KEY), theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.updateIcon();
  },

  setAccent(accent) {
    const value = accent === 'navy' ? 'navy' : 'green';
    localStorage.setItem(storageKey(ACCENT_KEY), value);
    document.documentElement.setAttribute('data-accent', value);
  },

  setAppearance({ theme, accent }) {
    this.set(theme);
    this.setAccent(accent);
  },

  toggle() {
    const next = this.current === 'light' ? 'dark' : 'light';
    this.set(next);
    return next;
  },

  apply() {
    document.documentElement.setAttribute('data-theme', this.current);
    document.documentElement.setAttribute('data-accent', this.accent);
    this.updateIcon();
  },

  init() { this.apply(); },

  updateIcon() {
    const el = document.getElementById('modeToggle');
    if (!el) return;
    const isDark = this.current === 'dark';
    el.innerHTML = `
      <i class="fas ${isDark ? 'fa-moon' : 'fa-sun'}"></i>
      <span>${isDark ? 'Modo oscuro' : 'Modo claro'}</span>
      <span class="switch"></span>
    `;
  },

  render(containerId = 'modeToggleContainer') {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = `<button class="mode-toggle" id="modeToggle" type="button"></button>`;
    this.updateIcon();
    document.getElementById('modeToggle').addEventListener('click', () => this.toggle());
  },

  openAppearanceDialog() {
    document.getElementById('appearanceDialog')?.remove();
    const selectedTheme = this.current;
    const selectedAccent = this.accent;
    const overlay = document.createElement('div');
    overlay.id = 'appearanceDialog';
    overlay.className = 'appearance-overlay';
    overlay.innerHTML = `
      <section class="appearance-dialog" role="dialog" aria-modal="true" aria-labelledby="appearanceTitle">
        <div class="appearance-head">
          <div><h2 id="appearanceTitle">Apariencia</h2><p>Personaliza cómo se ve el sistema en esta cuenta.</p></div>
          <button class="appearance-close" type="button" aria-label="Cerrar"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="appearance-section">
          <span class="appearance-label">Modo</span>
          <div class="appearance-options" data-choice="theme">
            <button type="button" data-value="light" class="appearance-option ${selectedTheme==='light'?'selected':''}"><i class="fas fa-sun"></i><strong>Claro</strong><small>Fondos luminosos</small></button>
            <button type="button" data-value="dark" class="appearance-option ${selectedTheme==='dark'?'selected':''}"><i class="fas fa-moon"></i><strong>Oscuro</strong><small>Menor luminosidad</small></button>
          </div>
        </div>
        <div class="appearance-section">
          <span class="appearance-label">Color del sistema</span>
          <div class="appearance-options" data-choice="accent">
            <button type="button" data-value="green" class="appearance-option accent-option ${selectedAccent==='green'?'selected':''}"><span class="accent-swatch green"></span><strong>Verde institucional</strong><small>Turquesa sobrio</small></button>
            <button type="button" data-value="navy" class="appearance-option accent-option ${selectedAccent==='navy'?'selected':''}"><span class="accent-swatch navy"></span><strong>Azul marino</strong><small>Azul académico</small></button>
          </div>
        </div>
        <div class="appearance-preview"><span class="preview-mark"><i class="fas fa-graduation-cap"></i></span><div><strong>Vista previa</strong><small>Botones, enlaces, selección y elementos activos usan este color.</small></div><button type="button" class="btn btn-primary">Acción principal</button></div>
        <div class="appearance-actions"><button type="button" class="btn btn-secondary appearance-cancel">Cancelar</button><button type="button" class="btn btn-primary appearance-save">Guardar apariencia</button></div>
      </section>`;
    document.body.appendChild(overlay);
    let draftTheme = selectedTheme, draftAccent = selectedAccent;
    const select = (kind, value) => {
      overlay.querySelectorAll(`[data-choice="${kind}"] .appearance-option`).forEach(b=>b.classList.toggle('selected', b.dataset.value===value));
      if(kind==='theme') { draftTheme=value; document.documentElement.setAttribute('data-theme', value); }
      else { draftAccent=value; document.documentElement.setAttribute('data-accent', value); }
    };
    overlay.querySelectorAll('[data-choice="theme"] .appearance-option').forEach(b=>b.onclick=()=>select('theme',b.dataset.value));
    overlay.querySelectorAll('[data-choice="accent"] .appearance-option').forEach(b=>b.onclick=()=>select('accent',b.dataset.value));
    const cancel=()=>{document.documentElement.setAttribute('data-theme',selectedTheme);document.documentElement.setAttribute('data-accent',selectedAccent);overlay.remove();};
    overlay.querySelector('.appearance-close').onclick=cancel;
    overlay.querySelector('.appearance-cancel').onclick=cancel;
    overlay.addEventListener('click',e=>{if(e.target===overlay)cancel();});
    overlay.querySelector('.appearance-save').onclick=()=>{this.setAppearance({theme:draftTheme,accent:draftAccent});overlay.remove();document.dispatchEvent(new CustomEvent('appearance:changed',{detail:{theme:draftTheme,accent:draftAccent}}));};
  }
};
