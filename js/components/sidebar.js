import { Auth, ROLES } from '../core/auth.js';
import { Router } from '../core/router.js';
import { ModeToggle } from './mode-toggle.js';
import { ConfigService } from '../services/data.service.js';


/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const SIDEBAR_STORAGE_KEY =
    'school_sidebar_collapsed';
function escapeBrand(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}




/* ============================================================
   MENÚ
   ============================================================ */

const MENU = {

    [ROLES.ADMIN]: [

        {
            title: null,

            items: [

                {
                    section: 'inicio',
                    label: 'Inicio',
                    icon: 'fa-house'
                }

            ]
        },


        {
            title: 'Control escolar',

            items: [

                {
                    section: 'alumnos',
                    label: 'Alumnos',
                    icon: 'fa-user-graduate'
                },

                {
                    section: 'profesores',
                    label: 'Profesores',
                    icon: 'fa-chalkboard-user'
                },

                {
                    section: 'materias',
                    label: 'Materias',
                    icon: 'fa-book-open'
                },

                {
                    section: 'grupos',
                    label: 'Grupos',
                    icon: 'fa-users'
                },

                {
                    section: 'inscripciones',
                    label: 'Inscripciones',
                    icon: 'fa-clipboard-list'
                }

            ]
        },


        {
            title: 'Académico',

            items: [

                {
                    section: 'calificaciones',
                    label: 'Calificaciones',
                    icon: 'fa-chart-column'
                },

                {
                    section: 'asistencia',
                    label: 'Asistencia',
                    icon: 'fa-clipboard-check'
                },

                {
                    section: 'horarios',
                    label: 'Horarios',
                    icon: 'fa-clock'
                },

                {
                    section: 'kardex',
                    label: 'Kárdex',
                    icon: 'fa-file-lines'
                }

            ]
        },


        {
            title: 'Comunicación',

            items: [

                {
                    section: 'avisos',
                    label: 'Avisos',
                    icon: 'fa-bullhorn'
                },

                {
                    section: 'notificaciones',
                    label: 'Notificaciones',
                    icon: 'fa-bell'
                },

                {
                    section: 'calendario',
                    label: 'Calendario',
                    icon: 'fa-calendar-days'
                }

            ]
        },


        {
            title: 'Información',

            items: [

                {
                    section: 'reportes',
                    label: 'Reportes',
                    icon: 'fa-chart-pie'
                },
                {
                    section: 'auditoria',
                    label: 'Auditoría',
                    icon: 'fa-clock-rotate-left'
                }

            ]
        },


        {
            title: 'Administración',

            items: [

                {
                    section: 'usuarios',
                    label: 'Usuarios',
                    icon: 'fa-user-shield'
                },

                {
                    section: 'configuracion',
                    label: 'Configuración',
                    icon: 'fa-gear'
                }

            ]
        },


        {
            title: null,

            items: [

                {
                    section: 'ayuda',
                    label: 'Ayuda',
                    icon: 'fa-circle-question'
                }

            ]
        }

    ],



    /* ========================================================
       PROFESOR
       ======================================================== */

    [ROLES.PROFESOR]: [

        {
            title: null,

            items: [

                {
                    section: 'inicio',
                    label: 'Inicio',
                    icon: 'fa-house'
                }

            ]
        },


        {
            title: 'Mi información',

            items: [

                {
                    section: 'mi-perfil',
                    label: 'Mi perfil docente',
                    icon: 'fa-id-card'
                },

                {
                    section: 'mis-grupos',
                    label: 'Mis grupos',
                    icon: 'fa-users'
                },

                {
                    section: 'horarios',
                    label: 'Mi horario',
                    icon: 'fa-clock'
                }

            ]
        },


        {
            title: 'Docencia',

            items: [

                {
                    section: 'calificaciones',
                    label: 'Calificaciones',
                    icon: 'fa-chart-column'
                },

                {
                    section: 'asistencia',
                    label: 'Asistencia',
                    icon: 'fa-clipboard-check'
                }

            ]
        },


        {
            title: 'Comunicación',

            items: [

                {
                    section: 'avisos',
                    label: 'Avisos',
                    icon: 'fa-bullhorn'
                },

                {
                    section: 'notificaciones',
                    label: 'Notificaciones',
                    icon: 'fa-bell'
                }

            ]
        },


        {
            title: null,

            items: [

                {
                    section: 'ayuda',
                    label: 'Ayuda',
                    icon: 'fa-circle-question'
                }

            ]
        }

    ],



    /* ========================================================
       ALUMNO
       ======================================================== */

    [ROLES.ALUMNO]: [

        {
            title: null,

            items: [

                {
                    section: 'inicio',
                    label: 'Inicio',
                    icon: 'fa-house'
                }

            ]
        },


        {
            title: 'Mi información',

            items: [

                {
                    section: 'mi-kardex',
                    label: 'Kárdex',
                    icon: 'fa-file-lines'
                },

                {
                    section: 'mis-calificaciones',
                    label: 'Calificaciones',
                    icon: 'fa-chart-column'
                },

                {
                    section: 'mi-horario',
                    label: 'Mi horario',
                    icon: 'fa-clock'
                },

                {
                    section: 'mi-asistencia',
                    label: 'Mi asistencia',
                    icon: 'fa-clipboard-check'
                }

            ]
        },


        {
            title: 'Servicios escolares',

            items: [

                {
                    section: 'boleta',
                    label: 'Boleta',
                    icon: 'fa-file-invoice'
                },

                {
                    section: 'tramites',
                    label: 'Trámites',
                    icon: 'fa-file-signature'
                },

                {
                    section: 'documentos',
                    label: 'Documentos',
                    icon: 'fa-folder-open'
                }

            ]
        },


        {
            title: 'Comunicación',

            items: [

                {
                    section: 'avisos',
                    label: 'Avisos',
                    icon: 'fa-bullhorn'
                },

                {
                    section: 'notificaciones',
                    label: 'Notificaciones',
                    icon: 'fa-bell'
                }

            ]
        },


        {
            title: null,

            items: [

                {
                    section: 'mi-perfil',
                    label: 'Mi perfil',
                    icon: 'fa-user'
                },

                {
                    section: 'ayuda',
                    label: 'Ayuda',
                    icon: 'fa-circle-question'
                }

            ]
        }

    ]

};



