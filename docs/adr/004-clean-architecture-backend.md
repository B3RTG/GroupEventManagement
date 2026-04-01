# ADR 004 — Backend: Clean Architecture + CQRS con MediatR

**Fecha**: 2026-03-30  
**Estado**: Aceptado

## Contexto

El backend necesita una estructura que sea mantenible, testeable y que no acople el dominio a frameworks externos (EF Core, ASP.NET, etc.).

## Decisión

**Clean Architecture** con cuatro capas:

```
GroupEvents.Domain          → Entidades, Value Objects, Enums
GroupEvents.Application     → Casos de uso (Commands/Queries), interfaces
GroupEvents.Infrastructure  → EF Core, servicios externos (FCM, Resend, Hangfire)
GroupEvents.Api             → Controllers, middlewares, configuración
GroupEvents.Contracts       → DTOs públicos de la API
```

Con **MediatR** para implementar CQRS ligero (sin Event Sourcing en MVP).

## Motivo

- El dominio permanece limpio sin dependencias externas → fácil de testear con unit tests.
- Los casos de uso en `Application` son el contrato de negocio, independientes de la infraestructura.
- CQRS con MediatR separa lecturas de escrituras, facilita añadir behaviors (logging, validación, auth).
- Patrón ampliamente conocido en el ecosistema .NET.

## Consecuencias

**Positivo:**
- Alta testabilidad: el dominio y application se testean sin base de datos.
- Cambiar EF Core por otro ORM no afecta al dominio ni a application.
- Los MediatR behaviors permiten añadir cross-cutting concerns (FluentValidation, logging) sin tocar los handlers.

**Negativo:**
- Más archivos y capas que un proyecto "simple" (trade-off aceptable por la complejidad del dominio).
- Curva de aprendizaje para contribuidores no familiarizados con el patrón.

## Notas de implementación

- Usar **FluentValidation** integrado con MediatR behavior para validar Commands.
- Los repositorios se definen como interfaces en `Application` e implementan en `Infrastructure`.
- Los controllers solo llaman a `_mediator.Send(command/query)` y retornan el resultado.
