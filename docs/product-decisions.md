# Decisiones de producto

> Decisiones tomadas en sesión de Q&A inicial (2026-03-30). Actualizar con fecha cuando cambien.

---

## Scope del MVP

### Autenticación
- **Google OAuth** y **Apple OAuth** únicamente.
- Sin email/password en MVP. Diseño extensible para añadirlo después.

### Grupos
- Acceso mediante **código de invitación** generado por el admin/owner.
- El código puede compartirse libremente (WhatsApp, etc.).
- **Visibilidad de eventos**: solo visible para miembros del grupo.

### Roles
| Rol | Capacidades |
|---|---|
| **Owner** | Único. Crea el grupo, gestiona co-admins, puede eliminarlo |
| **Co-admin** | Crea/edita/cancela eventos, gestiona miembros |
| **Member** | Se apunta/desapunta de eventos, invita externos |

### Eventos
- **Una plaza por usuario** por evento (sin selección de pista/recurso específico).
- **No hay eventos recurrentes** en MVP.
- Los eventos son visibles solo para miembros del grupo.

### Waitlist
- Lista de espera **automática**: si el evento está lleno, el usuario entra en waitlist.
- Promoción **FIFO e inmediata** cuando se libera una plaza (vía Hangfire job).
- No hay opción de "mantener en waitlist voluntariamente" en MVP.

### Invitados externos
- Cualquier **miembro** puede invitar a un usuario externo al grupo (no miembro).
- El externo ocupa plaza igual que un miembro, pero no tiene acceso al grupo.

### Notificaciones
- **Push** (FCM) + **Email** (Resend).
- Casos cubiertos en MVP:
  - Confirmación de inscripción
  - Promoción desde waitlist
  - Cancelación de evento
  - Recordatorio previo al evento

### Pagos
- **Sin pagos en MVP**.
- El diseño del dominio debe permitir añadir pagos en el futuro sin romper el modelo (campo `price` nullable, estado de pago como extensión).

---

## Reglas de negocio clave

1. Un usuario no puede apuntarse dos veces al mismo evento.
2. Si un usuario cancela su plaza, la siguiente persona en waitlist es promovida automáticamente (FIFO).
3. El owner no puede abandonar el grupo sin transferir la propiedad.
4. Un co-admin no puede degradar a otro co-admin (solo el owner puede).
5. Los eventos cancelados no liberan plazas a la waitlist (el evento desaparece).

---

## Out of scope (MVP)

- Pagos / sistema de cobro
- Eventos recurrentes
- Múltiples grupos por usuario (a revisar — actualmente sin restricción técnica)
- Chat / comentarios en eventos
- Foto de perfil de usuario (solo OAuth avatar)
- Analytics / dashboard de admin
- App web administración (el admin gestiona desde la misma app)

---

## Decisiones pendientes de confirmar

| Decisión | Estado | Opciones |
|---|---|---|
| ¿Límite de miembros por grupo? | ❓ Sin decidir | Sin límite / X miembros |
| ¿Múltiples grupos por usuario? | ❓ Sin decidir | Sí (ya soportado) / 1 solo |
| ¿El código de invitación expira? | ❓ Sin decidir | Nunca / X días / uso único |
