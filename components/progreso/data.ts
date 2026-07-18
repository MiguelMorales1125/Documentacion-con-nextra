export type DocStatus = "documentado" | "parcial" | "pendiente" | "sin-modulo";

export type ModuleRow = {
  id: string;
  name: string;
  qaMenuItems: number;
  qaAccessible: number;
  nextraPages: number;
  coveredScreens: number;
  notionDocs: number;
  status: DocStatus;
  notes: string;
};

export type ScreenRow = {
  module: string;
  screen: string;
  qaPath: string;
  nextra: string;
  status: DocStatus;
};

export const AS_OF = "16 jul 2026";
export const QA_URL = "https://dev-cms.solvatico.com/";
export const NEXTRA_PAGES = 37;
export const QA_MODULES = 9;
export const QA_ACCESSIBLE = 97;

export const MODULES: ModuleRow[] = [
  {
    id: "intro",
    name: "Introducción / setup",
    qaMenuItems: 0,
    qaAccessible: 0,
    nextraPages: 6,
    coveredScreens: 6,
    notionDocs: 2,
    status: "documentado",
    notes: "Paso 1 y Paso 2 en Nextra (6 páginas).",
  },
  {
    id: "admin",
    name: "Administrador",
    qaMenuItems: 12,
    qaAccessible: 8,
    nextraPages: 8,
    coveredScreens: 8,
    notionDocs: 8,
    status: "documentado",
    notes: "Incluye Mi Empresa y API tokens. Permisos CRUD viven en Superadmin.",
  },
  {
    id: "citas",
    name: "Gestión de Citas",
    qaMenuItems: 21,
    qaAccessible: 17,
    nextraPages: 12,
    coveredScreens: 12,
    notionDocs: 12,
    status: "parcial",
    notes:
      "Faltan: Principal, autorizaciones, cursos de vida, reportes notificaciones/oportunidad.",
  },
  {
    id: "digiturno",
    name: "Digiturno",
    qaMenuItems: 15,
    qaAccessible: 12,
    nextraPages: 8,
    coveredScreens: 8,
    notionDocs: 10,
    status: "parcial",
    notes:
      "Faltan: Novedades y config compartida (Pacientes/Aseguradoras/Sedes).",
  },
  {
    id: "hc",
    name: "Historias clínicas",
    qaMenuItems: 26,
    qaAccessible: 16,
    nextraPages: 3,
    coveredScreens: 2,
    notionDocs: 9,
    status: "parcial",
    notes: "Solo CIE + Pacientes (+ placeholder). Notion tiene 8+ docs sin migrar.",
  },
  {
    id: "superadmin",
    name: "Superadmin",
    qaMenuItems: 16,
    qaAccessible: 7,
    nextraPages: 0,
    coveredScreens: 0,
    notionDocs: 0,
    status: "pendiente",
    notes: "Sin sección Nextra. Parcial en Paso 1 / Empresas.",
  },
  {
    id: "inventarios",
    name: "Inventarios",
    qaMenuItems: 21,
    qaAccessible: 13,
    nextraPages: 0,
    coveredScreens: 0,
    notionDocs: 0,
    status: "sin-modulo",
    notes: "Módulo completo en QA sin Notion ni Nextra.",
  },
  {
    id: "facturacion",
    name: "Facturación",
    qaMenuItems: 33,
    qaAccessible: 16,
    nextraPages: 0,
    coveredScreens: 0,
    notionDocs: 0,
    status: "sin-modulo",
    notes: "Módulo completo en QA sin Notion ni Nextra.",
  },
  {
    id: "ordenamiento",
    name: "Ordenamiento",
    qaMenuItems: 8,
    qaAccessible: 4,
    nextraPages: 0,
    coveredScreens: 0,
    notionDocs: 0,
    status: "sin-modulo",
    notes: "4 pantallas accesibles; sin documentación.",
  },
  {
    id: "suscripciones",
    name: "Suscripciones",
    qaMenuItems: 7,
    qaAccessible: 4,
    nextraPages: 0,
    coveredScreens: 0,
    notionDocs: 0,
    status: "sin-modulo",
    notes: "4 pantallas accesibles; sin documentación.",
  },
];

export const QA_MODULES_DATA = MODULES.filter((m) => m.id !== "intro");

export const COVERED = QA_MODULES_DATA.reduce(
  (s, m) => s + m.coveredScreens,
  0,
);

export const COVERAGE_PCT = Math.round((COVERED / QA_ACCESSIBLE) * 100);

export const GAP_TOUCHED = QA_MODULES_DATA.filter(
  (m) => m.status === "parcial" || m.status === "documentado",
).reduce((s, m) => s + Math.max(0, m.qaAccessible - m.coveredScreens), 0);

export const GAP_ZERO = QA_MODULES_DATA.filter((m) => m.nextraPages === 0).reduce(
  (s, m) => s + m.qaAccessible,
  0,
);

