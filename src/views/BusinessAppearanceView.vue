<script setup>
import { onMounted, ref } from 'vue'
import {
  Store,
  X,
  User,
  Building2,
  Wallet,
  Link2,
  Palette,
  MessageCircle,
  MapPin,
  Clock,
  Check,
  RotateCcw,
  Trash2,
  Plus,
  Loader2,
  ImageOff,
  Pipette,
} from '@lucide/vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSidePanel from '@/components/ui/BaseSidePanel.vue'
import PerfilPublicoRenderer from '@/components/storefront/PerfilPublicoRenderer.vue'
import InstagramIcon from '@/components/icons/InstagramIcon.vue'
import TikTokIcon from '@/components/icons/TikTokIcon.vue'
import FacebookIcon from '@/components/icons/FacebookIcon.vue'
import { accentColors, backgroundOptions, fontOptions, radiusOptions, coverOptions, paymentMethodOptions } from '@/data/mock'
import { useBusiness } from '@/composables/useBusiness'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/api/http'
import { listEnlaces, createEnlace, deleteEnlace } from '@/api/enlaces'
import { uploadNegocioLogo, uploadNegocioCoverImage, uploadNegocioBackgroundImage } from '@/api/negocio'
import { getDestacadosPublico, getColeccionesPublico } from '@/api/tienda'
import { formatPhone, slugify } from '@/utils/format'
import { coverClasses } from '@/utils/theme'

// Pantalla aparte (sin el layout de administración) que muestra el perfil público real del
// negocio, con un riel flotante vertical (a la izquierda) que abre paneles flotantes (a la
// derecha, sin oscurecer el fondo — ver BaseSidePanel) para editar cada grupo de datos —
// el mismo patrón que CatalogEditorView usa para "Mi catálogo", aplicado al perfil.
const { success, error: toastError } = useToast()
const { state: businessState, business, ensureInitialized, save: saveNegocio, reload } = useBusiness()

const featured = ref([])
const collections = ref([])

// Mismos datos reales que ve un visitante (destacados, colecciones), para que la vista
// previa de acá sea igual a la página pública, no una aproximación aparte.
async function loadPreviewData() {
  if (!business.slug) return
  const [destacados, colecciones] = await Promise.all([
    getDestacadosPublico(business.slug).catch(() => []),
    getColeccionesPublico(business.slug).catch(() => []),
  ])
  featured.value = destacados
  collections.value = colecciones
}

function paymentMethodIndex(key) {
  return business.paymentMethods.findIndex((m) => m.key === key)
}
function isPaymentMethodSelected(key) {
  return paymentMethodIndex(key) !== -1
}
function togglePaymentMethod(key) {
  const index = paymentMethodIndex(key)
  if (index === -1) business.paymentMethods.push({ key, value: '' })
  else business.paymentMethods.splice(index, 1)
}
function paymentMethodValue(key) {
  return business.paymentMethods[paymentMethodIndex(key)]?.value ?? ''
}
function setPaymentMethodValue(key, value) {
  const method = business.paymentMethods[paymentMethodIndex(key)]
  if (method) method.value = value
}

// Enlaces personalizados (no forman parte de business.* — son un recurso aparte, /api/v1/enlaces)
const links = ref([])
const loadingLinks = ref(true)
const newLink = ref({ label: '', url: '' })
const savingLink = ref(false)

async function loadLinks() {
  try {
    links.value = await listEnlaces()
  } catch {
    // si el negocio todavía no existe, simplemente no hay enlaces que mostrar
  } finally {
    loadingLinks.value = false
  }
}

async function addLink() {
  if (!newLink.value.label || !newLink.value.url) return
  savingLink.value = true
  try {
    const created = await createEnlace(newLink.value)
    links.value.push(created)
    newLink.value = { label: '', url: '' }
  } catch (err) {
    toastError('No se pudo agregar el enlace', { description: err.message })
  } finally {
    savingLink.value = false
  }
}

async function removeLink(link) {
  try {
    await deleteEnlace(link.id)
    links.value = links.value.filter((l) => l.id !== link.id)
  } catch (err) {
    toastError('No se pudo eliminar el enlace', { description: err.message })
  }
}

onMounted(async () => {
  loadLinks()
  await ensureInitialized()
  await loadPreviewData()
})

const saving = ref(false)
const errors = ref({})

function generateSlug() {
  business.slug = slugify(business.name)
}

const uploadingLogo = ref(false)

async function handleLogoUpload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  uploadingLogo.value = true
  try {
    const { url } = await uploadNegocioLogo(file)
    business.logoUrl = url
  } catch (err) {
    toastError('No se pudo subir la foto', { description: err.message })
  } finally {
    uploadingLogo.value = false
  }
}

