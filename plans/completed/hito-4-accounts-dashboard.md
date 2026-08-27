# Hito 4 — API de Cuentas + Balance Global + Dashboard

**Principio inamovible**: El dashboard siempre lee de SQLite (cache local). Nunca golpea Enable Banking en el path de lectura. El balance global es calculado en el backend, no en el frontend.

**Prerrequisito**: Hito 3 completado y verificado. `transactions` y `accounts` tienen datos reales.

---

## 1. Estado Final (To-Be) — Criterios de Aceptación

### 1.A Backend — Endpoints

- [x] **A1** — `GET /accounts` responde con array de cuentas: `{id, alias, bankName, iban, currency, lastBalance, syncedAt}`
- [x] **A2** — `GET /accounts/:id` responde con una cuenta o AppError(404)
- [x] **A3** — `GET /balance/total` responde con saldos agrupados por moneda: `{EUR: "1234.56", GBP: "789.10"}`
- [x] **A4** — Todos los response shapes están tipados con Zod schemas (no tipado manual)
- [x] **A5** — `GET /accounts` con DB vacía responde `[]` — no 500

### 1.B Frontend — Dashboard

- [x] **B1** — Existe `pages/Dashboard.tsx` con hook `useDashboardData` — el componente no tiene `useState`/`useEffect` propios
- [x] **B2** — `useDashboardData` usa `lib/api/accounts.ts` — nunca `fetch` directo
- [x] **B3** — El widget de balance total muestra EUR y GBP por separado (o solo EUR si no hay GBP)
- [x] **B4** — Existe una tarjeta por cuenta con: nombre del banco, alias/IBAN parcial, saldo, moneda, badge de estado (active/expired)
- [x] **B5** — Estado de carga: skeleton animado (no spinner genérico)
- [x] **B6** — Estado vacío: mensaje "No banks connected" con CTA a `/connect`

### 1.C Diseño (frontend-design skill aplicado)

- [x] **C1** — Las cantidades monetarias usan `--font-mono` (JetBrains Mono)
- [x] **C2** — Balance positivo usa `--color-accent` (#00e5a0), negativo usa `--color-negative` (#ff4d6a)
- [x] **C3** — Las tarjetas de cuenta tienen borde de acento con el color del banco (Santander rojo, Revolut azul)
- [x] **C4** — El widget de balance total es el elemento más prominente visualmente — tamaño de fuente ≥ 48px para el número
- [x] **C5** — Hover en tarjetas: `transform: translateY(-2px)` + glow sutil, transición ≤ 200ms
- [x] **C6** — Layout responsive: 1 columna mobile, 2 columnas tablet, 3 columnas desktop

### 1.D TypeScript

- [x] **D1** — `npx tsc --noEmit` en `server/` → exit code 0
- [x] **D2** — `npx tsc --noEmit` en `client/` → exit code 0

---

## 2. Artefactos Creados

### Backend

```
server/src/
├── routes/
│   ├── accounts/
│   │   └── index.ts          # GET /accounts + GET /accounts/:id
│   └── balance/
│       └── index.ts          # GET /balance/total
└── test-accounts-dashboard.ts # Test automatizado de verificación
```

### Frontend

```
client/src/
├── lib/api/
│   └── accounts.ts           # getAccounts(), getAccount(id), getTotalBalance(), triggerSync()
├── hooks/
│   └── useDashboardData.ts   # state machine del dashboard
├── components/
│   ├── accounts/
│   │   ├── AccountCard.tsx   # tarjeta individual
│   │   └── AccountGrid.tsx   # grid de tarjetas
│   └── balance/
│       └── TotalBalance.tsx  # widget de balance global
└── pages/
    └── Dashboard.tsx         # página principal
```

---

## 3. Verificación Final del Hito

```bash
# TypeScript limpio
cd server && npx tsc --noEmit  # → exit code 0
cd client && npx tsc --noEmit  # → exit code 0

# Backend endpoint test
npx tsx src/test-accounts-dashboard.ts # → exit code 0
```
