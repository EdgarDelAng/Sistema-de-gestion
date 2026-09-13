// Selector de ciclo escolar + periodo (componente global en el header)
// Persiste la selección en sessionStorage para que todas las páginas la usen.

const STORAGE_KEY = 'periodo_seleccionado';

const CICLOS = ['2026-2027', '2025-2026', '2024-2025'];
const PERIODOS = ['Agosto-Diciembre 2026', 'Enero-Junio 2027'];

export const PeriodSelector = {
  get current() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { ciclo: CICLOS[0], periodo: PERIODOS[0] };
  },

  set(ciclo, periodo) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ciclo, periodo }));
    document.dispatchEvent(new CustomEvent('periodo-change', { detail: { ciclo, periodo } }));
  },

  render() {
    const el = document.getElementById('periodSelector');
    if (!el) return;
    const { ciclo, periodo } = this.current;

    el.innerHTML = `
      <div class="period-selector">
        <label for="selCiclo">Ciclo</label>
        <select id="selCiclo">
          ${CICLOS.map((c) => `<option ${c === ciclo ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <span style="width:1px;height:18px;background:var(--border);margin:0 4px"></span>
        <label for="selPeriodo">Periodo</label>
        <select id="selPeriodo">
          ${PERIODOS.map((p) => `<option ${p === periodo ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </div>
    `;

    el.querySelector('#selCiclo').addEventListener('change', (e) => {
      const { periodo } = this.current;
      this.set(e.target.value, periodo);
    });
    el.querySelector('#selPeriodo').addEventListener('change', (e) => {
      const { ciclo } = this.current;
      this.set(ciclo, e.target.value);
    });
  }
};