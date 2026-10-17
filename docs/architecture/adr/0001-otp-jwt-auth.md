# ADR 0001: OTP and JWT Authentication

## Status

Accepted (updated to match production snapshot)

## Context

El Dashboard no debe usar contraseñas compartidas. Se requiere acceso por correo institucional controlado (whitelist) y sesión temporal.

Documentación temprana mencionaba Redis, access token corto y refresh token en cookie HttpOnly. La implementación real del proyecto usa el stack disponible en Google Apps Script.

## Decision

1. **OTP:** 6 dígitos, almacenado en `CacheService` con clave `OTP_{email}`, TTL **600 segundos**.
2. **Envío:** plantilla HTML de marca vía `MailApp` (`enviarCorreoTemplate`).
3. **Verificación:** comparación en claro del OTP en cache; contador de intentos `ATTEMPTS_*`; lock `LOCK_*` 900s tras 5 fallos.
4. **Sesión:** un único **JWT HS256** (header.payload.firma Base64), claim `exp` = now + **24h**, firmado con Script Property `SECRET_JWT`.
5. **Claims:** userId, email, nombre, rol, estado, exp.
6. **Cliente:** token en `localStorage` (`inm_dash_token`); cada request privado lo reenvía en el body JSON.
7. **Autorización:** `requerirPermiso(permiso, token)` valida firma, expiración y membresía del permiso en `ROLES[rol]`.

## Consequences

* Positivo: cero contraseñas, deploy simple en GAS, RBAC centralizado.
* Negativo: localStorage expone el JWT a XSS (mitigar con CSP y evitar HTML no sanitizado).
* Negativo: sin refresh token, a las 24h el usuario vuelve a OTP.
* Futuro opcional: access corto + refresh HttpOnly si se migra a hosting con backend propio; no invalida este ADR mientras el deploy sea GAS.

## Related

* RF-08, RNF-01, RNF-04, RNF-05
* Código: `backend/Auth.gs`, `backend/Config.gs` (`ROLES`, `SEGURIDAD`)
