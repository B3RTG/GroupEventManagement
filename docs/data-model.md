# Modelo de datos

## Diagrama de entidades

```
users ──< group_memberships >── groups
                                  │
                                events ──< tracks
                                  │
                    event_registrations
                    waitlist_entries
                    guests

users ──< notifications
groups/events ──< audit_logs
```

---

## Entidades

### `users`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `external_id` | string | ID del proveedor OAuth |
| `auth_provider` | enum | `google` \| `apple` |
| `email` | string nullable | Puede ser relay de Apple |
| `display_name` | string | |
| `avatar_url` | string nullable | |
| `push_token` | string nullable | Token FCM actual |
| `preferred_locale` | string nullable | Para i18n futuro |
| `is_active` | bool | Borrado lógico (GDPR) |
| `created_at` | timestamptz | |

> **UNIQUE**: `(external_id, auth_provider)` — nunca usar email como identificador de Apple.  
> **Nota GDPR**: al borrar cuenta → anonimizar campos, no eliminar fila (preservar registros históricos).

---

### `groups`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `name` | string | |
| `slug` | string | URL-friendly, único |
| `invite_code` | string | Código corto compartible |
| `invite_link_enabled` | bool | Activa/desactiva el link |
| `owner_id` | UUID FK → users | Un único owner |
| `is_active` | bool | Borrado lógico |
| `created_at` | timestamptz | |

> **UNIQUE**: `invite_code`, `slug`  
> **Seguridad**: rate limit 10 intentos/IP/min en el endpoint de join por código.

---

### `group_memberships`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `group_id` | UUID FK → groups | |
| `user_id` | UUID FK → users | |
| `role` | enum | `owner` \| `co_admin` \| `member` |
| `invited_by` | UUID FK → users nullable | |
| `is_active` | bool | Borrado lógico |
| `joined_at` | timestamptz | |

> **UNIQUE**: `(group_id, user_id)`

---

### `events`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `group_id` | UUID FK → groups | |
| `created_by` | UUID FK → users | |
| `title` | string | |
| `event_type` | string | `padel` \| ... (extensible) |
| `location` | string nullable | |
| `timezone` | string | IANA TZ, ej. `Europe/Madrid` |
| `scheduled_at` | timestamptz | Siempre en UTC |
| `duration_minutes` | int | |
| `registration_opens_at` | timestamptz nullable | |
| `registration_closes_at` | timestamptz nullable | |
| `status` | enum | `draft` \| `published` \| `cancelled` \| `completed` |
| `track_count` | int | Número de pistas |
| `capacity_per_track` | int | Plazas por pista (ej. 4 para pádel) |
| `total_capacity` | int computed | `track_count × capacity_per_track` |
| `notes` | string nullable | |
| `recurrence_rule` | string nullable | RRULE — para Fase 3 |
| `parent_event_id` | UUID nullable | Para eventos recurrentes |
| `price_amount` | decimal nullable | Para Fase 3 (pagos) |
| `payment_required` | bool | Default false |

> **INDEX**: `(group_id, status, scheduled_at)`

---

### `tracks`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `event_id` | UUID FK → events | |
| `name` | string | Ej. "Pista 1", "Pista 2" |
| `capacity` | int | Plazas en esta pista |
| `sort_order` | int | Orden de presentación |

> En MVP cada pista tiene capacidad fija (`capacity_per_track`). Extensible a capacidades distintas por pista.

---

### `event_registrations`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `event_id` | UUID FK → events | |
| `user_id` | UUID FK → users nullable | Null si es invitado externo |
| `status` | enum | `confirmed` \| `cancelled` |
| `cancelled_at` | timestamptz nullable | |
| `cancelled_by` | UUID FK → users nullable | Quien canceló (admin o propio) |
| `is_guest_registration` | bool | |
| `guest_id` | UUID FK → guests nullable | |
| `promoted_from_waitlist` | bool | |
| `promoted_at` | timestamptz nullable | |
| `payment_status` | enum nullable | Para Fase 3 |

> **PARTIAL UNIQUE**: `(event_id, user_id)` WHERE `status = 'confirmed' AND guest_id IS NULL`  
> **Concurrencia**: usar `SELECT FOR UPDATE` en la fila del evento al registrar — nunca contar plazas a nivel de aplicación.

---

### `waitlist_entries`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `event_id` | UUID FK → events | |
| `user_id` | UUID FK → users nullable | |
| `joined_at` | timestamptz | Base del orden FIFO |
| `status` | enum | `waiting` \| `promoted` \| `cancelled` |
| `promoted_at` | timestamptz nullable | |
| `registration_id` | UUID FK → event_registrations nullable | Registro creado al promover |
| `is_guest_registration` | bool | |
| `guest_id` | UUID FK → guests nullable | |

> **INDEX**: `(event_id, status, joined_at)` — FIFO para promoción.  
> **Posición**: se calcula con `ROW_NUMBER() OVER (ORDER BY joined_at)` en tiempo de consulta. Nunca almacenar un campo `position` — quedaría obsoleto.

---

### `guests`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `invited_by` | UUID FK → users | Miembro que lo invita |
| `group_id` | UUID FK → groups | |
| `display_name` | string | |
| `email` | string nullable | |
| `created_at` | timestamptz | |

> Si el miembro que invitó abandona el grupo, los guests quedan "huérfanos". Política pendiente de definir (ver [edge-cases.md](./edge-cases.md) #4).

---

### `notifications`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | |
| `type` | string | `registration_confirmed`, `waitlist_promoted`, etc. |
| `title` | string | |
| `body` | string | |
| `data` | JSONB | Payload extra (deeplink, IDs) |
| `channel` | enum | `push` \| `email` \| `in_app` |
| `status` | enum | `pending` \| `sent` \| `failed` \| `read` |
| `idempotency_key` | string unique | Evita envíos duplicados |
| `created_at` | timestamptz | |
| `sent_at` | timestamptz nullable | |

> **INDEX**: `(status)` WHERE `status = 'pending'` — el job de Hangfire lo usa para polling.  
> **Flujo**: `NotificationService` escribe con `status = 'pending'` → `NotificationDispatchJob` envía y actualiza status. Desacopla la latencia de envío del HTTP request.

---

### `audit_logs`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `actor_id` | UUID FK → users nullable | Null para acciones del sistema |
| `target_type` | string | `event`, `group`, `user`, etc. |
| `target_id` | UUID | |
| `action` | string | `event.cancelled`, `member.role_changed`, etc. |
| `payload` | JSONB | Estado anterior/posterior |
| `created_at` | timestamptz | |

---

## Extensibilidad futura

| Feature | Cómo se extiende el schema |
|---|---|
| **Pagos** | `events.price_amount` + `events.payment_required` ya presentes. Añadir `registrations.payment_status` + tabla `payments`. Interfaz `IPaymentGateway` como no-op en MVP. |
| **Recurrencia** | `events.recurrence_rule` (RRULE) + `events.parent_event_id` ya presentes. Lógica de instancias en Fase 3. |
| **Tipos de evento** | `events.event_type` ya existe. Añadir `event_type_configs` + `events.custom_fields JSONB` cuando sea necesario. |
| **Internacionalización** | `users.preferred_locale` ya presente. Plantillas de notificación con soporte de locale desde el inicio. |
