# Código compacto: engine-review-system

> Snapshot para contexto de IA. No sustituye archivos fuente ni es apto para reconstruir el proyecto exactamente.


## `README.md`

````markdown
# Engine Review System

Sistema de gestión de reseñas y prueba social (Inmobiliarte 22 / Easy Broker y usos genéricos).

- **Dashboard** — Vue 3 + Vite + Tailwind (OTP, moderación, enlaces, usuarios, config).
- **Backend headless** — Google Apps Script + Google Sheets.
- **API pública** — reseñas aprobadas y alta de reseña con reCAPTCHA.

Documentación completa en [`docs/`](docs/).

---

## Arquitectura (snapshot)

```
[ Vue 3 Dashboard ]  --POST {action,payload,token}-->  [ GAS WebApp ]
        |
        +-- Auth: OTP correo + JWT 24h
        +-- RBAC por permisos
        +-- Sheets: Whitelist, Tokens, Resenas, Configuracion
```

Detalle: [docs/architecture/system_design.md](docs/architecture/system_design.md).

### Roles y permisos

| Rol | Permisos |
| --- | --- |
| ADMINISTRADOR | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena, gestionar_usuarios, configurar_sistema |
| SUPERVISOR | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena |
| APROBADOR | ver_dashboard, editar_resena |
| USUARIO | ver_dashboard, generar_enlace, ver_seguimientos |

### Hojas (GAS)

| Hoja | Uso |
| --- | --- |
| Whitelist | UserId, Nombre, Email, Estado, Rol, Logo |
| Tokens | ID_Enlace, UserId_Admin, Fecha_Envio, Nombre_Cliente, Zona_Servicio, URL_Generada, Estado |
| Resenas | ID_Resena, UserId, Fecha, Cliente, Servicio, Calificacion, Comentario, Legal_OK, Estado, Respuesta_Admin |
| Configuracion | KV: Empresa_Nombre, Color_Primario, Logo_Horizontal, Logo_Vertical, URL_Frontend_App |

Diccionario: [docs/database/data_dictionary.md](docs/database/data_dictionary.md).

---

## Frontend

```bash
npm install
npm run dev    # desarrollo
npm run build  # producción
```

URL del backend: `src/services/api.js` (`API_URL` del deployment `/exec`).

## Backend

Código en `backend/`. Despliegue y secretos: [backend/README.md](backend/README.md).

Script Properties: `SECRET_JWT`, `SECRET_FIRMA`, `RECAPTCHA_PROJECT`, `RECAPTCHA_API_KEY`, `RECAPTCHA_SITE_KEY`, `GEMINI_API_KEY`.

## Documentación

| Área | Ruta |
| --- | --- |
| Requisitos funcionales | [docs/requirements/functional.md](docs/requirements/functional.md) |
| Requisitos no funcionales | [docs/requirements/non_functional.md](docs/requirements/non_functional.md) |
| Matriz de cobertura | [docs/coverage_matrix.md](docs/coverage_matrix.md) |
| Arquitectura | [docs/architecture/system_design.md](docs/architecture/system_design.md) |
| ADR Auth | [docs/architecture/adr/0001-otp-jwt-auth.md](docs/architecture/adr/0001-otp-jwt-auth.md) |
| API (OpenAPI) | [docs/api/openapi.yaml](docs/api/openapi.yaml) |
| Datos | [docs/database/data_dictionary.md](docs/database/data_dictionary.md) |
| UI/UX | [docs/design/ui_ux_spec.md](docs/design/ui_ux_spec.md) |

## Reglas de diseño del proyecto

1. Cero lógica de negocio pesada en frontend
2. Cero mocks / datos falsos
3. RBAC por permisos reales en servidor
4. Mobile-first
5. Modularidad de vistas
6. Login OTP-only (sin contraseña en Perfil)

## Estructura

```
backend/          # Google Apps Script
docs/             # Requisitos, arquitectura, API, datos, UI
src/
  components/     # layout + ui
  composables/    # useAuth
  services/       # apiClient
  views/          # auth, core, admin, user
```
````

## `index.html`

````html
<head> <meta charset="UTF-8"> <link rel="icon" type="image/svg+xml" href="/vite.svg"> <meta name="viewport" content="width=device-width,initial-scale=1"> <title>Dashboard</title> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"> <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> </head> <body class="bg-slate-50 dark:bg-slate-900 transition-colors duration-300 antialiased text-slate-800 dark:text-slate-200"> <div id="engine-dashboard-root"></div> <script type="module" src="/src/main.js"></script> </body>
````

## `package.json`

````json
{"name":"engine-review-dashboard","private":true,"version":"0.0.0","type":"module","scripts":{"dev":"vite","build":"vite build","preview":"vite preview","test":"node --test tests/**/*.test.js","deploy":"gh-pages -d dist"},"dependencies":{"sweetalert2":"^11.26.25","vue":"^3.5.42"},"devDependencies":{"@vitejs/plugin-vue":"^6.0.8","autoprefixer":"^10.6.1","gh-pages":"^6.3.0","postcss":"^8.5.28","tailwindcss":"^3.4.19","vite":"^8.3.0"}}
````

## `postcss.config.js`

````javascript
export default{plugins:{tailwindcss:{},autoprefixer:{}}};
````

## `tailwind.config.js`

````javascript
export default{content:["./index.html","./src/**/*.{vue,js,ts,jsx,tsx}"],darkMode:"class",theme:{extend:{colors:{brand:{DEFAULT:"var(--brand-color)",dark:"var(--brand-color-dark)",light:"var(--brand-color-light)"},slate:{850:"#151e2e"}},fontFamily:{sans:["Inter","sans-serif"]}}},plugins:[]};
````

## `vite.config.js`

````javascript
import vue from"@vitejs/plugin-vue";import{defineConfig}from"vite";export default defineConfig({base:"/engine-review-system/",plugins:[vue()]});
````

## `.vscode/extensions.json`

````json
{"recommendations":["Vue.volar"]}
````

## `backend/API_Dashboard.gs`

````javascript
function api_obtenerResenasPublicas(){return db_leerTodo(BD.RESENAS).filter(r=>String(r.Estado).trim()==="Aprobado").map(r=>({cliente:r.Nombre_Cliente||r.Cliente,zona:r.Zona_Servicio||r.Zona_Propiedad,calificacion:parseFloat(r.Calificacion)||0,comentario:r.Valor_Gestion||r.Comentario,respuesta:r.Respuesta_Admin||"",fecha:r.Fecha_Envio||r.Fecha}))}function api_guardarResenaPublica(data){validarRecaptcha(data.recaptcha_token);let userId="WEB";if(data.token_id){const token=db_leerTodo(BD.TOKENS).find(t=>t.ID_Enlace===data.token_id&&t.Estado==="Activo");if(token){db_actualizarCampos(BD.TOKENS,token._fila,{Estado:"Usado"});userId=extraerUserId(token)}}const legalOk=data.aviso_privacidad_aceptado===true||String(data.aviso_privacidad_aceptado)==="true";const nombre=limpiarTexto(data.nombre_publico);const comentario=limpiarTexto(data.valor_gestion_resena);const id="RES-"+Utilities.getUuid().substring(0,8).toUpperCase();const fecha=Utilities.formatDate(new Date,Session.getScriptTimeZone(),"yyyy-MM-dd");db_crearFila(BD.RESENAS,[id,userId,fecha,nombre,limpiarTexto(data.zona_propiedad),data.calificacion,comentario,legalOk,"Pendiente",""]);if(legalOk&&userId!=="WEB"){notificarAdminUsuario(userId,nombre,data.calificacion,comentario)}return{message:"Reseña registrada con éxito."}}function dash_obtenerResenas(token){requerirPermiso("ver_dashboard",token);const mapa={};db_leerTodo(BD.WHITELIST).forEach(u=>{if(u.UserId)mapa[u.UserId]=u.Nombre||""});return db_leerTodo(BD.RESENAS).map(r=>({fila:r._fila,id:r.ID_Resena,suserId:r.UserId,asesor:mapa[r.UserId]||"Sin asignar",fecha:r.Fecha,cliente:r.Cliente,servicio:r.Servicio,calificacion:parseFloat(r.Calificacion)||0,comentario:r.Comentario||"",legalOk:r.Legal_OK===true||r.Legal_OK==="TRUE",estado:r.Estado,respuesta:r.Respuesta_Admin||""})).reverse()}function dash_actualizarResena(token,fila,estado,respuesta){requerirPermiso("editar_resena",token);const updates={Estado:estado};if(respuesta!==undefined)updates.Respuesta_Admin=limpiarTexto(respuesta);if(estado==="Aprobado")updates.Aviso_Privacidad=true;else if(estado==="No aprobado")updates.Aviso_Privacidad=false;db_actualizarCampos(BD.RESENAS,fila,updates);return{message:"Reseña actualizada."}}function dash_generarEnlaceCliente(tokenDashboard,nombreCliente,servicio){const creds=requerirPermiso("generar_enlace",tokenDashboard);const usuario=db_leerTodo(BD.WHITELIST).find(u=>String(u.Email).toLowerCase().trim()===creds.email);if(!usuario)throw new Error("Usuario gestor no encontrado.");const linkId="LNK-"+Utilities.getUuid().substring(0,6).toUpperCase();const n=limpiarTexto(nombreCliente);const z=limpiarTexto(servicio);const uid=extraerUserId(usuario);const header=Utilities.base64EncodeWebSafe(JSON.stringify({alg:"HS256",typ:"JWT"}));const payload=Utilities.base64EncodeWebSafe(JSON.stringify({id:linkId,u:uid,n:n,z:z}));const sig=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(`${header}.${payload}`,SEGURIDAD.SECRET_FIRMA));const cfg=getConfig();if(!cfg.urlFrontend)throw new Error("Falta 'URL_Frontend_App' en Configuración.");const url=`${cfg.urlFrontend}?t=${header}.${payload}.${sig}`;const fecha=Utilities.formatDate(new Date,Session.getScriptTimeZone(),"yyyy-MM-dd");db_crearFila(BD.TOKENS,[linkId,uid,fecha,n,z,url,"Activo"]);return{url:url}}function dash_obtenerSeguimientos(token){requerirPermiso("ver_seguimientos",token);const hoy=new Date;return db_leerTodo(BD.TOKENS).map(t=>{const raw=String(t.Estado||"").trim();const f=String(t.Fecha_Envio||"").split("-");const dias=f.length>=3?Math.floor(Math.abs(hoy-new Date(+f[0],+f[1]-1,+f[2]))/864e5):0;let estado="Activo";if(raw==="Usado")estado="Usado";else if(raw==="Cancelado")estado="Revocado";else if(raw==="Activo"&&dias>7)estado="Expirado";else if(raw==="Activo")estado="Activo";else estado=raw||"Activo";return{fila:t._fila,id:t.ID_Enlace,fecha:t.Fecha_Envio,cliente:t.Nombre_Cliente,servicio:t.Zona_Servicio,url:t.URL_Generada,dias:dias,estado:estado}}).reverse()}function dash_revocarEnlace(token,filaToken){requerirPermiso("editar_resena",token);db_actualizarCampos(BD.TOKENS,filaToken,{Estado:"Cancelado"});return{message:"Enlace revocado."}}function dash_obtenerUsuarios(token){requerirPermiso("gestionar_usuarios",token);return db_leerTodo(BD.WHITELIST).map(u=>({fila:u._fila,id:extraerUserId(u),nombre:u.Nombre,email:u.Email,estado:u.Estado||"Inactivo",rol:u.Rol||"Usuario",logo:u.Logo||""})).reverse()}function dash_agregarUsuario(token,idUser,nombre,email,rolAsignado,logoUrl){requerirPermiso("gestionar_usuarios",token);const emailLimpio=String(email).toLowerCase().trim();if(db_leerTodo(BD.WHITELIST).some(u=>String(u.Email).toLowerCase()===emailLimpio)){throw new Error("Correo ya registrado.")}const sheet=getSheet(BD.WHITELIST);const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>String(h).trim());const fila=new Array(headers.length).fill("");fila[0]=limpiarTexto(idUser);fila[1]=limpiarTexto(nombre);fila[2]=emailLimpio;const setCol=(name,val)=>{const i=headers.indexOf(name);if(i!==-1)fila[i]=val};setCol("Estado","Pendiente");setCol("Rol",String(rolAsignado||"USUARIO").trim());setCol("Logo",String(logoUrl||"").trim());db_crearFila(BD.WHITELIST,fila);return{message:"Usuario añadido."}}function auth_obtenerInfoUsuario(token){const payload=requerirPermiso("ver_dashboard",token);const usuario=db_leerTodo(BD.WHITELIST).find(u=>String(u.Email).toLowerCase().trim()===String(payload.email).toLowerCase());if(!usuario||String(usuario.Estado).toUpperCase().trim()!=="ACTIVO"){throw new Error("Usuario inactivo o revocado.")}const rol=String(usuario.Rol||"USUARIO").toUpperCase().trim();const resenas=db_leerTodo(BD.RESENAS);const tokens=db_leerTodo(BD.TOKENS);const hoy=new Date;const resenasNuevas=resenas.filter(r=>String(r.Estado).trim()==="Pendiente").length;const seguimientosAtrasados=tokens.filter(t=>{if(String(t.Estado).trim()!=="Activo")return false;const f=String(t.Fecha_Envio||"").split("-");if(f.length<3)return false;return Math.floor((hoy-new Date(+f[0],+f[1]-1,+f[2]))/864e5)>7}).length;return{userId:usuario.UserId||usuario.ID,nombre:usuario.Nombre,email:usuario.Email,rol:usuario.Rol,estado:usuario.Estado,logo:usuario.Logo||"",permisos:ROLES[rol]||ROLES.USUARIO,notificaciones:{resenasNuevas:resenasNuevas,seguimientosAtrasados:seguimientosAtrasados}}}function dash_actualizarEstadoUsuario(token,filaUsuario,nuevoEstado){return dash_actualizarUsuario(token,filaUsuario,{estado:nuevoEstado})}function dash_actualizarUsuario(token,filaUsuario,campos){requerirPermiso("gestionar_usuarios",token);const updates={};if(campos.estado!==undefined&&campos.estado!==null&&campos.estado!==""){updates.Estado=String(campos.estado).trim()}if(campos.nombre!==undefined&&campos.nombre!==null){updates.Nombre=limpiarTexto(campos.nombre)}if(campos.rol!==undefined&&campos.rol!==null&&campos.rol!==""){updates.Rol=String(campos.rol).toUpperCase().trim()}if(campos.logo!==undefined){updates.Logo=String(campos.logo||"").trim()}if(!Object.keys(updates).length)throw new Error("Sin campos para actualizar.");db_actualizarCampos(BD.WHITELIST,filaUsuario,updates);return{message:"Usuario actualizado."}}function dash_actualizarPerfil(token,campos){const creds=requerirPermiso("ver_dashboard",token);const usuario=db_leerTodo(BD.WHITELIST).find(u=>String(u.Email).toLowerCase().trim()===String(creds.email).toLowerCase());if(!usuario)throw new Error("Usuario no encontrado.");const updates={};if(campos.nombre!==undefined&&campos.nombre!==null){updates.Nombre=limpiarTexto(campos.nombre)}if(campos.logo!==undefined){updates.Logo=String(campos.logo||"").trim()}if(!Object.keys(updates).length)throw new Error("Sin campos para actualizar.");db_actualizarCampos(BD.WHITELIST,usuario._fila,updates);return{message:"Perfil actualizado.",nombre:updates.Nombre!==undefined?updates.Nombre:usuario.Nombre,logo:updates.Logo!==undefined?updates.Logo:usuario.Logo||""}}function dash_llamarGemini(token,prompt){requerirPermiso("editar_resena",token);const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${SEGURIDAD.GeminiAPI}`;const res=UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",payload:JSON.stringify({contents:[{parts:[{text:limpiarTexto(prompt)}]}],generationConfig:{temperature:.4}}),muteHttpExceptions:true});const json=JSON.parse(res.getContentText());if(json.candidates?.length){return{texto:json.candidates[0].content.parts[0].text.trim()}}throw new Error("Sin respuesta de la IA.")}function api_obtenerConfiguracionPublica(){return getConfig()}function dash_actualizarConfiguracion(token,configuracionNueva){requerirPermiso("configurar_sistema",token);const sheet=getSheet(BD.CONFIG);const data=sheet.getDataRange().getValues();for(let i=1;i<data.length;i++){const key=String(data[i][0]).trim();if(configuracionNueva[key]!==undefined){sheet.getRange(i+1,2).setValue(configuracionNueva[key])}}return{message:"Configuración del sistema actualizada correctamente."}}function dash_obtenerKpis(token){requerirPermiso("ver_dashboard",token);const resenas=db_leerTodo(BD.RESENAS);const tokens=db_leerTodo(BD.TOKENS);const usuarios=db_leerTodo(BD.WHITELIST);const totalResenas=resenas.length;const pendientes=resenas.filter(r=>String(r.Estado).trim()==="Pendiente").length;const aprobadas=resenas.filter(r=>String(r.Estado).trim()==="Aprobado").length;const promedio=totalResenas?Math.round(resenas.reduce((s,r)=>s+(parseFloat(r.Calificacion)||0),0)/totalResenas*10)/10:0;const tokensActivos=tokens.filter(t=>String(t.Estado).trim()==="Activo").length;const tokensUsados=tokens.filter(t=>String(t.Estado).trim()==="Usado").length;const tokensTotal=tokens.length;const usuariosActivos=usuarios.filter(u=>String(u.Estado).toUpperCase().trim()==="ACTIVO").length;return{totalResenas:totalResenas,pendientes:pendientes,aprobadas:aprobadas,promedio:promedio,tokensActivos:tokensActivos,tokensUsados:tokensUsados,tokensTotal:tokensTotal,usuariosActivos:usuariosActivos}}function dash_obtenerTokens(token){requerirPermiso("configurar_sistema",token);const hoy=new Date;const mapa={};db_leerTodo(BD.WHITELIST).forEach(u=>{const id=extraerUserId(u);if(id)mapa[id]=u.Nombre||""});return db_leerTodo(BD.TOKENS).map(t=>{const raw=String(t.Estado||"").trim();const f=String(t.Fecha_Envio||"").split("-");const dias=f.length>=3?Math.floor(Math.abs(hoy-new Date(+f[0],+f[1]-1,+f[2]))/864e5):0;let estado="Activo";if(raw==="Usado")estado="Usado";else if(raw==="Cancelado")estado="Revocado";else if(raw==="Activo"&&dias>7)estado="Expirado";else if(raw==="Activo")estado="Activo";else estado=raw||"Activo";return{fila:t._fila,id:t.ID_Enlace,fecha:t.Fecha_Envio,cliente:t.Nombre_Cliente,servicio:t.Zona_Servicio,url:t.URL_Generada,dias:dias,estado:estado,asesor:mapa[extraerUserId(t)]||t.UserId||"—"}}).reverse()}
````

## `backend/Auth.gs`

````javascript
function validarRecaptcha(token){const url=`https://recaptchaenterprise.googleapis.com/v1/projects/${SEGURIDAD.RECAPTCHA_PROJECT}/assessments?key=${SEGURIDAD.RECAPTCHA_API_KEY}`;const res=UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",payload:JSON.stringify({event:{token:token,expectedAction:"submit",siteKey:SEGURIDAD.RECAPTCHA_SITE_KEY}}),muteHttpExceptions:true});const json=JSON.parse(res.getContentText());if(!json.tokenProperties?.valid||json.riskAnalysis?.score<.5){throw new Error("Petición bloqueada por seguridad anti-spam.")}}function requerirPermiso(permiso,token){if(!token)throw new Error("Acceso denegado. Token no proporcionado.");const parts=token.split(".");if(parts.length!==3)throw new Error("Token malformado.");const firma=Utilities.base64Encode(Utilities.computeHmacSha256Signature(`${parts[0]}.${parts[1]}`,SEGURIDAD.SECRET_JWT));if(firma!==parts[2])throw new Error("Firma de seguridad inválida.");const datos=JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[1])).getDataAsString());if(datos.exp<Date.now())throw new Error("Sesión expirada.");const rol=String(datos.rol).toUpperCase();const perms=ROLES[rol]||ROLES.USUARIO;if(!perms.includes(permiso))throw new Error("Privilegios insuficientes para esta acción.");return{email:datos.email,nombre:datos.nombre,rol:rol}}function auth_solicitarOTP(emailAdmin){const email=String(emailAdmin).toLowerCase().trim();const usuario=db_leerTodo(BD.WHITELIST).find(u=>String(u.Email).toLowerCase().trim()===email);if(!usuario)throw new Error("Correo no registrado en el sistema.");if(String(usuario.Estado||"").trim().toUpperCase()==="SUSPENDIDO"){throw new Error("Acceso revocado.")}const otp=String(Math.floor(1e5+Math.random()*9e5));CacheService.getScriptCache().put(`OTP_${email}`,otp,600);const bloque=`<div style="padding:20px;text-align:center"><span style="font-size:40px;font-weight:bold;letter-spacing:8px">${otp}</span></div>`;enviarCorreoTemplate(email,`Tu código de acceso: ${otp}`,"Seguridad","Acceso de Seguridad","Ingresa el siguiente código de 6 dígitos:",bloque);return{message:"Código enviado correctamente."}}function auth_verificarOTP(emailAdmin,otpIngresado){const email=String(emailAdmin).toLowerCase().trim();const cache=CacheService.getScriptCache();if(cache.get(`LOCK_${email}`)){throw new Error("Cuenta bloqueada temporalmente por intentos fallidos. Intenta en 15 minutos.")}const otpGuardado=cache.get(`OTP_${email}`);if(!otpGuardado||otpGuardado!==String(otpIngresado)){let intentos=parseInt(cache.get(`ATTEMPTS_${email}`)||"0",10)+1;if(intentos>=5){cache.put(`LOCK_${email}`,"true",900);cache.remove(`ATTEMPTS_${email}`);throw new Error("Máximo de intentos alcanzado. Cuenta bloqueada por seguridad.")}cache.put(`ATTEMPTS_${email}`,String(intentos),900);throw new Error(`Código inválido o expirado. Intentos restantes: ${5-intentos}`)}cache.remove(`OTP_${email}`);cache.remove(`ATTEMPTS_${email}`);const usuario=db_leerTodo(BD.WHITELIST).find(u=>String(u.Email).toLowerCase().trim()===email);if(!usuario)throw new Error("Usuario no encontrado en el sistema.");if(String(usuario.Estado||"").trim().toUpperCase()==="PENDIENTE"){db_actualizarCampos(BD.WHITELIST,usuario._fila,{Estado:"Activo"})}const header=Utilities.base64Encode(JSON.stringify({alg:"HS256",typ:"JWT"}));const payload=Utilities.base64Encode(JSON.stringify({userId:String(usuario.UserId||usuario.ID||"").trim(),email:email,nombre:String(usuario.Nombre||"Usuario").trim(),rol:String(usuario.Rol||"USUARIO").toUpperCase().trim(),estado:String(usuario.Estado||"ACTIVO").toUpperCase().trim(),exp:Date.now()+864e5}));const firma=Utilities.base64Encode(Utilities.computeHmacSha256Signature(`${header}.${payload}`,SEGURIDAD.SECRET_JWT));return{token:`${header}.${payload}.${firma}`}}
````

## `backend/Config.gs`

````javascript
const BD={WHITELIST:"Whitelist",TOKENS:"Tokens",RESENAS:"Resenas",CONFIG:"Configuracion"};const ROLES={ADMINISTRADOR:["ver_dashboard","generar_enlace","ver_seguimientos","editar_resena","gestionar_usuarios","configurar_sistema"],SUPERVISOR:["ver_dashboard","generar_enlace","ver_seguimientos","editar_resena"],APROBADOR:["ver_dashboard","editar_resena"],USUARIO:["ver_dashboard","generar_enlace","ver_seguimientos"]};const SEGURIDAD={get SECRET_JWT(){return getSecret("SECRET_JWT")},get SECRET_FIRMA(){return getSecret("SECRET_FIRMA")},get RECAPTCHA_PROJECT(){return getSecret("RECAPTCHA_PROJECT")},get RECAPTCHA_API_KEY(){return getSecret("RECAPTCHA_API_KEY")},get RECAPTCHA_SITE_KEY(){return getSecret("RECAPTCHA_SITE_KEY")},get GeminiAPI(){return getSecret("GEMINI_API_KEY")}};function getSecret(key){const val=PropertiesService.getScriptProperties().getProperty(key);if(!val)throw new Error("Falta Script Property: "+key);return val}function getConfig(){const config={nombre:"Sistema",color:"#333333",logoH:"",logoV:"",urlFrontend:"",recaptchaSiteKey:""};try{const data=getSheet(BD.CONFIG).getDataRange().getValues();const map={Empresa_Nombre:"nombre",Color_Primario:"color",Logo_Horizontal:"logoH",Logo_Vertical:"logoV",URL_Frontend_App:"urlFrontend"};data.forEach(row=>{const key=String(row[0]).trim();if(map[key])config[map[key]]=String(row[1]).trim()})}catch(e){}try{config.recaptchaSiteKey=SEGURIDAD.RECAPTCHA_SITE_KEY||""}catch(e){}return config}function api_validarTokenInvitacion(tokenStr){const cfg=getConfig();const redirectUrl=cfg.urlFrontend?String(cfg.urlFrontend).split("?")[0]:"";if(!tokenStr||typeof tokenStr!=="string"){return{valid:false,reason:"missing_token",redirectUrl:redirectUrl}}const parts=tokenStr.split(".");if(parts.length!==3){return{valid:false,reason:"malformed",redirectUrl:redirectUrl}}try{const expected=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0]+"."+parts[1],SEGURIDAD.SECRET_FIRMA));if(expected!==parts[2]){return{valid:false,reason:"bad_signature",redirectUrl:redirectUrl}}const payloadJson=Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();const claims=JSON.parse(payloadJson);const linkId=String(claims.id||"").trim();if(!linkId){return{valid:false,reason:"missing_id",redirectUrl:redirectUrl}}const row=db_leerTodo(BD.TOKENS).find(t=>String(t.ID_Enlace).trim()===linkId);if(!row){return{valid:false,reason:"not_found",redirectUrl:redirectUrl}}const estado=String(row.Estado||"").trim();if(estado!=="Activo"){return{valid:false,reason:estado==="Usado"?"already_used":"inactive",redirectUrl:redirectUrl,token_id:linkId}}return{valid:true,token_id:linkId,nombre_cliente:claims.n||row.Nombre_Cliente||"",zona_servicio:claims.z||row.Zona_Servicio||"",redirectUrl:redirectUrl,brand:{nombre:cfg.nombre,color:cfg.color,logoH:cfg.logoH,logoV:cfg.logoV,recaptchaSiteKey:cfg.recaptchaSiteKey}}}catch(e){return{valid:false,reason:"error",redirectUrl:redirectUrl,message:e.message}}}
````

