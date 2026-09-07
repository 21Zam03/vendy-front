<script setup>
import { ref } from 'vue'
import { Mail, Phone, User, Store, CheckCircle2 } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { createSolicitudRegistro } from '@/api/solicitudes'
import { googleLoginUrl } from '@/api/auth'
import GoogleIcon from '@/components/icons/GoogleIcon.vue'
import { useToast } from '@/composables/useToast'

// Dos caminos para tener cuenta: "Continuar con Google" crea la cuenta al instante (sin
// contraseña, ver GoogleAuthService en el backend) y manda directo a completar el
// negocio; el formulario de acá abajo sigue siendo para quien prefiere que el equipo le
// arme la cuenta a mano — ese solo guarda un pedido de contacto, no crea sesión ni
// credenciales.
const name = ref('')
const business = ref('')
const email = ref('')
const phone = ref('')
const loading = ref(false)
const sent = ref(false)
const errors = ref({})

const { error: toastError } = useToast()

function validate() {
  errors.value = {}
  if (!name.value) errors.value.name = 'Ingresa tu nombre'
  if (!business.value) errors.value.business = 'Ingresa el nombre de tu negocio'
  if (!email.value) errors.value.email = 'Ingresa tu correo electrónico'
  if (!phone.value) errors.value.phone = 'Ingresa tu número de teléfono'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await createSolicitudRegistro({
      nombre: name.value,
      nombreNegocio: business.value,
      email: email.value,
      telefono: phone.value,
    })
    sent.value = true
  } catch (err) {
    toastError('No se pudo enviar tu solicitud', { description: err.message })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <template v-if="sent">
      <div class="flex flex-col items-center py-6 text-center">
        <CheckCircle2 class="size-12 text-emerald-500" />
        <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">¡Listo, recibimos tu solicitud!</h1>
        <p class="mt-2 text-sm text-slate-500">
          Te vamos a contactar al <span class="font-medium text-slate-700">{{ phone }}</span> para crear tu cuenta.
        </p>
      </div>
    </template>

    <template v-else>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Crea tu cuenta</h1>
      <p class="mt-2 text-sm text-slate-500">
        Crea tu cuenta al instante con Google, o dejanos tus datos y te contactamos por teléfono.
      </p>

      <a
        :href="googleLoginUrl()"
        class="mt-6 flex h-11 items-center justify-center gap-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <GoogleIcon class="size-4.5" />
        Continuar con Google
      </a>

      <div class="mt-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span class="h-px flex-1 bg-slate-200" />
        o te contactamos nosotros
        <span class="h-px flex-1 bg-slate-200" />
      </div>

      <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
        <BaseInput v-model="name" label="Nombre completo" placeholder="María López" :error="errors.name">
          <template #icon><User class="size-4" /></template>
        </BaseInput>

        <BaseInput v-model="business" label="Nombre del negocio" placeholder="Casa Aurora" :error="errors.business">
          <template #icon><Store class="size-4" /></template>
        </BaseInput>

        <BaseInput
          v-model="email"
          type="email"
          label="Correo electrónico"
          placeholder="tucorreo@negocio.com"
          autocomplete="email"
          :error="errors.email"
        >
          <template #icon><Mail class="size-4" /></template>
        </BaseInput>

        <BaseInput
          v-model="phone"
          type="tel"
          label="Número de teléfono"
          placeholder="+51 999 999 999"
          autocomplete="tel"
          :error="errors.phone"
        >
          <template #icon><Phone class="size-4" /></template>
        </BaseInput>

        <BaseButton type="submit" block :loading="loading" class="mt-2">
          Solicitar cuenta
        </BaseButton>
      </form>
    </template>

    <p class="mt-8 text-center text-sm text-slate-500">
      ¿Ya tienes una cuenta?
      <router-link :to="{ name: 'login' }" class="font-medium text-brand-600 hover:text-brand-700">
        Inicia sesión
      </router-link>
    </p>
  </AuthLayout>
</template>
