# ADR 001 — Monorepo con Turborepo + pnpm

**Fecha**: 2026-03-30  
**Estado**: Aceptado

## Contexto

El proyecto tiene tres capas de frontend (web + mobile) que comparten tipos, validaciones y lógica de llamadas a la API. Sin un monorepo, el código compartido se duplicaría o requeriría publicar paquetes en npm.

## Decisión

Usar **Turborepo** como orquestador de tareas y **pnpm workspaces** como gestor de paquetes del monorepo.

## Consecuencias

**Positivo:**
- Un único repositorio para backend + web + mobile + paquetes compartidos.
- Los cambios en `@repo/validators` o `@repo/api-client` se reflejan inmediatamente en web y mobile sin publicar.
- Turborepo cachea builds y tests, acelera la CI.

**Negativo:**
- Curva de aprendizaje inicial con pnpm workspaces.
- El backend .NET vive fuera del workspace JS/TS, por lo que su pipeline es independiente.
