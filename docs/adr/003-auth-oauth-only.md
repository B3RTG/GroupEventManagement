# ADR 003 — Autenticación: solo OAuth (Google + Apple)

**Fecha**: 2026-03-30  
**Estado**: Aceptado

## Contexto

Para el MVP se necesita una forma de autenticar usuarios. Las opciones principales son:

1. Email + password (con verificación, recuperación, etc.)
2. OAuth social (Google, Apple, etc.)
3. Combinación de ambas

## Decisión

**Solo Google OAuth y Apple OAuth** en MVP. Sin email/password.

## Motivo

- Elimina toda la complejidad de gestión de contraseñas, verificación de email, recuperación, etc.
- Apple OAuth es obligatorio en la App Store cuando se ofrece login social en iOS.
- Google OAuth cubre la gran mayoría de usuarios Android y web.
- El diseño debe permitir añadir email/password en el futuro sin romper el modelo de usuario.

## Consecuencias

**Positivo:**
- MVP más rápido de implementar y más seguro (sin passwords que gestionar).
- UX más fluida para el usuario (un click para entrar).

**Negativo:**
- Usuarios sin cuenta Google ni Apple no pueden acceder.
- Dependencia de terceros para la autenticación.

## Notas de implementación

- El backend emite un JWT propio tras validar el token OAuth, para no depender de Google/Apple en cada request.
- El campo `provider` en la entidad `User` permite añadir más providers en el futuro.
