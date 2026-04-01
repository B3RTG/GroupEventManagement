# Arquitectura del sistema

## Stack tecnológico

### Backend
| Componente | Tecnología | Motivo |
|---|---|---|
| Framework | ASP.NET Core (.NET 9) | Ecosistema maduro, rendimiento, integración Azure |
| ORM | Entity Framework Core | Migraciones, LINQ, integración con PostgreSQL |
| Base de datos | PostgreSQL 17 | Robustez, soporte JSON, extensible |
| Jobs en background | Hangfire | Promoción automática de waitlist, envío diferido de notificaciones |
| Autenticación | Google + Apple OAuth (JWT) | Sin gestión de passwords en MVP |
| Push notifications | Firebase Cloud Messaging (FCM) | Unifica iOS y Android con un solo servicio |
| Email | Resend | API simple, buen rate limit en tier gratuito |
| Patrón | Clean Architecture (Domain / Application / Infrastructure / Api) | Separación de responsabilidades, testabilidad |
| Mediator | MediatR | CQRS ligero, desacopla handlers |

### Frontend Web
| Componente | Tecnología |
|---|---|
| Framework | React 19 + Vite |
| Estado global | Redux Toolkit |
| Fetching / caché | RTK Query |
| Validación | Zod (compartido con mobile vía paquete `@repo/validators`) |
| Estilos | Tailwind CSS |
| Routing | React Router v7 |

### Mobile
| Componente | Tecnología | Motivo |
|---|---|---|
| Framework | React Native + Expo SDK 52 | Multiplataforma, acceso a device features, código compartido con web |
| Navegación | Expo Router (file-based) | Consistente con Next.js, deep links nativos |
| Auth | Expo AuthSession | OAuth nativo en iOS y Android |
| Push | Expo Notifications + FCM | Abstracción sobre FCM para Expo |

> MAUI fue descartado: ecosistema inmaduro, sin código compartido con la capa web, menor soporte de la comunidad.

### Monorepo
| Componente | Tecnología |
|---|---|
| Gestor | Turborepo |
| Package manager | pnpm workspaces |

#### Paquetes compartidos (`packages/`)
| Paquete | Contenido |
|---|---|
| `@repo/api-client` | Cliente HTTP tipado (generado desde OpenAPI) |
| `@repo/validators` | Schemas Zod compartidos entre web y mobile |
| `@repo/utils` | Helpers comunes (fechas, formateo, etc.) |

### Infraestructura (Cloud: Azure)
| Recurso | Servicio Azure |
|---|---|
| API Backend | App Service (Linux, .NET) |
| Base de datos | PostgreSQL Flexible Server |
| Almacenamiento (imágenes, assets) | Blob Storage |
| CI/CD | GitHub Actions |

---

## Estructura del monorepo

```
GroupEventManagement/
├── apps/
│   ├── web/          # React + Vite
│   └── mobile/       # React Native + Expo
├── backend/
│   ├── src/
│   │   ├── GroupEvents.Api           # Controllers, Program.cs, Middlewares
│   │   ├── GroupEvents.Application   # CQRS Handlers, DTOs, Interfaces
│   │   ├── GroupEvents.Domain        # Entidades, Value Objects, Enums
│   │   ├── GroupEvents.Infrastructure# EF Core, Repositorios, Servicios externos
│   │   └── GroupEvents.Contracts     # DTOs públicos / contratos de API
│   └── tests/
│       ├── GroupEvents.Tests.Unit
│       └── GroupEvents.Tests.Integration
├── packages/
│   ├── api-client/
│   ├── validators/
│   └── utils/
├── docs/             # Esta carpeta
└── .devcontainer/    # Dev Container con PostgreSQL
```

---

## Patrones clave

### Clean Architecture en el backend

```
Api → Application → Domain
          ↓
    Infrastructure
```

- **Domain**: entidades puras, sin dependencias externas.
- **Application**: casos de uso (Commands/Queries con MediatR), interfaces de repositorios.
- **Infrastructure**: implementaciones concretas (EF Core, Hangfire, FCM, Resend).
- **Api**: controllers delgados que solo orquestan el mediator.

### CQRS ligero
Usamos MediatR para separar lecturas (Queries) de escrituras (Commands). No se usa Event Sourcing en MVP.

