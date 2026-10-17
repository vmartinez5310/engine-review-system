const BD = {
  WHITELIST: 'Whitelist',
  TOKENS: 'Tokens',
  RESENAS: 'Resenas',
  CONFIG: 'Configuracion'
};

const ROLES = {
  ADMINISTRADOR: ['ver_dashboard', 'generar_enlace', 'ver_seguimientos', 'editar_resena', 'gestionar_usuarios', 'configurar_sistema'],
  SUPERVISOR: ['ver_dashboard', 'generar_enlace', 'ver_seguimientos', 'editar_resena'],
  APROBADOR: ['ver_dashboard', 'editar_resena'],
  USUARIO: ['ver_dashboard', 'generar_enlace', 'ver_seguimientos']
};

const SEGURIDAD = {
  get SECRET_JWT() { return getSecret('SECRET_JWT'); },
  get SECRET_FIRMA() { return getSecret('SECRET_FIRMA'); },
  get RECAPTCHA_PROJECT() { return getSecret('RECAPTCHA_PROJECT'); },
  get RECAPTCHA_API_KEY() { return getSecret('RECAPTCHA_API_KEY'); },
  get RECAPTCHA_SITE_KEY() { return getSecret('RECAPTCHA_SITE_KEY'); },
  get GeminiAPI() { return getSecret('GEMINI_API_KEY'); }
};

function getSecret(key) {
  const val = PropertiesService.getScriptProperties().getProperty(key);
  if (!val) throw new Error('Falta Script Property: ' + key);
  return val;
}

function getConfig() {
  const config = { nombre: 'Sistema', color: '#333333', logoH: '', logoV: '', urlFrontend: '' };
  try {
    const data = getSheet(BD.CONFIG).getDataRange().getValues();
    const map = {
      Empresa_Nombre: 'nombre',
      Color_Primario: 'color',
      Logo_Horizontal: 'logoH',
      Logo_Vertical: 'logoV',
      URL_Frontend_App: 'urlFrontend'
    };
    data.forEach(row => {
      const key = String(row[0]).trim();
      if (map[key]) config[map[key]] = String(row[1]).trim();
    });
  } catch (e) {}
  return config;
}