## `backend/DB_Core.gs`

````javascript
function getSheet(name){const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);if(!sheet)throw new Error("Hoja no encontrada: "+name);return sheet}function db_crearFila(nombreHoja,arrayDatos){const sheet=getSheet(nombreHoja);const colA=sheet.getRange("A:A").getValues();let fila=colA.findIndex(c=>String(c[0]).trim()==="")+1;if(fila===0)fila=sheet.getLastRow()+1;const range=sheet.getRange(fila,1,1,arrayDatos.length);range.setValues([arrayDatos]);if(fila>2){sheet.getRange(fila-1,1,1,arrayDatos.length).copyTo(range,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false)}return fila}function db_leerTodo(nombreHoja){const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);if(!sheet)return[];const data=sheet.getDataRange().getDisplayValues();if(data.length<2)return[];const headers=data.shift().map(h=>String(h).trim());return data.map((row,i)=>{const obj={_fila:i+2};headers.forEach((h,j)=>{if(h)obj[h]=row[j]});return obj}).filter(r=>r[headers[0]]!=="")}function db_actualizarCampos(nombreHoja,fila,updates){const sheet=getSheet(nombreHoja);const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>String(h).trim());Object.entries(updates).forEach(([col,val])=>{const idx=headers.indexOf(col)+1;if(idx>0)sheet.getRange(fila,idx).setValue(val)});return true}
````

## `backend/README.md`

````markdown
# Backend — Google Apps Script

Código fuente del API headless del Engine Review System.

## Hojas requeridas

### 1. Whitelist

```
UserId | Nombre | Email | Estado | Rol | Logo
```

- Estado: `Activo` | `Pendiente` | `Suspendido`
- Rol: `ADMINISTRADOR` | `SUPERVISOR` | `APROBADOR` | `USUARIO`
- Logo: URL pública opcional

### 2. Tokens

```
ID_Enlace | UserId_Admin | Fecha_Envio | Nombre_Cliente | Zona_Servicio | URL_Generada | Estado
```

- Estado: `Activo` | `Usado` | `Cancelado`

### 3. Resenas

```
ID_Resena | UserId | Fecha | Cliente | Servicio | Calificacion | Comentario | Legal_OK | Estado | Respuesta_Admin
```

- Estado: `Pendiente` | `Aprobado` | `Archivado`

### 4. Configuracion (clave-valor)

Columna A = clave, B = valor:

```
Empresa_Nombre
Color_Primario
Logo_Horizontal
Logo_Vertical
URL_Frontend_App
```

## Secretos (Script Properties)

Project Settings → Script properties:

| Property | Descripción |
| --- | --- |
| SECRET_JWT | Firma JWT de sesión |
| SECRET_FIRMA | Firma de enlaces de reseña |
| RECAPTCHA_PROJECT | Project ID reCAPTCHA Enterprise |
| RECAPTCHA_API_KEY | API Key reCAPTCHA |
| RECAPTCHA_SITE_KEY | Site Key reCAPTCHA |
| GEMINI_API_KEY | API Key Gemini |

Nunca subir estos valores al repositorio.

## Archivos

| Archivo | Rol |
| --- | --- |
| Config.gs | BD, ROLES, SEGURIDAD, getConfig |
| DB_Core.gs | getSheet, crear/leer/actualizar filas |
| Auth.gs | reCAPTCHA, OTP, JWT, requerirPermiso |
| Utils.gs | sanitización, correos, cron, notificaciones |
| API_Dashboard.gs | casos de uso de negocio |
| WebApp.gs | doGet / doPost (router por `action`) |

## Despliegue

1. Spreadsheet → Extensiones → Apps Script
2. Pegar/actualizar los `.gs` de esta carpeta
3. Configurar Script Properties
4. Deploy → Web App (Execute as: **Me**, Access: **Anyone**)
5. Copiar URL `/exec` a `src/services/api.js` del frontend

## Triggers

- `cron_dispararRecordatorios` — time-driven **diario** (recordatorio día 7 a gestores).

## Contrato API

Ver [docs/api/openapi.yaml](../docs/api/openapi.yaml) y la matriz de acciones en [docs/requirements/functional.md](../docs/requirements/functional.md).

Respuesta unificada:

```json
{ "status": "success", "data": { } }
{ "status": "error", "message": "..." }
```
````

## `backend/Utils.gs`

