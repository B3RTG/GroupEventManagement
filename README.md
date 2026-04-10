# Group Event Management (GEM)

Plataforma para gestionar eventos dentro de grupos privados: reservas de pistas de pádel, partidas de fútbol, torneos internos... cualquier actividad donde haya un aforo limitado, lista de espera y un grupo de personas recurrentes.

Monorepo full-stack con backend .NET, web React y app móvil React Native.

---

## Qué hace la aplicación

- **Grupos privados** con código de invitación y roles (owner / co-admin / member)
- **Eventos** con capacidad por pistas (tracks), estados draft → published → cancelled → completed
- **Inscripción concurrente** con transacciones serializables para evitar race conditions
- **Waitlist automática** con promoción FIFO cuando se cancela una plaza
- **Notificaciones push** (FCM) y email (Resend): inscripción confirmada, promovido de waitlist, recordatorio 24h antes, evento cancelado
- **App móvil** iOS + Android con paridad de features respecto a la web
- **Jobs Hangfire** en background: dispatch de notificaciones, safety-net de waitlist, cierre de eventos, limpieza de tokens

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | ASP.NET Core 8, Clean Architecture, MediatR (CQRS), EF Core, Hangfire |
| Base de datos | PostgreSQL 17 |
| Auth | Google OAuth + Apple Sign In → JWT propio + refresh tokens |
| Push | Firebase Cloud Messaging (FCM HTTP v1) |
| Email | Resend |
| Web | React 19 + Vite, Redux Toolkit + RTK Query, React Router v7, Tailwind CSS |
| Mobile | React Native 0.81 + Expo SDK 54, React Navigation, Redux Toolkit |
| Monorepo | Turborepo + pnpm workspaces |
| CI/CD | GitHub Actions |
| Builds mobile | Expo EAS |

---

## Estructura del monorepo

```
GroupEventManagement/
├── apps/
│   ├── web/                    # React + Vite (frontend web)
│   └── mobile/                 # React Native + Expo (iOS + Android)
├── backend/
│   ├── src/
│   │   ├── GroupEvents.Api          # Controllers, middlewares, Program.cs
│   │   ├── GroupEvents.Application  # CQRS handlers, interfaces, DTOs
│   │   ├── GroupEvents.Domain       # Entidades, enums, value objects
│   │   ├── GroupEvents.Infrastructure # EF Core, Hangfire, FCM, Resend
│   │   └── GroupEvents.Contracts    # DTOs públicos de la API
│   └── tests/
│       ├── GroupEvents.Tests.Unit
│       └── GroupEvents.Tests.Integration
├── packages/
│   ├── api-client/             # Cliente HTTP tipado (tipos + fetch helpers)
│   ├── validators/             # Schemas Zod compartidos web ↔ mobile
│   └── utils/                  # Helpers comunes (fechas, formateo, initials)
├── docs/                       # Arquitectura, ADRs, roadmap, modelo de datos
└── .devcontainer/              # Dev Container con PostgreSQL incluido
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+ (`npm i -g pnpm`)
- [.NET SDK](https://dotnet.microsoft.com/) 8
- [Docker](https://www.docker.com/) (para el Dev Container o `docker-compose` local)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm i -g expo-cli`) — solo para mobile
- [EAS CLI](https://docs.expo.dev/eas/) (`npm i -g eas-cli`) — solo para builds mobile

---

## Puesta en marcha local

### Opción A — Dev Container (recomendado)

Abre el repositorio en VS Code y acepta "Reopen in Container". El devcontainer levanta PostgreSQL, instala dependencias y aplica migraciones automáticamente.

### Opción B — Manual

**1. Instalar dependencias JS**
```bash
pnpm install
```

**2. Levantar PostgreSQL**
```bash
docker-compose -f .devcontainer/docker-compose.devcontainer.yml up -d
```

**3. Configurar el backend**

Copia el fichero de ejemplo y rellena tus credenciales:
```bash
cp backend/src/GroupEvents.Api/appsettings.Development.example.json \
   backend/src/GroupEvents.Api/appsettings.Development.json
```

Variables mínimas para desarrollo:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=groupevents;Username=groupevents;Password=groupevents_dev;SSL Mode=Disable"
  },
  "Jwt": {
    "Secret": "min-32-caracteres-para-firmar-el-jwt!!"
  },
  "Auth": {
    "Google": { "ClientId": "TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com" }
  }
}
```

Variables opcionales (push y email solo necesarios en producción o para probar notificaciones):
```json
{
  "Fcm": {
    "ProjectId": "tu-firebase-project-id",
    "ServiceAccountJson": "{ ... JSON completo de la service account ... }"
  },
  "Resend": {
    "ApiKey": "re_xxxxxxxxxxxxxxxxxxxx"
  }
}
```

**4. Aplicar migraciones y seed**
```bash
cd backend
dotnet ef database update --project src/GroupEvents.Infrastructure --startup-project src/GroupEvents.Api
```

El seeder de desarrollo crea automáticamente 2 usuarios, 1 grupo y 2 eventos al iniciar en modo Development.

---

## Comandos de desarrollo

Desde la raíz del monorepo:

```bash
# Arrancar todos los servicios en paralelo (API + web)
pnpm dev

