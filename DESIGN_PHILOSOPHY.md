# Filosofía de Diseño — Banky

Banky adopta una filosofía de diseño utilitaria, densa y de alta precisión inspirada en los sistemas de **GitHub Primer** y **Linear**, adaptada a la gestión financiera personal y multi-banco.

---

## 🎯 Principio Fundamental: Densidad, Legibilidad y Cero Fricción

El objetivo de una herramienta financiera no es deslumbrar con animaciones innecesarias ni tarjetas decorativas ("card inception"), sino maximizar la **relación señal/ruido**:
- **Menos chrome visual, más datos útiles.**
- **Todo elemento interactivo debe ser evidente y táctil.**
- **Cero estados ocultos exclusivos de ratón (hover).**

---

## 🏛️ 1. Arquitectura de Layout y Viewport

| Componente | Patrón Antiguo | Enfoque Banky Primer |
|---|---|---|
| **Navegación Global** | Sidebar fija de 256px (resta 20% del viewport) | **Top Navigation unificada** con pestañas underline (`max-w-7xl`). |
| **Scroll** | Contenedor `div` interno con `overflow-y-auto` | **Scroll nativo de ventana** a 60/120 FPS sin atrapar eventos. |
| **Jerarquía** | Títulos aislados sin contexto de ruta | **Breadcrumbs dinámicos** (`Banky / Cuentas / Santander`) integrados en el header. |
| **Búsqueda Global** | Inputs redundantes por página | **Command Palette** global invocable con `/` o `⌘K` / `Ctrl+K`. |

---

## 🔤 2. Tipografía y Cifras Financieras

1. **Jerarquía Dual de Fuentes:**
   - **Inter (Sans-Serif):** Textos descriptivos, navegación, títulos y etiquetas de UI.
   - **JetBrains Mono (Monospace):** Cifras monetarias, saldos, importes, IBANs, fechas y métricas.
2. **Escaneo Numérico Inmediato:**
   - Todo número monetario se alinea con precisión tabular y formato de dos decimales (`€4,875.70`).
   - El símbolo monetario precede al importe con contraste visual intencionado.

---

## 🎨 3. Disciplina Cromática y Semántica

Evitar la saturación visual reservando el color estrictamente para comunicar estado financiero:

```
Superficies:
  Canvas Principal:       #0d0d12  (bg)
  Contenedores / Cajas:   #13131a  (surface)
  Superficies Elevadas:   #1a1a24  (surface-elevated)
  Bordes Estructurales:   #242432  (border - 1px plano)

Semántica Financiera:
  Ingresos / Positivo:    #00e5a0  (income)
  Gastos / Salidas:       #ff4d6d  (expense - usado con moderación)
  Traspasos entre cuentas:#60a5fa  (transfer)
  Acentos / Selección:    #00e5a0  (accent)
```

---

## 🚫 4. Anti-Patrones Prohibidos

### ❌ 1. Card Inception (Tarjetas Anidadas con Glows)
- **Prohibido:** Envolver tarjetas dentro de tarjetas con sombras intensas y bordes brillantes.
- **Correcto:** Una única **Caja de Recursos (Resource Box)** con borde de 1px por sección y filas divididas por `divide-y`.

### ❌ 2. Acciones Ocultas tras Hover
- **Prohibido:** Botones de eliminar, reordenar o editar con `opacity-0 group-hover:opacity-100`. En móviles y pantallas táctiles el hover no existe y la funcionalidad queda inaccesible.
- **Correcto:** Botones de acción siempre visibles, compactos y con contraste atenuado (`text-muted hover:text-text`).

### ❌ 3. Diálogos Nativos (`window.confirm`)
- **Prohibido:** Interrumpir el flujo con cuadros de alerta nativos del navegador.
- **Correcto:** Modal de confirmación destructivo (`ConfirmModal`) con explicación del impacto y botón de confirmación en rojo (`bg-expense`).

### ❌ 4. Desbordamiento Horizontal en Mobile
- **Prohibido:** Franjas de métricas rígidas en una sola línea que rompen el ancho de pantalla en smartphones (< 400px).
- **Correcto:** Uso de `flex-wrap`, `justify-between`, `gap-x-4 gap-y-2` y separadores condicionales (`hidden sm:inline`).

---

## 🧩 5. Anatomía de Componentes Estándar

### A. Resource Box (Tablas / Feeds)
- Header con título de sección, contador numérico y barra de acciones secundarias.
- Filas densas con altura fija o compacta, identificador de banco/categoría a la izquierda, importe en `JetBrains Mono` a la derecha.

### B. Inline Metric Strips
- Reemplazo de los widgets gigantes de métricas por tiras de datos horizontales:
  `Ingresos: +€3,200.00 | Gastos: -€1,450.20 | Neto: +€1,749.80`

### C. Sticky Shrinking Context
- En vistas de feed extenso, un header sutil fijado en scroll superior mantiene visible el saldo y cuenta activa sin obstruir la lectura.

---

## 📱 6. Regla Mobile-First para Pantallas Táctiles

1. Todo botón interactivo debe tener un área mínima de toque accesible (mínimo `32x32px` táctil).
2. Las acciones secundarias se agrupan en toolbars compactas o popovers flotantes con soporte de clic exterior.
3. Pestañas inferiores fijadas (`BottomNav`) para cambio instantáneo de dominio en smartphones.
