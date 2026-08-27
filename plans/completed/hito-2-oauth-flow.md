# Hito 2 — Flujo OAuth / Connect Banks

**Principio inamovible**: El frontend nunca habla directamente con Enable Banking. El callback OAuth lo recibe el backend, que intercambia el código, cifra el session_id y lo persiste. El frontend solo sabe si la conexión fue exitosa.

**Prerrequisito**: Hito 1 completado y verificado.

---

## 1. Estado Final (To-Be) — Criterios de Aceptación

### 1.A Backend — Endpoints

- [x] **A1** — `GET /aspsps?country=ES` responde con lista de ASPSPs de Enable Banking (proxy)
- [x] **A2** — `POST /auth/start` body `{aspspName, aspspCountry}` → `{url: string}` — redirige al banco
- [x] **A3** — `GET /auth/callback?code=&state=` procesa el código, guarda en DB y redirige a `http://localhost:5173/?connected=true`
- [x] **A4** — Todos los endpoints validan con Zod — ningún payload sin validar
- [x] **A5** — Los errores de Enable Banking se mapean a `AppError` y nunca exponen el raw error al frontend

### 1.B Base de Datos

- [x] **B1** — Después de un callback exitoso existe exactamente 1 fila en `bank_connections` con `session_id_enc` distinto de texto plano
- [x] **B2** — `session_id_enc` es verificablemente cifrado (no es el session_id original de Enable Banking):
  ```bash
  sqlite3 server/banky.db "SELECT session_id_enc FROM bank_connections LIMIT 1;"
  # el valor empieza con el IV en hex, no es un UUID legible
  ```
- [x] **B3** — Existe al menos 1 fila en `accounts` sincronizada desde el callback

### 1.C Seguridad

- [x] **C1** — `ENABLE_BANKING_REDIRECT_URL` en `.env` apunta a `http://localhost:3001/auth/callback`
- [x] **C2** — El `state` de OAuth se genera aleatoriamente por request y se valida al llegar el callback (anti-CSRF básico — almacenado en memoria o DB temporal)
- [x] **C3** — Cero logs que impriman `session_id` en texto plano

### 1.D Frontend

- [x] **D1** — Existe página `Connect.tsx` con hook `useConnectFlow` — el componente no tiene `useState` propio
- [x] **D2** — `useConnectFlow` usa el service module `lib/api/auth.ts` — nunca `fetch` directo
- [x] **D3** — Al volver de Enable Banking con `?connected=true`, aparece un toast "Bank connected"
- [x] **D4** — La página Connect muestra los ASPSPs disponibles como tarjetas clicables (Santander, Revolut)
- [x] **D5** — El flujo completo funciona en Restricted Production con las cuentas reales whitelisted

### 1.E TypeScript

- [x] **E1** — `npx tsc --noEmit` en `server/` → exit code 0
- [x] **E2** — `npx tsc --noEmit` en `client/` → exit code 0

---

## 2. Artefactos Creados

### Backend

```
server/src/
├── routes/
│   ├── auth/
│   │   ├── index.ts          # ensamblador — solo registra sub-routers
│   │   └── auth-flow.ts      # POST /auth/start + GET /auth/callback
│   └── aspsps/
│       └── index.ts          # GET /aspsps — proxy a Enable Banking
└── services/
    └── state-store.ts        # Map en memoria para validar state OAuth
```

#### `auth-flow.ts` — flujo OAuth

```
POST /auth/start
  body: { aspspName: string, aspspCountry: string }
  1. Genera state aleatorio → guarda en stateStore
  2. adapter.startAuth({ name, country, redirectUrl, state })
  3. Responde { url }

GET /auth/callback
  query: { code: string, state: string }
  1. Valida state contra stateStore → si inválido, AppError(400)
  2. adapter.completeAuth(code) → { sessionId, accounts, validUntil }
  3. crypto.encrypt(sessionId) → sessionIdEnc
  4. INSERT INTO bank_connections
  5. UPSERT INTO accounts (loop sobre accounts)
  6. Redirect a FRONTEND_URL + "?connected=true"
```

### Frontend

```
client/src/
├── lib/api/
│   └── auth.ts               # getAspsps(), startAuth(aspsp)
├── hooks/
│   └── useConnectFlow.ts     # state machine de conexión
└── pages/
    └── Connect.tsx           # página de conexión de bancos
```

---

## 3. Verificación Final del Hito

```bash
# TypeScript limpio
cd server && npx tsc --noEmit  # → exit code 0
cd client && npx tsc --noEmit  # → exit code 0

# Test de verificación de flujo y DB
npx tsx src/test-oauth-flow.ts # → exit code 0
```

---

## 4. Commit

```
feat(banky): hito-2 OAuth flow + Connect page + ASPSP list
```