# Solo la API .NET
pnpm --filter @gem/api dev

# Solo el frontend web
pnpm --filter @gem/web dev

# App mobile (requiere dispositivo físico o emulador)
pnpm --filter @gem/mobile start          # Metro + QR
pnpm --filter @gem/mobile tunnel         # Expo con ngrok (para dispositivo físico en red distinta)

# Type-check en todos los paquetes
pnpm type-check

# Tests de backend
cd backend && dotnet test
```

---

## Variables de entorno en producción

| Variable | Descripción |
|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Jwt__Secret` | Secret para firmar JWT (mín. 32 caracteres) |
| `Auth__Google__ClientId` | Google OAuth client ID |
| `Auth__Apple__TeamId` | Apple Developer Team ID |
| `Auth__Apple__KeyId` | Apple Key ID para Sign In |
| `Auth__Apple__BundleId` | Bundle ID de la app iOS |
| `Fcm__ProjectId` | Firebase project ID |
| `Fcm__ServiceAccountJson` | JSON completo de la service account de Firebase |
| `Resend__ApiKey` | API key de Resend |

> En Docker/Railway se mapean como variables de entorno con doble guión bajo (`__`) como separador de sección.

---

## Builds mobile (EAS)

El proyecto está configurado con tres perfiles en [`apps/mobile/eas.json`](apps/mobile/eas.json):

```bash
# APK de desarrollo (con expo-dev-client, para testing de notificaciones)
eas build --profile development --platform android

# APK/IPA de preview (distribución interna)
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Build de producción (Play Store / App Store)
eas build --profile production --platform all
```

> Los builds `development` incluyen `expo-dev-client` y permiten recargar el bundle sin reinstalar la app.

---

## Documentación técnica

Ver la carpeta [`docs/`](docs/):

| Documento | Qué contiene |
|---|---|
| [architecture.md](docs/architecture.md) | Stack, patrones CQRS, servicios críticos, referencia de API |
| [data-model.md](docs/data-model.md) | Entidades, campos, índices, extensibilidad |
| [product-decisions.md](docs/product-decisions.md) | Scope MVP, features acordadas, reglas de negocio |
| [roadmap.md](docs/roadmap.md) | Estado de cada fase de desarrollo |
| [edge-cases.md](docs/edge-cases.md) | Concurrencia, GDPR, edge cases críticos |
| [adr/](docs/adr/) | Architecture Decision Records |

---

## Estado del proyecto

| Fase | Estado |
|---|---|
| Fase 0 — Scaffolding y monorepo | ✅ |
| Fase 1 — Dominio y persistencia | ✅ |
| Fase 2–5 — Auth, Grupos, Eventos, Registros/Waitlist | ✅ |
| Fase 6 — Notificaciones push + email + jobs Hangfire | ✅ |
| Fase 7 — Frontend Web | ✅ |
| Fase 8 — App Mobile iOS + Android | ✅ |
| Fase 9 — Infraestructura y despliegue | pendiente |

Backlog post-MVP: real-time con SignalR, eventos recurrentes, pagos con Stripe, chat.
