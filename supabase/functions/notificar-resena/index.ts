import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer@6.9.13"

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ message: "Sin datos de reseña válidos" }), { status: 200 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Obtener datos del asesor y configuración en paralelo
    const [asesorRes, configRes] = await Promise.all([
      supabase.from('whitelist').select('email, nombre').eq('user_id', record.user_id).maybeSingle(),
      supabase.from('configuracion').select('clave, valor')
    ])

    const asesor = asesorRes.data
    if (!asesor?.email) {
      console.warn("Asesor no encontrado para user_id:", record.user_id)
      return new Response(JSON.stringify({ message: "Asesor no encontrado" }), { status: 200 })
    }

    const cfgMap: Record<string, string> = {}
    ;(configRes.data || []).forEach((r: { clave: string, valor: string }) => { cfgMap[r.clave] = r.valor })
    const empresaNombre = cfgMap['Empresa_Nombre'] || 'Inmobiliarte 22'

    // 2. Credenciales del entorno
    const SMTP_USER = Deno.env.get('SMTP_USER') || ''
    const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || 465)

    if (!SMTP_USER || !SMTP_PASS) {
      console.error("Faltan variables SMTP_USER o SMTP_PASS en Edge Function Secrets")
      return new Response(JSON.stringify({ error: "Configuración SMTP incompleta" }), { status: 500 })
    }

    // 3. Crear transporter de Nodemailer (robusto y compatible con el runtime)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    const estrellas = "★".repeat(Math.round(Number(record.calificacion || 5)))
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">${empresaNombre}</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Nueva Reseña Recibida</p>
          </div>

          <div style="padding: 32px 24px;">
            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 12px 0;">¡Hola ${asesor.nombre || 'Asesor'}!</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              El cliente <strong>${record.cliente}</strong> ha calificado el servicio <em>${record.servicio || 'General'}</em>:
            </p>

            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #38bdf8;">
              <div style="color: #f59e0b; font-size: 20px; margin-bottom: 8px;">
                ${estrellas} <span style="color: #0f172a; font-size: 15px; font-weight: bold; margin-left: 6px;">${record.calificacion} / 5.0</span>
              </div>
              <p style="margin: 0; color: #334155; font-size: 14px; font-style: italic; line-height: 1.5;">
                "${record.comentario || 'Sin comentario escrito.'}"
              </p>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
              Ingresa al panel administrativo para revisar, moderar o responder a este cliente.
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; background-color: #fafafa;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">Mensaje automático del Sistema de Reseñas.</p>
          </div>
        </div>
      </div>
    `

    await transporter.sendMail({
      from: `"${empresaNombre}" <${SMTP_USER}>`,
      to: asesor.email,
      subject: `[${empresaNombre}] Nueva reseña de ${record.cliente} (${record.calificacion}/5 ⭐)`,
      html: htmlBody,
    })

    console.log(`Correo despachado correctamente a ${asesor.email}`)

    return new Response(JSON.stringify({ success: true, message: "Correo despachado" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Error en notificar-resena:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
