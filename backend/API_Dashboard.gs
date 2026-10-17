function api_obtenerResenasPublicas() {
  return db_leerTodo(BD.RESENAS)
    .filter(r => String(r.Estado).trim() === 'Aprobado')
    .map(r => ({
      cliente: r.Nombre_Cliente || r.Cliente,
      zona: r.Zona_Servicio || r.Zona_Propiedad,
      calificacion: parseFloat(r.Calificacion) || 0,
      comentario: r.Valor_Gestion || r.Comentario,
      respuesta: r.Respuesta_Admin || '',
      fecha: r.Fecha_Envio || r.Fecha
    }));
}

function api_guardarResenaPublica(data) {
  validarRecaptcha(data.recaptcha_token);

  let userId = 'WEB';
  if (data.token_id) {
    const token = db_leerTodo(BD.TOKENS).find(t => t.ID_Enlace === data.token_id && t.Estado === 'Activo');
    if (token) {
      db_actualizarCampos(BD.TOKENS, token._fila, { Estado: 'Usado' });
      userId = extraerUserId(token);
    }
  }

  const legalOk = data.aviso_privacidad_aceptado === true || String(data.aviso_privacidad_aceptado) === 'true';
  const nombre = limpiarTexto(data.nombre_publico);
  const comentario = limpiarTexto(data.valor_gestion_resena);
  const id = 'RES-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  db_crearFila(BD.RESENAS, [
    id, userId, fecha, nombre, limpiarTexto(data.zona_propiedad),
    data.calificacion, comentario, legalOk, 'Pendiente', ''
  ]);

  if (legalOk && userId !== 'WEB') {
    notificarAdminUsuario(userId, nombre, data.calificacion, comentario);
  }
  return { message: 'Reseña registrada con éxito.' };
}

function dash_obtenerResenas(token) {
  requerirPermiso('ver_dashboard', token);

  const mapa = {};
  db_leerTodo(BD.WHITELIST).forEach(u => {
    if (u.UserId) mapa[u.UserId] = u.Nombre || '';
  });

  return db_leerTodo(BD.RESENAS).map(r => ({
    fila: r._fila,
    id: r.ID_Resena,
    suserId: r.UserId,
    asesor: mapa[r.UserId] || 'Sin asignar',
    fecha: r.Fecha,
    cliente: r.Cliente,
    servicio: r.Servicio,
    calificacion: parseFloat(r.Calificacion) || 0,
    comentario: r.Comentario || '',
    legalOk: r.Legal_OK === true || r.Legal_OK === 'TRUE',
    estado: r.Estado,
    respuesta: r.Respuesta_Admin || ''
  })).reverse();
}

function dash_actualizarResena(token, fila, estado, respuesta) {
  requerirPermiso('editar_resena', token);
  const updates = { Estado: estado };
  if (respuesta !== undefined) updates.Respuesta_Admin = limpiarTexto(respuesta);
  if (estado === 'Aprobado') updates.Aviso_Privacidad = true;
  else if (estado === 'No aprobado') updates.Aviso_Privacidad = false;
  db_actualizarCampos(BD.RESENAS, fila, updates);
  return { message: 'Reseña actualizada.' };
}

function dash_generarEnlaceCliente(tokenDashboard, nombreCliente, servicio) {
  const creds = requerirPermiso('generar_enlace', tokenDashboard);
  const usuario = db_leerTodo(BD.WHITELIST).find(u => String(u.Email).toLowerCase().trim() === creds.email);
  if (!usuario) throw new Error('Usuario gestor no encontrado.');

  const linkId = 'LNK-' + Utilities.getUuid().substring(0, 6).toUpperCase();
  const n = limpiarTexto(nombreCliente);
  const z = limpiarTexto(servicio);
  const uid = extraerUserId(usuario);

  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify({ id: linkId, u: uid, n, z }));
  const sig = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(`${header}.${payload}`, SEGURIDAD.SECRET_FIRMA)
  );

  const cfg = getConfig();
  if (!cfg.urlFrontend) throw new Error("Falta 'URL_Frontend_App' en Configuración.");
  const url = `${cfg.urlFrontend}?t=${header}.${payload}.${sig}`;

  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  db_crearFila(BD.TOKENS, [linkId, uid, fecha, n, z, url, 'Activo']);
  return { url };
}

function dash_obtenerSeguimientos(token) {
  requerirPermiso('ver_seguimientos', token);
  const hoy = new Date();
  return db_leerTodo(BD.TOKENS)
    .filter(t => t.Estado === 'Activo')
    .map(t => {
      const f = String(t.Fecha_Envio || '').split('-');
      const dias = f.length >= 3
        ? Math.floor(Math.abs(hoy - new Date(+f[0], +f[1] - 1, +f[2])) / 86400000)
        : 0;
      return {
        fila: t._fila,
        id: t.ID_Enlace,
        fecha: t.Fecha_Envio,
        cliente: t.Nombre_Cliente,
        servicio: t.Zona_Servicio,
        url: t.URL_Generada,
        dias
      };
    }).reverse();
}

