# Hito 7 — Frontend Full Responsive Mobile-First

**Principio inamovible**: La base de estilos es **mobile** (360–430px). Los breakpoints (`sm`, `md`, `lg`) SOLO agrandan hacia arriba. Un layout que se vea roto en 375px es un fails del hito, no un edge case.

**Prerrequisito**: Hito 6 completado. Todos los archivos de `client/src/` analizados (Layout, 5 páginas, 6 componentes, 3 hooks).

---

## 1. Estado Final (To-Be) — Criterios de Aceptación

### 1.A Shell Responsive (Layout.tsx)

- [x] **A1** — Sidebar de 256px visible SOLO en `lg:` (`hidden lg:flex w-64`). En <1024px desaparece.
- [x] **A2** — Nueva `BottomNav` fija en móvil (`lg:hidden fixed bottom-0 inset-x-0 z-40`): 3 ítems — Dashboard, Accounts, Connect Bank. Íconos 24px, labels `text-[11px]`, altura ≥ 56px por ítem.
- [x] **A3** — La `BottomNav` respeta el notch iOS: `mobile-bottom-nav` con `padding-bottom: env(safe-area-inset-bottom)`, y el viewport meta usa `viewport-fit=cover`.
- [x] **A4** — El item activo de la `BottomNav` usa el mismo patrón visual que el sidebar (fondo `accent/10` en un contenedor pill, texto `accent`).
- [x] **A5** — El `header` es compacto en móvil (`h-14 px-4`) y muestra: brand Banky, indicador de estado (dot `accent` + "Active" oculto en <sm), avatar de usuario con inicial. El botón de logout del header se oculta en móvil (`hidden lg:flex`) porque el logout vive en el menú inferior/profile.
- [x] **A6** — El `main` usa `p-4 sm:p-6 lg:p-8` y `pb-24 lg:pb-8` en móvil para que el bottom nav NO tape contenido (ni el "Load more", ni el último card).
- [x] **A7** — Se elimina el link muerto a `/transactions` del sidebar (ruta inexistente → caía al Dashboard). El sidebar queda con Dashboard, Accounts, Connect Bank.
- [x] **A8** — En `md` (768–1023px): sin sidebar, sin bottom nav — se reutiliza `A2` (bottom nav) o un header con drawer. Se acepta bottom nav hasta `lg`.
- [x] **A9** — El toast de "Banco conectado" (App.tsx) deja de ser `bottom-6 right-6` en móvil: pasa a `bottom-20` (sobre el bottom nav) con `left-4 right-4 sm:left-auto sm:right-6` y width responsive.

### 1.B Dashboard + Balance

- [x] **B1** — `TotalBalance` usa `p-5 sm:p-8`.
- [x] **B2** — El monto principal es `text-3xl sm:text-5xl md:text-6xl` con `tracking-tight` y `whitespace-nowrap`. Un saldo de `-€1.234.567,89` cabe en 360px sin desborde ni overflow oculto.
- [x] **B3** — La fila inferior de TotalBalance es `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2` — el copy "Real-time SQLite read cache..." y el link "Connect another bank" nunca se pisan en móvil.
- [x] **B4** — Chips de monedas secundarias: `flex-wrap` (ya correcto) con `gap-2` y ancho contenido, sin `min-w` fijo que desborde.
- [x] **B5** — Header del dashboard: la cabecera "Connected Accounts" y el contador `N accounts active` se apilan en móvil (`flex flex-col sm:flex-row`), pero mantienen el layout en fila en ≥640px.
- [x] **B6** — `AccountGrid` reduce `gap-6` → `gap-4 md:gap-6` en carga y en lista.
- [x] **B7** — El empty state ("No banks connected") usa `p-6 sm:p-12` y `my-8 sm:my-12` — sin `p-12` en móvil.
- [x] **B8** — El skeleton de carga del dashboard no sobrepasa la altura del balance en móvil (revisar `h-56` → `h-44 sm:h-56`).

### 1.C Detalle de Cuenta + Transacciones

