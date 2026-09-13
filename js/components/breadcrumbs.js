// Los breadcrumbs se actualizan desde Router.updateBreadcrumbs()
// Este módulo solo expone helpers por si se necesita usar en páginas.

export function setBreadcrumbs(items) {
  const el = document.getElementById('breadcrumbs');
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = items.map((it, i) => {
    const isLast = i === items.length - 1;
    if (isLast) return `<span class="current">${it.label}</span>`;
    return `
      <a data-crumb="${it.section || ''}">${it.label}</a>
      <i class="fas fa-chevron-right sep"></i>
    `;
  }).join('');

  el.querySelectorAll('[data-crumb]').forEach((a) => {
    const section = a.dataset.crumb;
    if (!section) return;
    a.addEventListener('click', () => {
      location.hash = `#/${section}`;
    });
  });
}