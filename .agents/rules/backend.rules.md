# Backend Rules — Spaces

Principios inamovibles para el servidor (Bun + Hono + Zod). Todo PR debe respetarlos.

## 1. Ports First

Toda nueva capacidad de dominio requiere una interfaz en `apps/server/src/core/ports/` **antes** de su implementación concreta en `core/infra/`. Las interfaces definen el contrato; la implementación lo cumple. Sin excepciones.

## 2. Dependency Injection vía ServerContext

Las rutas y servicios acceden a las dependencias del core (`ISessionManager`, `IMcpRegistry`, `IDelegationRegistry`, `IMemoryRegistry`, `IUiApprovalRegistry`) **exclusivamente** a través de `ServerContext` (`createServerContext()`). No se importan singletons directamente desde los módulos de servicio. Si una ruta hoy usa un singleton, se migra antes de extenderla.

## 3. Sub-Router Pattern

Dominios con múltiples sub-recursos usan estructura de carpeta:

```
routes/<domain>/
  index.ts          # Solo ensambla sub-routers, no contiene lógica
  <sub>-crud.ts     # Un archivo por sub-recurso
```

Dominios simples (un solo recurso) pueden ser un flat file. La decisión se toma al alcanzar 3+ endpoints distintos en el mismo dominio.

## 4. Zod Validation en Cada Ruta

Toda ruta con body, query o params usa `zValidator`. No existen payloads sin validar. Los schemas reutilizables residen en `packages/shared/`.

## 5. AppError para Todos los Errores

Los errores controlados usan la jerarquía `AppError` (400, 401, 403, 404, 409, 500). Nunca se lanza `throw new Error("...")` ni strings. Errores inesperados los captura `globalErrorHandler`.

## 6. ToolRegistry como Fuente Única de Verdad

Todo tool se registra y consulta a través de `ToolRegistry`. No existen arrays de herramientas hardcodeados en sesiones, WebSocket, ni configuración. El catálogo canónico está en `packages/shared/src/tools-catalog.ts`.

## 7. Tipos Compartidos en `packages/shared`

Schemas Zod, tipos de API, payloads de WebSocket y contratos entre front y back residen **únicamente** en `packages/shared`. No se duplican tipos ni se definen inline en rutas o servicios.

## 8. TypeScript Estricto, Sin `any`

`strict: true`. Cero `any` en código nuevo. Si un adapter/bridge requiere `any` por una dependencia externa no tipada, se aísla con un cast explícito y un TODO de deuda técnica.

## 9. Sin Comentarios en Código de Producción

El código se explica solo. Si algo requiere explicación, se refactoriza. Única excepción: TODOs de deuda técnica con link a issue.

## 10. Archivos ≤ 300 Líneas

Ningún archivo supera las 300 líneas. Si crece, se extraen responsabilidades a submódulos especializados (EventBus, ToolRegistry, PromptBuilder, CompactionManager, etc.). Los God Objects no existen.
