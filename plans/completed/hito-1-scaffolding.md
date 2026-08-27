# Hito 1 — Scaffolding + Adaptador Core

**Principio inamovible**: El adaptador es la única pieza que habla con Enable Banking. El resto del sistema nunca importa el SDK ni hace fetch directo a `api.enablebanking.com`.

---

## 1. Estado Final (To-Be) — Criterios de Aceptación

Criterios **binarios y verificables**. El hito está completo cuando todos son `true`.

### 1.A Estructura

- [x] **A1** — Existe `server/` con `package.json`, `tsconfig.json`, `src/index.ts`
- [x] **A2** — Existe `client/` con `package.json`, `vite.config.ts`, `src/main.tsx`, `src/index.css`
- [x] **A3** — `GET http://localhost:3001/health` → `{"ok":true}` con exit code 0
- [x] **A4** — `npm run dev` en `server/` levanta sin errores TypeScript

### 1.B Ports First

- [x] **B1** — Existe `server/src/core/ports/IBankingAdapter.ts` con los 6 métodos del contrato
- [x] **B2** — `IBankingAdapter.ts` no importa nada de `core/infra/` ni de `node_modules/`
- [x] **B3** — Existe `server/src/core/infra/enable-banking/EnableBankingAdapter.ts` que implementa `IBankingAdapter`

### 1.C Seguridad

- [x] **C1** — Existe `server/src/services/jwt.ts` que genera JWT RS256 desde `process.env.PRIVATE_KEY_PEM` y `process.env.APP_ID`
- [x] **C2** — Existe `server/src/services/crypto.ts` con `encrypt(plaintext)` y `decrypt(ciphertext)` usando AES-256-GCM
- [x] **C3** — La clave de cifrado viene de `process.env.ENCRYPTION_KEY` — no hardcodeada

### 1.D Base de Datos

- [x] **D1** — Existe `server/src/db/schema.ts` con las 3 tablas: `bank_connections`, `accounts`, `transactions`
- [x] **D2** — Las migrations se ejecutan automáticamente al iniciar el servidor
- [x] **D3** — `server/src/db/index.ts` exporta una instancia única de `better-sqlite3`

### 1.E TypeScript

- [x] **E1** — `strict: true` en `tsconfig.json`
- [x] **E2** — Cero ocurrencias de `any` en código nuevo:
  ```bash
  grep -rn ": any" server/src/
  # debe producir 0 líneas
  ```
- [x] **E3** — `npx tsc --noEmit` en `server/` → exit code 0

### 1.F Frontend Base

- [x] **F1** — `npm run dev` en `client/` levanta en `:5173` sin errores
- [x] **F2** — `index.css` tiene bloque `@theme` con tokens de color y fuente (Inter + JetBrains Mono)
- [x] **F3** — Layout raíz renderiza sin errores en el navegador

---

## 2. Artefactos Creados

### Server

```
server/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts                          # Hono app + health route
    ├── core/
    │   ├── ports/
    │   │   └── IBankingAdapter.ts        # contrato del adaptador
    │   └── infra/
    │       └── enable-banking/
    │           ├── types.ts              # tipos crudos de Enable Banking
    │           └── EnableBankingAdapter.ts # implementación
    ├── db/
    │   ├── index.ts                      # singleton better-sqlite3
    │   └── schema.ts                     # CREATE TABLE + migrations
    ├── services/
    │   ├── jwt.ts                        # genera JWT RS256
    │   └── crypto.ts                     # AES-256-GCM encrypt/decrypt
    └── errors/
        └── AppError.ts                   # jerarquía de errores
```

### Client

```
client/
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx                 # React Router DOM raíz
    ├── index.css               # @theme tokens
    └── components/
        └── ui/
            └── Layout.tsx      # shell con sidebar estilizado
```

---

## 3. Commit

```
feat(banky): hito-1 scaffolding + IBankingAdapter + EnableBankingAdapter
```