````javascript
function limpiarTexto(str){if(typeof str!=="string"||!str)return"";let s=str.replace(/[^a-zA-Z0-9 !?.,;:\-_\(\)'"\s]/g,"");if(/^[=\+\-@]/.test(s.trim()))s="'"+s.trim();return s.trim()}function extraerUserId(obj){if(!obj)return null;return obj.UserId_Admin||obj.UserId||obj[Object.keys(obj)[0]]||null}function enviarCorreoTemplate(to,subject,nombreRemitente,titulo,subtitulo,bloqueHtml){const cfg=getConfig();const html=generarPlantillaPremium(titulo,subtitulo,bloqueHtml,cfg);MailApp.sendEmail({to:to,subject:subject,htmlBody:html,name:`${cfg.nombre} - ${nombreRemitente}`})}function generarPlantillaPremium(titulo,subtitulo,contenidoHtml,cfg){return`\n    <div style="font-family:sans-serif;background:#f8fafc;padding:40px 20px;text-align:center">\n      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">\n        <div style="background:${cfg.color};padding:30px 20px">\n          <h1 style="color:#fff;margin:0;font-size:24px">${cfg.nombre}</h1>\n        </div>\n        <div style="padding:40px 30px;text-align:left">\n          <h2 style="color:#1e293b;font-size:20px;margin-top:0">${titulo}</h2>\n          <p style="color:#64748b;font-size:15px;margin-bottom:30px">${subtitulo}</p>\n          <div style="margin-bottom:30px">${contenidoHtml}</div>\n          <hr style="border-top:1px solid #e2e8f0;margin:30px 0">\n          <p style="color:#94a3b8;font-size:12px;text-align:center">Mensaje automático. No respondas a este correo.</p>\n        </div>\n      </div>\n    </div>`}function cron_dispararRecordatorios(){const hoy=new Date;hoy.setHours(0,0,0,0);const tokens=db_leerTodo(BD.TOKENS).filter(t=>String(t.Estado).trim()==="Activo");const whitelist=db_leerTodo(BD.WHITELIST);tokens.forEach(token=>{const f=String(token.Fecha_Envio||"").split("-");if(f.length<3)return;const fecha=new Date(+f[0],+f[1]-1,+f[2]);fecha.setHours(0,0,0,0);const dias=Math.round((hoy-fecha)/864e5);if(dias!==7)return;const gestor=whitelist.find(u=>String(extraerUserId(u)).trim()===String(token.UserId_Admin).trim());if(!gestor?.Email)return;const msg=encodeURIComponent(`Hola ${token.Nombre_Cliente}. Esperamos tu reseña aquí: ${token.URL_Generada}`);const btn=`<div style="text-align:center;margin:30px 0"><a href="https://api.whatsapp.com/send?text=${msg}" style="background:#25D366;color:#fff;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Recordar por WhatsApp</a></div>`;enviarCorreoTemplate(gestor.Email,`Reseña pendiente: ${token.Nombre_Cliente}`,"Seguimientos",`Seguimiento: ${token.Nombre_Cliente}`,"Han pasado 7 días sin recibir la reseña de este cliente.",btn)})}function notificarAdminUsuario(userId,nombreCliente,calificacion,comentario){const gestor=db_leerTodo(BD.WHITELIST).find(u=>extraerUserId(u)===userId);if(!gestor?.Email)return;const cfg=getConfig();const bloque=`<div style="padding:20px;border-left:4px solid ${cfg.color}"><p><strong>Calificación:</strong> ${calificacion} / 5</p><p><em>"${comentario}"</em></p></div>`;enviarCorreoTemplate(gestor.Email,`Nueva reseña (${calificacion}/5)`,"Alertas",`Reseña de ${nombreCliente}`,"Has recibido una calificación que requiere aprobación.",bloque)}
````

## `backend/WebApp.gs`

````javascript
function doGet(){return ContentService.createTextOutput(JSON.stringify({status:"success",message:"Inmobiliarte Engine API Online",version:"2.1"})).setMimeType(ContentService.MimeType.JSON)}function doPost(e){try{const body=JSON.parse(e.postData.contents);const{action:action,payload:payload={},token:token=null}=body;const handlers={get_public_reviews:()=>api_obtenerResenasPublicas(),validate_review_token:()=>api_validarTokenInvitacion(payload.token||payload.t),submit_review:()=>api_guardarResenaPublica(payload),request_otp:()=>auth_solicitarOTP(payload.email),verify_otp:()=>auth_verificarOTP(payload.email,payload.otp),get_dashboard_reviews:()=>dash_obtenerResenas(token),update_review:()=>dash_actualizarResena(token,payload.fila,payload.estado,payload.respuesta),generate_link:()=>dash_generarEnlaceCliente(token,payload.nombre,payload.servicio),get_tracking:()=>dash_obtenerSeguimientos(token),revoke_link:()=>dash_revocarEnlace(token,payload.fila),get_users:()=>dash_obtenerUsuarios(token),update_user:()=>dash_actualizarUsuario(token,payload.fila,payload),update_profile:()=>dash_actualizarPerfil(token,payload),add_user:()=>dash_agregarUsuario(token,payload.idUser,payload.nombre,payload.email,payload.rol,payload.logo),call_ai:()=>dash_llamarGemini(token,payload.prompt),get_public_config:()=>api_obtenerConfiguracionPublica(),update_config:()=>dash_actualizarConfiguracion(token,payload.configuracion),get_user_info:()=>auth_obtenerInfoUsuario(token),get_kpis:()=>dash_obtenerKpis(token),get_tokens:()=>dash_obtenerTokens(token)};const handler=handlers[action];if(!handler)throw new Error("Acción de API no válida o no especificada.");return ContentService.createTextOutput(JSON.stringify({status:"success",data:handler()})).setMimeType(ContentService.MimeType.JSON)}catch(error){return ContentService.createTextOutput(JSON.stringify({status:"error",message:error.message})).setMimeType(ContentService.MimeType.JSON)}}
````

## `docs/PRODUCTION.md`

````markdown
# Production Configuration

## 1. Build final product

```bash
# 1. Clone and install
git clone https://github.com/vmartinez5310/engine-review-system.git
cd engine-review-system
npm ci

# 2. Set production env
cp .env.example .env
# Edit .env:
# VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# 3. Build
npm run build
# Output: dist/
```

For GitHub Pages (project site under `/repo-name/`):

```js
// vite.config.js
export default defineConfig({
  base: '/engine-review-system/',
  plugins: [vue()],
})
```

Then rebuild.

## 2. Store on GitHub Pages

### Option A — `gh-pages` branch

```bash
npm run build
npx gh-pages -d dist
```

### Option B — Actions (recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

In repo Settings → Pages → Source: `gh-pages` / root.

Live URL: `https://vmartinez5310.github.io/engine-review-system/`

## 3. Embed dashboard on white page

### A. Public reviews carousel (lightweight)

In Easy Broker HTML block:

```html
<div id="reviews-widget"></div>
<script type="module" src="https://vmartinez5310.github.io/engine-review-system/assets/index-XXXX.js"></script>
```

Or host a standalone widget page and iframe it:

```html
<iframe
  src="https://vmartinez5310.github.io/engine-review-system/?widget=reviews"
  style="width:100%;height:280px;border:0;background:transparent"
  loading="lazy"
></iframe>
```

### B. Full dashboard (auth required)

```html
<iframe
  src="https://vmartinez5310.github.io/engine-review-system/"
  style="width:100%;min-height:800px;border:0"
  allow="clipboard-write"
></iframe>
```

Notes:
- Easy Broker white page must allow iframe embedding (no `X-Frame-Options: DENY` on your host).
- GitHub Pages is public; do not put secrets in the frontend build.
- `VITE_API_URL` is public by design (GAS web app URL). Protect endpoints with OTP/JWT on the backend.
- For review invites, keep using `?t=TOKEN` links generated by the dashboard.
````

## `docs/coverage_matrix.md`

````markdown
# Coverage matrix — Docs ↔ System snapshot

Fecha de alineación: 2026-10-17. Rama de trabajo: `docs/sync-coverage-system-snapshot`.

Leyenda: **OK** implementado y documentado · **DOC+** documentado como planificado/evolución · **CODE** en código (doc actualizado) · **GAP** riesgo residual

## Requisitos funcionales

| ID | Tema | Código | Docs | Notas |
| --- | --- | --- | --- | --- |
| RF-01 | Envío reseña + legal + captcha | OK | OK | `submit_review` |
| RF-02 | Token de invitación | OK | OK | Marca Usado |
| RF-03 | Generar enlace | OK | OK | `generate_link` |
| RF-04 | Ciclo token | OK parcial | OK+DOC+ | Cancelado sí; Expirado 30d / QR / Share = evolución |
| RF-05 | Moderación + mail | OK | OK | |
| RF-06 | RBAC 4 roles | OK | OK | Unificado desde Developer/Admin docs antiguos |
| RF-07 | Config marca | OK | OK | |
| RF-08 | OTP + JWT | OK | OK | ADR actualizado (sin Redis/refresh) |
| RF-09 | Usuarios | OK | OK | Logo incluido |
| RF-10 | Seguimientos + cron D+7 | OK | OK | |
| RF-11 | Gemini | OK | OK | |
| RF-12 | Notificaciones sesión | OK | OK | |

## Datos

| Entidad | Hojas reales | Diccionario | DBML |
| --- | --- | --- | --- |
| Whitelist | OK | OK | OK |
| Tokens | OK | OK | OK |
| Resenas | OK | OK | OK |
| Configuracion KV | OK | OK | OK |

## API

| Superficie | Router WebApp | OpenAPI actions | Functional matrix |
| --- | --- | --- | --- |
| 16 actions | OK | OK | OK |

## UI

| Vista / área | Código | ui_ux_spec |
| --- | --- | --- |
| Login OTP | OK | OK |
| Layout + permisos | OK | OK |
| Reseñas / modal enlace | OK | OK |
| Usuarios / Config / Perfil | OK | OK |
| Widget público embebible | API only | DOC+ |

## Funcionalidad preservada

Ningún endpoint, permiso, hoja o flujo del snapshot de código fue eliminado al actualizar documentación. Los elementos solo-documentales previos (Redis, refresh token, rol Developer, estados Expirado/Revocado, QR) se reclasificaron como evolución o se mapearon al equivalente real (`Cancelado`, roles actuales, CacheService).
````

## `docs/api/openapi.yaml`

````yaml
openapi: 3.0.3
info:
  title: Engine Review System API
  description: |
    API headless sobre Google Apps Script Web App.
    Todas las operaciones mutables/lecturas de negocio usan **POST** al endpoint `/exec`
    con cuerpo JSON `{ "action", "payload", "token" }`.
    `doGet` solo expone health/version.
  version: "2.1"
servers:
  - url: https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
    description: GAS Web App deployment
paths:
  /:
    get:
      summary: Health check
      operationId: doGet
      responses:
        "200":
          description: API online
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: success }
                  message: { type: string }
                  version: { type: string, example: "2.1" }
    post:
      summary: Action router (doPost)
      operationId: doPost
      requestBody:
        required: true
        content:
          text/plain:
            schema:
              $ref: "#/components/schemas/ActionRequest"
          application/json:
            schema:
              $ref: "#/components/schemas/ActionRequest"
      responses:
        "200":
          description: Unified envelope
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: "#/components/schemas/SuccessEnvelope"
                  - $ref: "#/components/schemas/ErrorEnvelope"

components:
  schemas:
    ActionRequest:
      type: object
      required: [action]
      properties:
        action:
          type: string
          enum:
            - get_public_config
            - get_public_reviews
            - submit_review
            - request_otp
            - verify_otp
            - get_user_info
            - get_dashboard_reviews
            - update_review
            - generate_link
            - get_tracking
            - revoke_link
            - get_users
            - add_user
            - update_user
            - update_config
            - call_ai
        payload:
          type: object
          additionalProperties: true
        token:
          type: string
          nullable: true
          description: JWT de sesión (endpoints privados)
    SuccessEnvelope:
      type: object
      properties:
        status: { type: string, enum: [success] }
        data: {}
    ErrorEnvelope:
      type: object
      properties:
        status: { type: string, enum: [error] }
        message: { type: string }

  x-actions:
    public:
      - get_public_config
      - get_public_reviews
      - submit_review
      - request_otp
      - verify_otp
    private:
      get_user_info: ver_dashboard
      get_dashboard_reviews: ver_dashboard
      update_review: editar_resena
      generate_link: generar_enlace
      get_tracking: ver_seguimientos
      revoke_link: editar_resena
      get_users: gestionar_usuarios
      add_user: gestionar_usuarios
      update_user: gestionar_usuarios
      update_config: configurar_sistema
      call_ai: editar_resena
````

## `docs/architecture/system_design.md`

````markdown
# System Architecture — Engine Review System

## High-level overview

Two surfaces share one headless API (Google Apps Script Web App):

1. **Public surface** — widget / formulario de reseña (token en URL) + listado público de reseñas aprobadas.
2. **Admin Dashboard** — Vue 3 SPA: OTP login, moderación, enlaces, usuarios, configuración, perfil.

Persistencia: **Google Sheets** (hojas Whitelist, Tokens, Resenas, Configuracion).

```
[ Cliente final ] --token URL--> [ Widget / form público ]
                                        |
[ Operador ] --OTP+JWT--> [ Vue 3 Dashboard ]
                                        |
                    POST { action, payload, token }
                                        v
                    [ GAS WebApp doPost / doGet ]
                         |            |
                    [ Sheets ]   [ MailApp / UrlFetch ]
                                      |
                         reCAPTCHA Enterprise, Gemini
```

## Component map

| Capa | Tecnología | Responsabilidad |
| :---- | :---- | :---- |
| Dashboard UI | Vue 3, Vite, Tailwind, SweetAlert2 | Auth UX, tablas, modales, RBAC de UI vía `hasPermission` |
| API | Apps Script (`WebApp.gs` router) | Enrutado por `action`, respuestas JSON unificadas |
| Auth | `Auth.gs` | OTP, JWT, reCAPTCHA, `requerirPermiso` |
| Domain API | `API_Dashboard.gs` | Reseñas, tokens, usuarios, config, Gemini |
| Data access | `DB_Core.gs` | CRUD por hoja/fila |
| Cross-cutting | `Config.gs`, `Utils.gs` | Roles, secretos, sanitización, correos, cron |

## Auth flow (implementado)

1. Usuario ingresa email → `request_otp` (whitelist + no Suspendido).
2. OTP en cache 10 min; correo HTML de marca.
3. `verify_otp` → activa Pendiente→Activo si aplica → JWT 24h.
4. Dashboard guarda JWT en `localStorage` y llama `get_user_info` en cada carga.

## Review invitation flow

1. Operador con `generar_enlace` → `generate_link(nombre, servicio)`.
2. Backend firma payload (id, userId, nombre, zona) con `SECRET_FIRMA`.
3. URL = `URL_Frontend_App?t=<jwt-enlace>`; fila en Tokens (`Activo`).
4. Cliente envía reseña con `token_id` → token `Usado`, reseña `Pendiente`, correo al gestor.
5. Moderación → `Aprobado` / `Archivado` (+ respuesta opcional).
6. Día 7 sin uso: correo de recordatorio al gestor (cron).

## Seguridad

* Secretos solo en Script Properties (`SEGURIDAD` getters).
* RBAC en servidor (no confiar en ocultar botones del frontend).
* Sanitización de texto y protección de fórmulas de Sheets (`limpiarTexto`).

## Límites conocidos del snapshot

* No hay RDBMS ni migraciones formales; el esquema es el encabezado de cada hoja.
* No hay refresh token / cookie HttpOnly; sesión = JWT en localStorage.
* Expiración automática a 30 días de tokens y QR/Web Share: documentados como evolución, no implementados en este snapshot.
````

## `docs/architecture/adr/0001-otp-jwt-auth.md`

````markdown
# ADR 0001: OTP and JWT Authentication

## Status

Accepted (updated to match production snapshot)

## Context

El Dashboard no debe usar contraseñas compartidas. Se requiere acceso por correo institucional controlado (whitelist) y sesión temporal.

Documentación temprana mencionaba Redis, access token corto y refresh token en cookie HttpOnly. La implementación real del proyecto usa el stack disponible en Google Apps Script.

## Decision

1. **OTP:** 6 dígitos, almacenado en `CacheService` con clave `OTP_{email}`, TTL **600 segundos**.
2. **Envío:** plantilla HTML de marca vía `MailApp` (`enviarCorreoTemplate`).
3. **Verificación:** comparación en claro del OTP en cache; contador de intentos `ATTEMPTS_*`; lock `LOCK_*` 900s tras 5 fallos.
4. **Sesión:** un único **JWT HS256** (header.payload.firma Base64), claim `exp` = now + **24h**, firmado con Script Property `SECRET_JWT`.
5. **Claims:** userId, email, nombre, rol, estado, exp.
6. **Cliente:** token en `localStorage` (`inm_dash_token`); cada request privado lo reenvía en el body JSON.
7. **Autorización:** `requerirPermiso(permiso, token)` valida firma, expiración y membresía del permiso en `ROLES[rol]`.

## Consequences

* Positivo: cero contraseñas, deploy simple en GAS, RBAC centralizado.
* Negativo: localStorage expone el JWT a XSS (mitigar con CSP y evitar HTML no sanitizado).
* Negativo: sin refresh token, a las 24h el usuario vuelve a OTP.
* Futuro opcional: access corto + refresh HttpOnly si se migra a hosting con backend propio; no invalida este ADR mientras el deploy sea GAS.

## Related

* RF-08, RNF-01, RNF-04, RNF-05
* Código: `backend/Auth.gs`, `backend/Config.gs` (`ROLES`, `SEGURIDAD`)
````

## `docs/database/data_dictionary.md`

````markdown
# Data Dictionary — Engine Review System

Persistencia real: **Google Sheets**. Cada "tabla" es una hoja; la fila 1 son encabezados. El acceso se hace vía `DB_Core.gs` (`db_leerTodo`, `db_crearFila`, `db_actualizarCampos`).

## 7.1 Hoja Whitelist

| Campo | Tipo lógico | Req | Descripción |
| :---- | :---- | :---- | :---- |
| UserId | string | PK | Identificador de usuario/asesor |
| Nombre | string | sí | Nombre visible |
| Email | string | único | Correo para OTP (case-insensitive) |
| Estado | enum | sí | `Activo` \| `Pendiente` \| `Suspendido` |
| Rol | enum | sí | `ADMINISTRADOR` \| `SUPERVISOR` \| `APROBADOR` \| `USUARIO` |
| Logo | URL string | no | Avatar / logo del usuario |

## 7.2 Hoja Tokens

| Campo | Tipo lógico | Req | Descripción |
| :---- | :---- | :---- | :---- |
| ID_Enlace | string | PK | Ej. `LNK-XXXXXX` |
| UserId_Admin | string | FK lógico | Gestor que generó el enlace |
| Fecha_Envio | date `yyyy-MM-dd` | sí | Fecha de emisión |
| Nombre_Cliente | string | sí | Cliente invitado |
| Zona_Servicio | string | sí | Servicio / zona |
| URL_Generada | URL | sí | Link firmado completo |
| Estado | enum | sí | `Activo` \| `Usado` \| `Cancelado` |

## 7.3 Hoja Resenas

| Campo | Tipo lógico | Req | Descripción |
| :---- | :---- | :---- | :---- |
| ID_Resena | string | PK | Ej. `RES-XXXXXXXX` |
| UserId | string | sí | Gestor asociado o `WEB` |
| Fecha | date `yyyy-MM-dd` | sí | Fecha de registro |
| Cliente | string | sí | Nombre público |
| Servicio | string | no | Zona / servicio declarado |
| Calificacion | number | sí | 0–5 |
| Comentario | text | no | Experiencia |
| Legal_OK | boolean | sí | Aceptación de aviso / publicación |
| Estado | enum | sí | `Pendiente` \| `Aprobado` \| `Archivado` |
| Respuesta_Admin | text | no | Respuesta pública del equipo |

*Nota de cobertura:* Documentación previa incluía `ID_Enlace`, `Autorizacion_Publicacion` separada y `Fecha_Respuesta`. En el snapshot, el vínculo al token se resuelve al marcar el token `Usado` y el consentimiento se concentra en `Legal_OK`. Campos adicionales pueden añadirse a la hoja sin romper lecturas por encabezado.

## 7.4 Hoja Configuracion (clave-valor)

| Clave (col A) | Valor (col B) | Uso |
| :---- | :---- | :---- |
| Empresa_Nombre | string | Nombre de marca |
| Color_Primario | hex | `--brand-color` / correos |
| Logo_Horizontal | URL | Header / login |
| Logo_Vertical | URL | Ícono / login |
| URL_Frontend_App | URL base | Construcción de enlaces de invitación |

## 7.5 Enums efectivos

| Enum | Valores | Uso |
| :---- | :---- | :---- |
| EstadoUsuario | Activo, Pendiente, Suspendido | Whitelist |
| RolUsuario | ADMINISTRADOR, SUPERVISOR, APROBADOR, USUARIO | Whitelist + ROLES |
| EstadoToken | Activo, Usado, Cancelado | Tokens |
| EstadoResena | Pendiente, Aprobado, Archivado | Resenas |

## 7.6 Mapeo con modelo relacional aspiracional

El archivo `schema.dbml` se mantiene como **modelo conceptual**. Donde difiere (nombres de rol, estados de token, columnas de Resenas), prevalece este diccionario y las hojas reales.
````

## `docs/design/ui_ux_spec.md`

````markdown
# UI/UX Specification — Dashboard

Alineado al frontend Vue 3 + Tailwind del snapshot y a RNF-07/RNF-08.

## Design principles

* Mobile-first; controles principales con área táctil generosa (~44px).
* Color de marca dinámico (`--brand-color` desde `Color_Primario`).
* Soporte **light / dark** (`class="dark"` en `html`, preferencia sistema o `localStorage.theme`).
* Componentes base reutilizables: `BaseButton`, `BaseInput`, `BaseSelect`, `BaseModal`, `BaseStarRating`, `DataTable`, `StatusBadge`, `EmptyState`.

## Structure

### Auth — LoginView

* Paso 1: email → `request_otp`.
* Paso 2: OTP 6 dígitos → `verify_otp` → emite `login-success`.
* Logo: vertical → horizontal → inicial del nombre de empresa.

### Shell — DashboardLayout

* Sidebar colapsable con entradas condicionadas por `hasPermission`.
* Áreas típicas: Reseñas, Seguimientos / tokens, Usuarios (gestión), Configuración / Sistema, Perfil.
* Header: notificaciones (conteos de `get_user_info`), identidad, logout.

### Core

* **ResenasView:** tabla de reseñas, filtros, badges de estado (Pendiente / Aprobado / Archivado), edición de respuesta, estrellas.
* **GenerarResenaModal:** nombre + servicio → `generate_link` → muestra URL (QR / share: mejora planificada).

### Admin / User

* **UsuariosView:** listado Whitelist, alta (id, nombre, email, rol, logo), cambio de estado.
* **ConfigView / SistemaView:** edición de KV de marca y parámetros de sistema.
* **PerfilView:** datos de sesión; **sin** cambio de contraseña (OTP-only).

## Status badges

| Estado reseña | Tratamiento visual sugerido |
| :---- | :---- |
| Pendiente | Badge warning / ámbar |
| Aprobado | Badge success / verde |
| Archivado | Badge neutro |

## Accessibility (objetivo)

* Contraste legible en light/dark.
* Labels en formularios de login y alta.
* Meta WCAG 2.1 AA como objetivo de evolución (RNF previo); no bloqueante del snapshot.

## Out of scope en este snapshot de UI

* Widget público embebible completo (la API pública sí existe).
* Generación de QR y Web Share API en el modal de enlace (documentados como mejora).
````

## `docs/requirements/functional.md`

````markdown
# Requisitos Funcionales (RF) - Engine Review System

Plataforma de gestión y captura de reseñas (prueba social) orientada a servicios y productos. Backend headless en Google Apps Script + Google Sheets; Dashboard en Vue 3.

**Fuente de verdad del estado implementado:** código en `backend/` y `src/` (snapshot actual de `main`).

## 3.1 Captura y widget de reseñas

| ID | Requisito | Estado | Detalle implementado / aceptación |
| :---- | :---- | :---- | :---- |
| **RF-01** | Widget / envío de reseña | Implementado (API pública) | `submit_review`: calificación, comentario, nombre, zona, `recaptcha_token`, aceptación legal (`aviso_privacidad_aceptado`). Persistencia en hoja Resenas como `Pendiente`. |
| **RF-02** | Validación por token de invitación | Implementado | Si `token_id` corresponde a enlace `Activo`, se marca `Usado` y se asocia `UserId` del gestor. Sin token válido la reseña puede registrarse como `WEB`. |
| **RF-03** | Generación de enlaces de invitación | Implementado | `generate_link` (permiso `generar_enlace`): Nombre + Servicio → URL firmada (`SECRET_FIRMA`) con base `URL_Frontend_App`. |
| **RF-04** | Ciclo de vida del token | Implementado (parcial vs aspiracional) | Estados en sistema: **Activo**, **Usado**, **Cancelado**. Revocación vía `revoke_link`. *Planificado (no en snapshot):* Expirado a 30 días, QR nativo, Web Share API en UI. |
| **RF-05** | Notificaciones y moderación | Implementado | Correo al gestor al recibir reseña con legal OK; moderación `update_review` (Pendiente / Aprobado / Archivado + `Respuesta_Admin`). Publicación pública solo si estado `Aprobado` (`get_public_reviews`). |
| **RF-06** | Roles y permisos (RBAC) | Implementado | Roles: **ADMINISTRADOR**, **SUPERVISOR**, **APROBADOR**, **USUARIO**. Permisos granulares (ver matriz). *Aspiracional en docs previos (Developer / Admin / Usuario Normal) se unifica a estos roles de código.* |
| **RF-07** | Configuración de identidad visual | Implementado | Hoja Configuracion (KV): Empresa_Nombre, Color_Primario, Logo_Horizontal, Logo_Vertical, URL_Frontend_App. Lectura pública `get_public_config`; escritura `update_config` (permiso `configurar_sistema`). |
| **RF-08** | Autenticación OTP + JWT | Implementado | `request_otp` / `verify_otp`. OTP 6 dígitos en CacheService (10 min). JWT HS256 24h. Bloqueo tras 5 intentos fallidos (15 min). |
| **RF-09** | Gestión de usuarios | Implementado | `get_users`, `add_user` (estado inicial Pendiente, logo opcional), `update_user` (Estado). Permiso `gestionar_usuarios`. |
| **RF-10** | Seguimientos de enlaces | Implementado | `get_tracking`: tokens Activo con días transcurridos. Recordatorio por correo al día 7 (`cron_dispararRecordatorios`). |
| **RF-11** | Asistencia IA (Gemini) | Implementado | `call_ai` (permiso `editar_resena`) para redactar/sugerir respuestas. |
| **RF-12** | Info de sesión y notificaciones | Implementado | `get_user_info`: perfil, permisos, conteos `resenasNuevas` (Pendiente) y `seguimientosAtrasados` (>7 días). |

## 3.2 Matriz de permisos (código)

| Rol | ver_dashboard | generar_enlace | ver_seguimientos | editar_resena | gestionar_usuarios | configurar_sistema |
| :---- | :---: | :---: | :---: | :---: | :---: | :---: |
| ADMINISTRADOR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SUPERVISOR | ✓ | ✓ | ✓ | ✓ | | |
| APROBADOR | ✓ | | | ✓ | | |
| USUARIO | ✓ | ✓ | ✓ | | | |

## 3.3 Acciones API (contrato real)

Todas las operaciones van por **POST** al Web App `/exec` con cuerpo JSON:

```json
{ "action": "<nombre>", "payload": { }, "token": "<jwt opcional>" }
```

Respuesta unificada: `{ "status": "success"|"error", "data"|"message": ... }`.

| action | Auth | Permiso | Descripción |
| :---- | :---- | :---- | :---- |
| get_public_config | No | — | Marca pública |
| get_public_reviews | No | — | Reseñas Aprobado |
| submit_review | No (+ reCAPTCHA) | — | Alta de reseña |
| request_otp | No | — | Envía OTP |
| verify_otp | No | — | Devuelve JWT |
| get_user_info | JWT | ver_dashboard | Sesión + notificaciones |
| get_dashboard_reviews | JWT | ver_dashboard | Listado moderación |
| update_review | JWT | editar_resena | Estado / respuesta |
| generate_link | JWT | generar_enlace | URL de invitación |
| get_tracking | JWT | ver_seguimientos | Tokens activos |
| revoke_link | JWT | editar_resena | Cancelar token |
| get_users | JWT | gestionar_usuarios | Whitelist |
| add_user | JWT | gestionar_usuarios | Alta usuario |
| update_user | JWT | gestionar_usuarios | Estado usuario |
| update_config | JWT | configurar_sistema | KV marca |
| call_ai | JWT | editar_resena | Gemini |

## Reglas de negocio (RN)

* **RN-01:** Solo correos presentes en Whitelist pueden solicitar OTP.
* **RN-02:** Usuario `Suspendido` no puede autenticarse; `Pendiente` se activa al primer OTP correcto.
* **RN-03:** Publicación en widget/carousel solo con estado `Aprobado`.
* **RN-04:** Secretos (JWT, firma, reCAPTCHA, Gemini) solo en Script Properties; nunca en repositorio.
* **RN-05:** Texto de entrada se sanitiza (`limpiarTexto`) antes de persistir.

## Restricciones y supuestos

* **RES-01:** Persistencia = Google Sheets (no RDBMS relacional).
* **RES-02:** Frontend Dashboard: Vue 3 + Vite + Tailwind; sin lógica de negocio pesada en cliente.
* **SUP-01:** reCAPTCHA Enterprise y Gemini configurados en el proyecto GCP del operador.
* **SUP-02:** Trigger diario de Apps Script para `cron_dispararRecordatorios`.
````

## `docs/requirements/non_functional.md`

````markdown
# Requisitos No Funcionales (RNF)

Atributos de calidad alineados al snapshot implementado (GAS + Vue Dashboard).

## 4.1 Seguridad (RNF-SEC)

| ID | Requisito | Estado | Implementación |
| :---- | :---- | :---- | :---- |
| **RNF-01** | Auth sin contraseña (OTP + JWT) | Implementado | OTP 6 dígitos (CacheService, TTL 600s). JWT HS256, exp 24h, firmado con `SECRET_JWT`. Almacenamiento de sesión en `localStorage` (`inm_dash_token`). |
| **RNF-02** | Protección anti-spam en envío público | Implementado | reCAPTCHA Enterprise en `submit_review` (`validarRecaptcha`, score ≥ 0.5). |
| **RNF-03** | Firmas de enlaces de reseña | Implementado | Token de invitación = JWT web-safe firmado con `SECRET_FIRMA`. |
| **RNF-04** | Rate-limit de OTP | Implementado | Tras 5 OTP incorrectos: lock 15 min (`LOCK_*` en cache). |
| **RNF-05** | RBAC por permiso | Implementado | `requerirPermiso(permiso, token)` en cada endpoint privado. |
| **RNF-06** | Secretos fuera del código | Implementado | Script Properties vía `getSecret` / getters `SEGURIDAD`. |

*Nota:* El ADR histórico mencionaba Redis + refresh token HttpOnly. El snapshot **no** usa Redis ni refresh token; usa CacheService + JWT único 24h. Cualquier evolución a access/refresh queda como mejora futura sin invalidar RNF-01.

## 4.2 UX / UI (RNF-UX)

| ID | Requisito | Estado | Detalle |
| :---- | :---- | :---- | :---- |
| **RNF-07** | Tema claro/oscuro + color de marca | Implementado | Clase `dark` en `documentElement`; `--brand-color` desde config pública. |
| **RNF-08** | Mobile-first / touch targets | Diseño de proyecto | Regla de diseño: targets ~44×44 px; layout responsive Tailwind. |
| **RNF-09** | Navegación modular | Implementado | Vistas: Login, Reseñas, Seguimientos (en core), Usuarios, Config, Sistema, Perfil. Layout con sidebar. |

## 4.3 Disponibilidad y operacion (RNF-OPS)

| ID | Requisito | Estado | Detalle |
| :---- | :---- | :---- | :---- |
| **RNF-10** | Backend serverless | Implementado | Google Apps Script Web App (Execute as: Me, Access: Anyone). |
| **RNF-11** | Health check | Implementado | `doGet` → JSON status/version. |
| **RNF-12** | Recordatorios programados | Implementado | Trigger time-driven diario → `cron_dispararRecordatorios` (día 7). |
| **RNF-13** | Backups | Responsabilidad del operador | Respaldos de Spreadsheet (historial de versiones de Google / export). Objetivo operativo: al menos semanal. |

## 4.4 Mantenibilidad (RNF-MAINT)

* Código backend modular: Config, DB_Core, Auth, Utils, API_Dashboard, WebApp.
* Frontend: componentes UI base, composable `useAuth`, `apiClient` único.
* Principios de proyecto: cero mocks, cero lógica de negocio pesada en frontend, RBAC real.
````

## `public/favicon.svg`

````xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style="fill:#863bff;fill:color(display-p3 .5252 .23 1);fill-opacity:1"/><mask id="a" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style="fill:#000;fill-opacity:1"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -39.328 7.883)"/></g><g filter="url(#d)"><ellipse cx="5.508" cy="30.487" fill="#7e14ff" rx="5.508" ry="30.487" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -25.913 -14.639)scale(1 -1)"/></g><g filter="url(#e)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -32.644 -3.334)scale(1 -1)"/></g><g filter="url(#f)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -34.34 30.47)"/></g><g filter="url(#g)"><ellipse cx="14.072" cy="22.078" fill="#ede6ff" rx="14.072" ry="22.078" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="rotate(93.35 24.506 48.493)scale(-1 1)"/></g><g filter="url(#h)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#i)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#j)"><ellipse cx=".387" cy="8.972" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(39.51 .387 8.972)"/></g><g filter="url(#k)"><ellipse cx="47.523" cy="-6.092" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 47.523 -6.092)"/></g><g filter="url(#l)"><ellipse cx="41.412" cy="6.333" fill="#47bfff" rx="5.971" ry="9.665" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 41.412 6.333)"/></g><g filter="url(#m)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#n)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#o)"><ellipse cx="35.651" cy="29.907" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 35.651 29.907)"/></g><g filter="url(#p)"><ellipse cx="38.418" cy="32.4" fill="#47bfff" rx="5.971" ry="15.297" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 38.418 32.4)"/></g></g><defs><filter id="b" width="60.045" height="41.654" x="-19.77" y="16.149" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="c" width="90.34" height="51.437" x="-54.613" y="-7.533" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="d" width="79.355" height="29.4" x="-49.64" y="2.03" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="e" width="79.579" height="29.4" x="-45.045" y="20.029" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="f" width="79.579" height="29.4" x="-43.513" y="21.178" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="g" width="74.749" height="58.852" x="15.756" y="-17.901" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="h" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="i" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="j" width="56.045" height="63.649" x="-27.636" y="-22.853" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="k" width="54.814" height="64.646" x="20.116" y="-38.415" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="l" width="33.541" height="35.313" x="24.641" y="-11.323" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="m" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="n" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="o" width="54.814" height="64.646" x="8.244" y="-2.416" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="p" width="39.409" height="43.623" x="18.713" y="10.588" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter></defs></svg>
````

## `public/icons.svg`

````xml
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="bluesky-icon" viewBox="0 0 16 17">
    <g clip-path="url(#bluesky-clip)"><path fill="#08060d" d="M7.75 7.735c-.693-1.348-2.58-3.86-4.334-5.097-1.68-1.187-2.32-.981-2.74-.79C.188 2.065.1 2.812.1 3.251s.241 3.602.398 4.13c.52 1.744 2.367 2.333 4.07 2.145-2.495.37-4.71 1.278-1.805 4.512 3.196 3.309 4.38-.71 4.987-2.746.608 2.036 1.307 5.91 4.93 2.746 2.72-2.746.747-4.143-1.747-4.512 1.702.189 3.55-.4 4.07-2.145.156-.528.397-3.691.397-4.13s-.088-1.186-.575-1.406c-.42-.19-1.06-.395-2.741.79-1.755 1.24-3.64 3.752-4.334 5.099"/></g>
    <defs><clipPath id="bluesky-clip"><path fill="#fff" d="M.1.85h15.3v15.3H.1z"/></clipPath></defs>
  </symbol>
  <symbol id="discord-icon" viewBox="0 0 20 19">
    <path fill="#08060d" d="M16.224 3.768a14.5 14.5 0 0 0-3.67-1.153c-.158.286-.343.67-.47.976a13.5 13.5 0 0 0-4.067 0c-.128-.306-.317-.69-.476-.976A14.4 14.4 0 0 0 3.868 3.77C1.546 7.28.916 10.703 1.231 14.077a14.7 14.7 0 0 0 4.5 2.306q.545-.748.965-1.587a9.5 9.5 0 0 1-1.518-.74q.191-.14.372-.293c2.927 1.369 6.107 1.369 8.999 0q.183.152.372.294-.723.437-1.52.74.418.838.963 1.588a14.6 14.6 0 0 0 4.504-2.308c.37-3.911-.63-7.302-2.644-10.309m-9.13 8.234c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.894 0 1.614.82 1.599 1.82.001 1-.705 1.82-1.6 1.82m5.91 0c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.893 0 1.614.82 1.599 1.82 0 1-.706 1.82-1.6 1.82"/>
  </symbol>
  <symbol id="documentation-icon" viewBox="0 0 21 20">
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="m15.5 13.333 1.533 1.322c.645.555.967.833.967 1.178s-.322.623-.967 1.179L15.5 18.333m-3.333-5-1.534 1.322c-.644.555-.966.833-.966 1.178s.322.623.966 1.179l1.534 1.321"/>
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M17.167 10.836v-4.32c0-1.41 0-2.117-.224-2.68-.359-.906-1.118-1.621-2.08-1.96-.599-.21-1.349-.21-2.848-.21-2.623 0-3.935 0-4.983.369-1.684.591-3.013 1.842-3.641 3.428C3 6.449 3 7.684 3 10.154v2.122c0 2.558 0 3.838.706 4.726q.306.383.713.671c.76.536 1.79.64 3.581.66"/>
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M3 10a2.78 2.78 0 0 1 2.778-2.778c.555 0 1.209.097 1.748-.047.48-.129.854-.503.982-.982.145-.54.048-1.194.048-1.749a2.78 2.78 0 0 1 2.777-2.777"/>
  </symbol>
  <symbol id="github-icon" viewBox="0 0 19 19">
    <path fill="#08060d" fill-rule="evenodd" d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844" clip-rule="evenodd"/>
  </symbol>
  <symbol id="social-icon" viewBox="0 0 20 20">
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M12.5 6.667a4.167 4.167 0 1 0-8.334 0 4.167 4.167 0 0 0 8.334 0"/>
    <path fill="none" stroke="#aa3bff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M2.5 16.667a5.833 5.833 0 0 1 8.75-5.053m3.837.474.513 1.035c.07.144.257.282.414.309l.93.155c.596.1.736.536.307.965l-.723.73a.64.64 0 0 0-.152.531l.207.903c.164.715-.213.991-.84.618l-.872-.52a.63.63 0 0 0-.577 0l-.872.52c-.624.373-1.003.094-.84-.618l.207-.903a.64.64 0 0 0-.152-.532l-.723-.729c-.426-.43-.289-.864.306-.964l.93-.156a.64.64 0 0 0 .412-.31l.513-1.034c.28-.562.735-.562 1.012 0"/>
  </symbol>
  <symbol id="x-icon" viewBox="0 0 19 19">
    <path fill="#08060d" fill-rule="evenodd" d="M1.893 1.98c.052.072 1.245 1.769 2.653 3.77l2.892 4.114c.183.261.333.48.333.486s-.068.089-.152.183l-.522.593-.765.867-3.597 4.087c-.375.426-.734.834-.798.905a1 1 0 0 0-.118.148c0 .01.236.017.664.017h.663l.729-.83c.4-.457.796-.906.879-.999a692 692 0 0 0 1.794-2.038c.034-.037.301-.34.594-.675l.551-.624.345-.392a7 7 0 0 1 .34-.374c.006 0 .93 1.306 2.052 2.903l2.084 2.965.045.063h2.275c1.87 0 2.273-.003 2.266-.021-.008-.02-1.098-1.572-3.894-5.547-2.013-2.862-2.28-3.246-2.273-3.266.008-.019.282-.332 2.085-2.38l2-2.274 1.567-1.782c.022-.028-.016-.03-.65-.03h-.674l-.3.342a871 871 0 0 1-1.782 2.025c-.067.075-.405.458-.75.852a100 100 0 0 1-.803.91c-.148.172-.299.344-.99 1.127-.304.343-.32.358-.345.327-.015-.019-.904-1.282-1.976-2.808L6.365 1.85H1.8zm1.782.91 8.078 11.294c.772 1.08 1.413 1.973 1.425 1.984.016.017.241.02 1.05.017l1.03-.004-2.694-3.766L7.796 5.75 5.722 2.852l-1.039-.004-1.039-.004z" clip-rule="evenodd"/>
  </symbol>
</svg>
````

## `src/App.vue`

````text
<script setup>
import { ref, onMounted } from 'vue'
import LoginView from './views/auth/LoginView.vue'
import DashboardLayout from './components/layout/DashboardLayout.vue'
import ReviewFormView from './views/public/ReviewFormView.vue'
import PublicReviewsCarousel from './views/public/PublicReviewsCarousel.vue'
import { apiClient } from './services/api'
import { authState, fetchUserInfo, logout as authLogout } from './composables/useAuth'

const isAppLoading = ref(true)
const loadingMessage = ref('Estableciendo conexión')
const appConfig = ref({
  nombre: '',
  color: '#334155',
  logoH: null,
  logoV: null,
  urlFrontend: '',
  recaptchaSiteKey: ''
})

const inviteToken = ref('')
const isPublicReview = ref(false)
const isReviewsWidget = ref(false)

function loadRecaptchaEnterprise(siteKey) {
  if (window.grecaptcha?.enterprise) {
    return new Promise((resolve) => {
      window.grecaptcha.enterprise.ready(() => {
        window.__recaptchaReady = true
        resolve(true)
      })
    })
  }
  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-recaptcha-enterprise]')
    if (existing) {
      existing.addEventListener('load', () => {
        window.grecaptcha?.enterprise?.ready(() => {
          window.__recaptchaReady = true
          resolve(true)
        })
      })
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const s = document.createElement('script')
    s.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`
    s.async = true
    s.defer = true
    s.dataset.recaptchaEnterprise = '1'
    s.onload = () => {
      const ent = window.grecaptcha?.enterprise
      if (!ent) {
        resolve(false)
        return
      }
      ent.ready(() => {
        window.__recaptchaReady = true
        resolve(true)
      })
    }
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const t = params.get('t') || ''
  if (t) {
    inviteToken.value = t
    isPublicReview.value = true
  }
  if (params.get('widget') === 'reviews') {
    isReviewsWidget.value = true
  }

  try {
    const cfg = await apiClient.post('get_public_config')
    appConfig.value = {
      nombre: cfg.nombre || 'Dashboard',
      color: cfg.color || '#334155',
      logoH: cfg.logoH,
      logoV: cfg.logoV,
      urlFrontend: cfg.urlFrontend || '',
      recaptchaSiteKey: cfg.recaptchaSiteKey || ''
    }
    document.documentElement.style.setProperty('--brand-color', appConfig.value.color)

    if (appConfig.value.recaptchaSiteKey && isPublicReview.value) {
      await loadRecaptchaEnterprise(appConfig.value.recaptchaSiteKey)
    }

    if (!isPublicReview.value && !isReviewsWidget.value) {
      await fetchUserInfo()
    }
  } catch (e) {
    console.error(e)
    appConfig.value.nombre = 'Sistema de Gestión'
  } finally {
    isAppLoading.value = false
  }
})

async function handleLoginSuccess(token) {
  loadingMessage.value = 'Iniciando sesión segura...'
  isAppLoading.value = true
  localStorage.setItem('inm_dash_token', token)
  const ok = await fetchUserInfo(token)
  isAppLoading.value = false
  if (!ok) {
    window.Swal?.fire('Error', 'No se pudo iniciar sesión. Verifica tu conexión.', 'error')
  }
}

function handleLogout() {
  loadingMessage.value = 'Cerrando sesión...'
  isAppLoading.value = true
  setTimeout(authLogout, 400)
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isAppLoading"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 backdrop-blur-sm"
    >
      <div class="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-brand dark:border-t-brand rounded-full animate-spin mb-5 shadow-lg shadow-brand/20" />
      <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase animate-pulse">
          loadingMessage
      </p>
    </div>
  </Transition>

  <div v-show="!isAppLoading" class="min-h-screen w-full relative">
    <div
      v-if="isReviewsWidget"
      class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
    >
      <PublicReviewsCarousel :config="appConfig" />
    </div>
    <ReviewFormView
      v-else-if="isPublicReview"
      :invite-token="inviteToken"
      :config="appConfig"
    />
    <template v-else>
      <LoginView
        v-if="!authState.isAuthenticated"
        :config="appConfig"
        @login-success="handleLoginSuccess"
      />
      <DashboardLayout
        v-else
        :config="appConfig"
        @logout="handleLogout"
      />
    </template>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
````

## `src/main.js`

````javascript
import{createApp}from"vue";import"./assets/style.css";import App from"./App.vue";import Swal from"sweetalert2";window.Swal=Swal;import DataTable from"./components/ui/DataTable.vue";import StatusBadge from"./components/ui/StatusBadge.vue";import BaseModal from"./components/ui/BaseModal.vue";import BaseButton from"./components/ui/BaseButton.vue";import BaseInput from"./components/ui/BaseInput.vue";import BaseSelect from"./components/ui/BaseSelect.vue";import BaseStarRating from"./components/ui/BaseStarRating.vue";import EmptyState from"./components/ui/EmptyState.vue";import SkeletonBlock from"./components/ui/SkeletonBlock.vue";const app=createApp(App);[["DataTable",DataTable],["StatusBadge",StatusBadge],["BaseModal",BaseModal],["BaseButton",BaseButton],["BaseInput",BaseInput],["BaseSelect",BaseSelect],["BaseStarRating",BaseStarRating],["EmptyState",EmptyState],["SkeletonBlock",SkeletonBlock]].forEach(([name,comp])=>app.component(name,comp));app.mount(document.getElementById("engine-dashboard-root")||document.body);
````

## `src/style.css`

````css
:root{--text:#6b6375;--text-h:#08060d;--bg:#fff;--border:#e5e4e7;--code-bg:#f4f3ec;--accent:#aa3bff;--accent-bg:rgba(170, 59, 255, 0.1);--accent-border:rgba(170, 59, 255, 0.5);--social-bg:rgba(244, 243, 236, 0.5);--shadow:rgba(0, 0, 0, 0.1) 0 10px 15px -3px,rgba(0, 0, 0, 0.05) 0 4px 6px -2px;--sans:system-ui,'Segoe UI',Roboto,sans-serif;--heading:system-ui,'Segoe UI',Roboto,sans-serif;--mono:ui-monospace,Consolas,monospace;font:18px/145% var(--sans);letter-spacing:.18px;color-scheme:light dark;color:var(--text);background:var(--bg);font-synthesis:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}h1,h2{font-family:var(--heading);font-weight:500;color:var(--text-h)}h1{font-size:56px;letter-spacing:-1.68px;margin:32px 0;margin:20px 0}.counter,code{font-family:var(--mono);display:inline-flex;border-radius:4px;color:var(--text-h)}code{font-size:15px;line-height:135%;padding:4px 8px;background:var(--code-bg)}.counter{font-size:16px;padding:5px 10px;border-radius:5px;color:var(--accent);background:var(--accent-bg);border:2px solid transparent;transition:border-color .3s;margin-bottom:24px}.hero{position:relative;margin:0 auto}.base{width:170px;position:relative;z-index:0}.framework,.vite{position:absolute}.framework{z-index:1;top:34px;height:28px;transform:perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg) scale(1.4)}.vite{z-index:0;top:107px;height:26px;width:auto;transform:perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg) scale(.8)}#center{display:flex;flex-direction:column;gap:25px;place-content:center;place-items:center;flex-grow:1;gap:18px}a{color:var(--text-h);font-size:16px;border-radius:6px;background:var(--social-bg);display:flex;padding:6px 12px;align-items:center;gap:8px;text-decoration:none;transition:box-shadow .3s;width:18px}a{width:100%;justify-content:center;box-sizing:border-box}
````

## `src/assets/style.css`

````css
@tailwind base;@tailwind components;@tailwind utilities;
````

## `src/components/layout/DashboardLayout.vue`

````text
<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { authState, hasPermission } from '../../composables/useAuth'

const props = defineProps({ config: Object })
const emit = defineEmits(['logout'])

const isSidebarOpen = ref(false)
const isMinified = ref(false)
const isDarkMode = ref(false)
const isUserMenuOpen = ref(false)
const isNotifMenuOpen = ref(false)

const activeTab = ref('home')
const subTabToOpen = ref(null)

const DashboardHomeView = defineAsyncComponent(() => import('../../views/core/DashboardHomeView.vue'))
const ResenasView = defineAsyncComponent(() => import('../../views/core/ResenasView.vue'))
const UsuariosView = defineAsyncComponent(() => import('../../views/admin/UsuariosView.vue'))
const SistemaView = defineAsyncComponent(() => import('../../views/admin/SistemaView.vue'))
const PerfilView = defineAsyncComponent(() => import('../../views/user/PerfilView.vue'))

const currentViewComponent = computed(() => {
  const views = {
    home: DashboardHomeView,
    resenas: ResenasView,
    usuarios: UsuariosView,
    sistema: SistemaView,
    perfil: PerfilView
  }
  return views[activeTab.value] || DashboardHomeView
})

const pageTitle = computed(() => {
  const titles = {
    home: 'Inicio',
    resenas: 'Centro de Reseñas',
    usuarios: 'Gestión de Usuarios',
    sistema: 'Configuración',
    perfil: 'Mi Perfil'
  }
  return titles[activeTab.value] || 'Dashboard'
})

const currentUser = computed(() => authState.user || {})
const userRole = computed(() => currentUser.value.rol || 'USUARIO')
const userName = computed(() => {
  const nombre = currentUser.value.nombre || 'Usuario'
  return nombre.split(' ')[0]
})
const userInitials = computed(() => {
  const n = currentUser.value.nombre || 'U'
  return n.substring(0, 2).toUpperCase()
})

const notifications = computed(() => currentUser.value.notificaciones || { resenasNuevas: 0, seguimientosAtrasados: 0 })
const totalNotifications = computed(() => {
  return (notifications.value.resenasNuevas || 0) + (notifications.value.seguimientosAtrasados || 0)
})

function navigateTo(tab, subTab = null) {
  activeTab.value = tab
  subTabToOpen.value = subTab
  isUserMenuOpen.value = false
  isNotifMenuOpen.value = false
  isSidebarOpen.value = false
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  const html = document.documentElement
  if (isDarkMode.value) {
    html.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    html.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

function logout() {
  emit('logout')
}

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      isSidebarOpen.value = false
      isUserMenuOpen.value = false
      isNotifMenuOpen.value = false
    }
  })
})
</script>

<template>
  <div
    class="h-screen flex w-full relative overflow-hidden text-slate-800 dark:text-slate-200 antialiased bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <aside :class="[
      'fixed inset-y-0 left-0 bg-[#0F172A] border-r border-slate-800 z-50 transform md:relative transition-all duration-300 ease-in-out flex flex-col shrink-0',
      isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
      isMinified ? 'w-20' : 'w-64'
    ]">
      <button @click="isMinified = !isMinified"
        class="hidden md:flex absolute -right-3.5 top-8 w-7 h-7 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white shadow-md z-[60] transition-colors">
        <i :class="isMinified ? 'fas fa-chevron-right text-[10px]' : 'fas fa-chevron-left text-[10px]'"></i>
      </button>

      <div class="p-6 flex items-center h-20 shrink-0 overflow-hidden"
        :class="isMinified ? 'justify-center px-0' : 'justify-start'">
        <div v-if="isMinified"
          class="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand/20 shrink-0">
          <img v-if="config?.logoV" :src="config.logoV" class="w-full h-full object-contain p-1" />
          <span v-else class="text-xl drop-shadow-md">  config?.nombre?.charAt(0) || 'I'  </span>
        </div>
        <div v-else class="flex items-center gap-3 w-full">
          <img v-if="config?.logoH" :src="config.logoH" class="h-8 object-contain max-w-[140px]" />
          <div v-else class="flex items-center gap-3">
            <div
              class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold shadow-lg shrink-0">
              <span class="drop-shadow-md">  config?.nombre?.charAt(0) || 'I'  </span>
            </div>
            <h1 class="font-bold text-white text-lg tracking-tight truncate">  config?.nombre || 'Dashboard'  </h1>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">

        <button @click="navigateTo('home')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'home' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-home text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Inicio</span></Transition>
          </div>
        </button>

        <button @click="navigateTo('resenas')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'resenas' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-star text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Reseñas</span></Transition>
          </div>
        </button>

        <button v-if="hasPermission('gestionar_usuarios')" @click="navigateTo('usuarios')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'usuarios' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-users text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Usuarios</span>
            </Transition>
          </div>
        </button>

        <button v-if="hasPermission('configurar_sistema')" @click="navigateTo('sistema')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'sistema' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-cog text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Configuración</span>
            </Transition>
          </div>
        </button>
      </nav>

      <div class="px-3 py-4 flex flex-col gap-1.5 border-t border-slate-800/50">
        <button @click="navigateTo('perfil')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'perfil' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-user-circle text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Mi Perfil</span>
            </Transition>
          </div>
        </button>

        <button @click="logout"
          class="w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 group">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-sign-out-alt text-lg w-6 text-center group-hover:-translate-x-1 transition-transform"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Cerrar Sesión</span>
            </Transition>
          </div>
        </button>
      </div>
    </aside>

    <div v-if="isSidebarOpen" @click="isSidebarOpen = false"
      class="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

    <main
      class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden dark:bg-slate-900 transition-colors relative z-10">
      <header
        class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 sticky top-0">
        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen"
            class="md:hidden text-slate-500 hover:text-brand p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <i class="fas fa-bars text-xl"></i>
          </button>
          <span class="inline-block text-sm font-semibold text-slate-400 dark:text-slate-500 ml-2">
            Dashboard / <span class="text-slate-800 dark:text-slate-200">  pageTitle  </span>
          </span>
        </div>

        <div class="flex items-center gap-3 sm:gap-4">

          <div class="relative flex items-center h-full">
            <button @click="isNotifMenuOpen = !isNotifMenuOpen; isUserMenuOpen = false"
              class="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-brand dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <i class="fas fa-bell text-[1.1rem]"></i>
              <span v-if="totalNotifications > 0"
                class="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </button>
            <div v-if="isNotifMenuOpen" @click="isNotifMenuOpen = false" class="fixed inset-0 z-40"></div>

            <div v-if="isNotifMenuOpen"
              class="absolute right-0 top-[calc(100%+12px)] w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div class="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                <h4 class="text-sm font-bold text-slate-800 dark:text-white">Notificaciones</h4>
                <span v-if="totalNotifications > 0"
                  class="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">  totalNotifications
                   </span>
              </div>

              <div class="p-4 text-center text-sm text-slate-500" v-if="totalNotifications === 0">Sin notificaciones
              </div>
              <div v-else class="flex flex-col">

  <div class="flex flex-col">

    <button v-if="notifications.resenasNuevas > 0"
      @click="navigateTo('resenas', 'recibidas')"
      class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 text-sm flex items-center gap-3 text-slate-700 dark:text-slate-300">
      <i class="fas fa-star text-amber-500 shrink-0"></i>
      <span>Tienes   notifications.resenasNuevas   reseñas por aprobar</span>
    </button>

    <button v-if="notifications.seguimientosAtrasados > 0"
      @click="navigateTo('resenas', 'por_evaluar')"
      class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm flex items-center gap-3 text-slate-700 dark:text-slate-300">
      <i class="fas fa-clock text-red-500 shrink-0"></i>
      <span>Tienes   notifications.seguimientosAtrasados   seguimientos atrasados</span>
    </button>
  </div>
</div>
            </div>
          </div>

          <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div class="relative flex items-center h-full">
            <button @click="isUserMenuOpen = !isUserMenuOpen; isNotifMenuOpen = false"
              class="flex items-center gap-3 pl-2 py-1 pr-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div class="hidden sm:flex flex-col items-end">
                <span class="text-sm font-bold text-slate-800 dark:text-white leading-tight">  userName  </span>
                <span class="text-[10px] font-semibold text-brand uppercase tracking-wider">  userRole  </span>
              </div>
              <div
                class="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shadow-md uppercase overflow-hidden">
                <img v-if="currentUser.logo" :src="currentUser.logo" class="w-full h-full object-cover"
                  @error="$event.target.style.display = 'none'" />
                <template v-else>  userInitials  </template>
              </div>
            </button>
            <div v-if="isUserMenuOpen" @click="isUserMenuOpen = false" class="fixed inset-0 z-40"></div>

            <div v-if="isUserMenuOpen"
              class="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                <p class="text-sm font-bold text-slate-800 dark:text-white truncate">  currentUser.nombre  </p>
                <p class="text-xs text-slate-500 truncate mt-0.5">  currentUser.email  </p>
              </div>
              <div class="p-2 space-y-0.5">

                <button @click="navigateTo('perfil'); isUserMenuOpen = false"
                  class="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <i class="fas fa-user w-4 text-slate-400"></i>
                  <span>Mi Perfil</span>
                </button>

                <div @click="toggleTheme"
                  class="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                  <div class="flex items-center gap-3">
                    <i :class="isDarkMode ? 'fas fa-moon text-amber-400' : 'fas fa-sun text-slate-400'"
                      class="w-4 transition-colors"></i>
                    <span>Modo Oscuro</span>
                  </div>

                  <div :class="isDarkMode ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-600'"
                    class="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center">
                    <div :class="isDarkMode ? 'translate-x-4' : 'translate-x-0'"
                      class="w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out">
                    </div>
                  </div>
                </div>

                <button @click="logout"
                  class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                  <i class="fas fa-sign-out-alt w-4 text-red-500"></i>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </header>

      <div class="flex-1 overflow-hidden p-3 sm:p-5">

        <component :is="currentViewComponent" :config="config" :initial-sub-tab="subTabToOpen" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-sidebar-enter-active,
.fade-sidebar-leave-active {
  transition: opacity 0.15s ease;
}

.fade-sidebar-enter-from,
.fade-sidebar-leave-to {
  opacity: 0;
}
</style>
````

## `src/components/ui/BaseButton.vue`

````text
<script setup>
import { computed } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  icon: { type: String, default: '' }
})

const buttonClasses = computed(() => {
  const base = "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap"

  const variants = {
    primary: "bg-brand text-white shadow-md shadow-brand/20 hover:brightness-110",
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-transparent dark:border-red-800",
    outline: "border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
  }

  return `${base} ${variants[props.variant] || variants.primary}`
})
</script>

<template>
  <button :type="type" :disabled="disabled || isLoading" :class="buttonClasses">
    <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
    <i v-else-if="icon" :class="icon"></i>
    <span><slot></slot></span>
  </button>
</template>
````

## `src/components/ui/BaseInput.vue`

````text
<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  icon: { type: String, default: '' },
  error: { type: String, default: '' },
  readonly: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
        label
    </label>
    <div class="relative">

      <i v-if="icon" :class="[icon, 'absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400']"></i>

      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :type="type"
        :placeholder="placeholder"
        :readonly="readonly"
        :class="[
          'w-full p-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none transition-colors text-sm text-slate-800 dark:text-white',
          icon ? 'pl-10' : 'pl-3',
          error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand',
          readonly ? 'cursor-not-allowed opacity-70' : ''
        ]"
      />
    </div>

    <Transition name="fade">
      <p v-if="error" class="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
        <i class="fas fa-exclamation-circle"></i>   error
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
````

## `src/components/ui/BaseModal.vue`

````text
<script setup>
defineProps({
  title: { type: String, default: '' },
  maxWidth: { type: String, default: 'max-w-md' }
})

const open = defineModel({ type: Boolean, required: true })

function close() {
  open.value = false
}
</script>

<template>
  <Transition name="fade-modal">
    <div
      v-if="open"
      class="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-2.5 sm:p-4 z-[100] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div
        :class="[
          'bg-white dark:bg-slate-900 rounded-2xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden',
          maxWidth
        ]"
      >

        <div
          v-if="title || $slots['header-extra']"
          class="px-4 py-3.5 sm:px-5 border-b border-slate-100 dark:border-slate-800/90 flex justify-between items-center gap-3 shrink-0"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <slot name="header-icon" />
            <h3 class="font-bold text-sm sm:text-base text-slate-800 dark:text-white truncate">
                title
            </h3>
            <slot name="header-extra" />
          </div>

          <button
            type="button"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Cerrar"
            @click="close"
          >
            <i class="fas fa-times text-sm" />
          </button>
        </div>

        <div class="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="px-4 py-3 sm:px-5 border-t border-slate-100 dark:border-slate-800/90 flex items-center justify-between gap-2.5 bg-slate-50/60 dark:bg-slate-950/40 shrink-0"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(4px);
}
</style>
````

## `src/components/ui/BaseSelect.vue`

````text
<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, required: true },
  icon: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
        label
    </label>

    <div class="relative">

      <i v-if="icon" :class="[icon, 'absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 z-10']"></i>

      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        :disabled="disabled"
        :class="[
          'w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none transition-colors text-sm text-slate-800 dark:text-white cursor-pointer appearance-none',
          icon ? 'pl-10' : 'pl-3',
          error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand',
          disabled ? 'cursor-not-allowed opacity-70' : ''
        ]"
      >
        <option value="" disabled selected>Selecciona...</option>
        <option v-for="(opt, i) in options" :key="i" :value="opt.value !== undefined ? opt.value : opt">
            opt.label !== undefined ? opt.label : opt
        </option>
      </select>

      <i class="fas fa-chevron-down absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
    </div>

    <Transition name="fade">
      <p v-if="error" class="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
        <i class="fas fa-exclamation-circle"></i>   error
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
````

## `src/components/ui/BaseStarRating.vue`

````text
<script setup>
defineProps({
  score: { type: Number, required: true },
  max: { type: Number, default: 5 },
  size: { type: String, default: 'text-sm' }
})
</script>

<template>
  <div class="flex items-center gap-1">
    <i
      v-for="n in max"
      :key="n"
      :class="[
        'fas fa-star transition-colors',
        size,
        n <= score ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'
      ]"
    ></i>
  </div>
</template>
````

## `src/components/ui/DataTable.vue`

````text
<script setup>

import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  filterOptions: { type: Array, default: () => [] },
  filterColumnKey: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Buscar...' },
  mobilePreviewCount: { type: Number, default: 2 }
})

defineEmits(['row-action', 'row-click'])

const isColumnPickerOpen = ref(false)
const selectedColumns = ref([])

onMounted(() => {
  selectedColumns.value = props.columns.filter((c) => !c.hidden).map((c) => c.key)
})

const activeColumns = computed(() =>
  props.columns.filter((col) => col.required || selectedColumns.value.includes(col.key))
)

const searchQuery = ref('')
const selectedFilter = ref('all')
const itemsPerPage = ref(10)
const currentPage = ref(1)
const sortColumn = ref('')
const sortAsc = ref(true)
const expandedRows = ref([])

watch([searchQuery, selectedFilter, itemsPerPage], () => {
  currentPage.value = 1
  expandedRows.value = []
})

const filteredAndSortedData = computed(() => {
  let result = [...props.data]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((row) =>
      props.columns.some((col) => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }

  if (selectedFilter.value !== 'all' && props.filterColumnKey) {
    result = result.filter((row) => row[props.filterColumnKey] === selectedFilter.value)
  }

  if (sortColumn.value) {
    result.sort((a, b) => {
      const valA = a[sortColumn.value]
      const valB = b[sortColumn.value]
      if (valA === valB) return 0
      const comparison = valA > valB ? 1 : -1
      return sortAsc.value ? comparison : -comparison
    })
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredAndSortedData.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() =>
  Math.ceil(filteredAndSortedData.value.length / itemsPerPage.value) || 0
)
const totalItems = computed(() => filteredAndSortedData.value.length)
const currentRangeStart = computed(() =>
  totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
)
const currentRangeEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
)

const skeletonRows = [1, 2, 3, 4, 5]
const skeletonMobile = [1, 2, 3]

function handleSort(colKey) {
  if (sortColumn.value === colKey) {
    sortAsc.value = !sortAsc.value
  } else {
    sortColumn.value = colKey
    sortAsc.value = true
  }
}

function toggleRow(id) {
  const index = expandedRows.value.indexOf(id)
  if (index > -1) expandedRows.value.splice(index, 1)
  else expandedRows.value.push(id)
}

function rowKey(row, index) {
  return row.id ?? row.fila ?? index
}
</script>

<template>
  <div
    class="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors relative"
  >

    <div
      class="h-14 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex gap-2 items-center z-20"
    >

      <div class="flex-1 sm:flex-initial sm:w-72 min-w-0">
        <BaseInput v-model="searchQuery" :placeholder="searchPlaceholder" icon="fas fa-search" />
      </div>

      <div class="flex gap-2 items-center ml-auto shrink-0">
        <div class="relative">
          <BaseButton
            variant="outline"
            icon="fas fa-columns"
            class="px-3"
            @click="isColumnPickerOpen = !isColumnPickerOpen"
          >
            <span class="hidden sm:inline">Columnas</span>
          </BaseButton>
          <Transition name="fade">
            <div
              v-if="isColumnPickerOpen"
              class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-2"
            >
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2 pt-1">
                Mostrar columnas
              </div>
              <div class="flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
                <label
                  v-for="col in columns"
                  :key="col.key"
                  class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  :class="{ 'opacity-60 cursor-not-allowed': col.required }"
                >
                  <input
                    v-model="selectedColumns"
                    type="checkbox"
                    :value="col.key"
                    :disabled="col.required"
                    class="w-4 h-4 rounded text-brand border-slate-300 focus:ring-brand"
                  />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">  col.label  </span>
                  <i v-if="col.required" class="fas fa-lock text-xs text-slate-400" />
                </label>
              </div>
            </div>
          </Transition>
        </div>

        <div class="flex-none">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <div
      v-if="filterOptions.length > 0"
      class="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-1.5 shrink-0 bg-white dark:bg-slate-800"
    >
      <button
        type="button"
        class="h-8 px-3 rounded-full text-xs font-semibold transition-colors"
        :class="
          selectedFilter === 'all'
            ? 'bg-brand text-white'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        "
        @click="selectedFilter = 'all'"
      >
        Todos
      </button>
      <button
        v-for="opt in filterOptions"
        :key="opt"
        type="button"
        class="h-8 px-3 rounded-full text-xs font-semibold transition-colors"
        :class="
          selectedFilter === opt
            ? 'bg-brand text-white'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        "
        @click="selectedFilter = opt"
      >
          opt
      </button>
    </div>

    <div v-if="isColumnPickerOpen" class="fixed inset-0 z-10" @click="isColumnPickerOpen = false" />

    <div class="flex-1 overflow-auto custom-scrollbar relative bg-slate-50/30 dark:bg-slate-900/20">

      <table class="min-w-full text-left text-sm whitespace-nowrap hidden md:table">
        <thead
          class="sticky top-0 z-10 bg-slate-50 dark:bg-[#0B1120] shadow-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-700"
        >
          <tr class="h-12">
            <th
              v-for="col in activeColumns"
              :key="col.key"
              class="px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white select-none"
              @click="handleSort(col.key)"
            >
              <div class="flex items-center gap-2">
                  col.label
                <i
                  class="fas fa-sort text-slate-300 dark:text-slate-600"
                  :class="{
                    'text-brand': sortColumn === col.key,
                    'fa-sort-up': sortColumn === col.key && sortAsc,
                    'fa-sort-down': sortColumn === col.key && !sortAsc
                  }"
                />
              </div>
            </th>
            <th v-if="$slots.actions" class="px-4 text-right">Acciones</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
          <template v-if="isLoading">
            <tr v-for="i in skeletonRows" :key="'skel' + i" class="h-14 animate-pulse">
              <td v-for="col in activeColumns" :key="'skel-td' + col.key" class="px-4">
                <div class="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
              </td>
              <td v-if="$slots.actions" class="px-4">
                <div class="h-8 bg-slate-200 dark:bg-slate-700/50 rounded w-16 ml-auto" />
              </td>
            </tr>
          </template>

          <tr v-else-if="paginatedData.length === 0">
            <td :colspan="activeColumns.length + ($slots.actions ? 1 : 0)" class="py-12">
              <EmptyState
                icon="fas fa-search"
                title="No se encontraron registros"
                description="Intenta ajustando los filtros o el término de búsqueda."
              />
            </td>
          </tr>

          <tr
            v-for="(row, index) in paginatedData"
            v-else
            :key="rowKey(row, index)"
            class="h-14 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            @click="$emit('row-click', row)"
          >
            <td
              v-for="col in activeColumns"
              :key="col.key"
              class="px-4 text-slate-700 dark:text-slate-300"
            >
              <slot :name="'cell-' + col.key" :item="row">  row[col.key]  </slot>
            </td>
            <td
              v-if="$slots.actions"
              class="px-4 text-right"
              @click.stop
            >
              <slot name="actions" :item="row" />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="md:hidden p-3 flex flex-col gap-3">
        <template v-if="isLoading">
          <div
            v-for="i in skeletonMobile"
            :key="'skelm' + i"
            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 animate-pulse flex flex-col gap-3 min-h-[88px]"
          >
            <div class="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2" />
            <div class="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
          </div>
        </template>

        <div v-else-if="paginatedData.length === 0" class="py-10">
          <EmptyState icon="fas fa-search" title="Sin resultados" description="Intenta buscar otra cosa." />
        </div>

        <div
          v-for="(row, index) in paginatedData"
          v-else
          :key="rowKey(row, index)"
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col shadow-sm cursor-pointer active:scale-[0.99]"
          @click="$emit('row-click', row)"
        >
          <div class="flex flex-col gap-3">
            <div
              v-for="col in activeColumns.slice(0, mobilePreviewCount)"
              :key="col.key"
              class="flex flex-col"
            >
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">  col.label  </span>
              <div class="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                <slot :name="'cell-' + col.key" :item="row">  row[col.key]  </slot>
              </div>
            </div>
          </div>

          <Transition name="expand">
            <div v-show="expandedRows.includes(rowKey(row, index))">
              <div class="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
                <div
                  v-for="col in activeColumns.slice(mobilePreviewCount)"
                  :key="col.key"
                  class="flex flex-col"
                >
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">  col.label  </span>
                  <div class="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                    <slot :name="'cell-' + col.key" :item="row">  row[col.key]  </slot>
                  </div>
                </div>
              </div>
              <div
                v-if="$slots.actions"
                class="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-end gap-2"
                @click.stop
              >
                <slot name="actions" :item="row" />
              </div>
            </div>
          </Transition>

          <button
            v-if="activeColumns.length > mobilePreviewCount || $slots.actions"
            type="button"
            class="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/30 text-xs font-bold text-brand w-full text-center flex items-center justify-center gap-1.5"
            @click.stop="toggleRow(rowKey(row, index))"
          >
            <span>  expandedRows.includes(rowKey(row, index)) ? 'Ocultar detalles' : 'Leer más'  </span>
            <i
              :class="expandedRows.includes(rowKey(row, index)) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
              class="text-[10px]"
            />
          </button>
        </div>
      </div>
    </div>

    <div
      class="h-14 px-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-between gap-4 z-20"
    >
      <div class="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Mostrar</span>
        <select
          v-model="itemsPerPage"
          class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand font-medium cursor-pointer"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </div>

      <div class="text-sm text-slate-500 dark:text-slate-400 font-medium flex-1 sm:text-center text-left">
        <span class="sm:hidden text-xs">  currentRangeStart   -   currentRangeEnd   de   totalItems  </span>
        <span class="hidden sm:inline">
          Mostrando   currentRangeStart   al   currentRangeEnd   de
          <strong class="text-slate-800 dark:text-slate-200">  totalItems  </strong>
        </span>
      </div>

      <div class="flex gap-2 shrink-0">
        <button
          type="button"
          class="min-w-[40px] h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fas fa-chevron-left text-[12px]" />
          <span class="hidden sm:inline">Anterior</span>
        </button>
        <button
          type="button"
          class="min-w-[40px] h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="currentPage >= totalPages || totalPages === 0"
          @click="currentPage++"
        >
          <span class="hidden sm:inline">Siguiente</span>
          <i class="fas fa-chevron-right text-[12px]" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 800px;
  opacity: 1;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  margin-top: 0;
  border-color: transparent;
}
</style>
````

## `src/components/ui/EmptyState.vue`

````text
<script setup>
defineProps({
  icon: { type: String, default: 'fas fa-folder-open' },
  title: { type: String, default: 'No hay registros' },
  description: { type: String, default: '' }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center fade-in">

    <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
      <i :class="[icon, 'text-2xl text-slate-300 dark:text-slate-600']"></i>
    </div>

    <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">  title  </h4>

    <p v-if="description" class="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-xs">
        description
    </p>

    <div v-if="$slots.default" class="mt-5">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
</style>
````

## `src/components/ui/SkeletonBlock.vue`

````text
<script setup>
defineProps({
  rows: { type: Number, default: 6 },
  variant: {
    type: String,
    default: 'list',
    validator: (v) =>
      ['list', 'cards', 'form', 'table', 'bento', 'reviews', 'tokens', 'sistema', 'perfil'].includes(v)
  }
})
</script>

<template>

  <div
    v-if="variant === 'table' || variant === 'tokens'"
    class="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse select-none"
  >
    <div class="h-14 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2 shrink-0">
      <div class="h-9 w-full sm:w-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div class="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl ml-auto shrink-0" />
      <div class="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0 hidden sm:block" />
    </div>
    <div class="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-1.5 shrink-0">
      <div v-for="n in 5" :key="'chip' + n" class="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
    </div>
    <div class="flex-1 min-h-0">
      <div
        v-for="n in rows"
        :key="'row' + n"
        class="h-14 px-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
      >
        <div class="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
        <div class="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
        <div class="h-3.5 flex-1 max-w-[160px] bg-slate-100 dark:bg-slate-800/70 rounded hidden sm:block" />
        <div class="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0 ml-auto" />
      </div>
    </div>
    <div class="h-14 px-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
      <div class="h-3.5 w-24 bg-slate-100 dark:bg-slate-800 rounded hidden sm:block" />
      <div class="h-3.5 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
      <div class="flex gap-2">
        <div class="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div class="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  </div>

  <div
    v-else-if="variant === 'sistema'"
    class="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse select-none min-h-0"
  >
    <div class="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div class="space-y-2">
            <div class="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-2.5 w-44 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        <div class="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div class="sm:col-span-7 space-y-2">
          <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
        <div class="sm:col-span-5 space-y-2">
          <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
      </div>
      <div class="h-20 w-full rounded-xl bg-slate-100/80 dark:bg-slate-800/50" />
      <div class="h-20 w-full rounded-xl bg-slate-100/80 dark:bg-slate-800/50" />
    </div>

    <div class="lg:col-span-5 flex flex-col gap-4 min-h-0">
      <div class="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div class="space-y-2">
            <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-2.5 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        <div class="space-y-2">
          <div class="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
        <div class="h-12 w-full bg-slate-100/80 dark:bg-slate-800/50 rounded-xl" />
      </div>

      <div class="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div class="flex justify-between">
          <div class="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-md" />
        </div>
        <div class="h-16 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl my-auto" />
        <div class="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded" />
      </div>
    </div>
  </div>

  <div
    v-else-if="variant === 'perfil'"
    class="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse select-none min-h-0"
  >
    <div class="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between items-center">
      <div class="w-full flex justify-between">
        <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-md" />
      </div>
      <div class="flex flex-col items-center gap-3 my-auto">
        <div class="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div class="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-3 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
      <div class="w-full h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
    </div>

    <div class="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4">
      <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div class="space-y-2">
          <div class="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-2.5 w-52 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
      </div>
      <div class="space-y-4 my-auto">
        <div class="space-y-2">
          <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
        <div class="space-y-2">
          <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
      </div>
      <div class="h-10 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
    </div>
  </div>

  <div
    v-else-if="variant === 'bento'"
    class="h-full w-full flex flex-col gap-4 animate-pulse select-none"
  >
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 shrink-0">
      <div class="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 min-h-[150px] flex flex-col justify-between">
        <div class="flex justify-between gap-4">
          <div class="space-y-3">
            <div class="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-12 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div class="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full mt-4" />
      </div>
      <div class="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 min-h-[150px] flex flex-col justify-between">
        <div class="flex justify-between gap-4">
          <div class="space-y-3">
            <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-12 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
        <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full mt-4" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-h-0">
      <div
        v-for="n in 6"
        :key="'kpi' + n"
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 min-h-[100px] flex flex-col justify-between"
      >
        <div class="flex justify-between items-center">
          <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
        <div class="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  </div>

  <div
    v-else-if="variant === 'cards'"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse select-none"
  >
    <div
      v-for="n in rows"
      :key="'card' + n"
      class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 min-h-[104px]"
    >
      <div class="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
      <div class="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div class="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
    </div>
  </div>

  <div v-else-if="variant === 'form'" class="space-y-4 animate-pulse max-w-lg select-none">
    <div v-for="n in rows" :key="'field' + n" class="space-y-2">
      <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
      <div class="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
    </div>
    <div class="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl ml-auto" />
  </div>

  <div v-else-if="variant === 'reviews'" class="space-y-3 animate-pulse select-none">
    <div
      v-for="n in rows"
      :key="'rev' + n"
      class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 min-h-[112px]"
    >
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-2.5 w-1/4 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div class="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      <div class="space-y-2">
        <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
        <div class="h-2.5 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
    </div>
  </div>

  <div v-else class="space-y-3 animate-pulse select-none">
    <div
      v-for="n in rows"
      :key="'list' + n"
      class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 min-h-[56px]"
    >
      <div class="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-3 w-2/5 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-2.5 w-3/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
      <div class="h-5 w-14 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0" />
    </div>
  </div>
</template>
````

## `src/components/ui/StatusBadge.vue`

````text
<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

const statusConfig = computed(() => {
  const s = String(props.status || '').toUpperCase().trim()

  if (['ACTIVO', 'APROBADO', 'COMPLETADO', 'USADO'].includes(s)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
  }
  if (['PENDIENTE', 'EN ESPERA', 'REVISIÓN', 'EXPIRADO'].includes(s)) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
  }
  if (['REVOCADO', 'RECHAZADO', 'ERROR', 'CANCELADO', 'ARCHIVADO', 'SUSPENDIDO'].includes(s)) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
  }
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
})
</script>

<template>
  <span :class="['px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase', statusConfig]">
      status
  </span>
</template>
````

## `src/composables/useAuth.js`

````javascript
import{reactive}from"vue";import{apiClient}from"../services/api";export const authState=reactive({user:null,isAuthenticated:false,isReady:false});export async function fetchUserInfo(overrideToken=null){const token=overrideToken||localStorage.getItem("inm_dash_token");if(!token){authState.isReady=true;return false}try{const data=await apiClient.post("get_user_info",overrideToken?{token:overrideToken}:{});authState.user=data;authState.isAuthenticated=true;return true}catch(e){console.error(e.message);return false}finally{authState.isReady=true}}export function logout(){localStorage.removeItem("inm_dash_token");authState.user=null;authState.isAuthenticated=false;window.location.reload()}export function hasPermission(permission){return(authState.user?.permisos||[]).includes(permission)}
````

## `src/services/api.js`

````javascript
const API_URL=import.meta.env.VITE_API_URL;if(!API_URL){console.warn("ADVERTENCIA: VITE_API_URL no está definida en el archivo .env")}export const apiClient={async post(action,payload={}){const token=localStorage.getItem("inm_dash_token");try{const response=await fetch(API_URL,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:action,payload:payload,token:token})});const result=await response.json();if(result.status==="error"){throw new Error(result.message)}return result.data}catch(error){console.error(`Error de Red en API [${action}]:`,error);throw error}}};
````

## `src/utils/tokenEstado.js`

````javascript
export function normalizeTokenEstado(rawEstado,dias=0){const raw=String(rawEstado||"").trim();if(raw==="Usado")return"Usado";if(raw==="Cancelado")return"Revocado";if(raw==="Activo"&&Number(dias)>7)return"Expirado";if(raw==="Activo")return"Activo";return raw||"Activo"}export function statusTone(status){const s=String(status||"").toUpperCase().trim();if(["ACTIVO","APROBADO","COMPLETADO","USADO"].includes(s))return"success";if(["PENDIENTE","EN ESPERA","REVISIÓN","EXPIRADO"].includes(s))return"warning";if(["REVOCADO","RECHAZADO","ERROR","CANCELADO","ARCHIVADO","SUSPENDIDO"].includes(s))return"danger";return"neutral"}
````

## `src/views/admin/SistemaView.vue`

````text
<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) }
})

const isLoading = ref(true)
const isSaving = ref(false)

const form = ref({
  Empresa_Nombre: '',
  Color_Primario: '#4cc3e9',
  Logo_Horizontal: '',
  Logo_Vertical: '',
  URL_Frontend_App: ''
})

const previewH = computed(() => {
  const u = form.value.Logo_Horizontal?.trim()
  return u && /^https?:\/\//i.test(u) ? u : null
})

const previewV = computed(() => {
  const u = form.value.Logo_Vertical?.trim()
  return u && /^https?:\/\//i.test(u) ? u : null
})

async function loadConfig() {
  isLoading.value = true
  try {
    const data = await apiClient.post('get_public_config')
    form.value = {
      Empresa_Nombre: data.nombre || '',
      Color_Primario: data.color || '#4cc3e9',
      Logo_Horizontal: data.logoH || '',
      Logo_Vertical: data.logoV || '',
      URL_Frontend_App: data.urlFrontend || ''
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function saveConfig() {
  if (!hasPermission('configurar_sistema')) return
  isSaving.value = true
  try {
    await apiClient.post('update_config', { configuracion: form.value })
    document.documentElement.style.setProperty('--brand-color', form.value.Color_Primario)
    window.Swal?.fire({
      icon: 'success',
      title: 'Configuración guardada',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto pb-6 select-none">

    <div class="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">
            form.Empresa_Nombre || props.config?.nombre || 'Configuración'
        </p>
        <h2 class="text-2xl font-semibold text-white mt-1">Identidad y enlaces</h2>
        <p class="text-sm text-slate-400 mt-1">
          Cómo se ve tu marca y dónde reciben los clientes las reseñas
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button type="button" :disabled="isLoading || isSaving"
          class="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          @click="loadConfig">
          Recargar
        </button>

        <BaseButton v-if="hasPermission('configurar_sistema')" :is-loading="isSaving" @click="saveConfig">
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <SkeletonBlock v-if="isLoading" variant="sistema" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <div class="lg:col-span-7 h-full rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col">
        <div class="mb-5">
          <h3 class="text-sm font-medium text-white">Tu marca</h3>
          <p class="text-xs text-slate-400 mt-1">
            Nombre, color y logos que aparecen en invitaciones y reseñas
          </p>
        </div>

        <div class="space-y-5 flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput v-model="form.Empresa_Nombre" label="Nombre de la empresa" placeholder="Inmobiliarte 22" />

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">
                Color de marca
              </label>

              <div
                class="flex items-center gap-2 h-11 px-2 rounded-xl border border-white/15 bg-white/5 overflow-hidden">

                <input v-model="form.Color_Primario" type="color"
                  class="w-7 h-7 cursor-pointer bg-transparent border-0 shrink-0 rounded-full overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full" />
                <input v-model="form.Color_Primario" type="text"
                  class="flex-1 px-1 bg-transparent outline-none text-sm font-mono uppercase text-slate-100"
                  placeholder="#4CC3E9" />
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1 w-full">
              <BaseInput v-model="form.Logo_Horizontal" label="Logo horizontal" placeholder="https://..." />
            </div>

            <div
              class="w-full sm:w-36 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0 overflow-hidden">
              <img v-if="previewH" :src="previewH" alt="Logo horizontal" class="max-h-full max-w-full object-contain" />
              <span v-else class="text-xs text-slate-500">Vista previa</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1 w-full">
              <BaseInput v-model="form.Logo_Vertical" label="Logo vertical / icono" placeholder="https://..." />
            </div>

            <div
              class="w-14 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0 overflow-hidden">
              <img v-if="previewV" :src="previewV" alt="Logo vertical" class="max-h-full max-w-full object-contain" />
              <i v-else class="fas fa-cube text-slate-500 text-sm"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-5 flex flex-col gap-6">

        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="mb-5">
            <h3 class="text-sm font-medium text-white">Enlace de reseñas</h3>
            <p class="text-xs text-slate-400 mt-1">
              URL base donde los clientes abren el formulario de evaluación
            </p>
          </div>

          <BaseInput v-model="form.URL_Frontend_App" label="URL de la aplicación"
            placeholder="https://inmobiliarte22.com.mx/resenas" />

          <div class="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <p class="text-xs text-slate-400">Estructura de invitación</p>
            <p class="text-xs font-mono text-sky-400 mt-1 truncate">
                form.URL_Frontend_App || 'https://tudominio.com'  /?t=TOKEN
            </p>
          </div>
        </div>

        <div class="flex-1 rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col">
          <div class="mb-5">
            <h3 class="text-sm font-medium text-white">Así se ve tu marca</h3>
            <p class="text-xs text-slate-400 mt-1">
              Vista previa de cómo aparece en las invitaciones
            </p>
          </div>

          <div class="flex-1 flex items-center">
            <div
              class="w-full p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="previewV || previewH" :src="previewV || previewH" alt="Logo"
                    class="max-h-full max-w-full object-contain" />
                  <i v-else class="fas fa-building text-slate-500 text-xs"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-white truncate">
                      form.Empresa_Nombre || 'Tu empresa'
                  </p>
                  <div class="flex gap-0.5 mt-0.5">
                    <i v-for="n in 5" :key="n" class="fas fa-star text-[10px] text-amber-400"></i>
                  </div>
                </div>
              </div>

              <span class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-950 shrink-0"
                :style="{ backgroundColor: form.Color_Primario || '#4cc3e9' }">
                Evaluar
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
````

## `src/views/admin/UsuarioAddModal.vue`

````text
<script setup>
import { ref, computed, watch } from 'vue'
import { apiClient } from '../../services/api'

const isOpen = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['saved'])

const isSaving = ref(false)
const form = ref({ idUser: '', nombre: '', email: '', rol: 'USUARIO', logo: '' })

const roleOptions = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'APROBADOR', label: 'Aprobador' },
  { value: 'USUARIO', label: 'Usuario' }
]

const logoPreview = computed(() => {
  const url = (form.value.logo || '').trim()
  return /^https?:\/\//i.test(url) ? url : null
})

watch(isOpen, (open) => {
  if (open) {
    form.value = { idUser: '', nombre: '', email: '', rol: 'USUARIO', logo: '' }
  }
})

function close() {
  isOpen.value = false
}

async function save() {
  if (!form.value.nombre || !form.value.email) {
    return window.Swal?.fire('Atención', 'Nombre y email son obligatorios', 'warning')
  }
  isSaving.value = true
  try {
    await apiClient.post('add_user', {
      idUser: form.value.idUser || ('USR-' + Date.now().toString(36).toUpperCase()),
      nombre: form.value.nombre,
      email: form.value.email,
      rol: form.value.rol,
      logo: (form.value.logo || '').trim()
    })
    isOpen.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Usuario añadido',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
    emit('saved')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Nuevo Usuario" max-width="max-w-md">
    <div class="space-y-4">
      <BaseInput v-model="form.nombre" label="Nombre completo" placeholder="Ej. Juan Pérez" icon="fas fa-user" />
      <BaseInput v-model="form.email" label="Email" type="email" placeholder="correo@empresa.com" icon="fas fa-envelope" />
      <BaseInput v-model="form.idUser" label="ID (opcional)" placeholder="Se genera automático si se deja vacío" icon="fas fa-fingerprint" />
      <BaseSelect v-model="form.rol" label="Rol" :options="roleOptions" />
      <BaseInput v-model="form.logo" label="Avatar (URL)" placeholder="https://..." icon="fas fa-image" />
      <div
        v-if="logoPreview"
        class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block"
      >
        <img :src="logoPreview" alt="Preview" class="h-12 w-12 rounded-full object-cover" />
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" @click="close">Cancelar</BaseButton>
        <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="save">Guardar</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
````

## `src/views/admin/UsuarioEditModal.vue`

````text
<script setup>
import { ref, computed, watch } from 'vue'
import { apiClient } from '../../services/api'

const isOpen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['saved'])

const isSaving = ref(false)
const form = ref({ nombre: '', rol: 'USUARIO', logo: '', estado: 'Activo' })

const roleOptions = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'APROBADOR', label: 'Aprobador' },
  { value: 'USUARIO', label: 'Usuario' }
]

const estadoOptions = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Suspendido', label: 'Suspendido' }
]

const logoPreview = computed(() => {
  const url = (form.value.logo || '').trim()
  return /^https?:\/\//i.test(url) ? url : null
})

watch(
  () => [isOpen.value, props.user],
  ([open]) => {
    if (open && props.user) {
      form.value = {
        nombre: props.user.nombre || '',
        rol: (props.user.rol || 'USUARIO').toUpperCase(),
        logo: props.user.logo || '',
        estado: props.user.estado || 'Activo'
      }
    }
  }
)

function close() {
  isOpen.value = false
}

async function save() {
  if (!props.user) return
  if (!form.value.nombre?.trim()) {
    return window.Swal?.fire('Atención', 'El nombre es obligatorio', 'warning')
  }
  isSaving.value = true
  try {
    await apiClient.post('update_user', {
      fila: props.user.fila,
      nombre: form.value.nombre.trim(),
      rol: form.value.rol,
      logo: (form.value.logo || '').trim(),
      estado: form.value.estado
    })
    isOpen.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Usuario actualizado',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
    emit('saved')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Editar Usuario" max-width="max-w-md">
    <div class="space-y-4">
      <BaseInput v-model="form.nombre" label="Nombre" placeholder="Nombre completo" icon="fas fa-user" />
      <BaseSelect v-model="form.rol" label="Rol" :options="roleOptions" />
      <BaseSelect v-model="form.estado" label="Estado" :options="estadoOptions" />
      <BaseInput v-model="form.logo" label="Avatar (URL)" placeholder="https://..." icon="fas fa-image" />
      <div
        v-if="logoPreview"
        class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block"
      >
        <img :src="logoPreview" alt="Preview" class="h-12 w-12 rounded-full object-cover" />
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" @click="close">Cancelar</BaseButton>
        <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="save">Guardar</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
````

## `src/views/admin/UsuariosView.vue`

````text
<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import UsuarioAddModal from './UsuarioAddModal.vue'
import UsuarioEditModal from './UsuarioEditModal.vue'

const isLoading = ref(true)
const users = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editing = ref(null)

const columns = [
  { key: 'avatar', label: '', required: true },
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado', required: true }
]

async function fetchUsers() {
  isLoading.value = true
  try {
    users.value = await apiClient.post('get_users')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUsers)

function openEdit(user) {
  editing.value = user
  showEditModal.value = true
}

async function toggleStatus(user) {
  const next = String(user.estado).toUpperCase() === 'ACTIVO' ? 'Suspendido' : 'Activo'
  const result = await window.Swal?.fire({
    title: next === 'Activo' ? '¿Activar usuario?' : '¿Suspender usuario?',
    text: user.nombre,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: next === 'Activo' ? '#10b981' : '#ef4444'
  })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('update_user', { fila: user.fila, estado: next })
    user.estado = next
    window.Swal?.fire({
      icon: 'success',
      title: 'Estado actualizado',
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

function initials(name) {
  return (name || 'U').substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <SkeletonBlock v-if="isLoading" variant="table" :rows="6" />

    <DataTable
      v-else
      :mobile-preview-count="3"
      :columns="columns"
      :data="users"
      :is-loading="false"
      search-placeholder="Buscar usuario..."
      :filter-options="['Activo', 'Pendiente', 'Suspendido']"
      filter-column-key="estado"
    >
      <template #header-actions>
        <BaseButton
          v-if="hasPermission('gestionar_usuarios')"
          icon="fas fa-user-plus"
          @click="showAddModal = true"
        >
          <span class="hidden sm:inline ml-1">Añadir Usuario</span>
        </BaseButton>
      </template>

      <template #cell-avatar="{ item }">
        <div class="w-9 h-9 rounded-full overflow-hidden bg-brand/10 flex items-center justify-center shrink-0">
          <img
            v-if="item.logo"
            :src="item.logo"
            :alt="item.nombre"
            class="w-full h-full object-cover"
            @error="$event.target.style.display = 'none'"
          />
          <span v-else class="text-xs font-bold text-brand">  initials(item.nombre)  </span>
        </div>
      </template>

      <template #cell-rol="{ item }">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">  item.rol  </span>
      </template>

      <template #cell-estado="{ item }">
        <StatusBadge :status="item.estado" />
      </template>

      <template #actions="{ item }">
        <div v-if="hasPermission('gestionar_usuarios')" class="flex items-center gap-1 justify-end">
          <button
            type="button"
            class="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
            title="Editar"
            @click.stop="openEdit(item)"
          >
            <i class="fas fa-pen text-xs" />
          </button>
          <button
            type="button"
            class="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
            :title="String(item.estado).toUpperCase() === 'ACTIVO' ? 'Suspender' : 'Activar'"
            @click.stop="toggleStatus(item)"
          >
            <i
              :class="String(item.estado).toUpperCase() === 'ACTIVO' ? 'fas fa-user-slash' : 'fas fa-user-check'"
              class="text-xs"
            />
          </button>
        </div>
      </template>
    </DataTable>

    <UsuarioAddModal v-model="showAddModal" @saved="fetchUsers" />
    <UsuarioEditModal v-model="showEditModal" :user="editing" @saved="fetchUsers" />
  </div>
</template>
````

## `src/views/auth/LoginView.vue`

````text
<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../services/api'

const props = defineProps({ config: Object })
const emit = defineEmits(['login-success'])

const step = ref('EMAIL')
const email = ref('')
const otp = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const isDark = localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
})

async function solicitarAcceso() {
  if (!email.value.includes('@')) {
    errorMsg.value = 'Ingresa un formato válido'
    return
  }
  isLoading.value = true
  errorMsg.value = ''
  try {
    await apiClient.post('request_otp', { email: email.value })
    step.value = 'OTP'
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    isLoading.value = false
  }
}

async function verificarCodigo() {
  if (otp.value.length !== 6) {
    errorMsg.value = 'El código debe tener 6 dígitos'
    return
  }
  isLoading.value = true
  errorMsg.value = ''
  try {
    const { token } = await apiClient.post('verify_otp', { email: email.value, otp: otp.value })
    emit('login-success', token)
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative z-50 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/10 dark:bg-brand/20 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

    <div class="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-8 sm:p-10 relative z-10 transition-colors">
      <div class="text-center mb-8">
        <div v-if="config?.logoV" class="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-6 border border-slate-100 dark:border-slate-700 p-2">
          <img :src="config.logoV" class="w-full h-full object-contain" alt="Logo" />
        </div>
        <img v-else-if="config?.logoH" :src="config.logoH" class="h-12 mx-auto mb-6 object-contain" alt="Logo" />
        <div v-else class="w-16 h-16 bg-brand rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-brand/20 mb-6 text-white font-bold text-2xl">
            config?.nombre?.charAt(0) || 'D'
        </div>
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Acceso al sistema</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">  config?.nombre || 'Cargando información...'  </p>
      </div>

      <form v-if="step === 'EMAIL'" @submit.prevent="solicitarAcceso" class="space-y-5" novalidate>
        <div>
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correo electrónico</label>
          <input
            v-model="email"
            type="email"
            class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-slate-800 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="usuario@dominio.com"
            required
          />
        </div>
        <Transition name="fade">
          <p v-if="errorMsg" class="text-red-500 text-sm font-medium">  errorMsg  </p>
        </Transition>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-brand hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin" />
          <span>  isLoading ? 'Procesando...' : 'Continuar'  </span>
        </button>
      </form>

      <form v-if="step === 'OTP'" @submit.prevent="verificarCodigo" class="space-y-5">
        <p class="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
          Ingresa el código de 6 dígitos que enviamos a<br />
          <strong class="text-slate-800 dark:text-white">  email  </strong>
        </p>
        <input
          v-model="otp"
          type="text"
          maxlength="6"
          class="w-full py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-3xl tracking-[0.5em] focus:ring-2 focus:ring-brand outline-none font-mono font-bold text-slate-800 dark:text-white transition-all"
          placeholder="••••••"
          required
        />
        <Transition name="fade">
          <p v-if="errorMsg" class="text-red-500 text-sm font-medium text-center">  errorMsg  </p>
        </Transition>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-slate-800 hover:bg-slate-900 dark:bg-brand dark:hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin" />
          <span>  isLoading ? 'Verificando...' : 'Validar acceso'  </span>
        </button>
        <button
          type="button"
          class="w-full text-center text-sm font-medium text-slate-500 hover:text-brand transition-colors mt-2"
          @click="step = 'EMAIL'; otp = ''"
        >
          <i class="fas fa-arrow-left mr-1" /> Modificar correo
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
````

## `src/views/core/DashboardHomeView.vue`

````text
<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

defineProps({ config: { type: Object, default: () => ({}) } })

const isLoading = ref(true)
const lastUpdated = ref('')

const kpis = ref({
  totalResenas: 0,
  pendientes: 0,
  aprobadas: 0,
  promedio: 0,
  tokensActivos: 0,
  tokensUsados: 0,
  tokensTotal: 0,
  usuariosActivos: 0
})

const approvalRate = computed(() => {
  if (!kpis.value.totalResenas) return 0
  return Math.round((kpis.value.aprobadas / kpis.value.totalResenas) * 100)
})

const pendingRate = computed(() => {
  if (!kpis.value.totalResenas) return 0
  return Math.round((kpis.value.pendientes / kpis.value.totalResenas) * 100)
})

const conversionRate = computed(() => {
  if (!kpis.value.tokensTotal) return 0
  return Math.round((kpis.value.tokensUsados / kpis.value.tokensTotal) * 100)
})

const secondaryCards = computed(() => [
  {
    key: 'totalResenas',
    label: 'Volumen de Reseñas',
    value: kpis.value.totalResenas ?? 0,
    subtext: 'Histórico acumulado',
    icon: 'fas fa-layer-group',
    accent: 'from-amber-500/15 to-transparent',
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    borderHover: 'hover:border-amber-500/40'
  },
  {
    key: 'aprobadas',
    label: 'Reseñas Publicadas',
    value: kpis.value.aprobadas ?? 0,
    subtext: `${approvalRate.value}% del volumen total`,
    badge: `${approvalRate.value}%`,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    icon: 'fas fa-check-circle',
    accent: 'from-emerald-500/15 to-transparent',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    borderHover: 'hover:border-emerald-500/40'
  },
  {
    key: 'pendientes',
    label: 'En Cola de Auditoría',
    value: kpis.value.pendientes ?? 0,
    subtext: kpis.value.pendientes > 0 ? 'Requieren revisión manual' : 'Bandeja al día',
    badge: kpis.value.pendientes > 0 ? 'Atención' : 'Al día',
    badgeColor: kpis.value.pendientes > 0
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
      : 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    icon: 'fas fa-clock',
    accent: 'from-orange-500/15 to-transparent',
    iconBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    borderHover: 'hover:border-orange-500/40'
  },
  {
    key: 'tokensActivos',
    label: 'Enlaces en Circulación',
    value: kpis.value.tokensActivos ?? 0,
    subtext: 'Disponibles para clientes',
    icon: 'fas fa-link',
    accent: 'from-sky-500/15 to-transparent',
    iconBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    borderHover: 'hover:border-sky-500/40'
  },
  {
    key: 'tokensTotal',
    label: 'Emisión de Enlaces',
    value: kpis.value.tokensTotal ?? 0,
    subtext: `${kpis.value.tokensUsados ?? 0} canjeados con éxito`,
    badge: `${kpis.value.tokensUsados ?? 0} usados`,
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
    icon: 'fas fa-hashtag',
    accent: 'from-violet-500/15 to-transparent',
    iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    borderHover: 'hover:border-violet-500/40'
  },
  {
    key: 'usuariosActivos',
    label: 'Operadores Activos',
    value: kpis.value.usuariosActivos ?? 0,
    subtext: 'Con acceso al sistema',
    icon: 'fas fa-users',
    accent: 'from-indigo-500/15 to-transparent',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    borderHover: 'hover:border-indigo-500/40'
  }
])

async function load() {
  isLoading.value = true
  try {
    kpis.value = await apiClient.post('get_kpis')
    const now = new Date()
    lastUpdated.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto lg:overflow-hidden pb-6 lg:pb-2 select-none">

    <div class="shrink-0 flex items-center justify-between gap-4 pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              config?.nombre || 'Sistema de Reseñas'
          </span>
        </div>
        <div class="flex items-baseline gap-3 mt-0.5">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Indicadores clave del sistema de reseñas
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <span v-if="lastUpdated" class="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline-block tabular-nums">
          Sincronizado:   lastUpdated
        </span>
        <button
          @click="load"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <i :class="['fas fa-sync-alt text-slate-400 text-xs', { 'animate-spin text-amber-400': isLoading }]"></i>
          <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex-1 min-h-0">
      <SkeletonBlock variant="bento" />
    </div>

    <div v-else class="flex flex-col lg:flex-1 lg:min-h-0 lg:grid lg:grid-rows-12 gap-4">

      <div class="lg:row-span-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-0">

        <div class="lg:col-span-7 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-br from-white via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-amber-950/25 p-5 xl:p-6 shadow-sm flex flex-col justify-between gap-5 lg:gap-2">
          <div class="absolute -right-12 -top-12 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <div class="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <i class="fas fa-crown text-xs text-amber-400"></i>
                </div>
                <span>Calificación Media Global</span>
              </div>
              <div class="mt-3 flex items-baseline gap-3">
                <span class="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                    (kpis.promedio || 0).toFixed(1)
                </span>
                <span class="text-sm sm:text-base font-semibold text-slate-400 dark:text-slate-500">/ 5.0 pts</span>
              </div>
            </div>

            <div class="flex flex-col items-start sm:items-end">
              <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-inner">
                <template v-for="star in 5" :key="star">
                  <i
                    class="fas fa-star text-sm sm:text-base"
                    :class="star <= Math.round(kpis.promedio || 0) ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 dark:text-slate-700'"
                  ></i>
                </template>
              </div>
              <span class="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                Basado en   kpis.totalResenas   evaluaciones
              </span>
            </div>
          </div>

          <div class="relative space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div class="flex items-center gap-5">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span class="text-slate-500 dark:text-slate-400">Publicadas:</span>
                  <strong class="text-slate-900 dark:text-white font-bold tabular-nums">  kpis.aprobadas  </strong>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span class="text-slate-500 dark:text-slate-400">Pendientes:</span>
                  <strong class="text-slate-900 dark:text-white font-bold tabular-nums">  kpis.pendientes  </strong>
                </div>
              </div>
              <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-lg tabular-nums">
                  approvalRate  % Aprobación
              </span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              <div class="h-full bg-emerald-500 rounded-l-full transition-all duration-700" :style="{ width: `${approvalRate}%` }"></div>
              <div class="h-full bg-amber-400 rounded-r-full transition-all duration-700" :style="{ width: `${pendingRate}%` }"></div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 xl:p-6 shadow-sm flex flex-col justify-between gap-5 lg:gap-2">
          <div class="absolute -right-12 -bottom-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative flex items-start justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Conversión de Enlaces
              </span>
              <div class="mt-3 flex items-baseline gap-2.5">
                <span class="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                    conversionRate  %
                </span>
                <span class="text-sm sm:text-base font-medium text-slate-400 dark:text-slate-500">efectividad</span>
              </div>
            </div>
            <div class="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0 shadow-sm">
              <i class="fas fa-chart-line text-sky-400 text-xl xl:text-2xl"></i>
            </div>
          </div>
          <div class="relative space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 tabular-nums">
              <span>Usados: <strong class="text-slate-900 dark:text-white font-bold">  kpis.tokensUsados  </strong></span>
              <span>Activos: <strong class="text-sky-400 font-bold">  kpis.tokensActivos  </strong></span>
              <span>Total: <strong class="text-slate-900 dark:text-white font-bold">  kpis.tokensTotal  </strong></span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div class="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-700" :style="{ width: `${Math.min(conversionRate, 100)}%` }"></div>
            </div>
          </div>
        </div>

      </div>

      <div class="lg:row-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:min-h-0">
        <div
          v-for="c in secondaryCards"
          :key="c.key"
          :class="['group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 p-5 xl:p-6 flex flex-col justify-between gap-4 lg:gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-slate-950/30', c.borderHover]"
        >
          <div :class="['absolute inset-x-0 top-0 h-16 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none', c.accent]"></div>
          <i :class="[c.icon, 'absolute -right-3 -bottom-3 text-7xl xl:text-8xl opacity-[0.03] dark:opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110']"></i>

          <div class="relative flex items-center justify-between gap-3">
            <span class="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                c.label
            </span>
            <div :class="['w-11 h-11 xl:w-13 xl:h-13 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm', c.iconBg]">
              <i :class="[c.icon, 'text-base sm:text-lg xl:text-xl']"></i>
            </div>
          </div>

          <div class="relative flex items-baseline justify-between gap-3 my-auto">
            <p class="text-4xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                c.value
            </p>
            <span v-if="c.badge" :class="['text-xs font-bold px-2.5 py-1 rounded-lg border tabular-nums', c.badgeColor]">
                c.badge
            </span>
          </div>

          <div class="relative pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
                c.subtext
            </span>
            <i class="fas fa-arrow-up-right text-[11px] text-slate-300 dark:text-slate-700 group-hover:text-slate-400 transition-colors"></i>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
````

## `src/views/core/GenerarResenaModal.vue`

````text
<script setup>
import { ref, watch, computed } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'

const props = defineProps({
  initialToken: { type: Object, default: null }
})

const isOpen = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['success', 'revoke'])

const isGenerating = ref(false)
const copied = ref(false)
const requestForm = ref({ cliente: '', servicio: '' })
const generatedResult = ref(null)

const buildQrUrl = (link) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}&margin=8`

watch(
  [isOpen, () => props.initialToken],
  ([open, token]) => {
    if (!open) return
    copied.value = false
    if (token) {
      const link = token.url || token.link || ''
      generatedResult.value = {
        id: token.id,
        fila: token.fila,
        estado: token.estado || 'Activo',
        link,
        cliente: token.cliente,
        servicio: token.servicio,
        asesor: token.asesor,
        fecha: token.fecha,
        qrUrl: link ? buildQrUrl(link) : ''
      }
    } else {
      requestForm.value = { cliente: '', servicio: '' }
      generatedResult.value = null
    }
  },
  { immediate: true }
)

const modalTitle = computed(() => {
  if (!generatedResult.value) return 'Nuevo Enlace de Reseña'
  return generatedResult.value.id ? `Enlace ${generatedResult.value.id}` : 'Enlace de Evaluación'
})

function close() {
  isOpen.value = false
}

async function generateReviewLink() {
  if (!requestForm.value.cliente.trim() || !requestForm.value.servicio.trim()) {
    return window.Swal?.fire('Atención', 'Ingresa el nombre del cliente y el servicio', 'warning')
  }

  isGenerating.value = true
  try {
    const response = await apiClient.post('generate_link', {
      nombre: requestForm.value.cliente.trim(),
      servicio: requestForm.value.servicio.trim()
    })

    const link = response.url || response.link
    if (!link) throw new Error('El servidor no devolvió una URL válida')

    generatedResult.value = {
      id: response.id || 'NUEVO',
      estado: 'Activo',
      link,
      cliente: requestForm.value.cliente.trim(),
      servicio: requestForm.value.servicio.trim(),
      fecha: new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      qrUrl: buildQrUrl(link)
    }

    emit('success', {
      url: link,
      cliente: requestForm.value.cliente.trim(),
      servicio: requestForm.value.servicio.trim()
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message || 'No se pudo generar el enlace.', 'error')
  } finally {
    isGenerating.value = false
  }
}

async function copyToClipboard(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    window.Swal?.fire({
      icon: 'success',
      title: 'Enlace copiado',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1400
    })
  } catch {

  }
}

async function shareLinkSystem() {
  if (!generatedResult.value?.link) return
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Evalúa nuestro servicio',
        text: `Hola ${generatedResult.value.cliente}, por favor ayúdanos evaluando nuestro servicio:`,
        url: generatedResult.value.link
      })
    } catch {

    }
  } else {
    copyToClipboard(generatedResult.value.link)
  }
}