- [x] **C1** — Banner de AccountDetail: `p-5 sm:p-6`. El nombre del banco + badge + IBAN se apilan limpiamente con la columna de balance (comportamiento `flex-col` ya correcto, se ajusta padding).
- [x] **C2** — El monto del banner es `text-2xl sm:text-3xl` — no compite con la fecha del breadcrumb en móvil.
- [x] **C3** — Breadcrumb "← Dashboard / Santander": en móvil el nombre del banco truncado con `truncate` y `min-w-0` si la ruta es larga.
- [x] **C4** — `TransactionRow`: en móvil `px-3 sm:px-4`, `gap-3 sm:gap-4`. La columna de monto tiene `shrink-0` y `min-w-0` para no empujar la descripción fuera del viewport. La categoría sigue bajando a segunda línea (`flex-wrap`).
- [x] **C5** — En <480px la celda de fecha no se encoge: se mantiene `w-18 shrink-0` y se permite que la descripción haga truncate en vez de recortar la fecha.
- [x] **C6** — `TransactionFilters`: en móvil los 3 controles (From/To/Category) van en una fila scrollable horizontal (`overflow-x-auto`) con `shrink-0` por control — no envuelven en 3 filas apiladas que rompen la altura del card. En `sm:` vuelve el wrap.
- [x] **C7** — Botón "Load more" y estados vacíos/carga tienen `pb-24` heredado de `A6` — el bottom nav nunca los cubre.

### 1.D Connect

- [x] **D1** — Header de la página: `text-2xl sm:text-3xl`. El chip "OAuth 2.0..." se mantiene full-width pero respeta márgenes.
- [x] **D2** — Search input ya es full-width en móvil (`flex-col sm:flex-row`) — se verifica que `max-w-md` no limite en pantallas <640.
- [x] **D3** — Chips de país: el `overflow-x-auto` actual se mantiene; se agrega `tabular-nums` y un `no-scrollbar` utility global (ocultar scrollbar en iOS manteniendo scroll).
- [x] **D4** — `BankCard` y `SkeletonCard`: `p-4 sm:p-5`. Nada más cambia — ya es mobile-first correcto en grid 1 col.

### 1.E Auth (Login / Register)

- [x] **E1** — Se reemplaza `min-h-screen ... justify-center` por `min-h-dvh flex flex-col` + contenedor interno con `m-auto` — el formulario YA NO se recorta en pantallas bajas ni en landscape.
- [x] **E2** — El card es `px-5 sm:px-10` con `py-8 sm:py-10`. Los campos mantienen `min-h-[44px]` touch target.
- [x] **E3** — **Unificación de paleta a tokens del brand**: se quita `bg-slate-950`, `emerald-*`, `slate-*` de Login/Register/ProtectedRoute/loading y se usa `bg`/`surface`/`accent`/`text`/`muted` del `@theme`. El brand Banky pasa a primer plano (en el hito de logo se define el mark final).
- [x] **E4** — El logo de login/register reusa el componente de marca (bloque "B") en vez del `Building2` sobre gradiente verde hard-coded.

### 1.F PWA / Meta / Safe-Area / Touch (Hardening)

- [x] **F1** — `index.html`: viewport → `width=device-width, initial-scale=1.0, viewport-fit=cover` (requisito para `env()`).
- [x] **F2** — `index.html`: `<meta name="theme-color" content="#0a0a0f">` + `<meta name="apple-mobile-web-app-capable" content="yes">`.
- [x] **F3** — `public/manifest.json` (name "Banky", short_name "Banky", start_url "/", display "standalone", background_color `#0a0a0f`, theme_color `#0a0a0f`, icon SVG del mark "B") + `public/app-icon.svg`. Se linkea en `index.html`.
- [x] **F4** — Touch targets: en `Layout`, `BottomNav`, íconos y chips → mínimo 44×44px ó 44px de alto en área de impacto (`min-h-11` / padding equivalente). Íconos decorativos (dos span del estado) exentos.
- [x] **F5** — `index.css`: se agregan utilities `@layer utilities`:
  - `.no-scrollbar` (scroll sin scrollbar visible, para chips de país y filtros)
  - `.mobile-bottom-nav` (fixed + `padding-bottom: env(safe-area-inset-bottom)`)
  - Se define el token `--breakpoint-*` no hace falta (defaults Tailwind) — solo se usan los breakpoints estándar.
