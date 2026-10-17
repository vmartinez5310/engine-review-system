function api_obtenerResenasPublicas() {
  const resenas = db_leerTodo(BD.RESENAS);
  return resenas.filter(r => String(r.Estado).trim() === 'Aprobado').map(r => ({
    cliente: r.Nombre_Cliente || r.Cliente,
    zona: r.Zona_Servicio || r.Zona_Propiedad,
    calificacion: parseFloat(r.Calificacion) || 0,
    comentario: r.Valor_Gestion || r.Comentario,
    respuesta: r.Respuesta_Admin || "",
    fecha: r.Fecha_Envio || r.Fecha
  }));
}

function api_guardarResenaPublica(data) {
  // SEGURIDAD ESTRICTA: Se elimina el bypass temporal. Todo request debe traer un token válido.
  validarRecaptcha(data.recaptcha_token);
  
  let userId = "WEB"; 
  if (data.token_id) {
    const token = db_leerTodo(BD.TOKENS).find(t => t.ID_Enlace === data.token_id && t.Estado === 'Activo');
    if (token) {
      db_actualizarCampos(BD.TOKENS, token._fila, { "Estado": "Usado" });
      userId = extraerUserId(token);
    }
  }
  
  const legalOk = (data.aviso_privacidad_aceptado === true || String(data.aviso_privacidad_aceptado) === "true");
  const nombreLimpio = limpiarTexto(data.nombre_publico);
  const comentarioLimpio = limpiarTexto(data.valor_gestion_resena);
  const idResena = 'RES-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  
  db_crearFila(BD.RESENAS, [idResena, userId, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), nombreLimpio, limpiarTexto(data.zona_propiedad), data.calificacion, comentarioLimpio, legalOk, 'Pendiente', '']);
  
  if (legalOk && userId !== "WEB") notificarAdminUsuario(userId, nombreLimpio, data.calificacion, comentarioLimpio);
  return { message: "Reseña registrada con éxito." };
}

function dash_obtenerResenas(token) {
  requerirPermiso('ver_dashboard', token);
  
  const usuarios = db_leerTodo(BD.WHITELIST || 'Whitelist');
  const mapaAsesores = {};
  usuarios.forEach(u => {
    if (u.UserId) {
      mapaAsesores[u.UserId] = u.Nombre || '';
    }
  });

  return db_leerTodo(BD.RESENAS).map(r => ({
    fila: r._fila,
    id: r.ID_Resena,
    suserId: r.UserId,
    asesor: mapaAsesores[r.UserId] || 'Sin asignar',
    fecha: r.Fecha,
    cliente: r.Cliente,
    servicio: r.Servicio,
    calificacion: parseFloat(r.Calificacion) || 0,
    comentario: r.Comentario || "",
    legalOk: r.Legal_OK === true || r.Legal_OK === "TRUE",
    estado: r.Estado,
    respuesta: r.Respuesta_Admin || ""
  })).reverse();
}

function dash_actualizarResena(token, fila, estado, respuesta) {
  requerirPermiso('editar_resena', token);
  const actualizaciones = { "Estado": estado };
  if (respuesta !== undefined) actualizaciones["Respuesta_Admin"] = limpiarTexto(respuesta);
  if (estado === 'Aprobado') actualizaciones["Aviso_Privacidad"] = true;
  else if (estado === 'No aprobado') actualizaciones["Aviso_Privacidad"] = false;
  
  db_actualizarCampos(BD.RESENAS, fila, actualizaciones);
  return { message: "Reseña actualizada." };
}

function dash_generarEnlaceCliente(tokenDashboard, nombreCliente, servicio) {
  const credenciales = requerirPermiso('generar_enlace', tokenDashboard);
  const usuario = db_leerTodo(BD.WHITELIST).find(u => String(u.Email).toLowerCase().trim() === credenciales.email);
  if (!usuario) throw new Error("Usuario gestor no encontrado.");
  
  const linkId = 'LNK-' + Utilities.getUuid().substring(0, 6).toUpperCase();
  const nLimpio = limpiarTexto(nombreCliente);
  const zLimpia = limpiarTexto(servicio);
  
  const header = Utilities.base64EncodeWebSafe(JSON.stringify({alg: "HS256", typ: "JWT"}));
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify({ id: linkId, u: extraerUserId(usuario), n: nLimpio, z: zLimpia }));
  const signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(`${header}.${payload}`, SEGURIDAD.SECRET_FIRMA));
  
  // SIN HARDCODE: Construimos el link final usando el parámetro del CMS
  const cfg = getConfig();
  if (!cfg.urlFrontend) throw new Error("Falta el parámetro 'URL_Frontend_App' en la hoja de Configuración.");
  const urlFinal = `${cfg.urlFrontend}?t=${header}.${payload}.${signature}`; 
  
  db_crearFila(BD.TOKENS, [linkId, extraerUserId(usuario), Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), nLimpio, zLimpia, urlFinal, 'Activo']);
  return { url: urlFinal };
}

function dash_obtenerSeguimientos(token) {
  requerirPermiso('ver_seguimientos', token);
  const hoy = new Date(); 
  return db_leerTodo(BD.TOKENS).filter(t => t.Estado === 'Activo').map(t => {
    const f = t.Fecha_Envio.split('-'); 
    return { fila: t._fila, id: t.ID_Enlace, fecha: t.Fecha_Envio, cliente: t.Nombre_Cliente, servicio: t.Zona_Servicio, url: t.URL_Generada, dias: Math.floor(Math.abs(hoy - new Date(f[0], f[1] - 1, f[2])) / 86400000) };
  }).reverse();
}