function sendWhatsAppLink() {
  if (!generatedResult.value?.link) return
  const text = encodeURIComponent(
    `Hola ${generatedResult.value.cliente}. Gracias por confiar en nosotros para: ${generatedResult.value.servicio || 'nuestro servicio'}. ¿Podrías apoyarnos con una breve calificación aquí? ${generatedResult.value.link}`
  )
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}
</script>

<template>
  <BaseModal v-model="isOpen" :title="modalTitle" max-width="max-w-md">
    <template #header-icon>
      <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
        <i :class="generatedResult ? 'fas fa-qrcode text-xs' : 'fas fa-link text-xs'"></i>
      </div>
    </template>

    <template v-if="generatedResult?.estado" #header-extra>
      <StatusBadge :status="generatedResult.estado" />
    </template>

    <form v-if="!generatedResult" class="space-y-4" @submit.prevent="generateReviewLink">
      <BaseInput
        v-model="requestForm.cliente"
        label="Nombre del Cliente"
        placeholder="Ej. Luis González"
        icon="fas fa-user"
      />
      <BaseInput
        v-model="requestForm.servicio"
        label="Servicio / Operación"
        placeholder="Ej. Compra de Departamento"
        icon="fas fa-briefcase"
      />
      <p class="text-[11px] text-slate-400 dark:text-slate-500">
        Se generará un código QR y un enlace único de un solo uso para este cliente.
      </p>
    </form>

