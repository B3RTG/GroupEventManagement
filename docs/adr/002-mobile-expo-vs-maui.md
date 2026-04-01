# ADR 002 — Mobile: React Native + Expo (descartado .NET MAUI)

**Fecha**: 2026-03-30  
**Estado**: Aceptado

## Contexto

El proyecto necesita una app mobile multiplataforma (iOS + Android) con acceso a características del dispositivo: notificaciones push, cámara, biometría (futuro). Se evaluaron dos opciones:

1. **.NET MAUI** — framework mobile de Microsoft, integrado con el ecosistema .NET.
2. **React Native + Expo** — framework JS/TS, amplio ecosistema, comunidad madura.

## Decisión

**React Native + Expo SDK** con **Expo Router** para navegación.

## Motivo

| Criterio | MAUI | React Native + Expo |
|---|---|---|
| Madurez del ecosistema | Inmaduro (2022) | Muy maduro |
| Código compartido con web | Ninguno | Types, validators, api-client |
| Soporte de librerías de terceros | Limitado | Amplio |
| Comunidad y recursos | Pequeña | Grande |
| Acceso a device features | Bueno | Bueno (Expo SDK) |
| Distribución (OTA updates) | No | Sí (EAS Update) |

## Consecuencias

**Positivo:**
- Los paquetes `@repo/validators` y `@repo/api-client` se comparten entre web y mobile.
- Expo simplifica enormemente la configuración de build, push notifications y OAuth.
- Expo Router permite deep links nativos y navegación tipada.
- EAS permite distribución OTA sin pasar por App Store review para JS updates.

**Negativo:**
- El equipo necesita conocer tanto .NET (backend) como JS/TS (frontend + mobile).
- Algunas features nativas muy específicas pueden requerir módulos nativos personalizados.
