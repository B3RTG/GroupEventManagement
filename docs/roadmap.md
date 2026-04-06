# Roadmap — Fases de desarrollo

## Fase 0 — Scaffolding y devcontainer ✅

**Objetivo**: estructura base del monorepo, entorno de desarrollo reproducible.

- [x] Monorepo con Turborepo + pnpm workspaces
- [x] Scaffolding backend (.NET — Clean Architecture con 5 proyectos)
- [x] Scaffolding web (React + Vite)
- [x] Scaffolding mobile (React Native + Expo)
- [x] Paquetes compartidos (`api-client`, `validators`, `utils`)
- [x] Dev Container con PostgreSQL
- [x] GitHub Actions (pipelines base para API y web)
- [x] `docker-compose.yml` para desarrollo local

---

## Fase 1 — Dominio y persistencia ✅

**Objetivo**: modelo de dominio completo y acceso a datos funcional.

- [x] Entidades del dominio: `User`, `Group`, `Event`, `GroupMembership`, `EventRegistration`, `Track`, `WaitlistEntry`, `Guest`, `Notification`, `AuditLog`, `RefreshToken`
- [x] Enums: `EventStatus`, `MemberRole`, `AuthProvider`, `RegistrationStatus`, `WaitlistStatus`, `NotificationChannel`, `NotificationStatus`
- [x] `AppDbContext` con EF Core + 11 configuraciones Fluent API
- [x] Migraciones: `InitialSchema` + `AddRefreshTokens`
- [x] Seed data para desarrollo local (`DevDataSeeder` — 2 usuarios, 1 grupo, 2 eventos)
- ~~Repositorios base~~ — *Decisión técnica: los handlers usan `IAppDbContext` directamente (patrón CQRS estándar). `IAppDbContext` ya es la abstracción sobre EF Core.*

---

## Fase 2 — MVP: Sprint 1 — Auth ✅

**Objetivo**: autenticación funcional end-to-end, JWT, registro de push token.

- [x] `POST /api/v1/auth/google` — callback + emitir JWT propio
- [x] `POST /api/v1/auth/apple` — callback + emitir JWT (usar `sub`, no email)
- [x] `POST /api/v1/auth/refresh` — renovar JWT
- [x] `DELETE /api/v1/auth/session` — logout (invalidar refresh token)
- [x] `GET /api/v1/auth/me` — perfil del usuario autenticado
- [x] `PUT /api/v1/auth/me` — actualizar push token del dispositivo
- [x] Middleware JWT en ASP.NET Core

---

## Fase 3 — MVP: Sprint 2 — Grupos ✅

**Objetivo**: CRUD de grupos, membresía y código de invitación.

- [x] `POST /api/v1/groups` — crear grupo (quien crea es el owner)
- [x] `GET /api/v1/groups/{id}` — detalle del grupo
- [x] `POST /api/v1/groups/join` — unirse con código de invitación
- [x] `GET /api/v1/groups/{id}/members` — listar miembros
- [x] `PATCH /api/v1/groups/{id}/members/{userId}/role` — cambiar rol (solo owner)
- [x] `DELETE /api/v1/groups/{id}/members/{userId}` — expulsar miembro
- [x] `POST /api/v1/groups/{id}/invite-code/regenerate` — regenerar código
- [ ] Rate limit `POST /groups/join` — 10/IP/min (pendiente Fase 9, no bloquea MVP)

---

## Fase 4 — MVP: Sprint 3 — Eventos y pistas ✅

**Objetivo**: CRUD de eventos con pistas (tracks), publicación y vista de capacidad.

- [x] `POST /api/v1/groups/{groupId}/events` — crear evento (draft), owner/co-admin
- [x] `GET /api/v1/groups/{groupId}/events` — listar eventos del grupo
- [x] `GET /api/v1/groups/{groupId}/events/{id}` — detalle con capacidad en tiempo real
- [x] `PATCH /api/v1/groups/{groupId}/events/{id}` — editar evento (solo draft)
- [x] `POST /api/v1/groups/{groupId}/events/{id}/publish` — publicar evento
- [x] `POST /api/v1/groups/{groupId}/events/{id}/cancel` — cancelar evento
- [x] CRUD `/api/v1/groups/{groupId}/events/{id}/tracks` — gestionar pistas
- [x] Bloquear reducción de capacidad si hay más inscritos que la nueva capacidad

---

## Fase 5 — MVP: Sprint 4 — Registros, Waitlist e Invitados ✅

**Objetivo**: inscripción con concurrencia correcta, waitlist automática, invitados externos.

