const BD = {
  WHITELIST: 'Whitelist',
  TOKENS: 'Tokens',
  RESENAS: 'Resenas',
  CONFIG: 'Configuracion'
};

const ROLES = {
  ADMINISTRADOR: ['ver_dashboard', 'generar_enlace', 'ver_seguimientos', 'editar_resena', 'gestionar_usuarios', 'configurar_sistema'],
  SUPERVISOR: ['ver_dashboard', 'generar_enlace', 'ver_seguimientos', 'editar_resena'],
  APROBADOR: ['ver_dashboard', 'editar_resena'],
  USUARIO: ['ver_dashboard', 'generar_enlace', 'ver_seguimientos']
};

const SEGURIDAD = {
  get SECRET_JWT() { return getSecret('SECRET_JWT'); },
  get SECRET_FIRMA() { return getSecret('SECRET_FIRMA'); },
  get RECAPTCHA_PROJECT() { return getSecret('RECAPTCHA_PROJECT'); },
  get RECAPTCHA_API_KEY() { return getSecret('RECAPTCHA_API_KEY'); },
  get RECAPTCHA_SITE_KEY() { return getSecret('RECAPTCHA_SITE_KEY'); },
  get GeminiAPI() { return getSecret('GEMINI_API_KEY'); }
};

function getSecret(key) {
  const val = PropertiesService.getScriptProperties().getProperty(key);
  if (!val) throw new Error('Falta Script Property: ' + key);
  return val;
}

function getConfig() {
  const config = { nombre: 'Sistema', color: '#333333', logoH: '', logoV: '', urlFrontend: '', recaptchaSiteKey: '' };
  try {
    const data = getSheet(BD.CONFIG).getDataRange().getValues();
    const map = {
      Empresa_Nombre: 'nombre',
      Color_Primario: 'color',
      Logo_Horizontal: 'logoH',
      Logo_Vertical: 'logoV',
      URL_Frontend_App: 'urlFrontend'
    };
    data.forEach(row => {
      const key = String(row[0]).trim();
      if (map[key]) config[map[key]] = String(row[1]).trim();
    });
  } catch (e) {}
  try {
    config.recaptchaSiteKey = SEGURIDAD.RECAPTCHA_SITE_KEY || '';
  } catch (e) {}
  return config;
}

/** Valida JWT de invitación (SECRET_FIRMA) y estado Activo en hoja Tokens. */
function api_validarTokenInvitacion(tokenStr) {
  const cfg = getConfig();
  const redirectUrl = cfg.urlFrontend ? String(cfg.urlFrontend).split('?')[0] : '';

  if (!tokenStr || typeof tokenStr !== 'string') {
    return { valid: false, reason: 'missing_token', redirectUrl };
  }

  const parts = tokenStr.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'malformed', redirectUrl };
  }

  try {
    const expected = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(parts[0] + '.' + parts[1], SEGURIDAD.SECRET_FIRMA)
    );
    if (expected !== parts[2]) {
      return { valid: false, reason: 'bad_signature', redirectUrl };
    }

    const payloadJson = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();
    const claims = JSON.parse(payloadJson);
    const linkId = String(claims.id || '').trim();
    if (!linkId) {
      return { valid: false, reason: 'missing_id', redirectUrl };
    }

    const row = db_leerTodo(BD.TOKENS).find(t => String(t.ID_Enlace).trim() === linkId);
    if (!row) {
      return { valid: false, reason: 'not_found', redirectUrl };
    }

    const estado = String(row.Estado || '').trim();
    if (estado !== 'Activo') {
      return {
        valid: false,
        reason: estado === 'Usado' ? 'already_used' : 'inactive',
        redirectUrl,
        token_id: linkId
      };
    }

    return {
      valid: true,
      token_id: linkId,
      nombre_cliente: claims.n || row.Nombre_Cliente || '',
      zona_servicio: claims.z || row.Zona_Servicio || '',
      redirectUrl,
      brand: {
        nombre: cfg.nombre,
        color: cfg.color,
        logoH: cfg.logoH,
        logoV: cfg.logoV,
        recaptchaSiteKey: cfg.recaptchaSiteKey
      }
    };
  } catch (e) {
    return { valid: false, reason: 'error', redirectUrl, message: e.message };
  }
}