/* ============================================================
   ICONOGRAFÍA SVG DEL SISTEMA
   ============================================================ */

const SVG_ICONS = {
    inicio: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.4 9.4V21h13.2V9.4"/><path d="M9.2 21v-6.2h5.6V21"/>',
    alumnos: '<path d="M12 3 2.8 7.5 12 12l9.2-4.5L12 3Z"/><path d="M6.2 9.2v5.1c0 1.9 2.6 3.5 5.8 3.5s5.8-1.6 5.8-3.5V9.2"/><path d="M21.2 7.5v6.2"/>',
    profesores: '<circle cx="8" cy="7" r="3.2"/><path d="M2.7 20v-2.1c0-3 2.4-5.4 5.3-5.4 1.8 0 3.4.9 4.4 2.2"/><rect x="13.5" y="5" width="7.8" height="10.5" rx="1.3"/><path d="M16 8h2.8M16 11h2.8M17.4 15.5V20"/>',
    materias: '<path d="M5 3.5h11.5A2.5 2.5 0 0 1 19 6v14.5H6.2A2.2 2.2 0 0 1 4 18.3V5.2A1.7 1.7 0 0 1 5.7 3.5"/><path d="M4 17.2c.6-.8 1.3-1.2 2.3-1.2H19M8 7h7M8 10.5h5"/>',
    grupos: '<circle cx="9" cy="8" r="3"/><circle cx="17.2" cy="9" r="2.4"/><path d="M3 20v-1.7A5.7 5.7 0 0 1 8.7 12.6h.6a5.7 5.7 0 0 1 5.7 5.7V20"/><path d="M15 13.4a4.7 4.7 0 0 1 6 4.5V20"/>',
    inscripciones: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M8.5 9h7M8.5 13h4"/><path d="M15.5 16v4M13.5 18h4"/>',
    calificaciones: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="m15.7 7.2 1.4 1.4 3-3"/>',
    asistencia: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 9h16"/><path d="m8 15 2.2 2.2 5-5"/>',
    horarios: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/>',
    kardex: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
    avisos: '<path d="M4 13V9l12-4v12L4 13Z"/><path d="M7 13l1.4 6h3.3L10 14M16 9.2c2 .3 3 1.2 3 2.8s-1 2.5-3 2.8"/>',
    notificaciones: '<path d="M6 17h12l-1.5-2.2V10a4.5 4.5 0 0 0-9 0v4.8L6 17Z"/><path d="M10 20h4"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 9h17M8 13h2M14 13h2M8 17h2"/>',
    auditoria: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l3 2"/>',
    reportes: '<path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/><path d="M19 4v5h-5M19 4l-6 6"/>',
    usuarios: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1.8A5.5 5.5 0 0 1 9 12.7c1.4 0 2.7.5 3.7 1.4"/><path d="m17 13 3 1.3v2.4c0 2-1.2 3.8-3 4.6-1.8-.8-3-2.6-3-4.6v-2.4l3-1.3Z"/><path d="m15.8 17 1 1 1.7-2"/>',
    configuracion: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.8-2.3 2.1-2.3 4M12 18h.01"/>',
    perfil: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    documentos: '<path d="M3.5 6.5h6l2-2h9v15h-17z"/><path d="M8 11h8M8 15h6"/>',
    tramites: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h4"/><path d="m14.5 18 1.3 1.3 2.7-2.7"/>',
    boleta: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/><path d="m14.5 16 1.2 1.2 2.3-2.5"/>'
};

