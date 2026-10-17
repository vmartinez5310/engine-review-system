function limpiarTexto(str) {
  if (typeof str !== 'string' || !str) return "";
  let limpio = str.replace(/[^a-zA-Z0-9 !?.,;:\-_\(\)'"\s]/g, '');
  if (/^[=\+\-@]/.test(limpio.trim())) limpio = "'" + limpio.trim(); 
  return limpio.trim();
}

function extraerUserId(obj) {
  if (!obj) return null;
  return obj.UserId_Admin || obj.UserId || obj[Object.keys(obj)[0]] || obj[Object.keys(obj)[1]];
}

function enviarCorreoTemplate(to, subject, nombreRemitente, titulo, subtitulo, bloqueHtml) {
  const cfg = getConfig();
  const htmlFinal = generarPlantillaPremium(titulo, subtitulo, bloqueHtml, cfg);
  MailApp.sendEmail({ to, subject, htmlBody: htmlFinal, name: `${cfg.nombre} - ${nombreRemitente}` });
}

function generarPlantillaPremium(titulo, subtitulo, contenidoHtml, cfg) {
  const anio = new Date().getFullYear();
  return `
    <div style="font-family: sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background-color: ${cfg.color}; padding: 30px 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${cfg.nombre}</h1>
        </div>
        <div style="padding: 40px 30px; text-align: left;">
          <h2 style="color: #1e293b; font-size: 20px; margin-top: 0;">${titulo}</h2>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 30px;">${subtitulo}</p>
          <div style="margin-bottom: 30px;">${contenidoHtml}</div>
          <hr style="border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Mensaje automático. No respondas a este correo.</p>
        </div>
      </div>
    </div>
  `;
}

function cron_dispararRecordatorios() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0); 
  const tokens = db_leerTodo(BD.TOKENS).filter(t => String(t.Estado).trim() === 'Activo');
  
  tokens.forEach(token => {
    const f = token.Fecha_Envio.split('-'); 
    const fechaEmision = new Date(f[0], f[1] - 1, f[2]); fechaEmision.setHours(0, 0, 0, 0); 
    const diasTranscurridos = Math.round((hoy - fechaEmision) / 86400000);
    
    if (diasTranscurridos === 7) {
      const whitelist = db_leerTodo(BD.WHITELIST);
      const gestor = whitelist.find(u => String(extraerUserId(u)).trim() === String(token.UserId_Admin).trim());
      if (!gestor || !gestor.Email) return;
      
      const mensajeWA = encodeURIComponent(`Hola ${token.Nombre_Cliente}. Esperamos tu reseña aquí: ${token.URL_Generada}`);
      const botonHtml = `<div style="text-align: center; margin: 30px 0;"><a href="https://api.whatsapp.com/send?text=${mensajeWA}" style="background-color: #25D366; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Recordar por WhatsApp</a></div>`;
      enviarCorreoTemplate(gestor.Email, `Reseña pendiente: ${token.Nombre_Cliente}`, "Seguimientos", `Seguimiento: ${token.Nombre_Cliente}`, `Han pasado 7 días sin recibir la reseña de este cliente.`, botonHtml);
    }
  });
}

function notificarAdminUsuario(userId, nombreCliente, calificacion, comentario) {
  const whitelist = db_leerTodo(BD.WHITELIST);
  const gestor = whitelist.find(u => extraerUserId(u) === userId);
  
  if (gestor && gestor.Email) {
    const cfg = getConfig();
    const bloqueResena = `<div style="padding: 20px; border-left: 4px solid ${cfg.color};"><p><strong>Calificación:</strong> ${calificacion} / 5</p><p><em>"${comentario}"</em></p></div>`;
    enviarCorreoTemplate(gestor.Email, `Nueva reseña (${calificacion}/5)`, "Alertas", `Reseña de ${nombreCliente}`, "Has recibido una calificación que requiere aprobación.", bloqueResena);
  }
}