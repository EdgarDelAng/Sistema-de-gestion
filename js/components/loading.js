// ============================================================
// loading.js — Skeletons, empty states, error states
// ============================================================

/**
 * Skeleton para tablas.
 */
export function tableSkeleton(cols, rows = 6) {
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
}

/**
 * Skeleton para tarjetas (grid).
 */
export function cardsSkeleton(count = 4) {
  return Array.from({ length: count }).map(() => `
    <div class="card" style="padding:var(--sp-5)">
      <div class="skeleton-block" style="height:60px;margin-bottom:12px"></div>
      <div class="skeleton-block" style="height:16px;width:70%;margin-bottom:8px"></div>
      <div class="skeleton-block" style="height:12px;width:50%"></div>
    </div>
  `).join('');
}

/**
 * Skeleton de un bloque alto (para dashboards).
 */
export function blockSkeleton(height = 300) {
  return `<div class="skeleton-block" style="height:${height}px"></div>`;
}

/**
 * Estado vacío con acción opcional.
 */
export function emptyState({ icon = 'fa-inbox', title = 'Sin datos', message = '', actionLabel = '', onAction = null, actionIcon = 'fa-plus' } = {}) {
  const html = `
    <div class="empty">
      <i class="fas ${icon}"></i>
      <h4>${title}</h4>
      ${message ? `<p>${message}</p>` : ''}
      ${actionLabel ? `<button class="btn btn-primary" id="emptyAction"><i class="fas ${actionIcon}"></i> ${actionLabel}</button>` : ''}
    </div>`;
  if (onAction) {
    setTimeout(() => {
      document.getElementById('emptyAction')?.addEventListener('click', onAction);
    }, 0);
  }
  return html;
}

/**
 * Estado de error con reintentar.
 */
export function errorState({ message = 'No se pudo cargar la información', onRetry = null, code = null } = {}) {
  const html = `
    <div class="empty">
      <i class="fas fa-triangle-exclamation" style="color:var(--c-danger)"></i>
      <h4>${code ? `Error ${code}` : 'Ocurrió un error'}</h4>
      <p>${message}</p>
      <button class="btn btn-primary" id="errRetry">
        <i class="fas fa-rotate"></i> Reintentar
      </button>
    </div>`;
  if (onRetry) {
    setTimeout(() => {
      document.getElementById('errRetry')?.addEventListener('click', onRetry);
    }, 0);
  }
  return html;
}

/**
 * Envuelve una promesa para cargar con loading + error + empty.
 * Uso:
 *   await withState({
 *     load: () => service.listar(),
 *     container: tbody,
 *     cols: 7,
 *     render: (data) => data.map(...).join(''),
 *     empty: { title: 'Sin alumnos', actionLabel: 'Nuevo', onAction: () => {} }
 *   })
 */
export async function withState({ load, container, cols = 5, render, empty, onError = null }) {
  if (!container) return null;
  const isTable = container.tagName === 'TBODY';
  const colSpan = cols;

  if (isTable) container.innerHTML = tableSkeleton(cols, 6);
  else container.innerHTML = blockSkeleton(280);

  try {
    const data = await load();
    const isEmpty = Array.isArray(data) ? data.length === 0 : !data;
    if (isEmpty && empty) {
      const html = emptyState(empty);
      container.innerHTML = isTable ? `<tr><td colspan="${colSpan}">${html}</td></tr>` : html;
      return data;
    }
    container.innerHTML = render(data);
    return data;
  } catch (err) {
    const html = errorState({ message: err.message, onRetry: () => withState({ load, container, cols, render, empty, onError }) });
    container.innerHTML = isTable ? `<tr><td colspan="${colSpan}">${html}</td></tr>` : html;
    onError?.(err);
    return null;
  }
}