function iconoSidebar(section) {
    const aliases = {
        'mis-grupos': 'grupos', 'mi-horario': 'horarios', 'mi-asistencia': 'asistencia',
        'mi-kardex': 'kardex', 'mis-calificaciones': 'calificaciones', 'mi-perfil': 'perfil'
    };
    const key = aliases[section] || section;
    const paths = SVG_ICONS[key] || SVG_ICONS.documentos;
    return `<svg class="sidebar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function iconoMarca() {
    return `<svg class="brand-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 2.8 27 7.2v7.9c0 6.7-4.6 11.7-11 14.1C9.6 26.8 5 21.8 5 15.1V7.2L16 2.8Z" fill="currentColor" opacity=".12"/>
        <path d="M16 4.8 25 8.4v6.7c0 5.5-3.6 9.7-9 12-5.4-2.3-9-6.5-9-12V8.4l9-3.6Z" stroke="currentColor" stroke-width="1.6"/>
        <path d="m10.2 13.2 5.8-2.8 5.8 2.8-5.8 2.9-5.8-2.9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M12.5 14.5v3c0 1.1 1.6 2 3.5 2s3.5-.9 3.5-2v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
}

/* ============================================================
   LEER ESTADO DEL SIDEBAR
   ============================================================ */

function sidebarEstaRetraido() {

    return (
        localStorage.getItem(
            SIDEBAR_STORAGE_KEY
        ) === 'true'
    );

}



/* ============================================================
   GUARDAR ESTADO
   ============================================================ */

function guardarEstadoSidebar(
    collapsed
) {

    localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        String(collapsed)
    );

}



/* ============================================================
   ACTUALIZAR BOTÓN
   ============================================================ */

function actualizarBotonSidebar(
    sidebar
) {

    const boton =
        document.getElementById(
            'sidebarCollapseBtn'
        );


    if (!boton) {
        return;
    }


    const collapsed =
        sidebar.classList.contains(
            'collapsed'
        );


    boton.setAttribute(
        'aria-label',

        collapsed
            ? 'Expandir menú lateral'
            : 'Contraer menú lateral'
    );


    boton.setAttribute('aria-expanded', String(!collapsed));

    boton.setAttribute(
        'title',

        collapsed
            ? 'Expandir menú'
            : 'Contraer menú'
    );

}



/* ============================================================
   CAMBIAR ESTADO
   ============================================================ */

function toggleSidebar(
    sidebar
) {

    const collapsed =
        sidebar.classList.toggle(
            'collapsed'
        );


    guardarEstadoSidebar(
        collapsed
    );


    actualizarBotonSidebar(
        sidebar
    );

}



/* ============================================================
   RENDER
   ============================================================ */

