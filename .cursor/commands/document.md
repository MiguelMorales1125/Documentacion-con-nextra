# Documentar opción (usuario final)

Documenta o actualiza una pantalla del CMS para el **usuario final** en Nextra. No escribas docs técnicas para desarrolladores.

## Entrada y alcance

El usuario puede pasar:
- ruta QA (ej. `/hc/configuracion/cie`)
- nombre de menú (ej. `CIE`, `API tokens`, `Pacientes`)
- “lo que cambió” (ej. “nuevo filtro Sede”, “documentar solo el histórico”)
- o nada: entonces infiere del diff / archivos abiertos / mensaje reciente

### Cómo interpretar el alcance

| Pedido | Qué documentar |
|--------|----------------|
| Una **opción/pantalla completa** (ej. `/document Pacientes`, `/document CIE`) | **Toda** la UI de esa pantalla: header, menús, formularios, filtros, columnas, **cada** acción de fila, pestañas, modales. Sin omitir botones “secundarios”. |
| Un **módulo completo** (ej. `/document Historias clínicas`) | Cada hoja del sidebar del módulo, una a una, con la misma exhaustividad. |
| **Una sola funcionalidad** (ej. “solo el histórico”, “nuevo filtro Sede”) | Solo esa pieza, pero **a la perfección**: inventario de esa UI, capturas correctas, texto alineado, revisión imagen↔texto. |

Si falta la ruta o el alcance, pregunta **una sola pregunta** corta y continúa.

## Criterio de verdad

1. **La app QA manda** sobre Notion y sobre el `.mdx` viejo.
2. Notion (`docu-notion/`) solo sirve de **estructura de secciones** (Ingreso, Crear, Buscar…), no de contenido literal ni de lista cerrada de funciones: si QA tiene algo que Notion no, **también se documenta**.
3. Tono: “haga clic…”, campos, pasos; sin APIs, permisos internos, seeds ni detalles de código.
4. **Para qué sirve (obligatorio):** en la intro de la pantalla y al inicio de cada `##` de funcionalidad, 1–2 frases orientadas al **usuario final** (qué logra / cuándo usarlo). No bastan solo los pasos.
   - Fuentes en este orden: UI/QA → front (`multi-front`) / back (`multi-back`) si el propósito no es obvio → Notion solo como pista.
   - Repos locales habituales: `../multi-front`, `../multi-back` (o las rutas que indique el usuario).
   - Prohibido pegar nombres técnicos de endpoints, permisos o tablas.

---

## Paso 0 — Descubrir jerarquía (antes de crear cualquier archivo)

**No inventes la ruta de carpetas.** Dedúcela de dónde está el ítem en el menú lateral de QA.

1. Abrir el módulo en QA y expandir el submenú que contiene la opción.
2. Tomar la captura de **ingreso** así (obligatorio):
   - Sidebar **completo** (logo + todos los ítems de primer nivel + grupo expandido). No un recorte mínimo del subítem.
   - Preferible: se vea también el inicio del área principal (título de la pantalla).
   - Recuadro rojo en la **hoja** a documentar; marcar también el **grupo padre** (o números rojos `(1)` padre / `(2)` hoja).
   - Verificar con `Read` que la ruta de menú se entiende sin leer el texto del MDX.
3. Anotar la cadena exacta del menú, por ejemplo:

| Módulo (home) | Grupo (padre con flecha) | Opción (hoja) |
|---------------|--------------------------|---------------|
| Historias clínicas | Configuración | CIE |
| Historias clínicas | Historia clinica | Provisional |
| Historias clínicas | Reportes | Personalizados |
| Administrador | Seguridad | API tokens |
| Citas | Configuración | Pacientes |

4. Traducir esa cadena a carpetas Nextra **antes** de escribir el `.mdx`:

```
app/modulo[Nombre]/
  _meta.js                         ← grupos del sidebar (Configuración, Reportes, …)
  [grupo]/                        ← carpeta = padre del menú
    _meta.js                       ← hojas de ese grupo
    [opcion]/page.mdx             ← la pantalla documentada
```

Ejemplos:

- Sidebar: `Configuración > CIE`  
  → `app/moduloHistoriasClinicas/configuracion/cie/page.mdx`
- Sidebar: `Historia clinica > Plantillas`  
  → `app/moduloHistoriasClinicas/historiaClinica/plantillas/page.mdx`
- Sidebar: `Reportes > Personalizados`  
  → `app/moduloHistoriasClinicas/reportes/personalizados/page.mdx`