- [x] `POST /api/v1/groups/{groupId}/events/{id}/registrations` — apuntarse (→ 409 si lleno)
- [x] `DELETE /api/v1/groups/{groupId}/events/{id}/registrations` — cancelar plaza
- [x] `POST /api/v1/groups/{groupId}/events/{id}/waitlist` — unirse a waitlist
- [x] `DELETE /api/v1/groups/{groupId}/events/{id}/waitlist` — salir de waitlist
- [x] `GET /api/v1/groups/{groupId}/events/{id}/waitlist/position` — posición en waitlist
- [x] Registro de invitado externo (`guest_id`)
- [x] `RegisterForEventCommand` con transacción `IsolationLevel.Serializable` (anti race condition)
- [x] Promoción FIFO en `CancelRegistrationCommand` con transacción serializable
- [x] Verificación de membresía dentro de la transacción de registro

---

## Fase 6 — Notificaciones y jobs

**Objetivo**: push + email reales, jobs automáticos de Hangfire.

- [ ] Integración FCM — envío de push notifications
- [ ] Integración Resend — envío de emails con plantillas
- [ ] `NotificationService` — escribe `pending`, desacoplado del HTTP request
- [ ] Job `NotificationDispatchJob` — cada 30s, envía pendientes
- [ ] Job `WaitlistSafetyNetJob` — cada 5min, detecta eventos con plazas + waitlist sin cubrir
- [ ] Job `CompletedEventsJob` — diario, marca eventos pasados como `completed`
- [ ] Job `PushTokenCleanupJob` — diario, limpia tokens `UNREGISTERED` devueltos por FCM
- [ ] Notificación: confirmación de inscripción
- [ ] Notificación: promovido desde waitlist
- [ ] Notificación: cancelación de evento
- [ ] Notificación: recordatorio previo al evento (con idempotencia para inscripciones tardías)

---

## Fase 7 — Frontend Web

**Objetivo**: aplicación web funcional con todas las features del MVP.

- [ ] Autenticación (Google / Apple OAuth)
- [ ] Pantalla de grupos (listado + detalle)
- [ ] Unirse a grupo por código
- [ ] Gestión de miembros (owner/co-admin)
- [ ] Listado y detalle de eventos con capacidad en vivo
- [ ] Inscripción / cancelación / waitlist
- [ ] Crear y editar eventos con pistas
- [ ] Perfil de usuario

---

## Fase 8 — Mobile (React Native + Expo)

**Objetivo**: app mobile iOS + Android con paridad de features con la web.

- [ ] Setup Expo Router y navegación (Stack + Tab)
- [ ] Autenticación OAuth nativa (Expo AuthSession)
- [ ] Registro y envío de push token a la API
- [ ] Push notifications con Expo Notifications
- [ ] Todas las pantallas equivalentes a la web
- [ ] Build EAS (Expo Application Services) para distribución TestFlight / Play Store

---

## Fase 9 — Infraestructura y despliegue

**Objetivo**: entorno de producción listo para usuarios reales.

> El proveedor cloud se elige definitivamente en esta fase. La app está containerizada, por lo que el código no cambia según el proveedor.

**Opción low-cost (proyecto personal):**

| Componente | Servicio | Coste aprox. |
|---|---|---|
| API .NET | Fly.io / Railway | $0–5/mes |
| PostgreSQL | Supabase / Neon | Gratis |
| Web React | Cloudflare Pages | Gratis |
| Push | Firebase FCM | Gratis |
| Email | Resend | Gratis (3k/mes) |
| Mobile builds | Expo EAS | Gratis |

**Tareas:**
- [ ] Provisionar base de datos PostgreSQL gestionada
- [ ] Desplegar API .NET en contenedor
- [ ] Desplegar web React en CDN / hosting estático
- [ ] Pipeline CI/CD completo: PR → build+test → main → staging → tag → producción
- [ ] EAS Build para mobile (iOS + Android)
- [ ] Variables de entorno y secrets en GitHub Actions
- [ ] Dominio y SSL
- [ ] Monitorización básica

---

## Backlog post-MVP (Fase 3 del plan original)

> Diseñar extensibilidad desde el inicio, implementar cuando el MVP esté validado.

- **Real-time** con SignalR (capacidad en vivo) — los domain events internos ya se disparan en MVP, solo añadir el hub como suscriptor
- **Eventos recurrentes** (RRULE) — campos `recurrence_rule` y `parent_event_id` ya en el schema
- **Pagos** con Stripe — campos `price_amount` y `payment_required` ya en el schema
- **Tipos de evento** adicionales — `event_type` y `custom_fields JSONB` ya preparados
- Chat / comentarios en eventos
- Analytics para admins
- Internacionalización (i18n) — `preferred_locale` ya en `users`