const uploadingCover = ref(false)

async function handleCoverUpload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  uploadingCover.value = true
  try {
    const { url } = await uploadNegocioCoverImage(file)
    business.appearance.coverImageUrl = url
  } catch (err) {
    toastError('No se pudo subir la foto', { description: err.message })
  } finally {
    uploadingCover.value = false
  }
}

const uploadingBackground = ref(false)

async function handleBackgroundUpload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  uploadingBackground.value = true
  try {
    const { url } = await uploadNegocioBackgroundImage(file)
    business.appearance.backgroundImageUrl = url
  } catch (err) {
    toastError('No se pudo subir la foto', { description: err.message })
  } finally {
    uploadingBackground.value = false
  }
}

async function save() {
  saving.value = true
  errors.value = {}
  try {
    await saveNegocio()
    success('Cambios guardados', { description: 'Tu página pública se actualizó correctamente' })
    return true
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.data) {
      errors.value = err.data
      toastError('Revisa los campos marcados', { description: 'Hay datos que el servidor no aceptó' })
    } else if (err instanceof ApiError && err.status === 409) {
      errors.value = { slug: err.message }
      toastError('Ese enlace ya está en uso', { description: 'Prueba con otro' })
    } else {
      toastError('No se pudieron guardar los cambios', { description: err.message })
    }
    return false
  } finally {
    saving.value = false
  }
}

async function reset() {
  await reload()
  success('Cambios descartados', { description: 'Se recargó la última versión guardada' })
}

// Un solo panel abierto a la vez, elegido desde el riel flotante.
const modalAbierto = ref(null)
function cerrarModal() {
  modalAbierto.value = null
}
</script>