export const DOCUMENTED_NEXTRA: Array<{
  section: string;
  content: string;
  pages: number;
}> = [
  {
    section: "Introducción",
    content: "Intro + Paso 1 (3) + Paso 2 (2)",
    pages: 6,
  },
  {
    section: "Administrador",
    content:
      "Mi Empresa, Operadores, Sedes, Grupos, API tokens, Webhooks, Logs, Procesos",
    pages: 8,
  },
  {
    section: "Gestión de Citas",
    content: "8 config + Agenda / Agendar / Gestionar + Reporte",
    pages: 12,
  },
  {
    section: "Digiturno",
    content:
      "Inicio, Módulos, Solicitar, Vista, Gestionar, Tipos, Categorías, Reporte",
    pages: 8,
  },
  {
    section: "Historias clínicas",
    content: "CIE, Pacientes (+ placeholder módulo)",
    pages: 3,
  },
];

export const PENDING_SCREENS: ScreenRow[] = [
  {
    module: "Citas",
    screen: "Principal",
    qaPath: "/citas",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "Citas",
    screen: "Gestionar autorizaciones",
    qaPath: "/citas/gestionar-autorizaciones",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "Citas",
    screen: "Cursos de vida",
    qaPath: "/citas/configuracion/cursos-vida",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "Citas",
    screen: "Reporte notificaciones",
    qaPath: "/citas/reportes/notificaciones",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "Citas",
    screen: "Reporte oportunidad",
    qaPath: "/citas/reportes/oportunidad",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "Digiturno",
    screen: "Novedades",
    qaPath: "/digiturno/configuracion/novedades",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "Digiturno",
    screen: "Pacientes (config)",
    qaPath: "/digiturno/configuracion/pacientes",
    nextra: "— (existe en Citas)",
    status: "parcial",
  },
  {
    module: "Digiturno",
    screen: "Aseguradoras (config)",
    qaPath: "/digiturno/configuracion/aseguradoras",
    nextra: "— (existe en Citas)",
    status: "parcial",
  },
  {
    module: "Digiturno",
    screen: "Sedes (config)",
    qaPath: "/digiturno/configuracion/sedes",
    nextra: "— (existe en Admin/Citas)",
    status: "parcial",
  },
  {
    module: "HC",
    screen: "Medicamentos",
    qaPath: "/hc/configuracion/medicamentos",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "Plantillas (config)",
    qaPath: "/hc/configuracion/plantillas",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "Grupos de plantillas",
    qaPath: "/hc/configuracion/grupos-plantillas",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "Etiquetas de plantilla",
    qaPath: "/hc/configuracion/etiquetas-plantillas",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "Listas personalizadas",
    qaPath: "/hc/configuracion/listas-personalizadas",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "Formatos provisionales",
    qaPath: "/hc/configuracion/formatos",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "Motivos de incapacidad",
    qaPath: "/hc/configuracion/motivos-incapacidad",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "HC › Plantillas (operativo)",
    qaPath: "/hc/historia-clinica/plantillas",
    nextra: "— (sí en Notion)",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "HC › Provisional",
    qaPath: "/hc/historia-clinica/provisional",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "HC",
    screen: "Reportes preventivas / personalizados",
    qaPath: "/hc/reportes/…",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "Superadmin",
    screen: "Empresas / Roles / Permisos / IUM…",
    qaPath: "/superadmin/…",
    nextra: "—",
    status: "pendiente",
  },
  {
    module: "Inventarios",
    screen: "13 pantallas accesibles",
    qaPath: "/inventarios/…",
    nextra: "—",
    status: "sin-modulo",
  },
  {
    module: "Facturación",
    screen: "16 pantallas accesibles",
    qaPath: "/facturacion/…",
    nextra: "—",
    status: "sin-modulo",
  },
  {
    module: "Ordenamiento",
    screen: "4 pantallas accesibles",
    qaPath: "/ordenamiento/…",
    nextra: "—",
    status: "sin-modulo",
  },
  {
    module: "Suscripciones",
    screen: "4 pantallas accesibles",
    qaPath: "/suscripciones/…",
    nextra: "—",
    status: "sin-modulo",
  },
];

export const FILTERS = [
  "Todos",
  "Citas",
  "Digiturno",
  "HC",
  "Superadmin",
  "Inventarios",
  "Facturación",
  "Ordenamiento",
  "Suscripciones",
] as const;

export const PRIORITIES = [
  {
    level: "Alta",
    title: "Historias clínicas",
    body: "Migrar 7+ docs Notion restantes (Medicamentos, Plantillas, Grupos, Etiquetas, Listas, Formatos, HC operativo) y alinear menú QA.",
  },
  {
    level: "Alta",
    title: "Cerrar Digiturno / Citas",
    body: "Novedades; decidir páginas vs enlaces cruzados para config compartida; 5 pantallas nuevas de Citas.",
  },
  {
    level: "Media",
    title: "Módulos sin Notion",
    body: "Inventarios, Facturación, Ordenamiento, Suscripciones y Superadmin: documentar desde cero contra QA.",
  },
] as const;

export function pct(covered: number, total: number): number {
  if (total <= 0) return covered > 0 ? 100 : 0;
  return Math.round((covered / total) * 100);
}

export function statusLabel(s: DocStatus): string {
  switch (s) {
    case "documentado":
      return "Documentado";
    case "parcial":
      return "Parcial";
    case "pendiente":
      return "Pendiente";
    case "sin-modulo":
      return "Sin doc";
  }
}