function dash_revocarEnlace(token, filaToken) {
  requerirPermiso('editar_resena', token);
  db_actualizarCampos(BD.TOKENS, filaToken, { Estado: 'Cancelado' });
  return { message: 'Enlace revocado.' };
}

function dash_obtenerUsuarios(token) {
  requerirPermiso('gestionar_usuarios', token);
  return db_leerTodo(BD.WHITELIST).map(u => ({
    fila: u._fila,
    id: extraerUserId(u),
    nombre: u.Nombre,
    email: u.Email,
    estado: u.Estado || 'Inactivo',
    rol: u.Rol || 'Usuario',
    logo: u.Logo || ''
  })).reverse();
}

function dash_agregarUsuario(token, idUser, nombre, email, rolAsignado, logoUrl) {
  requerirPermiso('gestionar_usuarios', token);
  const emailLimpio = String(email).toLowerCase().trim();
  if (db_leerTodo(BD.WHITELIST).some(u => String(u.Email).toLowerCase() === emailLimpio)) {
    throw new Error('Correo ya registrado.');
  }

  const sheet = getSheet(BD.WHITELIST);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const fila = new Array(headers.length).fill('');
  fila[0] = limpiarTexto(idUser);
  fila[1] = limpiarTexto(nombre);
  fila[2] = emailLimpio;

  const setCol = (name, val) => {
    const i = headers.indexOf(name);
    if (i !== -1) fila[i] = val;
  };
  setCol('Estado', 'Pendiente');
  setCol('Rol', String(rolAsignado || 'USUARIO').trim());
  setCol('Logo', String(logoUrl || '').trim());

  db_crearFila(BD.WHITELIST, fila);
  return { message: 'Usuario añadido.' };
}

function auth_obtenerInfoUsuario(token) {
  const payload = requerirPermiso('ver_dashboard', token);
  const usuario = db_leerTodo(BD.WHITELIST).find(u =>
    String(u.Email).toLowerCase().trim() === String(payload.email).toLowerCase()
  );

  if (!usuario || String(usuario.Estado).toUpperCase().trim() !== 'ACTIVO') {
    throw new Error('Usuario inactivo o revocado.');
  }

  const rol = String(usuario.Rol || 'USUARIO').toUpperCase().trim();
  const resenas = db_leerTodo(BD.RESENAS);
  const tokens = db_leerTodo(BD.TOKENS);
  const hoy = new Date();

  const resenasNuevas = resenas.filter(r => String(r.Estado).trim() === 'Pendiente').length;
  const seguimientosAtrasados = tokens.filter(t => {
    if (String(t.Estado).trim() !== 'Activo') return false;
    const f = String(t.Fecha_Envio || '').split('-');
    if (f.length < 3) return false;
    return Math.floor((hoy - new Date(+f[0], +f[1] - 1, +f[2])) / 86400000) > 7;
  }).length;

  return {
    userId: usuario.UserId || usuario.ID,
    nombre: usuario.Nombre,
    email: usuario.Email,
    rol: usuario.Rol,
    estado: usuario.Estado,
    permisos: ROLES[rol] || ROLES.USUARIO,
    notificaciones: { resenasNuevas, seguimientosAtrasados }
  };
}

function dash_actualizarEstadoUsuario(token, filaUsuario, nuevoEstado) {
  requerirPermiso('gestionar_usuarios', token);
  db_actualizarCampos(BD.WHITELIST, filaUsuario, { Estado: nuevoEstado });
  return { message: 'Estado actualizado.' };
}

function dash_llamarGemini(token, prompt) {
  requerirPermiso('editar_resena', token);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${SEGURIDAD.GeminiAPI}`;
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      contents: [{ parts: [{ text: limpiarTexto(prompt) }] }],
      generationConfig: { temperature: 0.4 }
    }),
    muteHttpExceptions: true
  });
  const json = JSON.parse(res.getContentText());
  if (json.candidates?.length) {
    return { texto: json.candidates[0].content.parts[0].text.trim() };
  }
  throw new Error('Sin respuesta de la IA.');
}

function api_obtenerConfiguracionPublica() {
  return getConfig();
}

function dash_actualizarConfiguracion(token, configuracionNueva) {
  requerirPermiso('configurar_sistema', token);
  const sheet = getSheet(BD.CONFIG);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    if (configuracionNueva[key] !== undefined) {
      sheet.getRange(i + 1, 2).setValue(configuracionNueva[key]);
    }
  }
  return { message: 'Configuración del sistema actualizada correctamente.' };
}
