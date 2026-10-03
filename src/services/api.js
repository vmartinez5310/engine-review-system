// Reemplaza esta URL con el enlace /exec de tu Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyMslmTFneKNc-nHeHLwDoEa9NOBiecy8H90i8Uup3iIPMfmbjEuKPn6P4VnAQzqTe0Lw/exec";

export const apiClient = {
  /**
   * Enrutador universal para consumir la API de Apps Script
   * @param {string} action - El endpoint que buscas (ej. 'request_otp', 'get_public_reviews')
   * @param {object} payload - Los datos que envías al servidor
   * @returns {Promise<any>} - La respuesta limpia del servidor
   */
  async post(action, payload = {}) {
    // 1. Buscamos el token de sesión en la bóveda local del navegador
    const token = localStorage.getItem('inm_dash_token');
    
    try {
      // 2. Disparamos el fetch HTTP
      const response = await fetch(API_URL, {
        method: 'POST',
        // 'follow' es obligatorio. Apps Script responde con un 302 a un servidor interno (script.googleusercontent.com)
        redirect: 'follow', 
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8' 
        },
        // 3. Empaquetamos la petición en el formato exacto que espera doPost()
        body: JSON.stringify({ 
          action, 
          payload, 
          token 
        })
      });
      
      // 4. Procesamos la respuesta JSON del servidor
      const result = await response.json();
      
      // 5. Si el servidor (el cadenero) rechazó la petición, lanzamos el error a la interfaz
      if (result.status === 'error') {
        throw new Error(result.message);
      }
      
      // 6. Si fue un éxito, devolvemos exclusivamente los datos útiles a los componentes de Vue
      return result.data;
      
    } catch (error) {
      console.error(`Error de Red en API [${action}]:`, error);
      throw error; // Propagamos el error para que SweetAlert2 lo muestre en la vista
    }
  }
};