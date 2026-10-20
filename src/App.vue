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
        {{ loadingMessage }}
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
