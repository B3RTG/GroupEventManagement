# Edge cases críticos

Problemas no obvios que deben resolverse correctamente para que el sistema sea fiable. Cada uno tiene su estrategia de solución definida.

---

## 1. Race condition en registro

**Problema**: dos usuarios se apuntan simultáneamente al último sitio disponible.

**Solución**: usar `SELECT FOR UPDATE` en la fila del evento al registrar. Nunca contar plazas disponibles a nivel de aplicación y luego insertar — esa ventana de tiempo es el bug.

```csharp
// En RegistrationService
await dbContext.Database.ExecuteSqlAsync(
    "SELECT id FROM events WHERE id = {0} FOR UPDATE", eventId);
var confirmedCount = await dbContext.EventRegistrations
    .CountAsync(r => r.EventId == eventId && r.Status == RegistrationStatus.Confirmed);
if (confirmedCount >= event.TotalCapacity)
    throw new EventFullException();
```

---

## 2. Fallo en promoción de waitlist

**Problema**: un usuario cancela su plaza → se intenta promover al primero en waitlist → falla a mitad. Resultado: plaza perdida.

**Solución**: cancelación + promoción en **una sola transacción**. Si falla la promoción, rollback completo (la cancelación no se aplica). El usuario que quería cancelar ve un error y reintenta.

---

## 3. Admin cancela múltiples registros rápido

**Problema**: el admin cancela el evento mientras varios usuarios se están apuntando simultáneamente → inconsistencias.

**Solución**: procesar cancelaciones en serie con row-level locking. Nunca en paralelo cuando afectan al mismo evento.

---

## 4. Invitado externo con miembro que abandonó el grupo

**Problema**: el miembro que invitó a un externo abandona el grupo. El invitado queda "huérfano" — su `invited_by` ya no es miembro.

**Política a definir** (pendiente de confirmar con producto):
- Opción A: el invitado mantiene su plaza hasta el final del evento (no se expulsa).
- Opción B: al salir el miembro, se cancelan sus invitaciones activas.

> Ver [product-decisions.md](./product-decisions.md) — actualmente en "Decisiones pendientes".

---

## 5. Reducción de capacidad con plazas ocupadas

**Problema**: el admin reduce el aforo de un evento que ya tiene gente apuntada.

**Solución**: bloquear la reducción si `nueva_capacidad < registros_confirmados_actuales`. Devolver error claro al cliente: "No puedes reducir la capacidad por debajo de los X inscritos actuales".

---

## 6. Borrado de cuenta (GDPR)

**Problema**: el usuario quiere eliminar su cuenta, pero tiene registros históricos que afectan a otros (un grupo que administra, eventos pasados, etc.).

**Solución** (flujo en orden):
1. Cancelar todos sus registros futuros → disparar promoción de waitlist para cada uno.
2. Si es owner de un grupo: transferir ownership o disolver el grupo (política a definir).
3. Anonimizar campos personales: `email → null`, `display_name → "Usuario eliminado"`, `avatar_url → null`.
4. Marcar `is_active = false`.
5. **Nunca borrar la fila** — los registros históricos (audit_logs, event_registrations pasados) deben mantenerse con el ID intacto.

---

## 7. Fuerza bruta en códigos de invitación

**Problema**: un atacante prueba códigos de invitación hasta dar con uno válido.

**Solución**:
- Rate limit: **10 intentos por IP por minuto** en el endpoint `POST /groups/join`.
- Los códigos deben tener suficiente entropía (mínimo 8 caracteres alfanuméricos → ~2.8 billones de combinaciones).
- El admin puede regenerar el código manualmente si sospecha de abuso.

---

## 8. Apple OAuth — email relay

**Problema**: Apple puede devolver un email de relay (`@privaterelay.appleid.com`) que cambia entre sesiones, o el usuario puede optar por no compartir su email.

**Solución**: usar siempre el campo `sub` (subject) del JWT de Apple como identificador único, nunca el email. El UNIQUE constraint en `users` es sobre `(external_id, auth_provider)`, no sobre email.

---

## 9. Push token obsoleto (FCM)

**Problema**: FCM devuelve `UNREGISTERED` cuando el token ya no es válido (app desinstalada, token rotado).

**Solución**:
1. Al recibir `UNREGISTERED` de FCM → eliminar el token (`users.push_token = null`).
2. Marcar la notificación como `failed`.
3. No reintentar notificaciones push para ese usuario hasta que registre un nuevo token.

---

## 10. Zona horaria de los eventos

**Problema**: un evento en Madrid a las 20:00 debe mostrarse a las 20:00 para usuarios en Madrid, pero en UTC es las 18:00 (o 19:00 en invierno).

**Solución**:
- Almacenar `scheduled_at` **siempre en UTC** en la base de datos.
- Almacenar también el campo `timezone` con la TZ del lugar (IANA, ej. `Europe/Madrid`).
- En el cliente, mostrar siempre en la TZ del evento (`timezone`), no en la TZ del dispositivo del usuario.
- Los recordatorios se calculan contra UTC, pero el texto del mensaje muestra la hora local del evento.

---

## 11. Inscripción tardía y recordatorios duplicados

**Problema**: el job de recordatorio se ejecuta 24h antes del evento. Un usuario que se inscribe 2h antes nunca recibe recordatorio.

**Solución**: al crear un registro, si `scheduled_at - now() < 24h`, enviar el recordatorio inmediatamente usando la clave de idempotencia `reminder:{eventId}:{userId}`. Así el job no lo volverá a enviar si ya fue enviado.

---

## 12. Verificación de membresía dentro de la transacción de registro

**Problema**: verificar que el usuario es miembro del grupo *antes* de la transacción y luego registrar deja una ventana de tiempo. El usuario podría ser expulsado entre la verificación y el registro.

**Solución**: incluir la verificación de membresía activa **dentro de la misma transacción** de registro, no solo como check de autorización previo en el middleware.

```csharp
// Dentro de la transacción de RegistrationService
var isMember = await dbContext.GroupMemberships
    .AnyAsync(m => m.GroupId == group.Id && m.UserId == userId && m.IsActive);
if (!isMember)
    throw new NotGroupMemberException();
// ... continuar con el registro
```
