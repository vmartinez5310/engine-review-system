/**
 * REEMPLAZA la funcion auth_obtenerInfoUsuario en tu Auth.gs / API_Dashboard.gs
 * Anade el objeto notificaciones con conteos reales.
 */
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
