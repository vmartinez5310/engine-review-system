function validarRecaptcha(token) {
  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${SEGURIDAD.RECAPTCHA_PROJECT}/assessments?key=${SEGURIDAD.RECAPTCHA_API_KEY}`;
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      event: { token, expectedAction: 'submit', siteKey: SEGURIDAD.RECAPTCHA_SITE_KEY }
    }),
    muteHttpExceptions: true
  });
  const json = JSON.parse(res.getContentText());
  if (!json.tokenProperties?.valid || (json.riskAnalysis?.score < 0.5)) {
    throw new Error('Petición bloqueada por seguridad anti-spam.');
  }
}

function requerirPermiso(permiso, token) {
  if (!token) throw new Error('Acceso denegado. Token no proporcionado.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado.');

  const firma = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(`${parts[0]}.${parts[1]}`, SEGURIDAD.SECRET_JWT)
  );
  if (firma !== parts[2]) throw new Error('Firma de seguridad inválida.');

  const datos = JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[1])).getDataAsString());
  if (datos.exp < Date.now()) throw new Error('Sesión expirada.');

  const rol = String(datos.rol).toUpperCase();
  const perms = ROLES[rol] || ROLES.USUARIO;
  if (!perms.includes(permiso)) throw new Error('Privilegios insuficientes para esta acción.');

  return { email: datos.email, nombre: datos.nombre, rol };
}

function auth_solicitarOTP(emailAdmin) {
  const email = String(emailAdmin).toLowerCase().trim();
  const usuario = db_leerTodo(BD.WHITELIST).find(u => String(u.Email).toLowerCase().trim() === email);

  if (!usuario) throw new Error('Correo no registrado en el sistema.');
  if (String(usuario.Estado || '').trim().toUpperCase() === 'SUSPENDIDO') {
    throw new Error('Acceso revocado.');
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  CacheService.getScriptCache().put(`OTP_${email}`, otp, 600);

  const bloque = `<div style="padding:20px;text-align:center"><span style="font-size:40px;font-weight:bold;letter-spacing:8px">${otp}</span></div>`;
  enviarCorreoTemplate(email, `Tu código de acceso: ${otp}`, 'Seguridad', 'Acceso de Seguridad', 'Ingresa el siguiente código de 6 dígitos:', bloque);

  return { message: 'Código enviado correctamente.' };
}

function auth_verificarOTP(emailAdmin, otpIngresado) {
  const email = String(emailAdmin).toLowerCase().trim();
  const cache = CacheService.getScriptCache();

  if (cache.get(`LOCK_${email}`)) {
    throw new Error('Cuenta bloqueada temporalmente por intentos fallidos. Intenta en 15 minutos.');
  }

  const otpGuardado = cache.get(`OTP_${email}`);
  if (!otpGuardado || otpGuardado !== String(otpIngresado)) {
    let intentos = parseInt(cache.get(`ATTEMPTS_${email}`) || '0', 10) + 1;
    if (intentos >= 5) {
      cache.put(`LOCK_${email}`, 'true', 900);
      cache.remove(`ATTEMPTS_${email}`);
      throw new Error('Máximo de intentos alcanzado. Cuenta bloqueada por seguridad.');
    }
    cache.put(`ATTEMPTS_${email}`, String(intentos), 900);
    throw new Error(`Código inválido o expirado. Intentos restantes: ${5 - intentos}`);
  }

  cache.remove(`OTP_${email}`);
  cache.remove(`ATTEMPTS_${email}`);

  const usuario = db_leerTodo(BD.WHITELIST).find(u => String(u.Email).toLowerCase().trim() === email);
  if (!usuario) throw new Error('Usuario no encontrado en el sistema.');

  if (String(usuario.Estado || '').trim().toUpperCase() === 'PENDIENTE') {
    db_actualizarCampos(BD.WHITELIST, usuario._fila, { Estado: 'Activo' });
  }

  const header = Utilities.base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = Utilities.base64Encode(JSON.stringify({
    userId: String(usuario.UserId || usuario.ID || '').trim(),
    email,
    nombre: String(usuario.Nombre || 'Usuario').trim(),
    rol: String(usuario.Rol || 'USUARIO').toUpperCase().trim(),
    estado: String(usuario.Estado || 'ACTIVO').toUpperCase().trim(),
    exp: Date.now() + 86400000
  }));
  const firma = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(`${header}.${payload}`, SEGURIDAD.SECRET_JWT)
  );

  return { token: `${header}.${payload}.${firma}` };
}
