# Principios de Diseño de Interfaces (GitHub Primer & Linear)

Reglas y principios de diseño para construir interfaces web profesionales, densas, minimalistas y de alta usabilidad.

---

## 1. Document Canvas & Cero "Card Inception"

- **El contenido respira en el canvas:** La página se estructura como un documento abierto. Prohibido envolver secciones dentro de múltiples tarjetas anidadas con sombras pesadas, degradados decorativos o resplandores (*glows*).
- **Resource Box Pattern:** Cada sección de datos (tablas, feeds, listas de entidades) utiliza un único contenedor estructurado con borde plano de 1px (`border-border`), superficies neutras de bajo contraste (`bg-surface`) y filas separadas por divisores limpios (`divide-y divide-border`).
- **Máxima relación señal/ruido:** Todo píxel debe aportar información o claridad estructural; eliminar cualquier adorno que no tenga una función directa.

---

## 2. Top Navigation Unificada & Scroll Nativo

- **Aprovechamiento del ancho horizontal:** La navegación principal se organiza horizontalmente en el encabezado superior con pestañas tipo *underline* (`border-b-2`) y badges numéricos de conteo (`[ Todas 12 ] [ Activas 8 ]`).
- **Sin sidebars fijas intrusivas:** Evitar barras laterales fijas de 256px que resten espacio útil a las tablas y datos.
- **Scroll siempre nativo de ventana:** Prohibido atrapar el scroll principal dentro de `div` con `overflow-y-auto`. El scroll debe pertenecer a `window` para garantizar fluidez a 60/120 FPS y compatibilidad con atajos de teclado y sticky headers.

---

## 3. Navegación Contextual con Breadcrumbs

- **Jerarquía siempre visible:** El header global debe incluir *breadcrumbs* dinámicos (`App / Sección / Recurso Activo`) para que el usuario conozca su ubicación exacta en el árbol de la aplicación sin consumir espacio vertical redundante.

---

## 4. Tipografía Dual Estricta y Escaneo Numérico

- **Texto de interfaz vs Datos numéricos:**
  - **Sans-Serif (ej. Inter):** Utilizada exclusivamente para textos de UI, navegación, etiquetas, títulos y descripciones.
  - **Monospace (ej. JetBrains Mono):** Obligatoria para toda cifra numérica, monedas, importes, identificadores (IDs, hashes, IBANs), fechas, contadores y métricas tabulares.
- **Alineación numérica a la derecha:** En listas y tablas, las cifras y métricas se alinean a la derecha con formato tabular y número fijo de decimales para facilitar la comparación vertical visual instantánea.

---

## 5. Disciplina Cromática Semántica (Bajo Ruido Visual)

- **Superficies neutras:** Uso de paletas oscuras o claras calibradas (canvas principal, superficie de caja, superficie elevada de hover) con bordes de 1px de contraste controlado.
- **Color reservado solo para significado:**
  - **Verde / Éxito:** Entradas, incrementos, estados positivos y confirmaciones.
  - **Rojo / Alerta:** Errores, salidas críticas y acciones destructivas (usado con moderación; evitar fatiga de rojo en listas densas).
  - **Azul / Neutro:** Enlaces y transferencias/movimientos informativos.
  - **Acento:** Focos interactivos, pestañas activas y selecciones principales.
- **Cero degradados decorativos:** Prohibido el uso de gradientes multicolores o saturación cromática arbitraria.

---

## 6. Cero Acciones Ocultas tras Hover (Touch-First)

- **Prohibido `group-hover:opacity-100` para controles clave:** En dispositivos móviles y pantallas táctiles el hover no existe. Ocultar botones de eliminar, reordenar, editar o configurar tras hover destruye la accesibilidad.
- **Visibilidad permanente y contraste atenuado:** Todo control interactivo debe ser visible por defecto con contraste sutil (`text-muted hover:text-text`) y un área táctil mínima de 32x32px.

---

## 7. Adaptabilidad Mobile: Bottom Sheets vs Popovers

- **Desktop (≥ sm):** Los menús de selección y filtros se abren como popovers flotantes anclados al botón disparador.
- **Mobile (< sm):** Todo selector o dropdown complejo debe transformarse automáticamente en un **Modal / Bottom Sheet** fijado al fondo de la pantalla con fondo oscurecido (`backdrop-blur`), buscador táctil y filas de altura cómoda (`40px+`).

---

## 8. Modales de Confirmación para Acciones Destructivas

- **Prohibido `window.confirm()`:** Nunca usar alertas nativas y bloqueantes del navegador.
- **ConfirmModal estandarizado:** Toda acción irreversible (eliminar registros, desvincular recursos, resetear configuraciones) debe invocar un diálogo modal con explicación explícita de las consecuencias y botón de acción de peligro (`bg-expense`).

---

## 9. Inline Metric Strips Responsivas

- **Métricas en franjas horizontales compactas:** Reemplazar widgets gigantes y cajas redundantes por tiras de texto métricas compactas (`Métrica A: 120 | Métrica B: 45 | Total: 165`).
- **Respeto del ancho en smartphones (< 400px):** Toda tira métrica debe implementar `flex-wrap`, `justify-between`, `gap-x-4 gap-y-2` y ocultar separadores verticales en móvil (`hidden sm:inline`) para prevenir desbordamientos horizontales.

---

## 10. Command Palette & Accesibilidad por Teclado

- **Navegación sin ratón:** La interfaz debe ser completamente navegable por teclado.
- **Atajos globales estándar:**
  - `/` o `Cmd+K` / `Ctrl+K`: Abre la Command Palette global para saltar a cualquier sección, entidad o acción rápida.
  - `Escape`: Cierra modales, popovers o limpia búsquedas activas.
  - `↑` / `↓` + `Enter`: Navega y selecciona elementos en listas de búsqueda y menús.

---

## 11. Sticky Context Inteligente

- **Contexto visible en scroll largo:** En vistas con feeds o tablas extensas, fijar un header compacto sutil al scroll superior que conserve el resumen principal y las acciones clave sin tapar ni sobreponerse al contenido interactivo.
