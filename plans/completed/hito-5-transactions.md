# Hito 5 — Transacciones por Cuenta

**Principio inamovible**: La paginación ocurre en el backend (SQLite), nunca en el frontend. El frontend siempre recibe una página de datos, nunca todos los registros.

**Prerrequisito**: Hito 4 completado y verificado. Dashboard funcional con tarjetas de cuentas.

---

## 1. Estado Final (To-Be) — Criterios de Aceptación

### 1.A Backend — Endpoint

- [ ] **A1** — `GET /transactions?accountId=&page=1&limit=50&from=&to=&category=` responde con:
  ```json
  {
    "data": [...],
    "total": 123,
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
  ```
- [ ] **A2** — `accountId` es requerido — si falta, AppError(400)
- [ ] **A3** — `page` y `limit` tienen defaults (page=1, limit=50) y límite máximo de limit=200
- [ ] **A4** — Filtro `from` y `to` son fechas ISO8601 — Zod valida el formato
- [ ] **A5** — Filtro `category` filtra exacto por valor en la columna `category`
- [ ] **A6** — `GET /accounts/:id/transactions` es un alias conveniente de lo anterior
- [ ] **A7** — `GET /transactions` con `accountId` inexistente → AppError(404)

### 1.B Frontend — AccountDetail

- [ ] **B1** — Existe `pages/AccountDetail.tsx` con hook `useAccountDetail(accountId)` — el componente no tiene `useState`/`useEffect` propios
- [ ] **B2** — `useAccountDetail` usa `lib/api/transactions.ts` — nunca `fetch` directo
- [ ] **B3** — Navegar desde Dashboard → tarjeta de cuenta → `AccountDetail` funciona sin reload
- [ ] **B4** — La lista de transacciones muestra: descripción, monto (coloreado), fecha, categoría badge
- [ ] **B5** — Paginación funcional: botón "Load more" o paginación numérica
- [ ] **B6** — Filtro de fechas: date range picker simple (dos inputs type=date)
- [ ] **B7** — Estado de carga: skeleton por fila de transacción (no spinner global)
- [ ] **B8** — Estado vacío: "No transactions in this period"

### 1.C Diseño (frontend-design skill aplicado)

- [ ] **C1** — Montos positivos en `--color-accent`, negativos en `--color-negative`
- [ ] **C2** — Los montos usan `--font-mono`
- [ ] **C3** — Las fechas usan formato legible: "26 Aug" o "Today", no ISO string crudo
- [ ] **C4** — Animación stagger en carga inicial: filas aparecen con delay progresivo (0ms, 30ms, 60ms...)
- [ ] **C5** — El header de la página muestra el nombre del banco + saldo actual de la cuenta
- [ ] **C6** — Categoría badge: color diferente por categoría (usar palette de `--color-accent` con opacidad variable, no colores inventados)
- [ ] **C7** — Breadcrumb: "Dashboard → [Nombre banco]" para orientación

### 1.D Routing

- [ ] **D1** — La ruta es `/accounts/:id` en React Router DOM
- [ ] **D2** — El botón "Back" del header navega a `/` sin reload completo
- [ ] **D3** — Recargar `/accounts/:id` directamente funciona (no rompe)

### 1.E TypeScript

- [ ] **E1** — `npx tsc --noEmit` en `server/` → exit code 0
- [ ] **E2** — `npx tsc --noEmit` en `client/` → exit code 0

---

## 2. Artefactos a Crear

### Backend

```
server/src/routes/
└── transactions/
    └── index.ts              # [NEW] GET /transactions
```

#### Query SQL de transacciones

```sql
SELECT id, amount, currency, description, category, booked_at
FROM transactions
WHERE account_id = :accountId
  AND (:from IS NULL OR booked_at >= :from)
  AND (:to IS NULL OR booked_at <= :to)
  AND (:category IS NULL OR category = :category)
ORDER BY booked_at DESC
LIMIT :limit OFFSET :offset
```

`total` se obtiene con un `COUNT(*)` de la misma query sin LIMIT/OFFSET.

### Frontend

```
client/src/
├── lib/api/
│   └── transactions.ts        # [NEW] getTransactions(params)
├── hooks/
│   └── useAccountDetail.ts    # [NEW] state machine de detalle
├── components/
│   └── transactions/
│       ├── TransactionList.tsx   # [NEW] lista paginada
│       ├── TransactionRow.tsx    # [NEW] fila individual
│       ├── TransactionFilters.tsx # [NEW] from, to, category
│       └── CategoryBadge.tsx     # [NEW] badge de categoría
└── pages/
    └── AccountDetail.tsx      # [NEW] página de detalle
```

#### Layout de AccountDetail

```
┌─────────────────────────────────────────────┐
│  ← Dashboard     Santander                  │ ← Breadcrumb + header
├─────────────────────────────────────────────┤
│  ES1234 5678 9012    €1,234.56  ●Active     │ ← Account summary
├─────────────────────────────────────────────┤
│  [From: ____] [To: ____] [Category: ▾]      │ ← Filtros
├─────────────────────────────────────────────┤
│  26 Aug    Mercadona           -€45.20      │
│            Groceries                         │
│  ─────────────────────────────────────────  │
│  25 Aug    Nómina              +€2,500.00   │ ← Filas con stagger
│            Income                            │
│  ─────────────────────────────────────────  │
│  ...                                         │
│  [Load more]                                │ ← Paginación
└─────────────────────────────────────────────┘
```

#### Signature visual de AccountDetail

Las filas de transacciones positivas tienen una línea izquierda de `2px solid --color-accent` con opacidad 60%. Las negativas tienen la misma línea en `--color-negative`. Es el único decorador — el resto es tipografía y spacing.

---

## 3. Restricciones No Negociables

1. **Paginación en backend** — nunca cargar todas las transacciones al frontend.
2. **Un Hook por Página** — `AccountDetail.tsx` solo renderiza, delega a `useAccountDetail`.
3. **Service Module** — `useAccountDetail` solo llama a `lib/api/transactions.ts`.
4. **React Router DOM** — navegación sin reload completo.
5. **Zod en el endpoint** — query params validados (tipos, defaults, límites).

---

## 4. Verificación Final del Hito

```bash
# TypeScript limpio
cd server && npx tsc --noEmit  # → exit code 0
cd client && npx tsc --noEmit  # → exit code 0

# Endpoint básico
ACCOUNT_ID=$(sqlite3 server/banky.db "SELECT id FROM accounts LIMIT 1;")
curl "http://localhost:3001/transactions?accountId=$ACCOUNT_ID"
# → {data:[...], total:N, page:1, limit:50, hasMore:false|true}

# Paginación
curl "http://localhost:3001/transactions?accountId=$ACCOUNT_ID&page=1&limit=5"
curl "http://localhost:3001/transactions?accountId=$ACCOUNT_ID&page=2&limit=5"
# → páginas diferentes, no duplicadas

# Filtro de fecha
curl "http://localhost:3001/transactions?accountId=$ACCOUNT_ID&from=2025-01-01&to=2025-01-31"
# → solo transacciones de enero 2025

# accountId inválido
curl "http://localhost:3001/transactions?accountId=nonexistent"
# → 404 AppError

# Sin accountId
curl "http://localhost:3001/transactions"
# → 400 AppError

# UI
# → Navegar Dashboard → tarjeta Santander → AccountDetail
# → Lista de transacciones con stagger animation
# → Filtros funcionan sin reload de página
# → "Load more" carga siguiente página
```

---

## 5. Commit

```
feat(banky): hito-5 transactions API + AccountDetail page + pagination
```
