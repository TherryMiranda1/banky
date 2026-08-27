# Hito 3 — Sincronización y Cache

**Principio inamovible**: El dashboard nunca consulta Enable Banking en vivo. Siempre lee de SQLite. La sincronización es la única operación que toca el adaptador post-conexión.

**Prerrequisito**: Hito 2 completado y verificado. Al menos 1 banco conectado en Restricted Production.

---

## 1. Estado Final (To-Be) — Criterios de Aceptación

### 1.A SyncService

- [x] **A1** — Existe `server/src/services/sync.ts` con clase `SyncService` y método `syncAll(): Promise<SyncResult>`
- [x] **A2** — `syncAll()` procesa solo conexiones con `valid_until > now`
- [x] **A3** — Las conexiones expiradas se marcan con un campo `status = 'expired'` en `bank_connections` — no crashea
- [x] **A4** — `syncAll()` es idempotente: ejecutarlo dos veces seguidas no duplica filas en `transactions`
- [x] **A5** — El sync usa `INSERT OR IGNORE` para transacciones (deduplicación por `id`)

### 1.B Endpoint Manual

- [x] **B1** — `POST /sync` dispara `syncAll()` y responde `{synced: number, accounts: number, transactions: number}`
- [x] **B2** — `POST /sync` valida con Zod (body vacío permitido)
- [x] **B3** — En caso de error parcial (un banco falla, otro ok), responde con `{errors: [...], synced: number}` — no falla todo

### 1.C Base de Datos

- [x] **C1** — Después de `POST /sync`, `accounts.synced_at` y `accounts.last_balance` están actualizados
- [x] **C2** — Después de `POST /sync`, `transactions` tiene filas con `booked_at` válido
- [x] **C3** — Segunda ejecución de `POST /sync` → `COUNT(*)` en `transactions` es igual o mayor (nunca menor):
  ```bash
  sqlite3 server/banky.db "SELECT COUNT(*) FROM transactions;"
  # guarda este número, ejecuta /sync de nuevo
  sqlite3 server/banky.db "SELECT COUNT(*) FROM transactions;"
  # debe ser >= al número anterior
  ```

### 1.D Descifrado de Sesión

- [x] **D1** — `SyncService` descifra `session_id_enc` con `crypto.decrypt()` antes de llamar al adaptador
- [x] **D2** — El `session_id` descifrado nunca se loguea

### 1.E TypeScript

- [x] **E1** — `npx tsc --noEmit` en `server/` → exit code 0
- [x] **E2** — Cero `any` nuevo:
  ```bash
  grep -rn ": any" server/src/
  # → 0 líneas
  ```

---

## 2. Artefactos a Crear/Modificar

### [NEW] `server/src/services/sync.ts`

```
SyncService
  ├── syncAll()
  │   ├── getActiveConnections()      → lee bank_connections WHERE valid_until > now
  │   ├── per connection:
  │   │   ├── decrypt(session_id_enc)
  │   │   ├── adapter.getAccounts(sessionId)  → upsert accounts
  │   │   ├── per account:
  │   │   │   ├── adapter.getBalances()       → update last_balance
  │   │   │   └── adapter.getTransactions(from: account.synced_at)
  │   │   │       → INSERT OR IGNORE transactions
  │   │   └── UPDATE accounts SET synced_at = now
  │   └── on error: UPDATE bank_connections SET status = 'expired' si 401/403
  └── SyncResult { synced, accounts, transactions, errors }
```

### [MODIFY] `server/src/db/schema.ts`

Agregar campo `status TEXT NOT NULL DEFAULT 'active'` a `bank_connections`.

### [NEW] `server/src/routes/sync/index.ts`

```ts
POST /sync → SyncService.syncAll() → SyncResult
```

### [MODIFY] `server/src/index.ts`

Registrar `app.route("/sync", syncRouter)`.

---

## 3. Lógica de Deduplicación

Enable Banking devuelve transacciones con `transaction_id` único por ASPSP. El campo `id` en la tabla es ese ID. `INSERT OR IGNORE INTO transactions (id, ...)` garantiza idempotencia sin necesidad de leer antes.

Para balances: `UPDATE accounts SET last_balance = json(?) WHERE id = ?` — siempre sobreescribe con el valor más reciente.

---

## 4. Manejo de Sesiones Expiradas

El consentimiento PSD2 dura ~90 días. Cuando Enable Banking devuelve 401/403:

```ts
catch (e) {
  if (e instanceof AppError && (e.status === 401 || e.status === 403)) {
    db.prepare("UPDATE bank_connections SET status = 'expired' WHERE id = ?").run(connectionId)
  }
  errors.push({ connectionId, error: e.message })
}
```

El usuario deberá reconectar el banco (flujo del Hito 2 de nuevo).

---

## 5. Restricciones No Negociables

1. **SyncService no hace fetch directo** — usa exclusivamente `IBankingAdapter`.
2. **Idempotencia garantizada** — `INSERT OR IGNORE`, nunca `INSERT`.
3. **Error parcial no bloquea todo** — un banco caído no rompe la sync del otro.
4. **Descifrado solo en memoria** — nunca persiste el session_id en claro.
5. **Archivos ≤ 300 líneas** — si `sync.ts` crece, extraer `ConnectionSyncer` como clase separada.

---

## 6. Verificación Final del Hito

```bash
# TypeScript limpio
cd server && npx tsc --noEmit  # → exit code 0

# Sin any
grep -rn ": any" server/src/
# → 0 líneas

# Primera sync
curl -X POST http://localhost:3001/sync
# → {"synced":1,"accounts":N,"transactions":M,"errors":[]}

# Idempotencia
BEFORE=$(sqlite3 server/banky.db "SELECT COUNT(*) FROM transactions;")
curl -X POST http://localhost:3001/sync
AFTER=$(sqlite3 server/banky.db "SELECT COUNT(*) FROM transactions;")
echo "Before: $BEFORE, After: $AFTER"
# After >= Before (nunca duplica)

# Balances actualizados
sqlite3 server/banky.db "SELECT id, last_balance, synced_at FROM accounts;"
# → last_balance con JSON de saldo, synced_at con timestamp reciente
```

---

## 7. Commit

```
feat(banky): hito-3 SyncService + POST /sync + idempotent transaction cache
```
