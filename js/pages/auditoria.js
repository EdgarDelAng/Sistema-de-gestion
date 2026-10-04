import { AuditService } from '../services/audit.service.js';
import { escapeHtml } from '../core/ui.js';

export async function renderAuditoria(container){
  const all=AuditService.list(300);
  const entities=[...new Set(all.map(x=>x.entity))].sort((a,b)=>a.localeCompare(b,'es'));
  container.innerHTML=`
    <div class="page-head"><div><h1 class="page-title"><i class="fas fa-clock-rotate-left"></i> Auditoría</h1><p class="page-sub">Trazabilidad de movimientos administrativos y académicos del sistema.</p></div></div>
    <div class="stats-grid" style="margin-bottom:var(--sp-4)">
      <div class="stat-card"><div class="stat-icon"><i class="fas fa-list-check"></i></div><div><div class="stat-value">${all.length}</div><div class="stat-label">Movimientos registrados</div></div></div>
      <div class="stat-card success"><div class="stat-icon"><i class="fas fa-user-shield"></i></div><div><div class="stat-value">${new Set(all.map(x=>x.usuario)).size}</div><div class="stat-label">Usuarios con actividad</div></div></div>
      <div class="stat-card warning"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><div><div class="stat-value">${entities.length}</div><div class="stat-label">Tipos de entidad</div></div></div>
      <div class="stat-card"><div class="stat-icon"><i class="fas fa-calendar-day"></i></div><div><div class="stat-value">${all.filter(x=>isToday(x.fecha)).length}</div><div class="stat-label">Movimientos de hoy</div></div></div>
    </div>
    <div class="table-wrap"><div class="table-toolbar">
      <div class="input-icon" style="flex:1;min-width:240px"><i class="fas fa-search"></i><input class="input" id="auditSearch" type="search" placeholder="Buscar usuario, acción o detalle..."></div>
      <select class="select" id="auditEntity" style="width:auto;min-width:170px"><option value="">Todas las entidades</option>${entities.map(e=>`<option>${escapeHtml(e)}</option>`).join('')}</select>
      <select class="select" id="auditRange" style="width:auto;min-width:160px"><option value="all">Todo el historial</option><option value="today">Hoy</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option></select>
      <span class="badge badge-neutral" id="auditCount"></span>
    </div><div class="table-scroll"><table class="table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead><tbody id="auditBody"></tbody></table></div></div>`;
  const body=container.querySelector('#auditBody'), search=container.querySelector('#auditSearch'), entity=container.querySelector('#auditEntity'), range=container.querySelector('#auditRange'), count=container.querySelector('#auditCount');
  const draw=()=>{const q=search.value.trim().toLowerCase(), now=Date.now();const items=AuditService.list(300).filter(x=>{if(entity.value&&x.entity!==entity.value)return false;if(q&&!`${x.usuario} ${x.rol} ${x.action} ${x.entity} ${x.detail}`.toLowerCase().includes(q))return false;if(range.value==='today'&&!isToday(x.fecha))return false;if(['7','30'].includes(range.value)&&now-new Date(x.fecha).getTime()>Number(range.value)*86400000)return false;return true});count.textContent=`${items.length} resultados`;body.innerHTML=items.length?items.map(row).join(''):`<tr><td colspan="5"><div class="empty"><i class="fas fa-filter-circle-xmark"></i><h4>Sin coincidencias</h4><p>Cambia los filtros para consultar otros movimientos.</p></div></td></tr>`};
  [search,entity,range].forEach(el=>el.addEventListener(el===search?'input':'change',draw));draw();
}
function row(x){return `<tr><td><strong>${new Date(x.fecha).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})}</strong><br><small>${new Date(x.fecha).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</small></td><td><strong>${escapeHtml(x.usuario)}</strong><br><small>${escapeHtml(x.rol)}</small></td><td><span class="badge badge-info">${escapeHtml(x.action)}</span></td><td>${escapeHtml(x.entity)}</td><td>${escapeHtml(x.detail||'—')}</td></tr>`}
function isToday(value){const d=new Date(value),n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
