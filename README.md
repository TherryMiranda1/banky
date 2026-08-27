# Banky — Open Banking Multi-Account Dashboard

Banky es un dashboard bancario personal de alto rendimiento para consultar cuentas y transacciones unificadas (Santander, Revolut y otros bancos compatibles) a través de la API Open Banking de **Enable Banking** (AISP, solo lectura).

---

## 🏛️ Arquitectura y Principios

- **Ports First:** `IBankingAdapter` desacopla la lógica de negocio y sincronización de la infraestructura del proveedor.
- **Seguridad y Cifrado AES-256-GCM:** Los `session_id` y tokens bancarios nunca se persisten en texto plano; se cifran con clave de 256 bits antes de guardarse en SQLite.
- **Lectura desde Cache Local:** La UI y las consultas leen exclusivamente de SQLite local (`better-sqlite3`), garantizando respuestas sub-milisegundo sin sobrecargar la API del banco.
- **Fail-Fast Env Validation:** Validación estricta con schemas Zod en el arranque del servidor. Si falta una variable crítica, el proceso no inicia.
- **Frontend State Machines:** React 19 + Tailwind CSS v4 con hooks desacoplados, skeletons, y feedback visual de sincronización en tiempo real.

---

## 📋 Requisitos Previos

- **Node.js** v20 o superior
- **npm** o **pnpm**
- **OpenSSL** (para generación de claves criptográficas)
- **Cuenta en Enable Banking** ([https://enablebanking.com](https://enablebanking.com))

---

## 🔐 Configuración de Seguridad y Enable Banking

### 1. Generar Par de Claves RSA 4096 bits

Enable Banking autentica las peticiones mediante JWTs firmados con RS256:

```bash
# 1. Generar la clave privada RSA
openssl genrsa -out private.key 4096

# 2. Extraer la clave pública correspondiente
openssl rsa -in private.key -pubout -out public.key
```

### 2. Registrar la Aplicación en Enable Banking

1. Inicia sesión en el **Enable Banking Control Panel**.
2. Crea una nueva aplicación y sube el contenido de `public.key`.
3. Copia el **Application ID** (`APP_ID`) generado (formato UUID).
4. Configura el **Redirect URL** en la consola: `http://localhost:5173/auth/callback`.

> [!IMPORTANT]
> **Modo Restricted Production y Whitelisting de Cuentas**
> Enable Banking opera inicialmente en modo **Restricted Production**. En este modo, el acceso a datos reales de producción está restringido exclusivamente a las cuentas e IBANs que agregues a la lista de prueba / whitelist en el panel de control de Enable Banking antes de iniciar el flujo de consentimiento.

### 3. Generar la Clave de Cifrado AES-256

Genera una clave aleatoria de 32 bytes en formato hexadecimal (64 caracteres) para el cifrado de datos en reposo:

```bash
openssl rand -hex 32
```

---

## ⚙️ Variables de Entorno

Copia el archivo `.env.example` en `server/`:

```bash
cp server/.env.example server/.env
```

Configura las variables requeridas en `server/.env`:

```env
PORT=3001
NODE_ENV=development
APP_ID=tu-enable-banking-app-id-uuid
PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
ENCRYPTION_KEY=tu-clave-hex-de-64-caracteres
ENABLE_BANKING_REDIRECT_URL=http://localhost:5173/auth/callback
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Inicio Rápido

### Servidor Backend

```bash
cd server
npm install
npm run dev
```

El backend se iniciará en `http://localhost:3001`.

### Cliente Frontend

```bash
cd client
npm install
npm run dev
```

La aplicación web estará disponible en `http://localhost:5173`.

---

## 🔄 Sincronización Manual de Cuentas

Para forzar una sincronización inmediata de saldos y transacciones de todas las conexiones activas:

```bash
curl -X POST http://localhost:3001/sync
```

Respuesta esperada:

```json
{
  "synced": 1,
  "failed": 0,
  "totalAccounts": 2,
  "totalTransactions": 48
}
```

---

## 🐳 Despliegue con Docker

El servidor incluye un `Dockerfile` multi-stage optimizado sobre `node:20-alpine`:

```bash
# Construir la imagen
docker build -t banky-server ./server

# Ejecutar el contenedor
docker run -d \
  --name banky-api \
  --env-file server/.env \
  -p 3001:3001 \
  -v banky-data:/app/data \
  banky-server

# Verificar estado
curl http://localhost:3001/health
# {"ok":true}
```

---

## ⚡ Despliegue en Cloudflare Workers & Cloudflare D1

El backend está preparado para ejecutarse en el edge sobre **Cloudflare Workers** con **Cloudflare D1** (Serverless SQLite):

### 1. Crear la Base de Datos D1

```bash
cd server
npx wrangler d1 create banky-db
```

Copia el `database_id` retornado en tu `wrangler.toml` bajo `[[d1_databases]]`.

### 2. Ejecutar las Migraciones SQL

```bash
# Para entorno local en Workers:
npm run d1:migrate:local

# Para base de datos de producción:
npm run d1:migrate:remote
```

### 3. Configurar Secretos en Cloudflare

```bash
npx wrangler secret put PRIVATE_KEY_PEM
npx wrangler secret put APP_ID
npx wrangler secret put ENCRYPTION_KEY
```

### 4. Desplegar el Worker Backend

```bash
npm run deploy
```

- **Backend API URL:** `https://banky-server.therrymiranda10.workers.dev`
- **Healthcheck:** `https://banky-server.therrymiranda10.workers.dev/health`

---

## ⚡ Despliegue del Frontend en Cloudflare Pages

El frontend está configurado y desplegado en **Cloudflare Pages**:

```bash
cd client

# 1. Compilar los assets estáticos de producción
npm run build

# 2. Desplegar a Cloudflare Pages
npx wrangler pages deploy dist --project-name=banky-client
```

- **Frontend Live URL:** `https://banky-client.pages.dev`

---

## 📡 Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Healthcheck del servicio |
| `GET` | `/auth/banks` | Listado de bancos soportados (Santander, Revolut, etc.) |
| `POST` | `/auth/connect` | Iniciar flujo OAuth y obtener URL de autorización bancaria |
| `GET` | `/auth/callback` | Callback de retorno tras autorización del banco |
| `GET` | `/aspsps` | Listado de entidades bancarias configuradas |
| `POST` | `/sync` | Sincronización de saldos y movimientos de bancos activos |
| `GET` | `/accounts` | Lista de cuentas conectadas y saldos calculados |
| `GET` | `/accounts/:id` | Detalle de cuenta específica |
| `GET` | `/balance` | Balance consolidado global y desglose por moneda |
| `GET` | `/transactions` | Historial paginado con filtros de banco, cuenta, fecha y tipo |

---

## 🧪 Verificación y Tipado

```bash
# Typecheck backend
cd server && npx tsc --noEmit

# Typecheck frontend
cd client && npx tsc --noEmit
```
