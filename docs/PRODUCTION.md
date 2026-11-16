# Configuración y Despliegue en Producción

El frontend se compila como una Single Page Application (SPA) estática y se sirve globalmente a través de GitHub Pages. Todos los datos y la autenticación son gestionados por Supabase.

## 1. Secretos del Repositorio (GitHub Secrets)

En tu repositorio de GitHub:
Settings -> Secrets and variables -> Actions -> New repository secret

Agrega los dos secretos de tu proyecto de Supabase:
1. VITE_SUPABASE_URL: URL de tu instancia (ej. https://xxxx.supabase.co).
2. VITE_SUPABASE_ANON_KEY: Clave pública anónima (anon key).

## 2. GitHub Pages Setup

1. Ve a Settings -> Pages.
2. En Build and deployment -> Source, selecciona: GitHub Actions (o rama gh-pages / root).
3. URL de producción: https://vmartinez5310.github.io/engine-review-system/
