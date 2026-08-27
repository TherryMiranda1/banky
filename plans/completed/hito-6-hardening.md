# Hito 6 — Hardening, Env Validation y Dockerfile

**Principio inamovible**: El servidor no arranca si falta cualquier variable de entorno crítica. Un token de banco en texto plano en la DB es un incident de seguridad — nunca debe ocurrir.

**Prerrequisito**: Hitos 1–5 completados y verificados. El sistema funcional de extremo a extremo.

---

## 1. Estado Final (To-Be) — Criterios de Aceptación

### 1.A Env Validation

- [x] **A1** — Existe `server/src/env.ts` con schema Zod que valida las variables requeridas al arrancar
- [x] **A2** — Si falta `PRIVATE_KEY_PEM` → el servidor imprime mensaje claro y sale con código 1 antes de registrar rutas:
  ```bash
  PRIVATE_KEY_PEM="" node dist/index.js
  # → "Missing required env: PRIVATE_KEY_PEM" + exit 1
  ```
- [x] **A3** — Lo mismo para `APP_ID`, `ENCRYPTION_KEY`, `ENABLE_BANKING_REDIRECT_URL`
- [x] **A4** — `PORT` tiene default 3001 — no falla si no está

### 1.B Archivos de Configuración

- [x] **B1** — Existe `server/.env.example` con todas las variables documentadas y sin valores reales
- [x] **B2** — `.env.example` incluye comentarios de cómo generar cada valor:
  ```
  # Generate with: openssl genrsa 4096 | base64 -w 0
  PRIVATE_KEY_PEM=
  
  # From Enable Banking Control Panel
  APP_ID=
  
  # Generate with: openssl rand -hex 32
  ENCRYPTION_KEY=
  ```
- [x] **B3** — `.gitignore` en `server/` incluye `.env` y `*.db` (la DB SQLite no va al repo)
- [x] **B4** — `.gitignore` en `client/` incluye `dist/`

### 1.C Dockerfile

- [x] **C1** — Existe `server/Dockerfile` multi-stage (build + runtime)
- [x] **C2** — Stage runtime usa `node:20-alpine`
- [x] **C3** — `docker build -t banky-server ./server` → exit code 0
- [x] **C4** — `docker run --env-file server/.env -p 3001:3001 banky-server` arranca y `GET /health` responde
- [x] **C5** — El Dockerfile no copia `.env` ni archivos `*.db` (`.dockerignore` los excluye)

### 1.D README

- [x] **D1** — Existe `out/banky/README.md` con:
  - Requisitos previos (Node 20, Enable Banking account)
  - Generar clave RSA: `openssl genrsa -out private.key 4096`
  - Registrar app en Enable Banking Control Panel
  - Setup de variables de entorno
  - Comandos para arrancar: `cd server && npm install && npm run dev`
  - Comandos para el cliente: `cd client && npm install && npm run dev`
  - Cómo hacer la primera sync: `curl -X POST http://localhost:3001/sync`
- [x] **D2** — El README menciona explícitamente el modo **Restricted Production** y el proceso de whitelisting de cuentas

### 1.E Seguridad Final

- [x] **E1** — `grep -rn "console.log.*session" server/src/` → 0 líneas (no se loguea session_id)
- [x] **E2** — `grep -rn "session_id[^_]" server/src/` aplicado a código de respuesta HTTP → 0 líneas (session_id nunca se expone en respuestas API)
- [x] **E3** — `sqlite3 server/banky.db "SELECT session_id_enc FROM bank_connections LIMIT 1;"` → valor cifrado, no UUID legible

### 1.F TypeScript Final

- [x] **F1** — `npx tsc --noEmit` en `server/` → exit code 0
- [x] **F2** — `npx tsc --noEmit` en `client/` → exit code 0
- [x] **F3** — `grep -rn ": any" server/src/ client/src/` → 0 líneas

---

## 2. Artefactos Creados/Modificados

- `server/src/env.ts`
- `server/src/index.ts`
- `server/.env.example`
- `server/.gitignore`
- `client/.gitignore`
- `.gitignore`
- `server/Dockerfile`
- `server/.dockerignore`
- `out/banky/README.md`
