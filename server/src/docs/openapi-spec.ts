export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Banky Open Banking API",
    version: "1.0.0",
    description: "API de agregación bancaria multi-tenant vía Open Banking AISP (Enable Banking). Admite autenticación dual con JWT de sesión o API Keys (`bky_live_...`) con control de scopes."
  },
  servers: [
    { url: "https://api.banky.therry.dev", description: "Producción Cloudflare Workers" },
    { url: "http://localhost:3001", description: "Desarrollo Local" }
  ],
  tags: [
    { name: "Salud", description: "Verificación de estado del servicio" },
    { name: "Autenticación", description: "Registro, login y sesión de usuario" },
    { name: "Bancos (AISP)", description: "Entidades bancarias y consentimiento OAuth" },
    { name: "Cuentas", description: "Cuentas bancarias y efectivo manual" },
    { name: "Saldos", description: "Balances consolidados y agregados" },
    { name: "Transacciones", description: "Movimientos bancarios y efectivo" },
    { name: "Sincronización", description: "Sync de datos con bancos upstream" },
    { name: "Categorías", description: "Categorización y reglas inteligentes" },
    { name: "Presupuestos", description: "Metas mensuales y analítica de gastos" },
    { name: "API Keys", description: "Gestión de credenciales programáticas" }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT emitido en /auth/login o /auth/register"
      },
      ApiKeyAuth: {
        type: "http",
        scheme: "bearer",
        description: "API Key con formato bky_live_<random_bytes>"
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Salud"],
        summary: "Estado del servicio",
        responses: { "200": { description: "Servidor operativo", content: { "application/json": { example: { ok: true } } } } }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar usuario",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" }, name: { type: "string" } }, required: ["email", "password", "name"] } } }
        },
        responses: { "201": { description: "Usuario registrado con éxito" }, "409": { description: "Email ya registrado" } }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] } } }
        },
        responses: { "200": { description: "Sesión iniciada con JWT" }, "401": { description: "Credenciales inválidas" } }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Autenticación"],
        summary: "Datos del usuario actual",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Perfil del usuario" }, "401": { description: "No autorizado" } }
      }
    },
    "/accounts": {
      get: {
        tags: ["Cuentas"],
        summary: "Listar cuentas del usuario",
        description: "Devuelve cuentas bancarias sincronizadas y cuentas de efectivo.",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["accounts:read"] }],
        responses: { "200": { description: "Listado de cuentas" } }
      }
    },
    "/accounts/cash": {
      post: {
        tags: ["Cuentas"],
        summary: "Crear o inicializar bóveda de efectivo manual",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["accounts:read"] }],
        responses: { "200": { description: "Cuenta de efectivo lista" } }
      }
    },
    "/balance/total": {
      get: {
        tags: ["Saldos"],
        summary: "Consultar saldo consolidado",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["balance:read"] }],
        responses: { "200": { description: "Total consolidado por moneda" } }
      }
    },
    "/transactions": {
      get: {
        tags: ["Transacciones"],
        summary: "Consultar movimientos con filtros",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["transactions:read"] }],
        parameters: [
          { name: "accountId", in: "query", schema: { type: "string" } },
          { name: "period", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: { "200": { description: "Transacciones paginadas" } }
      },
      post: {
        tags: ["Transacciones"],
        summary: "Registrar movimiento manual / efectivo",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["transactions:write"] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { accountId: { type: "string" }, amount: { type: "string" }, currency: { type: "string" }, description: { type: "string" }, bookedAt: { type: "string" } }, required: ["accountId", "amount", "currency", "bookedAt"] } } }
        },
        responses: { "201": { description: "Transacción creada" } }
      }
    },
    "/transactions/{id}": {
      patch: {
        tags: ["Transacciones"],
        summary: "Actualizar movimiento manual",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["transactions:write"] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Transacción actualizada" } }
      },
      delete: {
        tags: ["Transacciones"],
        summary: "Eliminar movimiento manual",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["transactions:write"] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Transacción eliminada" } }
      }
    },
    "/transactions/{id}/category": {
      patch: {
        tags: ["Transacciones"],
        summary: "Asignar categoría a una transacción",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["transactions:write"] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { categoryId: { type: "string", nullable: true } }, required: ["categoryId"] } } }
        },
        responses: { "200": { description: "Categoría actualizada" } }
      }
    },
    "/sync": {
      post: {
        tags: ["Sincronización"],
        summary: "Disparar sincronización con bancos upstream",
        description: "Actualiza cuentas y transacciones desde Enable Banking.",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["sync:write"] }],
        responses: { "200": { description: "Sincronización finalizada" } }
      }
    },
    "/categories": {
      get: {
        tags: ["Categorías"],
        summary: "Listar categorías y reglas",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["categories:read"] }],
        responses: { "200": { description: "Listado de categorías" } }
      }
    },
    "/budgets": {
      get: {
        tags: ["Presupuestos"],
        summary: "Consultar presupuestos de un período",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["budgets:read"] }],
        parameters: [{ name: "period", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Presupuestos y progreso" } }
      }
    },
    "/analytics/categories": {
      get: {
        tags: ["Presupuestos"],
        summary: "Analítica mensual de gastos por categoría",
        security: [{ BearerAuth: [] }, { ApiKeyAuth: ["budgets:read"] }],
        parameters: [{ name: "period", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Métricas de gasto y ahorro" } }
      }
    },
    "/api-keys": {
      get: {
        tags: ["API Keys"],
        summary: "Listar API Keys del usuario",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Listado de API Keys con prefijo y scopes (sin hashes)" } }
      },
      post: {
        tags: ["API Keys"],
        summary: "Generar nueva API Key",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  scopes: { type: "array", items: { type: "string" } },
                  expiresInDays: { type: "integer", minimum: 1, maximum: 365 }
                },
                required: ["name", "scopes"]
              }
            }
          }
        },
        responses: { "201": { description: "API Key generada con token raw visible una sola vez" } }
      }
    },
    "/api-keys/{id}": {
      delete: {
        tags: ["API Keys"],
        summary: "Revocar API Key",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "API Key revocada" } }
      }
    }
  }
};
