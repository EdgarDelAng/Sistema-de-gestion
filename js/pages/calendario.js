import { CalendarioService } from '../services/data.service.js';
import { escapeHtml } from '../core/ui.js';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const TIPO_COLOR = {
  inicio: { bg: 'var(--c-info-bg)', fg: 'var(--c-info-fg)', icon: 'fa-play' },
  examen: { bg: 'var(--c-danger-bg)', fg: 'var(--c-danger-fg)', icon: 'fa-pen-to-square' },
  suspension: { bg: 'var(--c-warning-bg)', fg: 'var(--c-warning-fg)', icon: 'fa-circle-pause' },
  reunion: { bg: 'var(--c-info-bg)', fg: 'var(--c-info-fg)', icon: 'fa-users' },
  entrega: { bg: 'var(--c-success-bg)', fg: 'var(--c-success-fg)', icon: 'fa-file-invoice' },
  fin: { bg: 'var(--c-danger-bg)', fg: 'var(--c-danger-fg)', icon: 'fa-flag-checkered' },
  vacaciones: { bg: 'var(--c-warning-bg)', fg: 'var(--c-warning-fg)', icon: 'fa-umbrella-beach' }
};

export async function renderCalendario(container) {
  const hoy = new Date();
  let year = hoy.getFullYear();
  let month = 8; // Septiembre 2026

  const eventos = await CalendarioService.todos();

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-calendar"></i> Calendario escolar</h1>
        <p class="page-sub">Eventos y fechas importantes del ciclo</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--sp-5)">
      <div class="card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:var(--sp-3)">
            <button class="btn-icon" id="prevMes"><i class="fas fa-chevron-left"></i></button>
            <h3 class="card-title" style="min-width:200px;justify-content:center" id="mesTitle"></h3>
            <button class="btn-icon" id="nextMes"><i class="fas fa-chevron-right"></i></button>
          </div>
          <button class="btn btn-sm btn-secondary" id="hoyBtn">Hoy</button>
        </div>
        <div id="gridCalendario"></div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-list"></i> Próximos eventos</h3></div>
        <div id="proximos"></div>
      </div>
    </div>
  `;

  const render = () => {
    const title = container.querySelector('#mesTitle');
    title.textContent = `${MESES[month]} ${year}`;

    // Cuadrícula
    const primerDia = new Date(year, month, 1).getDay();
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const eventosMes = eventos.filter((e) => {
      const d = new Date(e.fecha + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });

    let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;
    DIAS.forEach((d) => {
      html += `<div style="text-align:center;font-size:var(--fs-xs);font-weight:700;color:var(--text-muted);text-transform:uppercase;padding:var(--sp-2) 0;letter-spacing:.05em">${d}</div>`;
    });
    for (let i = 0; i < primerDia; i++) html += `<div></div>`;
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const eventosDia = eventosMes.filter((e) => e.fecha === fecha);
      const esHoy = hoy.getFullYear() === year && hoy.getMonth() === month && hoy.getDate() === d;
      html += `
        <div style="min-height:70px;padding:6px;border:1px solid var(--border);border-radius:var(--r-md);background:${esHoy ? 'var(--c-brand-100)' : '#fff'};cursor:${eventosDia.length ? 'pointer' : 'default'}"
             data-fecha="${fecha}">
          <div style="font-size:var(--fs-xs);font-weight:700;color:${esHoy ? 'var(--c-brand-600)' : 'var(--text-primary)'};margin-bottom:4px">${d}</div>
          ${eventosDia.slice(0, 2).map((e) => {
            const c = TIPO_COLOR[e.tipo] || TIPO_COLOR.inicio;
            return `<div style="font-size:.65rem;padding:2px 4px;border-radius:var(--r-sm);background:${c.bg};color:${c.fg};font-weight:600;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(e.titulo)}</div>`;
          }).join('')}
          ${eventosDia.length > 2 ? `<div style="font-size:.6rem;color:var(--text-muted)">+${eventosDia.length - 2} más</div>` : ''}
        </div>`;
    }
    html += `</div>`;
    container.querySelector('#gridCalendario').innerHTML = html;

    container.querySelectorAll('[data-fecha]').forEach((el) => {
      const fecha = el.dataset.fecha;
      const eventosDia = eventosMes.filter((e) => e.fecha === fecha);
      if (!eventosDia.length) return;
      el.addEventListener('click', () => {
        UI.modal({
          title: `Eventos del ${fecha}`,
          body: eventosDia.map((e) => {
            const c = TIPO_COLOR[e.tipo] || TIPO_COLOR.inicio;
            return `
              <div class="list-item" style="border-left-color:${c.fg}">
                <i class="fas ${c.icon}" style="color:${c.fg};font-size:1.1rem"></i>
                <div style="flex:1">
                  <div class="list-item-title">${escapeHtml(e.titulo)}</div>
                  <div class="list-item-desc">${escapeHtml(e.descripcion || '')}</div>
                </div>
              </div>`;
          }).join('')
        });
      });
    });

    // Próximos eventos (todos los futuros)
    const hoyISO = new Date().toISOString().slice(0, 10);
    const proximos = eventos.filter((e) => e.fecha >= hoyISO).slice(0, 6);
    const wrapProx = container.querySelector('#proximos');
    if (!proximos.length) {
      wrapProx.innerHTML = `<p class="text-muted" style="font-size:var(--fs-sm)">Sin eventos próximos.</p>`;
    } else {
      wrapProx.innerHTML = proximos.map((e) => {
        const c = TIPO_COLOR[e.tipo] || TIPO_COLOR.inicio;
        const d = new Date(e.fecha + 'T12:00:00');
        return `
          <div class="list-item" style="border-left-color:${c.fg}">
            <div style="width:42px;text-align:center;flex-shrink:0">
              <div style="font-size:1.15rem;font-weight:800;color:var(--c-brand-900);line-height:1">${d.getDate()}</div>
              <div style="font-size:.65rem;color:var(--text-muted);text-transform:uppercase;font-weight:600">${MESES[d.getMonth()].slice(0, 3)}</div>
            </div>
            <div style="flex:1">
              <div class="list-item-title" style="font-size:var(--fs-sm)">${escapeHtml(e.titulo)}</div>
              <div class="list-item-desc" style="font-size:var(--fs-xs)">${escapeHtml(e.descripcion || '')}</div>
            </div>
          </div>`;
      }).join('');
    }
  };

  container.querySelector('#prevMes').addEventListener('click', () => {
    month--; if (month < 0) { month = 11; year--; }
    render();
  });
  container.querySelector('#nextMes').addEventListener('click', () => {
    month++; if (month > 11) { month = 0; year++; }
    render();
  });
  container.querySelector('#hoyBtn').addEventListener('click', () => {
    year = hoy.getFullYear(); month = hoy.getMonth(); render();
  });

  render();
}

// Import
import { UI } from '../core/ui.js';