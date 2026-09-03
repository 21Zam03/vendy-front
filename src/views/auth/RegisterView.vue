<script setup>
import { ref } from 'vue'
import { Mail, Lock, User, Store } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useToast } from '@/composables/useToast'

const name = ref('')
const business = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = ref({})

const { info } = useToast()

function validate() {
  errors.value = {}
  if (!name.value) errors.value.name = 'Ingresa tu nombre'
  if (!business.value) errors.value.business = 'Ingresa el nombre de tu negocio'
  if (!email.value) errors.value.email = 'Ingresa tu correo electrónico'
  if (!password.value || password.value.length < 6)
    errors.value.password = 'Mínimo 6 caracteres'
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return
  loading.value = true
  setTimeout(() => {
    loading.value = false
    info('El registro aún no está disponible', {
      description: 'Por ahora las cuentas se crean manualmente. Contacta al equipo de Vendy.',
    })
  }, 500)
}
</script>

<template>
  <AuthLayout>
    <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Crea tu cuenta</h1>
    <p class="mt-2 text-sm text-slate-500">Crea tu catálogo online en minutos, sin tarjeta de crédito.</p>

    <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleSubmit">
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
        v-model="password"
        type="password"
        label="Contraseña"
        placeholder="Mínimo 6 caracteres"
        autocomplete="new-password"
        :error="errors.password"
      >
        <template #icon><Lock class="size-4" /></template>
      </BaseInput>

      <BaseButton type="submit" block :loading="loading" class="mt-2">
        Crear cuenta
      </BaseButton>
    </form>

    <p class="mt-8 text-center text-sm text-slate-500">
      ¿Ya tienes una cuenta?
      <router-link :to="{ name: 'login' }" class="font-medium text-brand-600 hover:text-brand-700">
        Inicia sesión
      </router-link>
    </p>
  </AuthLayout>
</template>