<div v-else class="flex flex-col items-center animate-fadeIn w-full space-y-4 select-none">

  <div class="w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black border border-slate-800 p-5 shadow-2xl relative overflow-hidden">

    <div class="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="flex flex-col items-center text-center pb-5 border-b border-slate-800/60">
      <button
        type="button"
        title="Haz clic para copiar el enlace"
        class="group relative p-3 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 transition-all hover:border-sky-500/30 active:scale-95 cursor-pointer"
        @click="copyToClipboard(generatedResult.link)"
      >
        <img
          v-if="generatedResult.qrUrl"
          :src="generatedResult.qrUrl"
          alt="QR Code"
          class="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl contrast-105"
        />
        <div class="absolute inset-0 rounded-2xl bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium gap-1.5">
          <i class="fas fa-copy text-sky-400 text-sm"></i>
          <span>Copiar enlace</span>
        </div>
      </button>

      <p class="text-[11px] text-slate-500 tracking-wide mt-3">
        Escanea con la cámara o toca el QR para copiar el enlace
      </p>
    </div>

    <div class="pt-4 grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
      <div class="min-w-0">
        <span class="text-[10px] font-medium uppercase tracking-widest text-slate-500 block mb-0.5">Cliente</span>
        <span class="font-semibold text-slate-200 truncate block">  generatedResult.cliente  </span>
      </div>

      <div class="min-w-0">
        <span class="text-[10px] font-medium uppercase tracking-widest text-slate-500 block mb-0.5">Servicio</span>
        <span class="font-medium text-slate-300 truncate block">  generatedResult.servicio  </span>
      </div>

      <div v-if="generatedResult.asesor" class="min-w-0">
        <span class="text-[10px] font-medium uppercase tracking-widest text-slate-500 block mb-0.5">Asesor</span>
        <span class="font-medium text-slate-400 truncate block">  generatedResult.asesor  </span>
      </div>

      <div class="min-w-0">
        <span class="text-[10px] font-medium uppercase tracking-widest text-slate-500 block mb-0.5">Emisión</span>
        <span class="font-mono text-slate-400 tracking-tight truncate block">  generatedResult.fecha  </span>
      </div>
    </div>
  </div>

  <div v-if="generatedResult.estado === 'Activo'" class="w-full grid grid-cols-3 gap-2">
    <button
      type="button"
      class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 transition-all active:scale-95 cursor-pointer"
      @click="sendWhatsAppLink"
    >
      <i class="fab fa-whatsapp text-sm"></i>
      <span>WhatsApp</span>
    </button>

    <button
      type="button"
      :class="[
        'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer',
        copied
          ? 'bg-sky-500 text-slate-950 border-sky-400'
          : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/10'
      ]"
      @click="copyToClipboard(generatedResult.link)"
    >
      <i :class="copied ? 'fas fa-check text-xs' : 'fas fa-copy text-xs'"></i>
      <span>  copied ? '¡Copiado!' : 'Copiar'  </span>
    </button>

    <button
      type="button"
      class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all active:scale-95 cursor-pointer"
      @click="shareLinkSystem"
    >
      <i class="fas fa-share-nodes text-xs"></i>
      <span>Compartir</span>
    </button>
  </div>
