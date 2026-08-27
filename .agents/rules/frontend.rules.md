# Frontend Rules — Spaces

Principios inamovibles para el cliente (React 19 + Vite + Tailwind CSS v4). Todo PR debe respetarlos.

## 1. Un Hook por Página como State Machine

Cada página delega todo su estado, efectos y callbacks a un hook dedicado (ej. `useChatAreaState`, `useDashboardData`). El componente de página solo renderiza — sin `useState`, `useEffect`, ni lógica. Los hooks retornan un objeto plano con valores y acciones.

## 2. API Calls Solo a Través de Service Modules

Toda llamada HTTP usa los service modules en `apps/client/src/lib/api/`. Nunca `fetch` directo en componentes o hooks. Cada dominio tiene su propio service file. Todas las llamadas pasan por `apiFetch()`.

## 3. Domain-Based Components

Componentes nuevos viven en `components/<dominio>/`. Solo los primitivos genéricos (Button, Modal, Dialog, Input) van en `components/ui/`. No se usa atomic design (atoms/molecules/organisms). Una carpeta por feature.

## 4. Tailwind CSS v4 con `@theme`

Todo el estilado es Tailwind. Valores custom (colores, fuentes, breakpoints) se definen en `index.css` vía `@theme`. No existe `tailwind.config`. No hay CSS modules ni styled-components.

## 5. Absolute Imports con `@/`

Todos los imports dentro de `apps/client/src/` usan el alias `@/`. Nada de `../../../` relativo.

## 6. EntityEventBus para Invalidación Cross-Cutting

Cuando un cambio en una entidad (agente, proyecto, equipo, sesión, skill, tool, config) debe reflejarse en otras partes de la UI, se emite `CustomEvent("entity-updated")` a través del `EntityEventBus`. Los consumidores se suscriben para re-fetch. Nunca se encadena refetch manual entre componentes no relacionados.

## 7. localStorage Tipado

Cualquier acceso a `localStorage` usa el wrapper tipado `storage.ts` con `STORAGE_KEYS`. En componentes React, se usa el hook `useLocalStorage`. Nunca `localStorage.getItem/setItem` directo.

## 8. Sin State Library Externa

React Context para estado global compartido. `useReducer` para estado complejo. Hooks locales para estado de página. Nada de Redux, Zustand, MobX o similares.

## 9. Solo Componentes Funcionales con Hooks

Cero clases. Todos los componentes son funciones. Los tipos de props se definen como interfaces inline en el mismo archivo.

## 10. Sin Comentarios en Código de Producción

El código se explica solo. Si requiere comentarios, se refactoriza. Única excepción: TODOs con link a issue.
