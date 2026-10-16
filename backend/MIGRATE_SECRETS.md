# Migrar secretos a Script Properties

En tu codigo actual reemplaza:

```js
SEGURIDAD.SECRET_JWT
SEGURIDAD.SECRET_FIRMA
SEGURIDAD.RECAPTCHA_PROJECT
SEGURIDAD.RECAPTCHA_API_KEY
SEGURIDAD.RECAPTCHA_SITE_KEY
SEGURIDAD.GeminiAPI
```

por:

```js
getSecret('SECRET_JWT')
getSecret('SECRET_FIRMA')
getSecret('RECAPTCHA_PROJECT')
getSecret('RECAPTCHA_API_KEY')
getSecret('RECAPTCHA_SITE_KEY')
getSecret('GEMINI_API_KEY')
```

Y elimina el objeto `const SEGURIDAD = { ... }` del codigo fuente.

La funcion `getSecret` esta en `Config.gs`.

Configura los valores en: Project Settings -> Script properties.
