import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import Swal from 'sweetalert2'

window.Swal = Swal

import DataTable from './components/ui/DataTable.vue'
import StatusBadge from './components/ui/StatusBadge.vue'
import BaseModal from './components/ui/BaseModal.vue'
import BaseButton from './components/ui/BaseButton.vue'
import BaseInput from './components/ui/BaseInput.vue'
import BaseSelect from './components/ui/BaseSelect.vue'
import BaseStarRating from './components/ui/BaseStarRating.vue'
import EmptyState from './components/ui/EmptyState.vue'

const app = createApp(App)
;[
  ['DataTable', DataTable],
  ['StatusBadge', StatusBadge],
  ['BaseModal', BaseModal],
  ['BaseButton', BaseButton],
  ['BaseInput', BaseInput],
  ['BaseSelect', BaseSelect],
  ['BaseStarRating', BaseStarRating],
  ['EmptyState', EmptyState]
].forEach(([name, comp]) => app.component(name, comp))

app.mount(document.getElementById('engine-dashboard-root') || document.body)
