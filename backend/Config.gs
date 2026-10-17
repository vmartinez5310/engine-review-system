const BD = {
  WHITELIST: 'Whitelist',
  TOKENS: 'Tokens',
  RESENAS: 'Resenas',
  CONFIG: 'Configuracion'
};

const ROLES = {
  'ADMINISTRADOR': ['ver_dashboard', 'generar_enlace', 'ver_seguimientos', 'editar_resena', 'gestionar_usuarios', 'configurar_sistema'],
  'SUPERVISOR': ['ver_dashboard', 'generar_enlace', 'ver_seguimientos', 'editar_resena'],
  'APROBADOR': ['ver_dashboard', 'editar_resena'],
  'USUARIO': ['ver_dashboard', 'generar_enlace', 'ver_seguimientos']
};

function getSecret(key) {
  const val = PropertiesService.getScriptProperties().getProperty(key);
  if (!val) throw new Error('Falta Script Property: ' + key);
  return val;
}

function getConfig() {
  let config = { nombre: 'Sistema', color: '#333333', logoH: '', logoV: '', urlFrontend: '' };
  try {
    const data = getSheet(BD.CONFIG).getDataRange().getValues();
    data.forEach(row => {
      const key = String(row[0]).trim();
      const val = String(row[1]).trim();
      if (key === 'Empresa_Nombre') config.nombre = val;
      if (key === 'Color_Primario') config.color = val;
      if (key === 'Logo_Horizontal') config.logoH = val;
      if (key === 'Logo_Vertical') config.logoV = val;
      if (key === 'URL_Frontend_App') config.urlFrontend = val;
    });
  } catch (e) {}
  return config;
}