function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: 'Inmobiliarte Engine API Online', version: '2.1' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, payload = {}, token = null } = body;

    const handlers = {
      get_public_reviews: () => api_obtenerResenasPublicas(),
      submit_review: () => api_guardarResenaPublica(payload),
      request_otp: () => auth_solicitarOTP(payload.email),
      verify_otp: () => auth_verificarOTP(payload.email, payload.otp),
      get_dashboard_reviews: () => dash_obtenerResenas(token),
      update_review: () => dash_actualizarResena(token, payload.fila, payload.estado, payload.respuesta),
      generate_link: () => dash_generarEnlaceCliente(token, payload.nombre, payload.servicio),
      get_tracking: () => dash_obtenerSeguimientos(token),
      revoke_link: () => dash_revocarEnlace(token, payload.fila),
      get_users: () => dash_obtenerUsuarios(token),
      update_user: () => dash_actualizarEstadoUsuario(token, payload.fila, payload.estado),
      add_user: () => dash_agregarUsuario(token, payload.idUser, payload.nombre, payload.email, payload.rol, payload.logo),
      call_ai: () => dash_llamarGemini(token, payload.prompt),
      get_public_config: () => api_obtenerConfiguracionPublica(),
      update_config: () => dash_actualizarConfiguracion(token, payload.configuracion),
      get_user_info: () => auth_obtenerInfoUsuario(token)
    };

    const handler = handlers[action];
    if (!handler) throw new Error('Acción de API no válida o no especificada.');

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: handler() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