function dash_revocarEnlace(token, filaToken) {
  requerirPermiso('editar_resena', token);
  db_actualizarCampos(BD.TOKENS, filaToken, { "Estado": "Cancelado" });
  return { message: "Enlace revocado." };
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
  const sheet = getSheet(BD.WHITELIST);

  if (db_leerTodo(BD.WHITELIST).some(u => String(u.Email).toLowerCase() === emailLimpio)) {
    throw new Error('Correo ya registrado.');
  }

  const numColumnas = sheet.getLastColumn();
  let nuevaFila = new Array(numColumnas).fill('');
  nuevaFila[0] = limpiarTexto(idUser);
  nuevaFila[1] = limpiarTexto(nombre);
  nuevaFila[2] = emailLimpio;

  const headers = sheet.getRange(1, 1, 1, numColumnas).getValues()[0].map(h => String(h).trim());
  const colEstado = headers.indexOf('Estado');
  const colRol = headers.indexOf('Rol');
  const colLogo = headers.indexOf('Logo');

  if (colEstado !== -1) nuevaFila[colEstado] = 'Pendiente';
  if (colRol !== -1) nuevaFila[colRol] = String(rolAsignado || 'USUARIO').trim();
  if (colLogo !== -1) nuevaFila[colLogo] = String(logoUrl || '').trim();

  db_crearFila(BD.WHITELIST, nuevaFila);
  return { message: 'Usuario anadido.' };
}

function auth_obtenerInfoUsuario(token) {
  const payload = requerirPermiso('ver_dashboard', token);
  const whitelist = db_leerTodo(BD.WHITELIST);
  const usuarioDB = whitelist.find(u => String(u.Email).toLowerCase().trim() === String(payload.email).toLowerCase());

  if (!usuarioDB || String(usuarioDB.Estado).toUpperCase().trim() !== 'ACTIVO') {
    throw new Error('Usuario inactivo o revocado.');
  }

  const rol = String(usuarioDB.Rol || 'USUARIO').toUpperCase().trim();

  // Conteos reales para la campana de notificaciones
  const resenas = db_leerTodo(BD.RESENAS);
  const tokens = db_leerTodo(BD.TOKENS);
  const hoy = new Date();

  const resenasNuevas = resenas.filter(r => String(r.Estado).trim() === 'Pendiente').length;
  const seguimientosAtrasados = tokens.filter(t => {
    if (String(t.Estado).trim() !== 'Activo') return false;
    const f = String(t.Fecha_Envio || '').split('-');
    if (f.length < 3) return false;
    const fecha = new Date(f[0], f[1] - 1, f[2]);
    const dias = Math.floor((hoy - fecha) / 86400000);
    return dias > 7;
  }).length;

  return {
    userId: usuarioDB.UserId || usuarioDB.ID,
    nombre: usuarioDB.Nombre,
    email: usuarioDB.Email,
    rol: usuarioDB.Rol,
    estado: usuarioDB.Estado,
    permisos: ROLES[rol] || ROLES['USUARIO'],
    notificaciones: {
      resenasNuevas: resenasNuevas,
      seguimientosAtrasados: seguimientosAtrasados
    }
  };
}

function dash_actualizarEstadoUsuario(token, filaUsuario, nuevoEstado) {
  requerirPermiso('gestionar_usuarios', token);
  db_actualizarCampos(BD.WHITELIST, filaUsuario, { "Estado": nuevoEstado });
  return { message: "Estado actualizado." };
}

function dash_agregarUsuario(token, idUser, nombre, email, rolAsignado) {
  requerirPermiso('gestionar_usuarios', token);
  const emailLimpio = String(email).toLowerCase().trim();
  const sheet = getSheet(BD.WHITELIST);
  
  if (db_leerTodo(BD.WHITELIST).some(u => String(u.Email).toLowerCase() === emailLimpio)) throw new Error("Correo ya registrado.");
  
  const numColumnas = sheet.getLastColumn();
  let nuevaFila = new Array(numColumnas).fill(''); 
  nuevaFila[0] = limpiarTexto(idUser); nuevaFila[1] = limpiarTexto(nombre); nuevaFila[2] = emailLimpio; 
  
  const headers = sheet.getRange(1, 1, 1, numColumnas).getValues()[0].map(h => String(h).trim());
  const colEstado = headers.indexOf("Estado"); const colRol = headers.indexOf("Rol");
  if(colEstado !== -1) nuevaFila[colEstado] = 'Pendiente'; 
  if(colRol !== -1) nuevaFila[colRol] = String(rolAsignado || 'USUARIO').trim();    
  
  db_crearFila(BD.WHITELIST, nuevaFila); 
  return { message: 'Usuario añadido.' };
}

function dash_llamarGemini(token, prompt) {
  requerirPermiso('editar_resena', token); 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${SEGURIDAD.GeminiAPI}`;
  const response = UrlFetchApp.fetch(url, { "method": "post", "contentType": "application/json", "payload": JSON.stringify({ "contents": [{ "parts": [{ "text": limpiarTexto(prompt) }] }], "generationConfig": { "temperature": 0.4 } }), "muteHttpExceptions": true });
  const json = JSON.parse(response.getContentText());
  
  if (json.candidates && json.candidates.length > 0) return { texto: json.candidates[0].content.parts[0].text.trim() };
  throw new Error("Sin respuesta de la IA.");
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
  
  return { message: "Configuración del sistema actualizada correctamente." };
}