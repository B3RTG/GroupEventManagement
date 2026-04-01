# Architecture Decision Records (ADR)

Un ADR documenta una decisión arquitectónica o técnica importante: qué se decidió, por qué, y qué consecuencias tiene.

## Índice

| # | Título | Estado | Fecha |
|---|---|---|---|
| [001](./001-monorepo-turborepo.md) | Monorepo con Turborepo + pnpm | Aceptado | 2026-03-30 |
| [002](./002-mobile-expo-vs-maui.md) | Mobile: React Native + Expo (descartado MAUI) | Aceptado | 2026-03-30 |
| [003](./003-auth-oauth-only.md) | Autenticación: solo OAuth (Google + Apple) | Aceptado | 2026-03-30 |
| [004](./004-clean-architecture-backend.md) | Backend: Clean Architecture + CQRS con MediatR | Aceptado | 2026-03-30 |

## Cómo añadir un ADR

1. Crea un archivo `NNN-titulo-kebab-case.md` usando la plantilla:

```markdown
# ADR NNN — Título

**Fecha**: YYYY-MM-DD  
**Estado**: Propuesto | Aceptado | Deprecado | Supersedido por [ADR-NNN]

## Contexto
¿Qué problema o necesidad originó esta decisión?

## Decisión
¿Qué se decidió?

## Motivo
¿Por qué esta opción y no las alternativas?

## Consecuencias
**Positivo:** ...  
**Negativo:** ...
```

2. Añade una fila en la tabla de índice de este README.

## Estados posibles

- **Propuesto**: en discusión, no implementado aún
- **Aceptado**: decisión tomada e implementada
- **Deprecado**: ya no aplica, sin sucesor
- **Supersedido**: reemplazado por otro ADR
