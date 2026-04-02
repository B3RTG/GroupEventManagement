# Group Event Management — Documentación

Repositorio central de decisiones, arquitectura y planificación del proyecto.

## Índice

| Documento | Descripción |
|---|---|
| [architecture.md](./architecture.md) | Stack tecnológico, patrones, servicios críticos y referencia de API |
| [data-model.md](./data-model.md) | Modelo de datos completo — entidades, campos, índices y extensibilidad |
| [product-decisions.md](./product-decisions.md) | Scope del MVP, features acordadas y reglas de negocio |
| [roadmap.md](./roadmap.md) | Fases y sprints del desarrollo con estado actual |
| [edge-cases.md](./edge-cases.md) | 12 edge cases críticos y cómo resolverlos (concurrencia, GDPR, etc.) |
| [adr/](./adr/) | Architecture Decision Records — decisiones importantes con contexto |

## Cómo usar esta documentación

- **Antes de implementar algo nuevo**: revisa `roadmap.md` para saber en qué fase estamos y `product-decisions.md` para no salirte del scope del MVP.
- **Cuando tomes una decisión técnica importante**: crea un ADR en `adr/` con el formato establecido.
- **Cuando cambie el scope o las reglas de negocio**: actualiza `product-decisions.md` con fecha y motivo.

## Estado actual

> Última actualización: 2026-04-02

| Fase | Estado |
|---|---|
| Fase 0 — Scaffolding y devcontainer | ✅ Completo |
| Fase 1 — Dominio y persistencia | ✅ Completo |
| Fase 2 — Sprint 1: Auth | ✅ Completo |
| Fase 3 — Sprint 2: Grupos | ✅ Completo |
| Fase 4 — Sprint 3: Eventos y pistas | ⏳ Pendiente |
| Fase 5 — Sprint 4: Registros y Waitlist | ⏳ Pendiente |
| Fase 6 — Notificaciones y jobs | ⏳ Pendiente |
| Fase 7 — Frontend Web | ⏳ Pendiente |
| Fase 8 — Mobile (React Native + Expo) | ⏳ Pendiente |
| Fase 9 — Infraestructura y despliegue | ⏳ Pendiente |
