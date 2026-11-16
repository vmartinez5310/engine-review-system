<script setup>
import { ref, onMounted } from 'vue'
import LoginView from './views/auth/LoginView.vue'
import DashboardLayout from './components/layout/DashboardLayout.vue'
import ReviewFormView from './views/public/ReviewFormView.vue'
import PublicReviewsCarousel from './views/public/PublicReviewsCarousel.vue'
import { supabase } from './services/supabaseClient'
import { authState, fetchUserInfo, logout as authLogout } from './composables/useAuth'
import { cacheStorage } from './utils/cache'

const isAppLoading = ref(true)
const loadingMessage = ref('Iniciando sistema...')
const appConfig = ref({
  nombre: 'Inmobiliarte 22',
  color: '#4cc3e9',
  logoH: null,
  logoV: null,
  urlFrontend: '',
  recaptchaSiteKey: ''
})

const inviteToken = ref('')
const isPublicReview = ref(false)
const isReviewsWidget = ref(false)

function applyConfig(cfg) {
  appConfig.value = {
    nombre: cfg.Empresa_Nombre || 'Inmobiliarte 22',
    color: cfg.Color_Primario || '#4cc3e9',
    logoH: cfg.Logo_Horizontal || null,
    logoV: cfg.Logo_Vertical || null,
    urlFrontend: cfg.URL_Frontend_App || '',
    recaptchaSiteKey: ''
  }
  document.documentElement.style.setProperty('--brand-color', appConfig.value.color)
}

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

  // 1. Cache Hit (render inmediato en 0 ms)
  const cached = cacheStorage.get('system_config', 600000)
  if (cached?.data) {
    applyConfig(cached.data)
    isAppLoading.value = false
  }

  // 2. Revalidación en segundo plano o Cache Miss
  try {
    const { data } = await supabase.from('configuracion').select('*')
    if (data && data.length > 0) {
      const cfgMap = {}
      data.forEach(row => { cfgMap[row.clave] = row.valor })
      cacheStorage.set('system_config', cfgMap)
      applyConfig(cfgMap)
    }

    if (!isPublicReview.value && !isReviewsWidget.value) {
      await fetchUserInfo()
    }
  } catch (e) {
    console.error('Error sincronizando configuración:', e)
  } finally {
    isAppLoading.value = false
  }
})

async function handleLoginSuccess() {
  loadingMessage.value = 'Validando credenciales...'
  isAppLoading.value = true
  await fetchUserInfo()
  isAppLoading.value = false
}

function handleLogout() {
  loadingMessage.value = 'Finalizando sesión...'
  isAppLoading.value = true
  setTimeout(authLogout, 300)
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isAppLoading"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 backdrop-blur-sm"
    >
      <div class="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-brand rounded-full animate-spin mb-4" />
      <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
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
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
