# AGENTS.md — Banky

Dashboard bancario multi-tenant y personal (Santander + Revolut) vía Open Banking (Enable Banking AISP, solo lectura), con arquitectura desacoplada, autenticación JWT/PBKDF2 y despliegue serverless en Cloudflare (Workers, D1 y Pages).

## Contexto Obligatorio

Antes de cualquier trabajo, leer:
1. `API-reference.md` — Documentación de la API de Enable Banking
2. `plans/` — Planes de trabajo e hitos completados (`plans/completed/`)
3. `.agents/rules/backend.rules.md` — Principios del servidor
4. `.agents/rules/frontend.rules.md` — Principios del cliente
5. `.agents/rules/design.rules.md` — Principios de diseño visual, UX y maquetación
6. `.agents/skills/frontend-design/SKILL.md` — Guía de diseño visual intencional y distintivo

## Stack y Despliegue

- **Backend:** Cloudflare Workers (Edge) + Node.js (desarrollo local) con Hono + Zod
- **Base de Datos:** Cloudflare D1 (producción) y SQLite `better-sqlite3` (local/tests) mediante la interfaz unificada `IDatabase`
- **Frontend:** React 19 + Vite + React Router DOM v7 + Tailwind CSS v4
- **Seguridad & Auth:** 
  - Autenticación multi-tenant con JWT HS256 (`hono/jwt`) y expiración de 7 días
  - Hashing de contraseñas con Web Crypto API PBKDF2-HMAC-SHA256 (100.000 iteraciones + salt aleatorio)
  - Firma RS256 para tokens de Enable Banking
  - Cifrado simétrico AES-256-GCM para `session_id` bancarios en base de datos
  - Tokens de estado OAuth firmados con HMAC-SHA256 (stateless anti-CSRF para Edge)
- **Infraestructura:**
  - Backend API: Cloudflare Workers
  - Frontend App: Cloudflare Pages

## Principios de Arquitectura Inamovibles

### Backend & Cloudflare Workers Runtime
1. **Ports First:** `IBankingAdapter` define el contrato antes que cualquier implementación (`EnableBankingAdapter`). Fuera de `core/infra/enable-banking/` está prohibido hacer fetch a `api.enablebanking.com`.
2. **Acceso a Entorno en Edge (`getRuntimeEnv`):** En Cloudflare Workers `process.env` está vacío. Todo acceso a configuración debe resolverse mediante `getRuntimeEnv()` poblado por el middleware inicial desde `c.env`.
3. **Variables vs Secretos en Cloudflare:**
   - Variables públicas (`APP_ID`, `ENABLE_BANKING_REDIRECT_URL`, `FRONTEND_URL`, `ENABLE_BANKING_BASE_URL`) van en la sección `[vars]` de `wrangler.toml`.
   - Secretos confidenciales (`PRIVATE_KEY_PEM`, `ENCRYPTION_KEY`, `JWT_SECRET`) se configuran vía `wrangler secret put <KEY>`.
4. **Sanitización de Criptografía y Claves:**
   - Aplicar siempre `.trim()` y normalización de saltos de línea (`.replace(/\\n/g, '\n')`) al cargar claves PEM y variables de entorno.
5. **OAuth State Stateless en Edge (`OAuthStateStore`):**
   - El parámetro `state` de OAuth se firma criptográficamente con HMAC-SHA256 y Web Crypto API (`createState` / `validateAndConsume`). No usar mapas en memoria para el estado OAuth, ya que los Workers se ejecutan en instancias distribuidas.
6. **Flujo de Callback Dual (JSON + Redirect):**
   - `POST /auth/callback`: endpoint JSON consumido por el frontend SPA para completar el intercambio de código y sincronización inicial.
   - `GET /auth/callback`: fallback con redirección HTTP 302 hacia el frontend.
7. **Multi-Tenant Data Scoping:**
   - Toda consulta de base de datos (`bank_connections`, `accounts`, `balance`, `transactions`) y ejecuciones de `SyncService` deben filtrar estrictamente por el `userId` inyectado por el middleware `requireAuth`.
8. **Sub-Router Pattern:** Dominios estructurados con ensamblador `routes/<domain>/index.ts` y handlers especializados (`<subdomain>-flow.ts`).
9. **Validación Zod Obligatoria:** Todo body, query param o path param se valida con Zod (`zValidator`).
10. **AppError:** Control de errores con jerarquía `AppError` (400, 401, 403, 404, 409, 500). Prohibido `throw new Error("...")`.
11. **Cero `any`:** `strict: true` en TypeScript. Tipado estricto en todas las capas.
12. **Archivos ≤ 300 Líneas:** Modularización estricta por responsabilidad única.
13. **Sin Comentarios en Producción:** El código se explica solo.

### Frontend
1. **Auth Context & Interceptor Centralizado:**
   - Sesión gestionada vía `AuthContext` (`AuthProvider`, `useAuth()`) con persistencia en `localStorage`.
   - Toda llamada HTTP se realiza a través de `lib/api/client.ts` (`apiFetch`), inyectando automáticamente el header `Authorization: Bearer <token>`.
2. **Rutas Protegidas & Callback de Banco:**
   - Vistas públicas: `/login` y `/register`.
   - Vista de Callback: `/auth/callback` (`AuthCallbackPage.tsx`) procesa `code` y `state` tras la redirección bancaria, llama a `POST /auth/callback` con JWT y redirige a `/?connected=true`.
   - Vistas privadas: protegidas mediante `<ProtectedRoute>` con redirección automática a `/login` preservando la ruta previa.
3. **Un Hook por Página como State Machine:** Páginas (`Dashboard.tsx`, `Connect.tsx`, `AccountDetail.tsx`) delegan estado y efectos a hooks dedicados.
4. **Service Modules:** Toda llamada API pasa por `lib/api/`. Prohibido `fetch` directo en componentes o hooks.
5. **Domain-Based Components:** Componentes organizados por dominio (`components/accounts/`, `components/transactions/`, `components/balance/`). Solo primitivos en `components/ui/`.
6. **Tailwind CSS v4 con `@theme`:** Estilos y tokens definidos exclusivamente en `index.css`. Fuentes: Inter para UI y JetBrains Mono para cifras monetarias.
7. **SPA Routing en Cloudflare Pages:** Mantener `client/public/_redirects` (`/* /index.html 200`) para compatibilidad con React Router.

## Requisitos de Terceros (Enable Banking)

1. **Redirect URI en Dashboard:**
   - La aplicación registrada en Enable Banking Console (`APP_ID`) debe tener configurada en sus *Redirect URIs permitidas* la URL correspondiente de callback del frontend (`<FRONTEND_URL>/auth/callback`).
2. **Claves Criptográficas:**
   - La clave pública registrada en Enable Banking debe coincidir con el par generado a partir de `PRIVATE_KEY_PEM`.

## Comandos del Proyecto

### Server (`out/banky/server`)
- `npm run dev` — Servidor Hono en modo watch local (:3001)
- `npx tsc --noEmit` — Typecheck estricto de TypeScript
- `npm run deploy` — Desplegar Worker a Cloudflare Workers
- `npx wrangler d1 execute banky-db --remote --file=src/db/schema.sql` — Migrar esquema a Cloudflare D1 en producción

### Client (`out/banky/client`)
- `npm run dev` — Servidor de desarrollo Vite (:5173)
- `npm run build` — Compilar bundle de producción con Vite
- `npm run typecheck` — Typecheck de frontend
- `npx wrangler pages deploy dist --project-name=banky-client` — Desplegar frontend a Cloudflare Pages