- [x] **F6** — Los textos de sistema `System State: Active` y `Safe Areas` se verifican en 320px (iPhone SE 1era gen): sin desborde horizontal (`overflow-x: hidden` NO se usa como parche — se corrige la causa).

### 1.G TypeScript / Build

- [x] **G1** — `cd client && npx tsc --noEmit` → exit code 0.
- [x] **G2** — `cd client && npm run build` → build de producción exitoso.
- [x] **G3** — `github actions`/lint: no se introduce ninguna librería nueva (solo Tailwind + primitivos existentes).

---

## 2. Artefactos a Crear / Modificar

### Nuevos

```
client/src/
├── components/ui/
│   └── BottomNav.tsx          # [NEW] bottom tabs mobile (lg:hidden)
└── ... (manifest/icons en public/)
public/
├── manifest.json              # [NEW] PWA manifest
```

### Modificados

```
client/index.html              # viewport-fit=cover, theme-color, manifest link, favicon
client/src/
├── index.css                  # @layer utilities: .no-scrollbar, .mobile-bottom-nav
├── App.tsx                    # toast responsive (bottom-20 + full-width mobile)
├── components/ui/Layout.tsx   # shell responsive: sidebar lg-only + MobileHeader + logo
├── components/balance/TotalBalance.tsx
├── components/accounts/AccountGrid.tsx
├── components/transactions/TransactionRow.tsx
├── components/transactions/TransactionFilters.tsx
├── components/transactions/TransactionList.tsx
├── components/ui/ProtectedRoute.tsx (paleta a tokens — ver E3)
├── pages/Dashboard.tsx
├── pages/AccountDetail.tsx
├── pages/Connect.tsx
├── pages/LoginPage.tsx        # token-based + min-h-dvh centrado seguro + logo
└── pages/RegisterPage.tsx     # idem
```

---

## 3. Restricciones No Negociables

1. **Mobile-first real**: el estilo base es siempre el móvil. Todo `sm:`/`md:`/`lg:` AÑADE, nunca parchea un layout roto a nivel base.
2. **Sin librerías nuevas**: solo Tailwind CSS v4 existente, componentes funcionales actuales, `lucide-react`. Nada de headless-ui, react-responsive, framer-motion.
3. **Token-only**: ningún color hard-coded fuera de `@theme` (se eliminan los `slate-*`/`emerald-*` que quedan en auth). Los colores por-banco (Santander/Revolut ring) ya tokenizados en índices quedan.
4. **Un Hook por Página intacto**: este hito toca SOLO clases/estructura de layout. No se mueve lógica de hooks, no se agrega `useState` a páginas. `BottomNav` puede usar `useLocation` (lectura) — no estado.
5. **50vh no aplica**: no se usan `h-screen` ni `viewport` fijo para altura (`min-h-dvh` in auth). En el shell se respeta `min-h-screen`.
6. **Sin respuestas mágicas**: `overflow-x-hidden` global queda prohibido como solución — cada overflow se corrige en su componente.
7. **Safe area solo donde toca**: `env(safe-area-inset-*)` únicamente en `BottomNav` y (si aplica) en `MobileHeader` top. No se riega por todo el CSS.
8. **Sidebar ≥1024 no cambia**: el layout desktop es el que ya existe; este hito solo lo CONGELA (`hidden lg:flex`) y le quita el link muerto.

---

## 4. Verificación Final del Hito

```bash
# TypeScript y build
cd client && npx tsc --noEmit   # → exit code 0
cd client && npm run build      # → dist/ generado
```

---

## 5. Commit

```
feat(banky): hito-7 responsive mobile-first + BottomNav + PWA meta
```
