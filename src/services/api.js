// La URL se inyecta dinámicamente en tiempo de construcción/desarrollo desde el archivo .env
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn("ADVERTENCIA: VITE_API_URL no está definida en el archivo .env");
}

export const apiClient = {
  /**
   * Enrutador universal para consumir la API de Apps Script
   * @param {string} action - El endpoint que buscas (ej. 'request_otp', 'get_public_reviews')
   * @param {object} payload - Los datos que envías al servidor
   * @returns {Promise<any>} - La respuesta limpia del servidor
   */
  async post(action, payload = {}) {
    const token = localStorage.getItem('inm_dash_token');
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        // 'follow' es obligatorio por el redireccionamiento 302 interno de Google Apps Script
        redirect: 'follow', 
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8' 
        },
        body: JSON.stringify({ 
          action, 
          payload, 
          token 
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message);
      }
      
      return result.data;
      
    } catch (error) {
      console.error(`Error de Red en API [${action}]:`, error);
      throw error; 
    }
  }
};