// ============================================================
// data-table.js — Tabla genérica con búsqueda, filtros, paginación
// ============================================================

import { UI, escapeHtml } from '../core/ui.js';

/**
 * config = {
 *   titulo, subtitulo, icono,
 *   columnas: [{ key, label, sortable, render?, align? }],
 *   servicio: { listar, eliminar },
 *   filtros: [{ id, label, opciones: [{value,label}] , onChange?}],
 *   puedeCrear, puedeEditar, puedeEliminar,
 *   onCrear, onEditar, onVer, onEliminar,
 *   estadoKey: 'filtrosState' // guarda filtros
 * }
 */
export async function renderDataTable(container, config) {
  const state = {
    search: '', page: 1, perPage: 10,
    sort: config.columnas.find((c) => c.sortable)?.key || null,
    dir: 'asc',
    filtros: {},
    total: 0, totalPages: 1
  };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas ${config.icono}"></i> ${escapeHtml(config.titulo)}</h1>
        <p class="page-sub">${escapeHtml(config.subtitulo || '')}</p>
      </div>
      ${config.puedeCrear ? `
        <button class="btn btn-primary" id="btnNuevo">
          <i class="fas fa-plus"></i> ${escapeHtml(config.crearLabel || 'Nuevo registro')}
        </button>` : ''}
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="input-icon" style="flex:1;min-width:220px">
          <i class="fas fa-search"></i>
          <input type="search" class="input" id="searchInput"
                 placeholder="${escapeHtml(config.searchPlaceholder || 'Buscar…')}">
        </div>
        ${(config.filtros || []).map((f) => `
          <select class="select" id="${f.id}" style="width:auto;min-width:130px">
            <option value="">${escapeHtml(f.label)}</option>
            ${f.opciones.map((o) =>
              `<option value="${escapeHtml(String(o.value))}">${escapeHtml(o.label)}</option>`
            ).join('')}
          </select>
        `).join('')}
      </div>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              ${config.columnas.map((c) => `
                <th class="${c.sortable ? 'sortable' : ''}" ${c.sortable ? `data-sort="${c.key}"` : ''}
                    style="${c.align === 'right' ? 'text-align:right' : ''}">
                  ${escapeHtml(c.label)}
                  ${c.sortable ? '<i class="fas fa-sort sort-icon"></i>' : ''}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
      <div class="pagination" id="pagination"></div>
    </div>
  `;

  // Enganches
  let timer;
  container.querySelector('#searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.search = e.target.value; state.page = 1; cargar(); }, 280);
  });

  (config.filtros || []).forEach((f) => {
    const el = container.querySelector('#' + f.id);
    if (el) el.addEventListener('change', () => {
      state.filtros[f.id] = el.value;
      state.page = 1;
      cargar();
    });
  });

  container.querySelectorAll('th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (state.sort === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
      else { state.sort = k; state.dir = 'asc'; }
      cargar();
    });
  });

  const btnNuevo = container.querySelector('#btnNuevo');
  if (btnNuevo && config.onCrear) btnNuevo.addEventListener('click', config.onCrear);

  // ---- CARGA ----
  async function cargar() {
    const tbody = container.querySelector('#tbody');
    const pag = container.querySelector('#pagination');
    const cols = config.columnas.length;

    tbody.innerHTML = UI.skeletonRows(cols, state.perPage);
    pag.innerHTML = '';

    try {
      const res = await config.servicio.listar({
        search: state.search,
        page: state.page,
        perPage: state.perPage,
        sort: state.sort,
        dir: state.dir,
        ...state.filtros
      });

      state.total = res.total;
      state.totalPages = res.totalPages;

      if (!res.items.length) {
        tbody.innerHTML = `
          <tr><td colspan="${cols}">
            <div class="empty">
              <i class="fas ${config.icono}"></i>
              <h4>No hay registros</h4>
              <p>${escapeHtml(config.emptyMsg || 'Prueba con otros filtros o crea uno nuevo.')}</p>
              ${config.puedeCrear && config.onCrear ? `
                <button class="btn btn-primary" id="emptyNuevo">
                  <i class="fas fa-plus"></i> Crear nuevo
                </button>` : ''}
            </div>
          </td></tr>`;
        const en = container.querySelector('#emptyNuevo');
        if (en) en.addEventListener('click', config.onCrear);
        return;
      }

      tbody.innerHTML = res.items.map((item) => fila(item)).join('');

      // Marcar orden
      container.querySelectorAll('th.sortable').forEach((th) => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.sort === state.sort) {
          th.classList.add(state.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
          const ico = th.querySelector('.sort-icon');
          if (ico) ico.className = `fas fa-sort-${state.dir === 'asc' ? 'up' : 'down'} sort-icon`;
        }
      });

      // Enganches de acciones
      tbody.querySelectorAll('[data-act]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = Number(btn.dataset.id);
          const act = btn.dataset.act;
          if (act === 'ver' && config.onVer) config.onVer(id, cargar);
          if (act === 'editar' && config.onEditar) config.onEditar(id, cargar);
          if (act === 'eliminar' && config.onEliminar) config.onEliminar(id, cargar, config);
          if (act === 'custom' && config.onCustom) config.onCustom(btn.dataset.action, id, cargar);
        });
      });

      renderPagination();

    } catch (err) {
      tbody.innerHTML = `
        <tr><td colspan="${cols}">
          <div class="empty">
            <i class="fas fa-triangle-exclamation" style="color:var(--c-danger)"></i>
            <h4>Error al cargar</h4>
            <p>${escapeHtml(err.message)}</p>
          </div>
        </td></tr>`;
    }
  }

  function fila(item) {
    const celdas = config.columnas.map((c) => {
      const val = c.render ? c.render(item) : escapeHtml(item[c.key] ?? '—');
      return `<td style="${c.align === 'right' ? 'text-align:right' : ''}">${val}</td>`;
    }).join('');

    // Columna de acciones solo si hay callbacks
    const tieneAcciones = config.onVer || config.onEditar || config.onEliminar || config.accionesCustom;
    if (!tieneAcciones) return `<tr>${celdas}</tr>`;

    const customBtns = (config.accionesCustom || []).map((a) => `
      <button class="btn-icon" data-act="custom" data-action="${a.action}" data-id="${item.id}"
              title="${escapeHtml(a.title)}" style="color:${a.color || 'var(--c-brand-500)'}">
        <i class="fas ${a.icon}"></i>
      </button>
    `).join('');

    return `
      <tr>
        ${celdas}
        <td>
          <div class="table-actions">
            ${customBtns}
            ${config.onVer ? `<button class="btn-icon" data-act="ver" data-id="${item.id}" title="Ver"><i class="fas fa-eye"></i></button>` : ''}
            ${config.onEditar ? `<button class="btn-icon" data-act="editar" data-id="${item.id}" title="Editar"><i class="fas fa-pen"></i></button>` : ''}
            ${config.onEliminar ? `<button class="btn-icon danger" data-act="eliminar" data-id="${item.id}" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
  }

  function renderPagination() {
    const pag = container.querySelector('#pagination');
    const { page, perPage, total, totalPages } = state;
    if (total === 0) { pag.innerHTML = ''; return; }
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    const pages = [];
    const maxBtns = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxBtns - 1);
    if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    pag.innerHTML = `
      <div class="pagination-info">
        Mostrando <strong>${from}–${to}</strong> de <strong>${total}</strong>
      </div>
      <div class="pager">
        <button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>
        ${pages.map((p) => `<button class="${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`).join('')}
        <button ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>
      </div>
      <select class="select" id="perPage" style="width:auto">
        ${[10, 20, 50].map((n) => `<option value="${n}" ${n === perPage ? 'selected' : ''}>${n} por página</option>`).join('')}
      </select>
    `;

    pag.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = Number(btn.dataset.page);
        if (p < 1 || p > totalPages || p === page) return;
        state.page = p;
        cargar();
        container.querySelector('.table-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    pag.querySelector('#perPage').addEventListener('change', (e) => {
      state.perPage = Number(e.target.value);
      state.page = 1;
      cargar();
    });
  }

  // Exponer recarga
  return { reload: cargar };
}