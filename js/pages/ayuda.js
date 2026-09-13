import { UI, escapeHtml } from '../core/ui.js';
import { Auth } from '../core/auth.js';

// ============================================================
// BASE DE CONOCIMIENTO
// ============================================================
const CATEGORIAS = [
  {
    id: 'primeros-pasos',
    titulo: 'Primeros pasos',
    icono: 'fa-rocket',
    color: 'var(--c-brand-500)',
    faqs: [
      { q: '¿Cómo inicio sesión en el sistema?', a: 'En la pantalla de inicio ingresa tu usuario y contraseña institucional. Si no recuerdas tu contraseña, usa el enlace "¿Olvidaste tu contraseña?" para recuperarla por correo.' },
      { q: '¿Qué puedo hacer según mi rol?', a: 'Los administradores gestionan todo el sistema. Los profesores capturan calificaciones, pasan lista y ven sus grupos. Los alumnos consultan su kárdex, calificaciones, horario y trámites.' },
      { q: '¿Cómo cambio entre modo claro y oscuro?', a: 'Usa el toggle en la parte inferior del menú lateral, o el botón de luna/sol en la barra superior. Tu preferencia se guarda automáticamente.' },
      { q: '¿Qué atajos de teclado existen?', a: 'Ctrl+K o / para buscar. Alt+H para Inicio. Alt+P para Mi perfil. Alt+N para Notificaciones. Escape cierra modales.' }
    ]
  },
  {
    id: 'alumnos',
    titulo: 'Gestión de alumnos',
    icono: 'fa-user-graduate',
    color: 'var(--c-accent-500)',
    faqs: [
      { q: '¿Cómo registro un alumno nuevo?', a: 'Ve a Control escolar → Alumnos. Pulsa el botón "Nuevo alumno" arriba a la derecha. Completa el formulario y guarda. La matrícula se genera automáticamente.' },
      { q: '¿Cómo veo el expediente de un alumno?', a: 'En Alumnos, selecciona un grupo y haz clic sobre el alumno. Se abre un modal con 3 pestañas: Datos personales, Académico y Asistencia.' },
      { q: '¿Cómo edito la información de un alumno?', a: 'Haz clic en el ícono de lápiz (✏️) en la fila del alumno. Se abre el formulario con los datos actuales para modificarlos.' },
      { q: '¿Cómo elimino un alumno?', a: 'Haz clic en el ícono de basura (🗑️). Se pedirá confirmación. Se eliminarán también sus calificaciones, asistencias y trámites asociados. Esta acción no se puede deshacer.' }
    ]
  },
  {
    id: 'calificaciones',
    titulo: 'Calificaciones',
    icono: 'fa-chart-bar',
    color: 'var(--c-warning)',
    faqs: [
      { q: '¿Cómo capturo calificaciones?', a: 'Ve a Académico → Calificaciones. Selecciona grupo y materia, pulsa "Consultar". Luego usa el botón "Capturar notas" para editar a todos los alumnos de una vez, o el lápiz por fila para uno solo.' },
      { q: '¿Cómo se calcula el promedio?', a: 'El promedio es la media aritmética de los parciales capturados. Si un alumno tiene 8, 9 y 7, su promedio es 8.0. Solo se cuentan parciales con nota registrada.' },
      { q: '¿Puedo ver la distribución de notas del grupo?', a: 'Sí. Después de consultar, aparece un panel con cards que muestran cuántos alumnos están en Excelente (9-10), Bueno (8-9), Regular (6-8) y Bajo (<6).' },
      { q: '¿Qué pasa si un alumno no tiene notas?', a: 'Su promedio aparece como "—" y su estado como "Sin notas". Puedes capturarle notas en cualquier momento.' }
    ]
  },
  {
    id: 'asistencia',
    titulo: 'Asistencia',
    icono: 'fa-clipboard-check',
    color: 'var(--c-success)',
    faqs: [
      { q: '¿Cómo paso lista de alumnos?', a: 'Ve a Académico → Asistencia. Pestaña "Alumnos". Selecciona un grupo, luego un día. Verás la lista con botones para marcar Presente, Retardo, Justificada o Falta.' },
      { q: '¿Cómo registro la asistencia de profesores?', a: 'En Asistencia, cambia a la pestaña "Profesores". Selecciona la fecha y carga la lista. Puedes marcar el estado de cada docente igual que con los alumnos.' },
      { q: '¿Cuándo se guardan los cambios?', a: 'Al hacer clic en "Guardar asistencia". Antes de eso, puedes cambiar los estados libremente sin que se registren.' },
      { q: '¿Qué significa cada estado?', a: 'Presente = asistió. Retardo = llegó tarde. Justificada = falta con justificante. Falta = falta sin justificar. Los retardos y justificadas cuentan como media asistencia.' }
    ]
  },
  {
    id: 'horarios',
    titulo: 'Horarios',
    icono: 'fa-clock',
    color: 'var(--c-info)',
    faqs: [
      { q: '¿Cómo consulto el horario de un grupo?', a: 'Ve a Académico → Horarios. En la pestaña "Por grupo" elige el grupo. Se muestra la parrilla semanal con todas las clases.' },
      { q: '¿Puedo ver el horario de un profesor específico?', a: 'Sí. En Horarios, cambia a la pestaña "Por profesor" y elige al docente. Verás sus clases de la semana con grupo y aula.' },
      { q: '¿Cómo agrego una clase al horario?', a: 'Pulsa "Agregar clase". Selecciona día, hora de inicio y fin, materia, grupo y profesor. El sistema valida que no haya conflictos.' }
    ]
  },
  {
    id: 'tramites',
    titulo: 'Trámites y documentos',
    icono: 'fa-file-signature',
    color: '#8b5cf6',
    faqs: [
      { q: '¿Cómo solicito una constancia?', a: 'Si eres alumno, ve a Trámites en tu menú lateral. Elige el tipo de documento y pulsa "Solicitar". Recibirás una notificación cuando esté disponible.' },
      { q: '¿Dónde veo mis documentos?', a: 'En Documentos, dentro de tu menú lateral. Ahí están tus boletas, kárdex, constancias y comprobantes. Cada uno tiene botón de descarga.' },
      { q: '¿Cuánto tarda un trámite?', a: 'Los trámites pasan por: Solicitado → En revisión → Disponible. El tiempo depende del tipo. Recibirás una notificación al estar listo.' }
    ]
  },
  {
    id: 'avisos',
    titulo: 'Avisos y notificaciones',
    icono: 'fa-bullhorn',
    color: 'var(--c-danger)',
    faqs: [
      { q: '¿Cómo creo un aviso?', a: 'Como administrador, ve a Comunicación → Avisos y pulsa "Nuevo aviso". Define título, contenido, prioridad, fecha y a quién va dirigido.' },
      { q: '¿Qué significan las prioridades?', a: 'Normal = informativo. Importante = requiere atención. Urgente = requiere acción inmediata. Los urgentes aparecen primero.' },
      { q: '¿Dónde veo mis notificaciones?', a: 'En el ícono de campana 🔔 de la barra superior. Las no leídas tienen un punto azul. Puedes marcar todas como leídas.' }
    ]
  }
];

