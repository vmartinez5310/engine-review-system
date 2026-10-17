// Opcional: Solo si necesitas confirmar que el API está viva desde un navegador
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Inmobiliarte Engine API Online', version: '2.0 Headless' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// EL ENRUTADOR PRINCIPAL (Switchboard)
function doPost(e) {
  try {
    // 1. Extraemos el cuerpo de la petición enviada desde tu GitHub Pages o CMS
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload || {};
    const token = body.token || null;

    let result;

    // 2. Desviamos la llamada según la acción solicitada
    switch(action) {
      // --- ENDPOINTS PÚBLICOS ---
      case 'get_public_reviews':
        result = api_obtenerResenasPublicas();
        break;
      case 'submit_review':
        result = api_guardarResenaPublica(payload);
        break;

      // --- ENDPOINTS DE AUTENTICACIÓN ---
      case 'request_otp':
        result = auth_solicitarOTP(payload.email);
        break;
      case 'verify_otp':
        result = auth_verificarOTP(payload.email, payload.otp);
        break;

      // --- ENDPOINTS PRIVADOS DEL DASHBOARD (Requieren Token) ---
      case 'get_dashboard_reviews':
        result = dash_obtenerResenas(token);
        break;
      case 'update_review':
        result = dash_actualizarResena(token, payload.fila, payload.estado, payload.respuesta);
        break;
      case 'generate_link':
        result = dash_generarEnlaceCliente(token, payload.nombre, payload.servicio);
        break;
      case 'get_tracking':
        result = dash_obtenerSeguimientos(token);
        break;
      case 'revoke_link':
        result = dash_revocarEnlace(token, payload.fila);
        break;
      case 'get_users':
        result = dash_obtenerUsuarios(token);
        break;
      case 'update_user':
        result = dash_actualizarEstadoUsuario(token, payload.fila, payload.estado);
        break;
      case 'add_user':
        result = dash_agregarUsuario(token, payload.idUser, payload.nombre, payload.email, payload.rol);
        break;
      case 'call_ai':
        result = dash_llamarGemini(token, payload.prompt);
        break;
      case 'get_public_config':
        result = api_obtenerConfiguracionPublica();
        break;
      case 'update_config':
        result = dash_actualizarConfiguracion(token, payload.configuracion);
        break;
      case 'get_user_info':
        result = auth_obtenerInfoUsuario(token);
        break;

      // Acción no reconocida
      default:
        throw new Error("Acción de API no válida o no especificada.");
    }

    // 3. Empaquetamos la respuesta exitosa en el formato unificado
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 4. Si cualquier función falla o rechaza el token, lo atrapamos aquí y devolvemos un error limpio
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}