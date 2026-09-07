<script setup>
import { onMounted, ref } from 'vue'
import { ImagePlus, Loader2, Trash2, Images } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { listArchivos, uploadArchivo, deleteArchivo } from '@/api/archivos'
import { ApiError } from '@/api/http'
import { useToast } from '@/composables/useToast'

// Biblioteca de fotos del negocio: se suben acá una sola vez y después se pueden elegir
// desde cualquier espacio del catálogo que use la biblioteca (ej. las secciones de Home
// de Moda, vía el botón "Elegir de mis archivos" al subir una foto ahí) — sin tener que
// subir el mismo archivo dos veces.
const { success, error: toastError } = useToast()

const loading = ref(true)
const noNegocio = ref(false)
const archivos = ref([])
const uploading = ref(false)
const deletingId = ref(null)
const fileInput = ref(null)

async function load() {
  loading.value = true
  noNegocio.value = false
  try {
    archivos.value = await listArchivos()
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      noNegocio.value = true
    } else {
      toastError('No se pudieron cargar tus archivos', { description: err.message })
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function handleFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return

  uploading.value = true
  try {
    for (const file of files) {
      const archivo = await uploadArchivo(file)
      archivos.value = [archivo, ...archivos.value]
    }
    success(files.length > 1 ? `${files.length} fotos subidas` : 'Foto subida')
  } catch (err) {
    toastError('No se pudo subir la foto', { description: err.message })
  } finally {
    uploading.value = false
  }
}

async function handleDelete(archivo) {
  deletingId.value = archivo.id
  try {
    await deleteArchivo(archivo.id)
    archivos.value = archivos.value.filter((a) => a.id !== archivo.id)
  } catch (err) {
    toastError('No se pudo eliminar el archivo', { description: err.message })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <DashboardLayout>
    <PageHeader
      title="Archivos guardados"
      description="Sube fotos a tu biblioteca y después elígelas para usarlas en las secciones de tu catálogo, sin tener que subirlas de nuevo cada vez."
    >
      <template #action>
        <BaseButton :disabled="uploading" @click="fileInput?.click()">
          <Loader2 v-if="uploading" class="size-4 animate-spin" />
          <ImagePlus v-else class="size-4" />
          {{ uploading ? 'Subiendo…' : 'Subir fotos' }}
        </BaseButton>
        <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="handleFiles" />
      </template>
    </PageHeader>

    <EmptyState
      v-if="!loading && noNegocio"
      :icon="Images"
      title="Todavía no configuraste tu negocio"
      description="Antes de subir archivos, completa el perfil de tu negocio."
    >
      <template #action>
        <router-link :to="{ name: 'business-profile' }">
          <BaseButton>Configurar mi negocio</BaseButton>
        </router-link>
      </template>
    </EmptyState>

    <template v-else-if="loading">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Skeleton v-for="i in 5" :key="i" class="aspect-square w-full rounded-xl" />
      </div>
    </template>

    <div v-else-if="archivos.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <div v-for="archivo in archivos" :key="archivo.id" class="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <img :src="archivo.url" :alt="archivo.nombre || ''" class="h-full w-full object-cover" />
        <div class="absolute inset-0 flex items-end bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          <p v-if="archivo.nombre" class="min-w-0 flex-1 truncate p-2 text-xs text-white">{{ archivo.nombre }}</p>
          <button
            type="button"
            class="m-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-rose-600 hover:bg-white disabled:opacity-50"
            :disabled="deletingId === archivo.id"
            @click="handleDelete(archivo)"
          >
            <Loader2 v-if="deletingId === archivo.id" class="size-4 animate-spin" />
            <Trash2 v-else class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      :icon="Images"
      title="Todavía no subiste ninguna foto"
      description="Subí fotos acá para poder elegirlas después en las secciones de tu catálogo."
    >
      <template #action>
        <BaseButton @click="fileInput?.click()">
          <ImagePlus class="size-4" />
          Subir fotos
        </BaseButton>
      </template>
    </EmptyState>
  </DashboardLayout>
</template>
