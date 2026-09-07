<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Lock, Eye, EyeOff } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import LoginIllustration from '@/components/auth/LoginIllustration.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/api/http'
import { googleLoginUrl } from '@/api/auth'
import GoogleIcon from '@/components/icons/GoogleIcon.vue'

const username = ref('')
const password = ref('')
const remember = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const errors = ref({})

const router = useRouter()
const route = useRoute()
const { login } = useAuth()
const { success } = useToast()

// Si venimos de un intento fallido de "Continuar con Google" (ver
// GoogleAuthenticationFailureHandler en el backend), mostramos ese mensaje acá mismo.
if (route.query.error) {
  errors.value.form = String(route.query.error)
}

function validate() {
  errors.value = {}
  if (!username.value) errors.value.username = 'Ingresa tu usuario'
  if (!password.value) errors.value.password = 'Ingresa tu contraseña'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await login(username.value, password.value)
    success('Bienvenida de nuevo', { description: 'Sesión iniciada correctamente' })
    router.push(route.query.redirect || { name: 'dashboard' })
  } catch (err) {
    errors.value.form =
      err instanceof ApiError && err.status === 401
        ? 'Usuario o contraseña incorrectos'
        : err.message || 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout :show-social-proof="false">
    <template #illustration>
      <LoginIllustration />
    </template>

    <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Inicia sesión</h1>
    <p class="mt-2 text-sm text-slate-500">Entra para seguir administrando tu catálogo.</p>

    <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleSubmit">
      <p v-if="errors.form" class="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
        {{ errors.form }}
      </p>

      <BaseInput
        v-model="username"
        label="Usuario"
        placeholder="tu.usuario"
        autocomplete="username"
        :error="errors.username"
      >
        <template #icon><User class="size-4" /></template>
      </BaseInput>

      <BaseInput
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        label="Contraseña"
        placeholder="••••••••"
        autocomplete="current-password"
        :error="errors.password"
      >
        <template #icon><Lock class="size-4" /></template>
        <template #suffix>
          <button type="button" class="text-slate-400 hover:text-slate-600" @click="showPassword = !showPassword">
            <EyeOff v-if="showPassword" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </template>
      </BaseInput>

      <div class="flex items-center justify-between">
        <label class="flex select-none items-center gap-2 text-sm text-slate-600">
          <input
            v-model="remember"
            type="checkbox"
            class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
          />
          Recordarme
        </label>
        <router-link :to="{ name: 'forgot-password' }" class="text-sm font-medium text-brand-600 hover:text-brand-700">
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <BaseButton type="submit" block :loading="loading" class="mt-2">
        Iniciar sesión
      </BaseButton>
    </form>

    <div class="mt-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
      <span class="h-px flex-1 bg-slate-200" />
      o
      <span class="h-px flex-1 bg-slate-200" />
    </div>

    <a
      :href="googleLoginUrl()"
      class="mt-6 flex h-11 items-center justify-center gap-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      <GoogleIcon class="size-4.5" />
      Continuar con Google
    </a>

    <p class="mt-8 text-center text-sm text-slate-500">
      ¿No tienes una cuenta?
      <router-link :to="{ name: 'register' }" class="font-medium text-brand-600 hover:text-brand-700">
        Crea una cuenta
      </router-link>
    </p>
  </AuthLayout>
</template>