### Shared types entre web y mobile
Los schemas Zod de `@repo/validators` se usan tanto para validación de formularios en el cliente como para parsear respuestas de la API. El `@repo/api-client` expone funciones tipadas que ambas apps consumen.

---

## Servicios críticos del backend

### `RegistrationService`

Lógica transaccional central para registros. El punto más sensible del sistema.

```
RegisterUserAsync:
  1. BEGIN TRANSACTION (Serializable)
  2. SELECT FOR UPDATE en la fila del evento  ← evita race condition
  3. Verificar membresía activa del usuario dentro de la transacción
  4. Contar registros confirmados
  5a. Si lleno → lanzar EventFullException (cliente llama al endpoint de waitlist)
  5b. Si hay plaza → insertar EventRegistration con status = Confirmed
  6. COMMIT

CancelRegistrationAsync:
  1. BEGIN TRANSACTION (Serializable)
  2. Cancelar el registro
  3. Llamar a WaitlistService.PromoteNextAsync dentro de la misma transacción
  4. Si falla la promoción → ROLLBACK completo (la cancelación NO se aplica)
  5. COMMIT
```

> **Convención HTTP**: evento lleno → `HTTP 409 { type: "EVENT_FULL" }` → cliente llama a `POST /waitlist`.

### `WaitlistService`

```
PromoteNextAsync:
  1. Buscar la entrada waiting más antigua: ORDER BY joined_at ASC LIMIT 1 FOR UPDATE
  2. Crear EventRegistration con status = Confirmed + promoted_from_waitlist = true
  3. Actualizar WaitlistEntry.status = Promoted
  4. Encolar notificación (status = pending) — sin enviar dentro de la transacción
  5. Todo en la misma transacción del llamador (no abre la suya propia)
```

> **Posición en waitlist**: siempre calculada con `ROW_NUMBER() OVER (ORDER BY joined_at)` en tiempo de consulta. Nunca almacenar un campo `position` — quedaría obsoleto ante cancelaciones.

### `NotificationService`

```
SendAsync(notification):
  1. Insertar en tabla notifications con status = 'pending' e idempotency_key
  2. Retornar — NO envía en el request HTTP
  ↓
NotificationDispatchJob (cada 30s):
  3. SELECT pending notifications FOR UPDATE SKIP LOCKED
  4. Enviar vía FCM o Resend según channel
  5. Actualizar status = 'sent' | 'failed'
  6. Si FCM devuelve UNREGISTERED → limpiar push_token del usuario
```

> Desacopla la latencia de envío del request HTTP. La clave `idempotency_key` evita envíos duplicados si el job se ejecuta dos veces.

---

## Jobs Hangfire

| Job | Frecuencia | Propósito |
|---|---|---|
| `NotificationDispatchJob` | Cada 30s | Enviar notificaciones `pending` vía FCM / Resend |
| `WaitlistSafetyNetJob` | Cada 5min | Red de seguridad: detectar eventos con plazas libres + waitlist sin promover |
| `CompletedEventsJob` | Diario | Marcar eventos pasados como `completed` |
| `PushTokenCleanupJob` | Diario | Limpiar tokens `UNREGISTERED` devueltos por FCM |

> `WaitlistSafetyNetJob` es una red de seguridad, no el flujo principal. La promoción debe ocurrir en la misma transacción que la cancelación. Este job corrige cualquier inconsistencia que haya podido quedar.

---

## API REST — referencia rápida

Base: `/api/v1` — autenticación con `Authorization: Bearer <JWT>`

| Grupo | Endpoints |
|---|---|
| **Auth** | `POST /auth/google`, `POST /auth/apple`, `POST /auth/refresh`, `DELETE /auth/session`, `GET+PUT /auth/me` |
| **Groups** | CRUD `/groups`, `/groups/{id}/members` (CRUD + roles), `POST /groups/join`, `POST /groups/{id}/invite-code/regenerate` |
| **Events** | CRUD `/groups/{groupId}/events`, `POST .../publish`, `POST .../cancel` |
| **Tracks** | CRUD `/groups/{groupId}/events/{id}/tracks` |
| **Registrations** | `POST+DELETE /groups/{groupId}/events/{id}/registrations`, guest registrations |
| **Waitlist** | `POST+DELETE /groups/{groupId}/events/{id}/waitlist`, `GET .../position` |
| **Notifications** | Lista paginada, marcar leída, preferencias |
