<script setup>
import { ref } from 'vue'
import { Mail, ArrowLeft, CheckCircle2 } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

function handleSubmit() {
  if (!email.value) {
    error.value = 'Ingresa tu correo electrónico'
    return
  }
  error.value = ''
  loading.value = true
  setTimeout(() => {
    loading.value = false
    sent.value = true
  }, 700)
}
</script>

<template>
  <AuthLayout>
    <router-link :to="{ name: 'login' }" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
      <ArrowLeft class="size-4" />
      Volver a iniciar sesión
    </router-link>

    <template v-if="!sent">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Recupera tu contraseña</h1>
      <p class="mt-2 text-sm text-slate-500">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleSubmit">
        <BaseInput
          v-model="email"
          type="email"
          label="Correo electrónico"
          placeholder="tucorreo@negocio.com"
          :error="error"
        >
          <template #icon><Mail class="size-4" /></template>
        </BaseInput>

        <BaseButton type="submit" block :loading="loading" class="mt-2">
          Enviar enlace de recuperación
        </BaseButton>
      </form>
    </template>

    <template v-else>
      <div class="flex size-12 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 class="size-6 text-emerald-500" />
      </div>
      <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Revisa tu correo</h1>
      <p class="mt-2 text-sm text-slate-500">
        Enviamos un enlace de recuperación a <span class="font-medium text-slate-700">{{ email }}</span>.
        Recuerda revisar la carpeta de spam.
      </p>
    </template>
  </AuthLayout>
</template>
