const THEME_KEY = 'tema';

export const ModeToggle = {
  get current() { return localStorage.getItem(THEME_KEY) || 'light'; },

  set(theme) {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.updateIcon();
  },

  toggle() {
    const next = this.current === 'light' ? 'dark' : 'light';
    this.set(next);
    return next;
  },

  init() {
    document.documentElement.setAttribute('data-theme', this.current);
  },

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
    document.getElementById('modeToggle').addEventListener('click', () => {
      this.toggle();
    });
  }
};