const API_URL = 'https://script.google.com/macros/s/AKfycbyMslmTFneKNc-nHeHLwDoEa9NOBiecy8H90i8Uup3iIPMfmbjEuKPn6P4VnAQzqTe0Lw/exec';

export const apiClient = {
  async post(action, payload = {}) {
    const token = localStorage.getItem('inm_dash_token');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload, token })
      });
      const result = await res.json();
      if (result.status === 'error') throw new Error(result.message);
      return result.data;
    } catch (err) {
      console.error(`API [${action}]:`, err);
      throw err;
    }
  }
};