</div>

    <template #footer>
      <template v-if="!generatedResult">
        <div class="flex items-center justify-end gap-2.5 w-full">
          <BaseButton variant="outline" @click="close">Cancelar</BaseButton>
          <BaseButton :is-loading="isGenerating" icon="fas fa-bolt" @click="generateReviewLink">
            Crear Enlace
          </BaseButton>
        </div>
      </template>

      <template v-else>
        <div>
          <button
            v-if="props.initialToken && generatedResult.estado === 'Activo' && hasPermission('editar_resena')"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
            @click="emit('revoke', props.initialToken)"
          >
            <i class="fas fa-ban text-[11px]"></i>
            <span>Revocar enlace</span>
          </button>
        </div>

        <BaseButton variant="outline" @click="close">Cerrar</BaseButton>
      </template>
    </template>
  </BaseModal>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.22s ease-out forwards;
}
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
````

## `src/views/core/GestionResenaModal.vue`

````text
<script setup>
import { ref, watch } from 'vue'
import { apiClient } from '../../services/api'

const isOpen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  review: { type: Object, default: null }
})
const emit = defineEmits(['updated'])

const replyText = ref('')
const isAILoading = ref(false)

watch(
  () => [isOpen.value, props.review],
  ([open]) => {
    if (open && props.review) {
      replyText.value = props.review.respuesta || ''
    }
  }
)

