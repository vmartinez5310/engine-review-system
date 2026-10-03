import { createApp } from 'vue'
import './assets/style.css' // <-- Debe apuntar a la carpeta assets
import App from './App.vue'

import Swal from 'sweetalert2'
window.Swal = Swal 

const rootElement = document.getElementById('engine-dashboard-root') || document.body
createApp(App).mount(rootElement)