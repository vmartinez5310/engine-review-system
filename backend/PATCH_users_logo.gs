/**
 * CAMBIO EN LA HOJA (hazlo manual una vez):
 * Whitelist -> anade columna con header exacto: Logo
 * (al final de los headers actuales: UserId | Nombre | Email | Estado | Rol | Logo)
 *
 * Luego reemplaza estas dos funciones en tu API_Dashboard.gs / Auth.
 */

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

/**
 * En doPost, case 'add_user', pasa el logo:
 *   result = dash_agregarUsuario(token, payload.idUser, payload.nombre, payload.email, payload.rol, payload.logo);
 *
 * En auth_obtenerInfoUsuario, incluye logo en el return:
 *   logo: usuarioDB.Logo || ''
 */