- Sidebar: `Seguridad > API tokens`  
  → `app/moduloAdministrador/seguridad/apiTokens/page.mdx`

5. Si el ítem **no** tiene padre (solo “Principal” u opción suelta en raíz del sidebar), entonces sí puede ir en la raíz del módulo. Si tiene flecha/padre → **obligatorio** crear la carpeta del grupo.

6. Comprobar módulos hermanos (`moduloGestionCitas`, `moduloAdministrador`) para copiar el mismo estilo de nombres de carpeta (`configuracion`, `seguridad`, camelCase en hojas).

### Checklist antes de crear archivos

- [ ] Vi el sidebar de QA (o su captura) con el padre expandido
- [ ] Sé el nombre exacto del **grupo** y de la **opción**
- [ ] La ruta propuesta es `modulo…/[grupo]/[opcion]/page.mdx` (no `modulo…/[opcion]/` si hay grupo)
- [ ] Actualizaré `_meta.js` del módulo **y** del grupo

Si no puedes ver el menú, **no crees la página**: entra a QA o pide la ruta.

### Opciones compartidas entre módulos

Pacientes, Médicos, Aseguradoras, Sedes, etc. aparecen en varios módulos:

1. **Duplicar** bajo el módulo actual en la jerarquía correcta (`…/configuracion/pacientes`), no dejar una sola copia “global”.
2. Adaptar el **Ingreso** al sidebar de ese módulo.
3. Captura de ingreso = menú del módulo que documentas; el resto de UI se reutiliza solo si es idéntica.

---

## Flujo obligatorio

### 1) Localizar
- QA: `https://dev-cms.solvatico.com/`
- Entrar al módulo (`moduleMulti` / tarjeta del home).
- Expandir el grupo del menú y confirmar la hoja.
- Completar el **Paso 0** (jerarquía).

### 2) Inventariar la UI (completo — no improvisar secciones)

Antes de escribir o capturar, recorrer QA y **anotar una lista explícita** de todo lo interactivo. Notion **no** limita esta lista.

Marcar cada ítem encontrado:

**Header / página**
- [ ] Título de pantalla
- [ ] Botón principal (Nuevo / Crear / …)
- [ ] Menú de opciones (⋮ / tres puntos) y **cada** ítem del menú
- [ ] Otros botones del header (Descargar, Generar reporte, …)

**Filtros y búsqueda**
- [ ] Campo Buscar (+ placeholder)
- [ ] Cada filtro (Estado, Ordenar, Entidad, Sede, fechas, …)
- [ ] Botón Buscar si existe

**Tabla**
- [ ] Todas las columnas visibles (incl. switches en columna, no solo Acciones)
- [ ] Paginación / filas por página si aporta al usuario

**Columna Acciones / fila (obligatorio recorrer uno por uno)**
- [ ] Switch de estado
- [ ] Editar (lápiz)
- [ ] Histórico / lista / ojo / cualquier ícono adicional
- [ ] Liberar, copiar, u otras acciones
- [ ] Tooltips o `aria-label` si el ícono no tiene texto

**Overlays**
- [ ] Modal/drawer de crear y de editar (campos)
- [ ] Cada pestaña dentro de un modal (ej. Histórico → citas / sanciones / actualizaciones)
- [ ] Confirmaciones masivas, importar CSV, etc.

Si el alcance es **pantalla completa** o **módulo completo**: la lista del inventario = checklist de secciones del `.mdx`. **Prohibido** cerrar dejando un ítem del inventario sin sección (o sin justificar por escrito que es decorativo/no usable).

Si el alcance es **una sola funcionalidad**: inventariar en profundidad **solo** esa pieza (y lo que abre: modal, pestañas, filtros internos).

### 3) Alcance del `.mdx`
- Nueva opción → carpetas + `_meta.js` según Paso 0 + **todas** las secciones del inventario.
- Actualización puntual → solo secciones afectadas, pero completas y verificadas.
- Una imagen distinta por `##` / subsección. Nunca reutilizar la misma captura en dos secciones.