function close() {
  isOpen.value = false
}

async function saveApproval() {
  if (!props.review) return
  const result = await window.Swal?.fire({
    title: '¿Publicar respuesta?',
    text: 'Será visible públicamente',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('update_review', {
      fila: props.review.fila,
      estado: 'Aprobado',
      respuesta: replyText.value
    })
    props.review.estado = 'Aprobado'
    props.review.respuesta = replyText.value
    isOpen.value = false
    emit('updated')
    window.Swal?.fire({
      icon: 'success',
      title: 'Publicado',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function handleArchive() {
  if (!props.review) return
  const result = await window.Swal?.fire({
    title: '¿Archivar esta reseña?',
    text: 'Se ocultará públicamente',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('update_review', { fila: props.review.fila, estado: 'Archivado' })
    props.review.estado = 'Archivado'
    isOpen.value = false
    emit('updated')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function callGeminiAI() {
  if (!props.review) return
  if (!replyText.value) replyText.value = 'Agradece cordialmente la reseña.'
  isAILoading.value = true
  try {
    const res = await apiClient.post('call_ai', {
      prompt: `Actúa como RP. Cliente dijo: "${props.review.comentario}". Borrador: "${replyText.value}". Mejora y devuelve SOLO respuesta.`
    })
    replyText.value = res.texto
  } catch (e) {
    window.Swal?.fire('Error de IA', e.message, 'error')
  } finally {
    isAILoading.value = false
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Gestión de Reseña" max-width="max-w-xl">
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
    <p class="text-sm font-semibold text-slate-800 dark:text-white mb-3">  review?.cliente  </p>
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario</label>
    <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">  review?.comentario  </p>
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Respuesta pública</label>
    <textarea
      v-model="replyText"
      rows="4"
      class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
      placeholder="Escribe o genera con IA..."
    />
    <template #footer>
      <BaseButton variant="outline" @click="handleArchive">Archivar</BaseButton>
      <BaseButton variant="outline" :is-loading="isAILoading" icon="fas fa-magic" @click="callGeminiAI">IA</BaseButton>
      <BaseButton icon="fas fa-check" @click="saveApproval">Publicar</BaseButton>
    </template>
  </BaseModal>
</template>
````

## `src/views/core/ResenasView.vue`

````text
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import GenerarResenaModal from './GenerarResenaModal.vue'
import GestionResenaModal from './GestionResenaModal.vue'

const props = defineProps({
  initialSubTab: {
    type: String,
    default: null
  }
})

const activeSubTab = ref('recibidas')
const isLoading = ref(true)
const reviews = ref([])
const tokens = ref([])

const showManageModal = ref(false)
const selectedReview = ref(null)

const showGenerateModal = ref(false)
const selectedToken = ref(null)

const reviewColumns = computed(() => {
  const baseCols = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente', required: true },
    { key: 'servicio', label: 'Servicio', hidden: true },
    { key: 'legalOk', label: 'LEGAL', hidden: true },
    { key: 'calificacion', label: 'Calif.', required: true },
    { key: 'comentario', label: 'Reseña' },
    { key: 'estado', label: 'Estado', required: true }
  ]
  if (hasPermission('editar_resena')) {
    baseCols.push({ key: 'respuesta', label: 'Respuesta', hidden: true })
  }
  return baseCols
})

const tokenColumns = [
  { key: 'id', label: 'ID', hidden: true },
  { key: 'fecha', label: 'Generado' },
  { key: 'cliente', label: 'Cliente', required: true },
  { key: 'servicio', label: 'Servicio' },
  { key: 'dias', label: 'Transcurrido' },
  { key: 'asesor', label: 'Asesor', hidden: true },
  { key: 'estado', label: 'Estado', required: true }
]

const tokenFilterOptions = ['Activo', 'Usado', 'Expirado', 'Revocado']

async function fetchData() {
  isLoading.value = true
  try {
    if (activeSubTab.value === 'recibidas') {
      reviews.value = await apiClient.post('get_dashboard_reviews')
    } else if (activeSubTab.value === 'por_evaluar') {
      tokens.value = await apiClient.post('get_tokens')
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {

  let targetSub = props.initialSubTab
  if (!targetSub) {
    const params = new URLSearchParams(window.location.search)
    targetSub = params.get('subtab')
    if (targetSub) {
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl)
    }
  }

  if (targetSub === 'recibidas' || targetSub === 'por_evaluar') {
    if (activeSubTab.value !== targetSub) {
      activeSubTab.value = targetSub
      return
    }
  }
  fetchData()
})

watch(() => props.initialSubTab, (newSub) => {
  if (newSub === 'recibidas' || newSub === 'por_evaluar') {
    activeSubTab.value = newSub
  }
})

watch(activeSubTab, fetchData)

function openNewLinkModal() {
  selectedToken.value = null
  showGenerateModal.value = true
}

function handleRowClick(row) {
  if (activeSubTab.value === 'recibidas') {
    if (hasPermission('editar_resena')) openManageModal(row)
  } else if (activeSubTab.value === 'por_evaluar') {
    selectedToken.value = row
    showGenerateModal.value = true
  }
}

function openManageModal(review) {
  selectedReview.value = review
  showManageModal.value = true
}

function onGenerateSuccess() {
  if (activeSubTab.value === 'por_evaluar') fetchData()
}

async function revokeToken(item) {
  if (!hasPermission('editar_resena') || !item) return
  const result = await window.Swal?.fire({
    title: '¿Revocar enlace?',
    text: `Se inhabilitará el enlace de ${item.cliente}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('revoke_link', { fila: item.fila })
    item.estado = 'Revocado'
    showGenerateModal.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Enlace revocado',
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">

    <div class="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-full sm:w-fit shrink-0">
      <button
        type="button"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'recibidas'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
        @click="activeSubTab = 'recibidas'"
      >
        Bandeja de Entrada
      </button>
      <button
        v-if="hasPermission('ver_seguimientos')"
        type="button"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'por_evaluar'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
        @click="activeSubTab = 'por_evaluar'"
      >
        Por Evaluar
      </button>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col relative">
      <Transition name="fade" mode="out-in">

        <div v-if="activeSubTab === 'recibidas'" key="recibidas" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="table" :rows="6" />
          <DataTable
            v-else
            :mobile-preview-count="3"
            :columns="reviewColumns"
            :data="reviews"
            :is-loading="false"
            search-placeholder="Buscar en reseñas..."
            :filter-options="['Pendiente', 'Aprobado', 'Archivado']"
            filter-column-key="estado"
            @row-click="handleRowClick"
          >
            <template #header-actions>
              <BaseButton
                v-if="hasPermission('generar_enlace')"
                icon="fas fa-plus"
                @click="openNewLinkModal"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>
            <template #cell-calificacion="{ item }">
              <BaseStarRating :score="Number(item.calificacion)" />
            </template>
            <template #cell-comentario="{ item }">
              <div class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300">
                  item.comentario
              </div>
            </template>
            <template #cell-legalOk="{ item }">
              <div class="text-center">
                <i v-if="item.legalOk" class="fas fa-check-circle text-emerald-500"></i>
                <i v-else class="fas fa-minus text-slate-300"></i>
              </div>
            </template>
            <template #cell-respuesta="{ item }">
              <div
                v-if="item.respuesta"
                class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300"
              >
                  item.respuesta
              </div>
              <span v-else class="text-slate-400 italic text-[11px]">Sin respuesta</span>
            </template>
            <template #cell-estado="{ item }">
              <StatusBadge :status="item.estado" />
            </template>
          </DataTable>
        </div>

        <div v-else-if="activeSubTab === 'por_evaluar'" key="por_evaluar" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="tokens" :rows="6" />
          <DataTable
            v-else
            :mobile-preview-count="3"
            :columns="tokenColumns"
            :data="tokens"
            :is-loading="false"
            search-placeholder="Buscar cliente o servicio..."
            :filter-options="tokenFilterOptions"
            filter-column-key="estado"
            @row-click="handleRowClick"
          >
            <template #header-actions>
              <BaseButton
                v-if="hasPermission('generar_enlace')"
                icon="fas fa-plus"
                @click="openNewLinkModal"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>

            <template #cell-dias="{ item }">
              <span
                class="text-xs font-semibold tabular-nums"
                :class="
                  item.estado === 'Expirado' || item.dias >= 7
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400'
                "
              >
                  item.dias === 0 ? 'Hoy' : `${item.dias} días`
              </span>
            </template>

            <template #cell-estado="{ item }">
              <StatusBadge :status="item.estado" />
            </template>

            <template #actions="{ item }">
              <button
                v-if="item.estado === 'Activo' && hasPermission('editar_resena')"
                type="button"
                class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Revocar enlace"
                @click.stop="revokeToken(item)"
              >
                <i class="fas fa-ban text-xs" />
              </button>
            </template>
          </DataTable>
        </div>
      </Transition>
    </div>

    <GestionResenaModal v-model="showManageModal" :review="selectedReview" @updated="fetchData" />

    <GenerarResenaModal
      v-model="showGenerateModal"
      :initial-token="selectedToken"
      @success="onGenerateSuccess"
      @revoke="revokeToken"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
````

## `src/views/public/PublicReviewsCarousel.vue`

````text
<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { apiClient } from '../../services/api'

const props = defineProps({
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 8000 },
  config: {
    type: Object,
    default: () => ({})
  }
})

const reviews = ref([])
const localConfig = ref({})
const loading = ref(true)
const index = ref(0)
const isPaused = ref(false)
const slideDirection = ref('next')
const touchStartX = ref(0)
const touchEndX = ref(0)
let timer = null

const activeConfig = computed(() => ({
  nombre: props.config?.nombre || localConfig.value?.nombre || 'Nuestros Clientes',
  color: props.config?.color || localConfig.value?.color || '#334155',
  logoH: props.config?.logoH || localConfig.value?.logoH || null,
  logoV: props.config?.logoV || localConfig.value?.logoV || null,
  urlFrontend: props.config?.urlFrontend || localConfig.value?.urlFrontend || ''
}))

const current = computed(() => reviews.value[index.value] || null)
const total = computed(() => reviews.value.length)

const averageRating = computed(() => {
  if (!total.value) return '0.0'
  const sum = reviews.value.reduce((acc, r) => acc + Number(r.calificacion ?? r.Calificacion ?? 0), 0)
  return (sum / total.value).toFixed(1)
})

const currentRating = computed(() => Number(current.value?.calificacion ?? current.value?.Calificacion ?? 0))
const currentComment = computed(() => current.value?.comentario ?? current.value?.Comentario ?? '')
const currentClient = computed(() => current.value?.cliente ?? current.value?.Cliente ?? 'Cliente Anónimo')
const currentService = computed(() => current.value?.zona ?? current.value?.Servicio ?? current.value?.servicio ?? '')
const currentDate = computed(() => current.value?.fecha ?? current.value?.Fecha ?? '')
const currentAdminReply = computed(() => current.value?.respuesta ?? current.value?.respuesta_admin ?? current.value?.Respuesta_Admin ?? '')
const currentId = computed(() => current.value?.id ?? current.value?.ID_Resena ?? index.value)

const clientInitials = computed(() => {
  return currentClient.value.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
})

const formattedDate = computed(() => {
  const raw = currentDate.value
  if (!raw) return ''
  const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(d)
    }
  }
  return raw
})

const jsonLdSchema = computed(() => {
  if (!total.value) return null
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": activeConfig.value.nombre,
    "image": activeConfig.value.logoH || activeConfig.value.logoV || "",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating.value,
      "reviewCount": total.value
    },
    "review": reviews.value.filter(r => r.Legal_OK !== false).map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.cliente || r.Cliente || "Anónimo" },
      "datePublished": r.fecha || r.Fecha,
      "reviewBody": r.comentario || r.Comentario,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": Number(r.calificacion || r.Calificacion || 0),
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  })
})

async function load() {
  loading.value = true
  try {
    const requests = [apiClient.post('get_public_reviews')]
    if (!props.config?.nombre && !props.config?.logoH && !props.config?.logoV) {
      requests.push(apiClient.post('get_public_config').catch(() => null))
    }
    const [reviewsRes, configRes] = await Promise.all(requests)
    reviews.value = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || [])
    if (configRes) localConfig.value = configRes?.data || configRes
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

function next() {
  if (total.value < 2) return
  slideDirection.value = 'next'
  index.value = (index.value + 1) % total.value
}

function prev() {
  if (total.value < 2) return
  slideDirection.value = 'prev'
  index.value = (index.value - 1 + total.value) % total.value
}

function start() {
  if (!props.autoplay || total.value < 2) return
  stop()
  isPaused.value = false
  timer = setInterval(next, props.interval)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
  isPaused.value = true
}

function restartTimer() {
  if (props.autoplay && total.value > 1) {
    stop()
    start()
  }
}

function handleTouchStart(e) {
  touchStartX.value = e.changedTouches[0].screenX
  stop()
}

function handleTouchEnd(e) {
  touchEndX.value = e.changedTouches[0].screenX
  const delta = touchStartX.value - touchEndX.value
  if (Math.abs(delta) > 50) delta > 0 ? next() : prev()
  start()
}

function handleKeydown(e) {
  if (e.key === 'ArrowLeft') { prev(); restartTimer() }
  else if (e.key === 'ArrowRight') { next(); restartTimer() }
}

watch(() => props.interval, restartTimer)
watch(() => props.autoplay, (val) => (val ? start() : stop()))

onMounted(async () => {
  await load()
  start()
})

onUnmounted(stop)
</script>

<template>
  <section
    class="relative w-full min-h-[60vh] xl:min-h-[75vh] flex flex-col justify-center bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-500 overflow-hidden outline-none"
    :style="activeConfig.color ? { '--brand-color': activeConfig.color } : {}"
    tabindex="0"
    aria-label="Testimonios de clientes"
    @mouseenter="stop"
    @mouseleave="start"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    @keydown="handleKeydown"
  >

    <component v-if="jsonLdSchema" :is="'script'" type="application/ld+json" v-html="jsonLdSchema" />

    <div class="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[var(--brand-color)] opacity-[0.03] dark:opacity-[0.05] blur-3xl pointer-events-none" />
    <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[var(--brand-color)] opacity-[0.03] dark:opacity-[0.05] blur-3xl pointer-events-none" />

    <div class="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-16 relative z-10">

      <div v-if="loading" class="grid lg:grid-cols-12 gap-12 lg:gap-24 animate-pulse items-center">
        <div class="lg:col-span-4 space-y-6">
          <div class="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-20 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div class="lg:col-span-8 space-y-8">
          <div class="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-12 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="flex items-center gap-6 mt-12">
            <div class="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div class="space-y-3">
              <div class="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div class="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!total" class="flex flex-col items-center justify-center text-center py-20">
        <i class="fas fa-comment-slash text-5xl mb-6 text-slate-300 dark:text-slate-700 font-black" />
        <p class="text-xl md:text-2xl font-light text-slate-500 dark:text-slate-400">Las historias de nuestros clientes aparecerán aquí pronto.</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

        <div class="lg:col-span-4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-10 lg:pb-0 lg:pr-12">

          <img
            v-if="activeConfig.logoH || activeConfig.logoV"
            :src="activeConfig.logoH || activeConfig.logoV"
            :alt="activeConfig.nombre"
            class="h-10 object-contain mb-10 max-w-[200px]"
          />
          <h2 v-else class="text-sm font-bold tracking-widest uppercase text-[var(--brand-color)] mb-10">
              activeConfig.nombre
          </h2>

          <h3 class="text-3xl md:text-4xl font-light text-slate-900 dark:text-white leading-tight mb-8">
            Lo que dicen <br/>
            <span class="font-bold">nuestros clientes</span>
          </h3>

          <div class="flex items-end gap-4 mb-10">
            <span class="text-7xl font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tighter">  averageRating  </span>
            <div class="pb-2">
              <div class="flex gap-1 text-amber-500 text-lg mb-1">

                <i v-for="i in 5" :key="i" class="fas fa-star font-black" />
              </div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Basado en   total   reseñas
              </p>
            </div>
          </div>

          <div v-if="total > 1" class="flex items-center gap-6 mt-auto">
            <div class="flex gap-3">

              <button type="button" aria-label="Anterior" @click="prev(); restartTimer()"
                class="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[var(--brand-color)] hover:border-[var(--brand-color)] hover:text-white transition-all duration-300 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                :style="{ '--tw-ring-color': 'var(--brand-color)' }">
                <i class="fas fa-arrow-left text-lg font-black" />
              </button>
              <button type="button" aria-label="Siguiente" @click="next(); restartTimer()"
                class="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[var(--brand-color)] hover:border-[var(--brand-color)] hover:text-white transition-all duration-300 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                :style="{ '--tw-ring-color': 'var(--brand-color)' }">
                <i class="fas fa-arrow-right text-lg font-black" />
              </button>
            </div>

            <div class="text-lg font-medium text-slate-400 tabular-nums tracking-widest">
              <span class="text-slate-900 dark:text-white">  String(index + 1).padStart(2, '0')  </span>
              <span class="opacity-50 mx-1">/</span>
              <span>  String(total).padStart(2, '0')  </span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-8 relative min-h-[400px] flex items-center">

          <Transition :name="slideDirection === 'next' ? 'slide-next' : 'slide-prev'" mode="out-in">
            <article :key="currentId" class="w-full relative z-10" itemscope itemtype="https://schema.org/Review">

              <i class="fas fa-quote-left text-7xl md:text-8xl text-[var(--brand-color)] opacity-20 mb-6 block font-black" />

              <blockquote class="mb-12" itemprop="reviewBody">
                <p class="text-2xl md:text-4xl lg:text-5xl leading-snug md:leading-tight font-light text-slate-800 dark:text-slate-100 tracking-tight">
                  "  currentComment  "
                </p>
              </blockquote>

              <div v-if="currentAdminReply" class="mb-12 border-l-2 border-[var(--brand-color)] pl-6 py-2">
                <p class="text-xs font-bold uppercase tracking-widest text-[var(--brand-color)] mb-2">Respuesta de   activeConfig.nombre  </p>
                <p class="text-base text-slate-600 dark:text-slate-400 italic">"  currentAdminReply  "</p>
              </div>

              <footer class="flex items-center gap-6" itemprop="author" itemscope itemtype="https://schema.org/Person">

                <div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full flex items-center justify-center text-2xl md:text-3xl font-light text-white shadow-xl shadow-[var(--brand-color)]/20"
                  :style="{
                    backgroundColor: 'var(--brand-color)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.25) 100%)'
                  }">
                    clientInitials
                </div>

                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <p class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white" itemprop="name">
                        currentClient
                    </p>

                    <span v-if="current.Legal_OK !== false" class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest flex items-center gap-1">
                      <i class="fas fa-check font-black" />
                      <span class="font-bold">VERIFICADA</span>
                    </span>
                  </div>

                  <div class="flex items-center gap-2 text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                    <span v-if="currentService" class="font-medium">  currentService  </span>
                    <span v-if="currentService && formattedDate" class="opacity-50">&bull;</span>
                    <span v-if="formattedDate" class="capitalize" itemprop="datePublished" :content="currentDate">  formattedDate  </span>
                  </div>

                  <div class="flex items-center gap-1 text-amber-500 text-xs mt-3" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
                    <meta itemprop="ratingValue" :content="currentRating.toString()" />
                    <i v-for="s in 5" :key="s" class="fas fa-star font-black" :class="s <= Math.round(currentRating) ? 'text-amber-500' : 'text-slate-200 dark:text-slate-800'" />
                  </div>
                </div>
              </footer>
            </article>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-next-enter-from { opacity: 0; transform: translateY(20px); }
.slide-next-leave-to { opacity: 0; transform: translateY(-20px); }
.slide-prev-enter-from { opacity: 0; transform: translateY(-20px); }
.slide-prev-leave-to { opacity: 0; transform: translateY(20px); }

@media (min-width: 1024px) {
  .slide-next-enter-from { opacity: 0; transform: translateX(40px); }
  .slide-next-leave-to { opacity: 0; transform: translateX(-40px); }
  .slide-prev-enter-from { opacity: 0; transform: translateX(-40px); }
  .slide-prev-leave-to { opacity: 0; transform: translateX(40px); }
}
</style>
````

## `src/views/public/ReviewFormView.vue`

````text
<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '../../services/api'

const props = defineProps({
  inviteToken: { type: String, required: true },
  config: { type: Object, default: () => ({}) }
})

const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')
const success = ref(false)
const invalid = ref(false)
const redirectUrl = ref('')

const tokenId = ref('')
const nombre = ref('')
const zona = ref('')
const calificacion = ref(0)
const hoverStar = ref(0)
const comentario = ref('')
const legalOk = ref(false)
const recaptchaSiteKey = ref('')

const canSubmit = computed(() =>
  nombre.value.trim().length >= 2 &&
  calificacion.value >= 1 &&
  legalOk.value &&
  !submitting.value
)

onMounted(async () => {
  try {
    const data = await apiClient.post('validate_review_token', { token: props.inviteToken })
    if (!data?.valid) {
      invalid.value = true
      redirectUrl.value = data?.redirectUrl || props.config?.urlFrontend || '/'
      setTimeout(() => {
        if (redirectUrl.value) window.location.replace(redirectUrl.value)
      }, 2500)
      return
    }
    tokenId.value = data.token_id
    nombre.value = data.nombre_cliente || ''
    zona.value = data.zona_servicio || ''
    recaptchaSiteKey.value = data.brand?.recaptchaSiteKey || props.config?.recaptchaSiteKey || ''
    if (data.brand?.color) {
      document.documentElement.style.setProperty('--brand-color', data.brand.color)
    }
  } catch (e) {
    invalid.value = true
    errorMsg.value = e.message || 'Enlace no válido'
    redirectUrl.value = props.config?.urlFrontend || '/'
  } finally {
    loading.value = false
  }
})

function waitForEnterprise(maxMs = 8000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      const ent = window.grecaptcha?.enterprise
      if (ent) {
        ent.ready(() => resolve(ent))
        return
      }
      if (Date.now() - start >= maxMs) {
        resolve(null)
        return
      }
      setTimeout(tick, 150)
    }
    tick()
  })
}

async function getRecaptchaToken() {
  const siteKey = recaptchaSiteKey.value
  if (!siteKey) {
    console.warn('[reCAPTCHA] site key empty')
    return ''
  }

  let enterprise = window.grecaptcha?.enterprise
  if (!enterprise) {

    enterprise = await waitForEnterprise(8000)
  }
  if (!enterprise) {
    console.warn('[reCAPTCHA] grecaptcha.enterprise not available (blocked script or domain)')
    return ''
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[reCAPTCHA] execute timeout')
      resolve('')
    }, 10000)
    try {
      enterprise.ready(() => {
        enterprise
          .execute(siteKey, { action: 'submit' })
          .then((token) => {
            clearTimeout(timeout)
            resolve(token || '')
          })
          .catch((err) => {
            clearTimeout(timeout)
            console.warn('[reCAPTCHA] execute error', err)
            resolve('')
          })
      })
    } catch (err) {
      clearTimeout(timeout)
      console.warn('[reCAPTCHA] ready error', err)
      resolve('')
    }
  })
}

async function enviar() {
  if (!canSubmit.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const recaptcha_token = await getRecaptchaToken()
    if (!recaptcha_token) {
      const hasKey = !!recaptchaSiteKey.value
      const hasLib = !!window.grecaptcha?.enterprise
      errorMsg.value = !hasKey
        ? 'reCAPTCHA no configurado (falta RECAPTCHA_SITE_KEY en Script Properties).'
        : !hasLib
          ? 'No se pudo cargar reCAPTCHA. Desactiva bloqueadores / revisa dominios en Google Cloud (vmartinez5310.github.io + localhost).'
          : 'No se pudo verificar seguridad (reCAPTCHA). Desactiva bloqueadores e intenta de nuevo.'
      return
    }
    await apiClient.post('submit_review', {
      token_id: tokenId.value,
      nombre_publico: nombre.value.trim(),
      zona_propiedad: zona.value.trim(),
      calificacion: calificacion.value,
      valor_gestion_resena: comentario.value.trim(),
      aviso_privacidad_aceptado: legalOk.value,
      recaptcha_token
    })
    success.value = true
  } catch (e) {
    errorMsg.value = e.message || 'No se pudo enviar la reseña'
  } finally {
    submitting.value = false
  }
}

function starClass(n) {
  const active = hoverStar.value || calificacion.value
  return n <= active ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-50 dark:bg-slate-900">
    <div v-if="loading" class="text-center">
      <div class="w-12 h-12 border-4 border-slate-200 border-t-brand rounded-full animate-spin mx-auto mb-4" />
      <p class="text-sm text-slate-500 tracking-wide uppercase">Validando enlace…</p>
    </div>

    <div
      v-else-if="invalid"
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-link-slash text-xl" />
      </div>
      <h1 class="text-xl font-bold text-slate-800 dark:text-white mb-2">Enlace no disponible</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Este enlace ya fue usado, expiró o no es válido. Serás redirigido en unos segundos.
      </p>
      <a
        v-if="redirectUrl"
        :href="redirectUrl"
        class="inline-flex items-center gap-2 text-brand font-semibold text-sm hover:underline"
      >
        Ir al inicio <i class="fas fa-arrow-right text-xs" />
      </a>
    </div>

    <div
      v-else-if="success"
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <div class="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-xl" />
      </div>
      <h1 class="text-xl font-bold text-slate-800 dark:text-white mb-2">¡Gracias por tu reseña!</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">
        Tu opinión nos ayuda a mejorar. Pronto será publicada.
      </p>
    </div>

    <form
      v-else
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-5"
      @submit.prevent="enviar"
    >
      <div class="text-center mb-2">
        <img
          v-if="props.config?.logoV || props.config?.logoH"
          :src="props.config.logoV || props.config.logoH"
          alt="Logo"
          class="h-12 mx-auto mb-3 object-contain"
        />
        <h1 class="text-xl font-bold text-slate-800 dark:text-white">Comparte tu experiencia</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">  props.config?.nombre || 'Inmobiliarte'  </p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tu nombre público</label>
        <input
          v-model="nombre"
          type="text"
          required
          minlength="2"
          maxlength="80"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Servicio / zona</label>
        <input
          v-model="zona"
          type="text"
          maxlength="100"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white"
          placeholder="Opcional"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Calificación</label>
        <div class="flex items-center gap-2" @mouseleave="hoverStar = 0">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="text-2xl transition-colors p-1"
            @mouseenter="hoverStar = n"
            @click="calificacion = n"
          >
            <i class="fas fa-star" :class="starClass(n)" />
          </button>
          <span class="text-sm text-slate-500 ml-2">  calificacion || '—'   / 5</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tu experiencia</label>
        <textarea
          v-model="comentario"
          rows="4"
          maxlength="2000"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white resize-none"
          placeholder="Cuéntanos cómo te fue…"
        />
      </div>

      <label class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
        <input v-model="legalOk" type="checkbox" class="mt-1 rounded border-slate-300 text-brand focus:ring-brand" required />
        <span>Acepto el aviso de privacidad y autorizo la publicación de esta reseña.</span>
      </label>

      <p v-if="errorMsg" class="text-sm text-red-500 font-medium">  errorMsg  </p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="w-full bg-brand hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <i v-if="submitting" class="fas fa-spinner fa-spin" />
        <span>  submitting ? 'Enviando…' : 'Enviar reseña'  </span>
      </button>
    </form>
  </div>
</template>
````

## `src/views/user/PerfilView.vue`

````text
<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import { authState } from '../../composables/useAuth'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) }
})

const isLoading = ref(true)
const isSaving = ref(false)
const profile = ref({
  idUser: '',
  nombre: '',
  email: '',
  rol: 'ADMINISTRADOR',
  estado: 'Activo',
  logo: ''
})

const avatarPreview = computed(() => {
  const url = profile.value.logo?.trim()
  return url && /^https?:\/\//i.test(url) ? url : null
})

const initials = computed(() =>
  (profile.value.nombre || 'U').slice(0, 2).toUpperCase()
)

async function loadProfile() {
  isLoading.value = true
  try {
    const data = await apiClient.post('get_user_info')
    if (data) {
      profile.value = {
        idUser: data.idUser || data.id || '',
        nombre: data.nombre || '',
        email: data.email || '',
        rol: data.rol || 'USUARIO',
        estado: data.estado || 'Activo',
        logo: data.logo || data.avatar || ''
      }
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function saveProfile() {
  const nombre = profile.value.nombre.trim()
  const email = profile.value.email.trim()

  if (!nombre) {
    return window.Swal?.fire('Atención', 'El nombre no puede estar vacío', 'warning')
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return window.Swal?.fire('Atención', 'Ingresa un correo válido', 'warning')
  }

  isSaving.value = true
  try {
    const logo = profile.value.logo?.trim() || ''

    await apiClient.post('update_profile', {
      nombre,
      email,
      logo
    })

    if (authState.user) {
      authState.user.nombre = nombre
      authState.user.email = email
      authState.user.logo = logo
    }

    window.Swal?.fire({
      icon: 'success',
      title: 'Perfil actualizado',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto pb-6 select-none">

    <div class="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">
            props.config?.nombre || 'Engine Review'
        </p>
        <h2 class="text-2xl font-semibold text-white mt-1">Tu perfil</h2>
        <p class="text-sm text-slate-400 mt-1">
          Así te verán los clientes en las invitaciones y reseñas
        </p>
      </div>

      <BaseButton :is-loading="isSaving" @click="saveProfile">
        Guardar cambios
      </BaseButton>
    </div>

    <SkeletonBlock v-if="isLoading" variant="perfil" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <div class="lg:col-span-4 h-full rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between mb-6">
          <span class="text-xs font-medium uppercase tracking-wider text-slate-400">
            Cómo apareces
          </span>
          <StatusBadge :status="profile.estado" />
        </div>

        <div class="flex flex-col items-center text-center">
          <div class="w-28 h-28 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center overflow-hidden">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              :alt="profile.nombre"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl font-semibold text-sky-400">
                initials
            </span>
          </div>

          <h3 class="mt-5 text-xl font-semibold text-white truncate max-w-full">
              profile.nombre || 'Tu nombre'
          </h3>
          <p class="text-sm text-slate-400 mt-1 truncate max-w-full">
              profile.email || 'tu@email.com'
          </p>

          <span class="mt-4 inline-flex px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
              profile.rol
          </span>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10 text-xs text-slate-500 text-center">
          Vista previa en tiempo real
        </div>
      </div>

      <form
        class="lg:col-span-8 h-full rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col"
        @submit.prevent="saveProfile"
      >
        <div class="mb-6">
          <h3 class="text-sm font-medium text-white">Información pública</h3>
          <p class="text-xs text-slate-400 mt-1">
            Estos datos aparecen en las invitaciones que envías y en los registros de reseñas
          </p>
        </div>

        <div class="space-y-5 flex-1">
          <BaseInput
            v-model="profile.nombre"
            label="Nombre visible"
            placeholder="Cómo quieres que te llamen"
          />

          <BaseInput
            v-model="profile.email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
          />

          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="flex-1">
              <BaseInput
                v-model="profile.logo"
                label="Foto o logo (URL)"
                placeholder="https://..."
              />
              <p class="text-xs text-slate-500 mt-1.5">
                Se actualiza al instante en la barra superior y en las invitaciones
              </p>
            </div>

            <div class="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt="Preview"
                class="w-full h-full object-cover"
              />
              <i v-else class="fas fa-user text-slate-500 text-sm"></i>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Los cambios se reflejan inmediatamente</span>
          <span class="text-emerald-400 flex items-center gap-1.5">
            <i class="fas fa-check-circle text-[10px]"></i>
            Sincronizado
          </span>
        </div>
      </form>
    </div>
  </div>
</template>
````

## `tests/apiHandlers.test.js`

````javascript
import{describe,it}from"node:test";import assert from"node:assert/strict";const REQUIRED_ACTIONS=["get_public_reviews","submit_review","request_otp","verify_otp","get_dashboard_reviews","update_review","generate_link","get_tracking","revoke_link","get_users","update_user","update_profile","add_user","call_ai","get_public_config","update_config","get_user_info","get_kpis","get_tokens"];describe("WebApp handler registry",()=>{it("lists all required actions",async()=>{const fs=await(import("node:fs"));const src=fs.readFileSync(new URL("../backend/WebApp.gs",import.meta.url),"utf8");for(const action of REQUIRED_ACTIONS){assert.match(src,new RegExp(`${action}\\s*:`),`missing handler: ${action}`)}})});describe("env contract",()=>{it("ships .env.example with VITE_API_URL",async()=>{const fs=await(import("node:fs"));const example=fs.readFileSync(new URL("../.env.example",import.meta.url),"utf8");assert.match(example,/VITE_API_URL=/)});it("api.js reads import.meta.env.VITE_API_URL",async()=>{const fs=await(import("node:fs"));const api=fs.readFileSync(new URL("../src/services/api.js",import.meta.url),"utf8");assert.match(api,/import\.meta\.env\.VITE_API_URL/)})});
````

## `tests/tokenEstado.test.js`

````javascript
import{describe,it}from"node:test";import assert from"node:assert/strict";import{normalizeTokenEstado,statusTone}from"../src/utils/tokenEstado.js";describe("normalizeTokenEstado",()=>{it("maps Activo under 7 days",()=>{assert.equal(normalizeTokenEstado("Activo",3),"Activo")});it("maps Activo over 7 days to Expirado",()=>{assert.equal(normalizeTokenEstado("Activo",8),"Expirado")});it("maps Usado",()=>{assert.equal(normalizeTokenEstado("Usado",0),"Usado")});it("maps Cancelado to Revocado",()=>{assert.equal(normalizeTokenEstado("Cancelado",0),"Revocado")});it("defaults empty to Activo",()=>{assert.equal(normalizeTokenEstado("",0),"Activo")})});describe("statusTone",()=>{it("success tones",()=>{assert.equal(statusTone("Activo"),"success");assert.equal(statusTone("Usado"),"success");assert.equal(statusTone("Aprobado"),"success")});it("warning tones",()=>{assert.equal(statusTone("Pendiente"),"warning");assert.equal(statusTone("Expirado"),"warning")});it("danger tones",()=>{assert.equal(statusTone("Revocado"),"danger");assert.equal(statusTone("Archivado"),"danger")})});
````