<template>
  <div v-if="businessState.loading" class="flex min-h-screen items-center justify-center text-sm text-slate-400">
    Cargando…
  </div>

  <EmptyState v-else-if="!businessState.exists" :icon="Store" title="Todavía no configuraste tu negocio" class="min-h-screen">
    <template #action>
      <router-link :to="{ name: 'business-profile' }">
        <BaseButton>Configurar mi negocio</BaseButton>
      </router-link>
    </template>
  </EmptyState>

  <template v-else>
    <StorefrontLayout :appearance="business.appearance">
      <PerfilPublicoRenderer editable :business="business" :featured="featured" :collections="collections" :links="links" :slug="business.slug" />
    </StorefrontLayout>

    <!-- Riel flotante vertical: mismo patrón que la barra de edición de Mi catálogo
         (CatalogEditorView), pero como columna a la derecha en vez de barra horizontal. -->
    <div class="fixed left-4 top-1/2 z-40 -translate-y-1/2">
      <div class="flex flex-col items-stretch gap-1 rounded-2xl bg-slate-900/95 p-1.5 text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md">
        <button type="button" class="flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors hover:bg-white/10" @click="modalAbierto = 'perfil'">
          <User class="size-4" />
          Perfil
        </button>
        <button type="button" class="flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors hover:bg-white/10" @click="modalAbierto = 'contacto'">
          <Building2 class="size-4" />
          Info del negocio
        </button>
        <button type="button" class="flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors hover:bg-white/10" @click="modalAbierto = 'pago'">
          <Wallet class="size-4" />
          Métodos de pago
        </button>
        <button type="button" class="flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors hover:bg-white/10" @click="modalAbierto = 'enlaces'">
          <Link2 class="size-4" />
          Enlaces
        </button>
        <button type="button" class="flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors hover:bg-white/10" @click="modalAbierto = 'estilos'">
          <Palette class="size-4" />
          Estilos
        </button>
        <div class="my-0.5 h-px bg-white/10" />
        <router-link :to="{ name: 'business-profile' }" class="flex w-16 flex-col items-center gap-1 rounded-xl bg-white/10 px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors hover:bg-white/20">
          <X class="size-4" />
          Salir
        </router-link>
      </div>
    </div>

    <!-- Perfil -->
    <BaseSidePanel :model-value="modalAbierto === 'perfil'" title="Perfil" @update:model-value="cerrarModal">
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="flex items-center gap-3">
          <label class="relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-lg font-semibold text-white">
            <img v-if="business.logoUrl" :src="business.logoUrl" class="h-full w-full object-cover" alt="" />
            <span v-else>{{ business.logoInitials }}</span>
            <span v-if="uploadingLogo" class="absolute inset-0 flex items-center justify-center bg-slate-900/50">
              <Loader2 class="size-5 animate-spin text-white" />
            </span>
            <input type="file" accept="image/*" class="hidden" :disabled="uploadingLogo" @change="handleLogoUpload" />
          </label>

          <div class="flex flex-col gap-1">
            <p class="text-sm text-slate-500">Foto de perfil de tu negocio. JPG, PNG, WEBP o GIF, sin comprimir.</p>
            <button v-if="business.logoUrl" type="button" class="flex w-fit items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700" @click="business.logoUrl = ''">
              <ImageOff class="size-3.5" />
              Quitar foto
            </button>
          </div>
        </div>
        <BaseInput v-model="business.name" label="Nombre del negocio" :error="errors.nombre" />
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            v-model="business.description"
            rows="6"
            placeholder="Cuéntale a tus clientes qué vendes"
            class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <BaseInput v-model="business.location" label="Ubicación" placeholder="Ciudad, país">
          <template #icon><MapPin class="size-4" /></template>
        </BaseInput>
        <BaseInput v-model="business.schedule" label="Horario de atención (opcional)" placeholder="Lun-Sáb 9am-8pm">
          <template #icon><Clock class="size-4" /></template>
        </BaseInput>
        <div class="flex flex-col gap-2 rounded-xl border border-slate-200 p-4">
          <label class="text-sm font-medium text-slate-700">Enlace de tu página pública</label>
          <div class="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500">
            <span class="shrink-0 text-slate-400">vendy.app/</span>
            <input v-model="business.slug" class="min-w-0 flex-1 bg-transparent text-slate-900 focus:outline-none" placeholder="tu-negocio" />
          </div>
          <div class="flex items-center justify-between gap-3">
            <p v-if="errors.slug" class="min-w-0 flex-1 text-xs text-rose-600">{{ errors.slug }}</p>
            <p v-else class="min-w-0 flex-1 text-xs text-slate-400">Solo minúsculas, números y guiones.</p>
            <BaseButton type="button" variant="outline" size="sm" class="shrink-0" @click="generateSlug">Generar</BaseButton>
          </div>
        </div>
        <div class="flex justify-end">
          <BaseButton type="submit" :loading="saving">Guardar cambios</BaseButton>
        </div>
      </form>
    </BaseSidePanel>

    <!-- Info del negocio -->
    <BaseSidePanel :model-value="modalAbierto === 'contacto'" title="Info del negocio" @update:model-value="cerrarModal">
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <BaseInput v-model="business.whatsapp" label="Número de WhatsApp" placeholder="51987654321" :error="errors.whatsapp">
          <template #icon><MessageCircle class="size-4" /></template>
        </BaseInput>
        <p class="-mt-2 text-xs text-slate-400">
          Se mostrará como <span class="font-medium text-slate-600">{{ formatPhone(business.whatsapp) }}</span>.
          Las consultas de tus productos llegarán a este número por WhatsApp.
        </p>
        <BaseInput v-model="business.social.instagram" label="Instagram (opcional)" placeholder="https://instagram.com/tunegocio">
          <template #icon><InstagramIcon class="size-4" /></template>
        </BaseInput>
        <BaseInput v-model="business.social.tiktok" label="TikTok (opcional)" placeholder="https://tiktok.com/@tunegocio">
          <template #icon><TikTokIcon class="size-4" /></template>
        </BaseInput>
        <BaseInput v-model="business.social.facebook" label="Facebook (opcional)" placeholder="https://facebook.com/tunegocio">
          <template #icon><FacebookIcon class="size-4" /></template>
        </BaseInput>
        <p class="-mt-2 text-xs text-slate-400">Pega el link completo de cada red — no hace falta escribir solo el usuario.</p>

        <div class="flex justify-end">
          <BaseButton type="submit" :loading="saving">Guardar cambios</BaseButton>
        </div>
      </form>
    </BaseSidePanel>

    <!-- Métodos de pago -->
    <BaseSidePanel
      :model-value="modalAbierto === 'pago'"
      title="Métodos de pago"
      description="Se muestran como referencia en tu página pública."
      @update:model-value="cerrarModal"
    >
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="flex flex-col gap-2">
          <div
            v-for="m in paymentMethodOptions"
            :key="m.key"
            class="rounded-lg border px-3.5 py-2.5 transition-colors"
            :class="isPaymentMethodSelected(m.key) ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200'"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2.5 text-left text-sm font-medium"
              :class="isPaymentMethodSelected(m.key) ? 'text-brand-700' : 'text-slate-600'"
              @click="togglePaymentMethod(m.key)"
            >
              <span
                class="flex size-4 shrink-0 items-center justify-center rounded border"
                :class="isPaymentMethodSelected(m.key) ? 'border-brand-600 bg-brand-600' : 'border-slate-300'"
              >
                <Check v-if="isPaymentMethodSelected(m.key)" class="size-3 text-white" />
              </span>
              {{ m.label }}
            </button>

            <input
              v-if="isPaymentMethodSelected(m.key) && m.needsDetail"
              :value="paymentMethodValue(m.key)"
              type="text"
              :placeholder="m.placeholder"
              class="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              @input="setPaymentMethodValue(m.key, $event.target.value)"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <BaseButton type="submit" :loading="saving">Guardar cambios</BaseButton>
        </div>
      </form>
    </BaseSidePanel>

    <!-- Enlaces -->
    <BaseSidePanel
      :model-value="modalAbierto === 'enlaces'"
      title="Enlaces personalizados"
      description="Además de Instagram/TikTok/Facebook: menú, reservas, otro local, lo que quieras."
      @update:model-value="cerrarModal"
    >
      <div v-if="loadingLinks" class="text-sm text-slate-400">Cargando…</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="l in links" :key="l.id" class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-900">{{ l.label }}</p>
            <p class="truncate text-xs text-slate-400">{{ l.url }}</p>
          </div>
          <button class="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" @click="removeLink(l)">
            <Trash2 class="size-4" />
          </button>
        </div>
        <p v-if="!links.length" class="text-sm text-slate-400">Todavía no agregaste enlaces.</p>
      </div>

      <form class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end" @submit.prevent="addLink">
        <div class="flex-1">
          <BaseInput v-model="newLink.label" label="Texto" placeholder="Ej. Nuestro menú" />
        </div>
        <div class="flex-1">
          <BaseInput v-model="newLink.url" label="URL" placeholder="https://…" />
        </div>
        <BaseButton type="submit" :loading="savingLink">
          <Plus class="size-4" />
          Agregar
        </BaseButton>
      </form>
    </BaseSidePanel>

    <!-- Estilos -->
    <BaseSidePanel :model-value="modalAbierto === 'estilos'" title="Estilos" description="Personaliza cómo se ve tu página" size="lg" @update:model-value="cerrarModal">
      <div class="-mt-8 mb-4 flex justify-end">
        <button class="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600" @click="reset">
          <RotateCcw class="size-3.5" />
          Restablecer
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <div>
          <p class="mb-3 text-sm font-medium text-slate-700">Color de acento</p>
          <div class="flex flex-wrap gap-3">
            <button v-for="c in accentColors" :key="c.key" type="button" class="flex flex-col items-center gap-1.5" @click="business.appearance.accentColor = c.key">
              <span class="relative flex size-11 items-center justify-center rounded-full" :class="c.class">
                <Check v-if="business.appearance.accentColor === c.key" class="size-5 text-white" />
              </span>
              <span class="text-xs text-slate-500">{{ c.label }}</span>
            </button>

            <button type="button" class="flex flex-col items-center gap-1.5" @click="business.appearance.accentColor = 'custom'">
              <span class="relative flex size-11 items-center justify-center rounded-full" :style="{ backgroundColor: business.appearance.accentColorHex }">
                <Check v-if="business.appearance.accentColor === 'custom'" class="size-5 text-white drop-shadow" />
                <Pipette v-else class="size-4 text-white drop-shadow" />
              </span>
              <span class="text-xs text-slate-500">Personalizado</span>
            </button>
          </div>

          <div v-if="business.appearance.accentColor === 'custom'" class="mt-3 flex items-center gap-3">
            <input v-model="business.appearance.accentColorHex" type="color" class="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 p-1" />
            <p class="text-xs text-slate-500">Elige cualquier color para tu página</p>
          </div>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-slate-700">Fondo del catálogo</p>
          <div class="flex flex-wrap gap-3">
            <button v-for="b in backgroundOptions" :key="b.key" type="button" class="flex flex-col items-center gap-1.5" @click="business.appearance.background = b.key">
              <span
                class="relative flex size-11 items-center justify-center rounded-full border-2"
                :class="[b.class, business.appearance.background === b.key ? 'border-brand-500' : 'border-slate-200']"
              >
                <Check v-if="business.appearance.background === b.key" class="size-4 text-slate-700" />
              </span>
              <span class="text-xs text-slate-500">{{ b.label }}</span>
            </button>

            <button type="button" class="flex flex-col items-center gap-1.5" @click="business.appearance.background = 'imagen'">
              <span
                class="relative flex size-11 items-center justify-center overflow-hidden rounded-full border-2"
                :class="business.appearance.background === 'imagen' ? 'border-brand-500' : 'border-slate-200'"
              >
                <img v-if="business.appearance.backgroundImageUrl" :src="business.appearance.backgroundImageUrl" class="h-full w-full object-cover" alt="" />
                <ImageOff v-else class="size-4 text-slate-400" />
                <Check v-if="business.appearance.background === 'imagen'" class="absolute size-4 text-white drop-shadow" />
              </span>
              <span class="text-xs text-slate-500">Foto</span>
            </button>
          </div>

          <div v-if="business.appearance.background === 'imagen'" class="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <label class="relative flex h-14 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              <img v-if="business.appearance.backgroundImageUrl" :src="business.appearance.backgroundImageUrl" class="h-full w-full object-cover" alt="" />
              <ImageOff v-else class="size-5 text-slate-300" />
              <span v-if="uploadingBackground" class="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                <Loader2 class="size-5 animate-spin text-white" />
              </span>
              <input type="file" accept="image/*" class="hidden" :disabled="uploadingBackground" @change="handleBackgroundUpload" />
            </label>
            <div class="flex flex-col gap-1">
              <p class="text-xs text-slate-500">Se muestra con opacidad baja detrás de tu página, para no competir con tus productos.</p>
              <button v-if="business.appearance.backgroundImageUrl" type="button" class="flex w-fit items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700" @click="business.appearance.backgroundImageUrl = ''">
                <ImageOff class="size-3.5" />
                Quitar foto
              </button>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-slate-700">Estilo de letra</p>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="f in fontOptions"
              :key="f.key"
              type="button"
              class="flex flex-col items-center gap-1 rounded-xl border-2 py-3 transition-colors"
              :class="business.appearance.font === f.key ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'"
              @click="business.appearance.font = f.key"
            >
              <span class="text-xl text-slate-800" :class="f.class">{{ f.preview }}</span>
              <span class="text-xs text-slate-500">{{ f.label }}</span>
            </button>
          </div>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-slate-700">Bordes</p>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="r in radiusOptions"
              :key="r.key"
              type="button"
              class="flex flex-col items-center gap-2 rounded-xl border-2 py-3 transition-colors"
              :class="business.appearance.radius === r.key ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'"
              @click="business.appearance.radius = r.key"
            >
              <span class="size-6 bg-slate-400" :style="{ borderRadius: r.value }" />
              <span class="text-xs text-slate-500">{{ r.label }}</span>
            </button>
          </div>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-slate-700">Portada</p>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="c in coverOptions"
              :key="c.key"
              type="button"
              class="flex flex-col items-center gap-2 overflow-hidden rounded-xl border-2 transition-colors"
              :class="business.appearance.cover === c.key ? 'border-brand-500' : 'border-slate-200 hover:border-slate-300'"
              @click="business.appearance.cover = c.key"
            >
              <span class="h-10 w-full" :class="coverClasses(business.appearance.accentColor, c.key)" />
              <span class="pb-2 text-xs text-slate-500">{{ c.label }}</span>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-2 overflow-hidden rounded-xl border-2 transition-colors"
              :class="business.appearance.cover === 'imagen' ? 'border-brand-500' : 'border-slate-200 hover:border-slate-300'"
              @click="business.appearance.cover = 'imagen'"
            >
              <span class="flex h-10 w-full items-center justify-center bg-slate-100">
                <img v-if="business.appearance.coverImageUrl" :src="business.appearance.coverImageUrl" class="h-full w-full object-cover" alt="" />
                <ImageOff v-else class="size-4 text-slate-400" />
              </span>
              <span class="pb-2 text-xs text-slate-500">Imagen</span>
            </button>
          </div>

          <div v-if="business.appearance.cover === 'imagen'" class="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <label class="relative flex h-14 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              <img v-if="business.appearance.coverImageUrl" :src="business.appearance.coverImageUrl" class="h-full w-full object-cover" alt="" />
              <ImageOff v-else class="size-5 text-slate-300" />
              <span v-if="uploadingCover" class="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                <Loader2 class="size-5 animate-spin text-white" />
              </span>
              <input type="file" accept="image/*" class="hidden" :disabled="uploadingCover" @change="handleCoverUpload" />
            </label>
            <div class="flex flex-col gap-1">
              <p class="text-xs text-slate-500">Imagen de fondo para la cabecera de tu perfil público. JPG, PNG, WEBP o GIF, sin comprimir.</p>
              <button v-if="business.appearance.coverImageUrl" type="button" class="flex w-fit items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700" @click="business.appearance.coverImageUrl = ''">
                <ImageOff class="size-3.5" />
                Quitar foto
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <BaseButton :loading="saving" @click="save">Guardar cambios</BaseButton>
      </div>
    </BaseSidePanel>
  </template>
</template>