export async function renderAyuda(container) {
  const user = Auth.user;
  let busqueda = '';

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="fas fa-circle-question"></i> Centro de ayuda</h1>
        <p class="page-sub">Guías, respuestas y recursos del sistema</p>
      </div>
      <div style="display:flex;gap:var(--sp-2)">
        <button class="btn btn-secondary" id="btnGuia">
          <i class="fas fa-book-open"></i> Guía del sistema
        </button>
        <button class="btn btn-primary" id="btnSoporte">
          <i class="fas fa-headset"></i> Contactar soporte
        </button>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-5);text-align:center;padding:var(--sp-6) var(--sp-5);background:linear-gradient(135deg, rgba(37,99,235,.06), rgba(20,184,166,.06))">
      <h2 style="font-size:var(--fs-xl);font-weight:800;color:var(--c-brand-900);margin-bottom:var(--sp-2)">
        ¿En qué podemos ayudarte${user && user.nombre ? ', ' + escapeHtml(user.nombre.split(' ')[0]) : ''}?
      </h2>
      <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin-bottom:var(--sp-4)">
        Busca en las preguntas frecuentes o navega por categoría
      </p>
      <div class="input-icon" style="max-width:520px;margin:0 auto">
        <i class="fas fa-search"></i>
        <input type="search" class="input" id="buscarAyuda" placeholder="Buscar en la ayuda… (Ej: contraseña, calificaciones)"
               style="height:48px;font-size:var(--fs-base);padding-left:44px">
      </div>
    </div>

    <div class="stats-grid" id="categoriasGrid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))"></div>

    <div id="faqsWrap"></div>

    <div class="card" style="margin-top:var(--sp-5);padding:var(--sp-5);background:linear-gradient(135deg, var(--c-brand-900), var(--c-brand-700));color:#fff;border:none">
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--sp-5);align-items:center">
        <div>
          <h3 style="font-size:var(--fs-lg);font-weight:800;margin-bottom:var(--sp-2);color:#fff">
            <i class="fas fa-headset"></i> ¿No encontraste lo que buscabas?
          </h3>
          <p style="color:rgba(255,255,255,.8);font-size:var(--fs-sm);line-height:1.6">
            Nuestro equipo de soporte está disponible de lunes a viernes de 8:00 a 16:00 hrs.
            Envíanos tu consulta y te responderemos en un máximo de 24 horas hábiles.
          </p>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-3);text-align:center">
          <div style="display:flex;align-items:center;justify-content:center;gap:var(--sp-2);font-size:var(--fs-sm)">
            <i class="fas fa-envelope" style="color:var(--c-accent-300)"></i>
            <span>soporte@colegiopapu.edu</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:center;gap:var(--sp-2);font-size:var(--fs-sm)">
            <i class="fas fa-phone" style="color:var(--c-accent-300)"></i>
            <span>+52 (81) 1234-5678</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const buscarInput = container.querySelector('#buscarAyuda');
  const categoriasGrid = container.querySelector('#categoriasGrid');
  const faqsWrap = container.querySelector('#faqsWrap');

  // ============================================================
  // Render categorías
  // ============================================================
  function renderCategorias() {
    categoriasGrid.innerHTML = CATEGORIAS.map((cat) => `
      <div class="stat-card" style="cursor:pointer;padding:var(--sp-4)" data-cat="${cat.id}">
        <div class="stat-icon" style="background:${cat.color}15;color:${cat.color}">
          <i class="fas ${cat.icono}"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;color:var(--c-brand-900);font-size:var(--fs-base);line-height:1.3">
            ${escapeHtml(cat.titulo)}
          </div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px">
            ${cat.faqs.length} artículo${cat.faqs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    `).join('');

    categoriasGrid.querySelectorAll('[data-cat]').forEach((card) => {
      card.addEventListener('click', () => {
        const cat = categoriasGrid.querySelector(`[data-cat="${card.dataset.cat}"]`);
        const catId = card.dataset.cat;
        // Hacer scroll y abrir el primero
        const faqSection = faqsWrap.querySelector(`[data-cat-section="${catId}"]`);
        if (faqSection) {
          faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const firstQ = faqSection.querySelector('.faq-q');
          if (firstQ && !firstQ.classList.contains('open')) firstQ.click();
        }
      });
    });
  }

  // ============================================================
  // Render FAQs
  // ============================================================
  function renderFaqs() {
    const q = busqueda.toLowerCase().trim();
    let totalResultados = 0;

    const html = CATEGORIAS.map((cat) => {
      const faqsFiltradas = cat.faqs.filter((f) =>
        !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      );
      if (!faqsFiltradas.length) return '';
      totalResultados += faqsFiltradas.length;

      return `
        <div class="card" style="margin-bottom:var(--sp-4)" data-cat-section="${cat.id}">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas ${cat.icono}" style="color:${cat.color}"></i>
              ${escapeHtml(cat.titulo)}
            </h3>
            <span class="badge badge-neutral">${faqsFiltradas.length} artículo${faqsFiltradas.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="faq-list" style="display:flex;flex-direction:column;gap:var(--sp-2)">
            ${faqsFiltradas.map((f, i) => {
              const id = `${cat.id}-${i}`;
              const resp = q
                ? highlight(f.a, q)
                : escapeHtml(f.a);
              const preg = q
                ? highlight(f.q, q)
                : escapeHtml(f.q);
              return `
                <div class="faq-card" style="border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;background:var(--bg-surface);transition:border-color .15s">
                  <button class="faq-q" data-faq="${id}" style="width:100%;text-align:left;padding:var(--sp-3) var(--sp-4);font-weight:600;color:var(--c-brand-900);background:none;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);font-size:var(--fs-base);font-family:inherit;transition:background .15s">
                    <span style="flex:1">
                      <i class="fas fa-circle-question" style="color:${cat.color};margin-right:var(--sp-2);font-size:.9em"></i>
                      ${preg}
                    </span>
                    <i class="fas fa-chevron-down faq-icon" style="transition:transform .2s;flex-shrink:0;font-size:.8em;color:var(--text-muted)" aria-hidden="true"></i>
                  </button>
                  <div class="faq-a" data-faq-a="${id}" style="display:none;padding:0 var(--sp-4) var(--sp-4);color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.75;background:var(--bg-muted)">
                    <div style="padding-top:var(--sp-3);border-top:1px solid var(--border)">
                      ${resp}
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    if (totalResultados === 0) {
      faqsWrap.innerHTML = `
        <div class="card" style="text-align:center;padding:var(--sp-8)">
          <i class="fas fa-search" style="font-size:3rem;color:var(--text-muted);opacity:.4"></i>
          <h3 style="margin-top:var(--sp-4);color:var(--c-brand-900);font-size:var(--fs-lg)">
            Sin resultados para "${escapeHtml(busqueda)}"
          </h3>
          <p style="color:var(--text-secondary);margin:var(--sp-2) 0 var(--sp-4);font-size:var(--fs-sm)">
            Intenta con otras palabras clave o contacta a soporte.
          </p>
          <button class="btn btn-primary" onclick="document.getElementById('buscarAyuda').value='';document.getElementById('buscarAyuda').dispatchEvent(new Event('input'))">
            <i class="fas fa-times"></i> Limpiar búsqueda
          </button>
        </div>`;
      return;
    }

    faqsWrap.innerHTML = `
      ${q ? `<div style="margin-bottom:var(--sp-4);padding:var(--sp-3) var(--sp-4);background:var(--bg-muted);border-radius:var(--r-md);font-size:var(--fs-sm);color:var(--text-secondary)">
        <i class="fas fa-search" style="color:var(--c-brand-500)"></i>
        <strong>${totalResultados}</strong> resultado${totalResultados !== 1 ? 's' : ''} para "<strong>${escapeHtml(busqueda)}</strong>"
      </div>` : ''}
      ${html}
    `;

    engancharFaqs();
  }

  function highlight(text, term) {
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<mark style="background:rgba(37,99,235,.2);color:var(--c-brand-900);padding:0 2px;border-radius:3px">$1</mark>');
  }

  // ============================================================
  // Enganches FAQ
  // ============================================================
  function engancharFaqs() {
    faqsWrap.querySelectorAll('.faq-q').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.faq;
        const resp = faqsWrap.querySelector(`[data-faq-a="${id}"]`);
        const icon = btn.querySelector('.faq-icon');
        const abierto = resp.style.display === 'block';

        // Cerrar otros de la misma categoría (opcional, mejor dejar múltiples abiertos)
        resp.style.display = abierto ? 'none' : 'block';
        icon.style.transform = abierto ? 'rotate(0deg)' : 'rotate(180deg)';
        btn.style.background = abierto ? '' : 'var(--bg-muted)';
      });
      // Hover
      btn.addEventListener('mouseenter', () => {
        const isOpen = btn.style.background === 'var(--bg-muted)';
        if (!isOpen) btn.style.background = 'var(--bg-hover)';
      });
      btn.addEventListener('mouseleave', () => {
        const isOpen = btn.querySelector('.faq-icon').style.transform === 'rotate(180deg)';
        if (!isOpen) btn.style.background = '';
      });
    });
  }

  // ============================================================
  // Búsqueda con debounce
  // ============================================================
  let timer;
  buscarInput.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      busqueda = e.target.value;
      renderFaqs();
    }, 200);
  });

  // ============================================================
  // Botón "Guía del sistema"
  // ============================================================
  container.querySelector('#btnGuia').addEventListener('click', () => {
    UI.modal({
      title: 'Guía rápida del sistema',
      size: 'modal-lg',
      body: `
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);border-left:4px solid var(--c-brand-500)">
            <div style="font-weight:700;color:var(--c-brand-900);margin-bottom:4px">
              <i class="fas fa-keyboard"></i> Atajos de teclado
            </div>
            <ul style="padding-left:var(--sp-5);list-style:disc;font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.8">
              <li><kbd style="background:var(--bg-surface);padding:1px 6px;border:1px solid var(--border);border-radius:4px;font-family:monospace">Ctrl + K</kbd> o <kbd style="background:var(--bg-surface);padding:1px 6px;border:1px solid var(--border);border-radius:4px;font-family:monospace">/</kbd> — Buscar en el sistema</li>
              <li><kbd style="background:var(--bg-surface);padding:1px 6px;border:1px solid var(--border);border-radius:4px;font-family:monospace">Alt + H</kbd> — Ir al inicio</li>
              <li><kbd style="background:var(--bg-surface);padding:1px 6px;border:1px solid var(--border);border-radius:4px;font-family:monospace">Alt + P</kbd> — Mi perfil</li>
              <li><kbd style="background:var(--bg-surface);padding:1px 6px;border:1px solid var(--border);border-radius:4px;font-family:monospace">Alt + N</kbd> — Notificaciones</li>
              <li><kbd style="background:var(--bg-surface);padding:1px 6px;border:1px solid var(--border);border-radius:4px;font-family:monospace">Esc</kbd> — Cerrar modales</li>
            </ul>
          </div>

          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);border-left:4px solid var(--c-accent-500)">
            <div style="font-weight:700;color:var(--c-brand-900);margin-bottom:4px">
              <i class="fas fa-lightbulb"></i> Consejos rápidos
            </div>
            <ul style="padding-left:var(--sp-5);list-style:disc;font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.8">
              <li>Haz clic en cualquier fila de una tabla para ver su detalle</li>
              <li>Usa los filtros para encontrar registros rápido</li>
              <li>El botón "Imprimir" genera PDF con formato oficial</li>
              <li>Tu selección de ciclo/periodo se aplica a todo el sistema</li>
              <li>El modo oscuro se guarda automáticamente</li>
            </ul>
          </div>

          <div style="padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);border-left:4px solid var(--c-warning)">
            <div style="font-weight:700;color:var(--c-brand-900);margin-bottom:4px">
              <i class="fas fa-shield-halved"></i> Seguridad
            </div>
            <ul style="padding-left:var(--sp-5);list-style:disc;font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.8">
              <li>Tu sesión expira a los 30 minutos de inactividad</li>
              <li>Cambia tu contraseña desde Mi perfil → Seguridad</li>
              <li>Todas las acciones quedan registradas para auditoría</li>
              <li>Puedes cerrar sesiones activas en otros dispositivos</li>
            </ul>
          </div>
        </div>
      `
    });
  });

  // ============================================================
  // Botón "Contactar soporte"
  // ============================================================
  container.querySelector('#btnSoporte').addEventListener('click', () => {
    const { overlay, close } = UI.modal({
      title: 'Contactar a soporte técnico',
      size: 'modal-lg',
      body: `
        <div style="margin-bottom:var(--sp-4);padding:var(--sp-3);background:var(--bg-muted);border-radius:var(--r-md);font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.6">
          <i class="fas fa-info-circle" style="color:var(--c-brand-500)"></i>
          Completa el formulario y te responderemos en un máximo de 24 horas hábiles.
        </div>

        <div class="form-grid-2">
          <div class="field">
            <label>Nombre</label>
            <input class="input" id="sp_nombre" value="${escapeHtml(user?.nombre || '')}" readonly>
          </div>
          <div class="field">
            <label>Correo</label>
            <input class="input" id="sp_email" value="${escapeHtml(user?.email || '')}" readonly>
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Categoría del problema <span class="req">*</span></label>
            <select class="select" id="sp_cat">
              <option value="">Selecciona una opción…</option>
              <option>Acceso al sistema / contraseña</option>
              <option>Problema con calificaciones</option>
              <option>Problema con asistencia</option>
              <option>Error en el sistema</option>
              <option>Documento incorrecto</option>
              <option>Reporte de un bug</option>
              <option>Otro</option>
            </select>
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Asunto <span class="req">*</span></label>
            <input class="input" id="sp_asunto" placeholder="Resumen breve del problema" maxlength="100">
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Descripción detallada <span class="req">*</span></label>
            <textarea class="textarea" id="sp_msg" rows="5" placeholder="Describe qué estabas haciendo, qué esperabas que pasara y qué pasó realmente…" maxlength="1000"></textarea>
            <div class="field-hint">Máximo 1000 caracteres</div>
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Prioridad</label>
            <select class="select" id="sp_prio">
              <option>Baja</option>
              <option selected>Media</option>
              <option>Alta</option>
              <option>Crítica</option>
            </select>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" data-action="close">Cancelar</button>
        <button class="btn btn-primary" id="sendTicket">
          <i class="fas fa-paper-plane"></i> Enviar solicitud
        </button>`
    });

    overlay.querySelector('#sendTicket').addEventListener('click', async (e) => {
      const cat = overlay.querySelector('#sp_cat').value;
      const asunto = overlay.querySelector('#sp_asunto').value.trim();
      const msg = overlay.querySelector('#sp_msg').value.trim();

      if (!cat) { UI.toast('Selecciona una categoría', 'warning'); return; }
      if (!asunto) { UI.toast('Ingresa un asunto', 'warning'); return; }
      if (msg.length < 20) { UI.toast('La descripción debe tener al menos 20 caracteres', 'warning'); return; }

      const btn = e.currentTarget;
      UI.buttonLoading(btn, true);
      await new Promise((r) => setTimeout(r, 900));
      close();
      UI.toast('Solicitud enviada. Recibirás respuesta en tu correo.', 'success', 4000);
    });
  });

  // ============================================================
  // Render inicial
  // ============================================================
  renderCategorias();
  renderFaqs();
}