### 4) Capturas
1. UI en el estado que explica el párrafo (cerrar modales si no aplican).
2. Esperar loader global **y** spinners del modal (crear/editar/histórico con datos) hasta que el contenido esté listo.
3. Recuadro rojo `#e03e3e`, `3px`, `outline-offset: 4px` (ingreso: hoja + opcional padre; resto: un solo elemento). En SVG/switch: resaltar el **contenedor padre** si el outline no se ve.
4. **Ingreso:** sidebar completo + grupo expandido + hoja marcada (ver regla de capturas).
5. Resto: recorte útil (header/botón; modal; filtros; columnas Acción para editar/estado/histórico).
6. Menús con textos parecidos (Activar/Desactivar…): coincidencia **exacta** (`/^Activar…$/` o `menuitem` por nombre). No usar `/Activar/i`.
7. `public/screenshots/[modulo]/[recurso]-[NN]-[seccion].png`
8. **Leer el PNG** y verificar: elemento visible, recuadro = lo que nombra el texto, sin loader, sin opción hermana equivocada.

Si falla → recapturar.

Herramientas: `capture-doc-screenshot.mjs` → MCP browser → batch solo si documentas muchas secciones.

### 5) Escribir el `.mdx`

```mdx
---
title: "Nombre en menú QA"
description: "Una línea orientada al usuario (para qué sirve la opción)"
---

import { ImageZoom } from 'nextra/components'

# Nombre

Intro breve: para qué existe esta opción en el día a día del usuario.

## Funcionalidad X

1–2 frases de **para qué sirve**, luego los pasos e imágenes.
...
```

- Labels = QA.
- Cada `##` de acción/función empieza con propósito + luego el “cómo”.
- `_meta.js` en cada nivel de la jerarquía.
- No tocar inventarios salvo petición explícita.
- Cubrir **cada** ítem del inventario del Paso 2 (alcance completo) o la funcionalidad pedida (alcance puntual).

### 6) Cobertura + revisión final (obligatoria antes de cerrar)

**A) Cobertura (pantalla/módulo completo)**  
Comparar inventario del Paso 2 vs secciones del `.mdx`:

- [ ] Ningún botón/ícono/menú/pestaña/filtro del inventario quedó sin documentar
- [ ] Cada acción de la columna Acciones tiene su sección (estado, editar, histórico, …)
- [ ] Intro de pantalla + cada `##` relevante tienen frase de **para qué sirve**

**B) Imagen ↔ texto**  
Recorrer **cada** `##` con su PNG (`Read`):

| Comprobar | Rechazar si… |
|-----------|----------------|
| Texto ↔ imagen | El recuadro rojo no es lo que el párrafo describe |
| Menús hermanos | Está marcada Activar cuando el texto dice Desactivar (o al revés) |
| Formularios / histórico | Se ve spinner/loader encima del modal |
| Overlays | Modal abierto en una sección que no lo documenta |
| Labels | El MDX nombra un campo/botón distinto al de QA |
| Acciones de fila | Falta el histórico u otro ícono que sí está en QA |
| Propósito | Solo hay pasos (“haga clic”) sin explicar para qué sirve |

Solo tras A + B → Paso 7 (cierre).

### 7) Cierre
- Ruta completa del `.mdx` (con carpetas)
- Capturas nuevas/reemplazadas
- Cadena de menú QA usada (ej. `Historias clínicas > Configuración > CIE`)
- Resumen breve de cobertura (pantalla completa vs funcionalidad puntual)

## Anti-patrones (prohibido)

- Documentar solo “lo típico” (Nuevo / Buscar / Editar / Estado) y **omitir** histórico, auto-agendamiento, menús ⋮, pestañas de un modal, etc.
- Crear `app/moduloX/cie/page.mdx` en la **raíz del módulo** cuando el sidebar la muestra bajo Configuración / Historia clinica / Reportes / Seguridad / etc.
- Elegir la carpeta “a ojo” sin mirar el menú o la captura de ingreso.
- Pegar la misma imagen en varias secciones.
- Capturar `main` entero cuando el sujeto es lápiz/switch/histórico.
- Dejar modales abiertos en capturas de buscar/tabla/estado.
- Documentar con Notion si QA dice otra cosa o tiene **más** opciones.
- Docs para desarrolladores (APIs, permisos técnicos, Prisma…).
- Entregar sin revisión final imagen ↔ texto **y** sin checklist de cobertura.
- Resaltar con regex ambiguo que confunda opciones (Activar ⊆ Desactivar).

## Ejemplos

`/document CIE` → pantalla completa → inventario + todas las acciones  
`/document Pacientes` → incluye histórico, auto agendamiento, menú ⋮, etc.  
`/document solo el histórico de Pacientes` → una funcionalidad, a fondo (botón + modal + pestañas)  
`/document /hc/configuracion/cie`  
`/document Pacientes en Historias clínicas` → `configuracion/pacientes`  
`/document /admin/seguridad/llaves-servicios` → `seguridad/apiTokens`
