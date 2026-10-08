import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'

import Swal from 'sweetalert2'
window.Swal = Swal 

// 1. Importación del Sistema de Diseño (UI Base)
import DataTable from './components/ui/DataTable.vue'
import StatusBadge from './components/ui/StatusBadge.vue'
import BaseModal from './components/ui/BaseModal.vue'
import BaseButton from './components/ui/BaseButton.vue'
import BaseInput from './components/ui/BaseInput.vue'
import BaseSelect from './components/ui/BaseSelect.vue'
import BaseStarRating from './components/ui/BaseStarRating.vue'
import EmptyState from './components/ui/EmptyState.vue'

const app = createApp(App)

// 2. Registro Global de Componentes
app.component('DataTable', DataTable)
app.component('StatusBadge', StatusBadge)
app.component('BaseModal', BaseModal)
app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)           // NUEVO
app.component('BaseSelect', BaseSelect)         // NUEVO
app.component('BaseStarRating', BaseStarRating) // NUEVO
app.component('EmptyState', EmptyState)   

// 3. Montaje como Widget
const rootElement = document.getElementById('engine-dashboard-root') || document.body
app.mount(rootElement)