export function renderSidebar() {

    const sidebar =
        document.getElementById(
            'sidebar'
        );


    if (!sidebar) {
        return;
    }



    /* ========================================================
       RECUPERAR ESTADO
       ======================================================== */

    if (
        window.innerWidth > 900 &&
        sidebarEstaRetraido()
    ) {

        sidebar.classList.add(
            'collapsed'
        );

    }



    /* ========================================================
       MENÚ SEGÚN ROL
       ======================================================== */

    const estructura =
        MENU[Auth.user.rol] ||
        MENU[ROLES.ADMIN];



    /* ========================================================
       HTML
       ======================================================== */

    sidebar.innerHTML = `

        <!-- ================================================
             IDENTIDAD
             ================================================ -->

        <div class="sidebar-brand">

            <div
                class="brand-icon"
                aria-hidden="true"
            >

                ${iconoMarca()}

            </div>


            <div class="brand-text">

                <strong>
                    ${escapeBrand(ConfigService.actual().nombreColegio || 'Sistema Escolar')}
                </strong>

                <small>
                    Sistema Escolar
                </small>

            </div>


            <!-- ============================================
                 BOTÓN RETRAER
                 ============================================ -->

            <button
                type="button"
                class="sidebar-collapse-btn"
                id="sidebarCollapseBtn"
                aria-label="Contraer menú lateral"
                title="Contraer menú"
            >

                <svg class="collapse-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m14.5 6.5-5.5 5.5 5.5 5.5"/>
                </svg>

            </button>

        </div>



        <!-- ================================================
             NAVEGACIÓN
             ================================================ -->

        <nav
            class="sidebar-nav"
            aria-label="Menú principal"
        >

            ${estructura.map((grupo) => {

                const itemsPermitidos =
                    grupo.items.filter(
                        (item) =>
                            Auth.can(
                                item.section
                            )
                    );


                if (
                    itemsPermitidos.length === 0
                ) {

                    return '';

                }


                return `

                    <div class="sidebar-section">

                        ${
                            grupo.title

                                ? `
                                    <div
                                        class="sidebar-section-title"
                                    >
                                        ${grupo.title}
                                    </div>
                                `

                                : ''
                        }


                        ${itemsPermitidos.map(
                            (item) => `

                                <a
                                    class="sidebar-link"
                                    data-nav="${item.section}"
                                    data-label="${item.label}"
                                    href="#/${item.section}"
                                    title="${item.label}"
                                >

                                    ${iconoSidebar(item.section)}


                                    <span>
                                        ${item.label}
                                    </span>

                                </a>

                            `
                        ).join('')}

                    </div>

                `;

            }).join('')}

        </nav>



        <!-- ================================================
             FOOTER
             ================================================ -->

        <div class="sidebar-footer">

            <div
                id="modeToggleContainer"
            ></div>


            <div class="sidebar-version">

                Sistema Escolar · v1.0.0

            </div>

        </div>

    `;



    /* ========================================================
       BOTÓN RETRAER
       ======================================================== */

    const collapseBtn =
        document.getElementById(
            'sidebarCollapseBtn'
        );


    collapseBtn?.addEventListener(
        'click',

        () => {

            if (
                window.innerWidth <= 900
            ) {

                return;

            }


            toggleSidebar(
                sidebar
            );

        }
    );


    actualizarBotonSidebar(
        sidebar
    );



    /* ========================================================
       NAVEGACIÓN
       ======================================================== */

    sidebar
        .querySelectorAll(
            '.sidebar-link'
        )
        .forEach(
            (link) => {

                link.addEventListener(
                    'click',

                    (event) => {

                        event.preventDefault();


                        Router.navigate(
                            link.dataset.nav
                        );


                        /* ------------------------------------
                           MÓVIL
                           ------------------------------------ */

                        if (
                            window.innerWidth <= 900
                        ) {

                            sidebar.classList.remove(
                                'open'
                            );


                            document
                                .getElementById(
                                    'mobileMenuBtn'
                                )
                                ?.setAttribute(
                                    'aria-expanded',
                                    'false'
                                );

                        }

                    }
                );

            }
        );



    /* ========================================================
       MODO OSCURO
       ======================================================== */

    ModeToggle.render(
        'modeToggleContainer'
    );

}