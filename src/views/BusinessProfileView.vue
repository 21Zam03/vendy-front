<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Store,
  Link2,
  Palette,
  User,
  MessageCircle,
  Camera,
  Music2,
  ThumbsUp,
  MapPin,
  Check,
  ExternalLink,
  RotateCcw,
  Trash2,
  Plus,
  Wallet,
  Link,
  Loader2,
  ImageOff,
} from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import {
  accentColors,
  backgroundOptions,
  fontOptions,
  radiusOptions,
  coverOptions,
  catalogLayoutOptions,
  paymentMethodOptions,
} from '@/data/mock'
import { useBusiness } from '@/composables/useBusiness'
import { useAuth } from '@/composables/useAuth'
import { formatPhone, slugify } from '@/utils/format'
import { accentClasses, coverClasses, radiusValue } from '@/utils/theme'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/api/http'
import { listEnlaces, createEnlace, deleteEnlace } from '@/api/enlaces'
import { uploadNegocioLogo, uploadNegocioCoverImage } from '@/api/negocio'

const { state: authState } = useAuth()

const { success, error: toastError } = useToast()
const { state: businessState, business, ensureInitialized, save: saveNegocio, reload } = useBusiness()
ensureInitialized()

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

onMounted(async () => {
  try {
    links.value = await listEnlaces()
  } catch {
    // si el negocio todavía no existe, simplemente no hay enlaces que mostrar
  } finally {
    loadingLinks.value = false
  }
})

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

const tabs = [
  { key: 'profile', label: 'Perfil', icon: Store },
  { key: 'contact', label: 'Info del negocio', icon: Link2 },
  { key: 'payment', label: 'Métodos de pago', icon: Wallet },
  { key: 'links', label: 'Enlaces', icon: Link },
  { key: 'appearance', label: 'Apariencia', icon: Palette },
  { key: 'account', label: 'Cuenta', icon: User },
]
const activeTab = ref('profile')
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

const previewAccent = computed(() => accentClasses(business.appearance.accentColor))
const previewCover = computed(() => coverClasses(business.appearance.accentColor, business.appearance.cover))
const previewRadius = computed(() => radiusValue(business.appearance.radius))
const previewBackground = computed(
  () => backgroundOptions.find((b) => b.key === business.appearance.background)?.class || 'bg-white',
)
const previewFontClass = computed(
  () => fontOptions.find((f) => f.key === business.appearance.font)?.class || 'font-sans',
)

async function save() {
  saving.value = true
  errors.value = {}
  try {
    await saveNegocio()
    success('Cambios guardados', { description: 'Tu página pública se actualizó correctamente' })
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
  } finally {
    saving.value = false
  }
}

async function reset() {
  await reload()
  success('Cambios descartados', { description: 'Se recargó la última versión guardada' })
}

function notifyAccountUnavailable() {
  toastError('Todavía no disponible', { description: 'Editar los datos de tu cuenta llegará pronto' })
}
</script>

<template>
  <DashboardLayout>
    <PageHeader title="Mi negocio" description="Así es como te verán tus clientes en tu página pública.">
      <template #action>
        <a v-if="business.slug" :href="`/tienda/${business.slug}`" target="_blank" rel="noopener">
          <BaseButton variant="outline">
            <ExternalLink class="size-4" />
            Ver mi página
          </BaseButton>
        </a>
      </template>
    </PageHeader>

    <p v-if="!businessState.loading && !businessState.exists" class="-mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
      Todavía no has creado tu negocio. Completa el perfil y guarda para publicar tu página.
    </p>

    <div v-if="businessState.loading" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
      Cargando…
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <nav class="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
          :class="activeTab === t.key ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'"
          @click="activeTab = t.key"
        >
          <component :is="t.icon" class="size-4" />
          {{ t.label }}
        </button>
      </nav>

      <div class="lg:col-span-3">
        <BaseCard v-if="activeTab === 'profile'">
          <template #header>
            <h2 class="text-base font-semibold text-slate-900">Perfil del negocio</h2>
          </template>
          <form class="flex flex-col gap-4" @submit.prevent="save">
            <div class="flex items-center gap-3">
              <label
                class="relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-lg font-semibold text-white"
              >
                <img v-if="business.logoUrl" :src="business.logoUrl" class="h-full w-full object-cover" alt="" />
                <span v-else>{{ business.logoInitials }}</span>
                <span
                  v-if="uploadingLogo"
                  class="absolute inset-0 flex items-center justify-center bg-slate-900/50"
                >
                  <Loader2 class="size-5 animate-spin text-white" />
                </span>
                <input type="file" accept="image/*" class="hidden" :disabled="uploadingLogo" @change="handleLogoUpload" />
              </label>

              <div class="flex flex-col gap-1">
                <p class="text-sm text-slate-500">Foto de perfil de tu negocio. JPG, PNG, WEBP o GIF, sin comprimir.</p>
                <button
                  v-if="business.logoUrl"
                  type="button"
                  class="flex w-fit items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                  @click="business.logoUrl = ''"
                >
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
                rows="3"
                placeholder="Cuéntale a tus clientes qué vendes"
                class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <BaseInput v-model="business.location" label="Ubicación" placeholder="Ciudad, país">
              <template #icon><MapPin class="size-4" /></template>
            </BaseInput>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Enlace de tu página pública</label>
              <div class="flex gap-2">
                <div class="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500">
                  <Link2 class="size-4 shrink-0 text-slate-400" />
                  <span class="shrink-0 text-slate-400">vendy.app/</span>
                  <input
                    v-model="business.slug"
                    class="min-w-0 flex-1 bg-transparent text-slate-900 focus:outline-none"
                    placeholder="tu-negocio"
                  />
                </div>
                <BaseButton type="button" variant="outline" @click="generateSlug">Generar</BaseButton>
              </div>
              <p v-if="errors.slug" class="mt-1.5 text-xs text-rose-600">{{ errors.slug }}</p>
              <p v-else class="mt-1.5 text-xs text-slate-400">Solo minúsculas, números y guiones.</p>
            </div>
            <div class="flex justify-end">
              <BaseButton type="submit" :loading="saving">Guardar cambios</BaseButton>
            </div>
          </form>
        </BaseCard>

        <BaseCard v-else-if="activeTab === 'contact'">
          <template #header>
            <h2 class="text-base font-semibold text-slate-900">Info del negocio</h2>
          </template>
          <form class="flex flex-col gap-4" @submit.prevent="save">
            <BaseInput v-model="business.whatsapp" label="Número de WhatsApp" placeholder="51987654321" :error="errors.whatsapp">
              <template #icon><MessageCircle class="size-4" /></template>
            </BaseInput>
            <p class="-mt-2 text-xs text-slate-400">
              Se mostrará como <span class="font-medium text-slate-600">{{ formatPhone(business.whatsapp) }}</span>.
              Las consultas de tus productos llegarán a este número por WhatsApp.
            </p>
            <BaseInput v-model="business.social.instagram" label="Instagram (opcional)" placeholder="tunegocio">
              <template #icon><Camera class="size-4" /></template>
            </BaseInput>
            <BaseInput v-model="business.social.tiktok" label="TikTok (opcional)" placeholder="tunegocio">
              <template #icon><Music2 class="size-4" /></template>
            </BaseInput>
            <BaseInput v-model="business.social.facebook" label="Facebook (opcional)" placeholder="tunegocio">
              <template #icon><ThumbsUp class="size-4" /></template>
            </BaseInput>

            <div class="flex justify-end">
              <BaseButton type="submit" :loading="saving">Guardar cambios</BaseButton>
            </div>
          </form>
        </BaseCard>

        <BaseCard v-else-if="activeTab === 'payment'">
          <template #header>
            <div>
              <h2 class="text-base font-semibold text-slate-900">Métodos de pago</h2>
              <p class="text-sm text-slate-400">Se muestran como referencia en tu página pública.</p>
            </div>
          </template>
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
        </BaseCard>

        <BaseCard v-else-if="activeTab === 'links'">
          <template #header>
            <div>
              <h2 class="text-base font-semibold text-slate-900">Enlaces personalizados</h2>
              <p class="text-sm text-slate-400">Además de Instagram/TikTok/Facebook: menú, reservas, otro local, lo que quieras.</p>
            </div>
          </template>

          <div v-if="loadingLinks" class="text-sm text-slate-400">Cargando…</div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="l in links"
              :key="l.id"
              class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
            >
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
        </BaseCard>

        <BaseCard v-else-if="activeTab === 'appearance'">
          <template #header>
            <div>
              <h2 class="text-base font-semibold text-slate-900">Apariencia</h2>
              <p class="text-sm text-slate-400">Personaliza cómo se ve tu página y tu catálogo público.</p>
            </div>
            <button class="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600" @click="reset">
              <RotateCcw class="size-3.5" />
              Restablecer
            </button>
          </template>

          <!-- vista previa en vivo -->
          <div class="mb-6 overflow-hidden rounded-2xl border border-slate-200">
            <img
              v-if="business.appearance.cover === 'imagen' && business.appearance.coverImageUrl"
              :src="business.appearance.coverImageUrl"
              class="h-16 w-full object-cover"
              alt=""
            />
            <div v-else class="h-16" :class="previewCover" />
            <div class="flex flex-col items-center gap-2 px-4 pb-5 pt-0" :class="[previewBackground, previewFontClass]">
              <span
                class="-mt-6 flex size-12 items-center justify-center border-4 border-white bg-slate-900 text-sm font-semibold text-white shadow"
                :style="{ borderRadius: previewRadius }"
              >
                {{ business.logoInitials }}
              </span>
              <p class="text-sm font-semibold text-slate-900">{{ business.name }}</p>
              <div class="mt-1 flex w-full max-w-[13rem] flex-col gap-1.5">
                <span
                  class="flex h-8 items-center justify-center text-xs font-semibold text-white"
                  :class="previewAccent.solid"
                  :style="{ borderRadius: previewRadius }"
                >
                  Ver catálogo
                </span>
                <span
                  class="flex h-8 items-center justify-center rounded-[10px] border text-xs text-slate-500"
                  :class="previewBackground === 'bg-white' ? 'border-slate-200' : 'border-slate-900/10'"
                >
                  Producto de ejemplo · S/ 89
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-6">
            <div>
              <p class="mb-3 text-sm font-medium text-slate-700">Color de acento</p>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="c in accentColors"
                  :key="c.key"
                  type="button"
                  class="flex flex-col items-center gap-1.5"
                  @click="business.appearance.accentColor = c.key"
                >
                  <span class="relative flex size-11 items-center justify-center rounded-full" :class="c.class">
                    <Check v-if="business.appearance.accentColor === c.key" class="size-5 text-white" />
                  </span>
                  <span class="text-xs text-slate-500">{{ c.label }}</span>
                </button>
              </div>
            </div>

            <div>
              <p class="mb-3 text-sm font-medium text-slate-700">Fondo del catálogo</p>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="b in backgroundOptions"
                  :key="b.key"
                  type="button"
                  class="flex flex-col items-center gap-1.5"
                  @click="business.appearance.background = b.key"
                >
                  <span
                    class="relative flex size-11 items-center justify-center rounded-full border-2"
                    :class="[b.class, business.appearance.background === b.key ? 'border-brand-500' : 'border-slate-200']"
                  >
                    <Check v-if="business.appearance.background === b.key" class="size-4 text-slate-700" />
                  </span>
                  <span class="text-xs text-slate-500">{{ b.label }}</span>
                </button>
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
                    <img
                      v-if="business.appearance.coverImageUrl"
                      :src="business.appearance.coverImageUrl"
                      class="h-full w-full object-cover"
                      alt=""
                    />
                    <ImageOff v-else class="size-4 text-slate-400" />
                  </span>
                  <span class="pb-2 text-xs text-slate-500">Imagen</span>
                </button>
              </div>

              <div v-if="business.appearance.cover === 'imagen'" class="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <label
                  class="relative flex h-14 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-100"
                >
                  <img
                    v-if="business.appearance.coverImageUrl"
                    :src="business.appearance.coverImageUrl"
                    class="h-full w-full object-cover"
                    alt=""
                  />
                  <ImageOff v-else class="size-5 text-slate-300" />
                  <span
                    v-if="uploadingCover"
                    class="absolute inset-0 flex items-center justify-center bg-slate-900/50"
                  >
                    <Loader2 class="size-5 animate-spin text-white" />
                  </span>
                  <input type="file" accept="image/*" class="hidden" :disabled="uploadingCover" @change="handleCoverUpload" />
                </label>
                <div class="flex flex-col gap-1">
                  <p class="text-xs text-slate-500">Imagen de fondo para la cabecera de tu perfil público. JPG, PNG, WEBP o GIF, sin comprimir.</p>
                  <button
                    v-if="business.appearance.coverImageUrl"
                    type="button"
                    class="flex w-fit items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                    @click="business.appearance.coverImageUrl = ''"
                  >
                    <ImageOff class="size-3.5" />
                    Quitar foto
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p class="mb-3 text-sm font-medium text-slate-700">Estructura del catálogo</p>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  v-for="t in catalogLayoutOptions"
                  :key="t.key"
                  type="button"
                  class="flex flex-col gap-3 rounded-xl border-2 p-3 text-left transition-colors"
                  :class="business.appearance.catalogLayout === t.key ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'"
                  @click="business.appearance.catalogLayout = t.key"
                >
                  <div class="flex h-14 items-center justify-center rounded-lg bg-white p-2">
                    <div v-if="t.key === 'grid'" class="grid h-full w-full grid-cols-2 gap-1">
                      <span v-for="i in 4" :key="i" class="rounded-sm bg-slate-300" />
                    </div>
                    <div v-else-if="t.key === 'pro'" class="grid h-full w-full grid-cols-2 gap-1.5">
                      <span class="rounded-sm bg-slate-300" />
                      <span class="rounded-sm bg-slate-300" />
                    </div>
                    <div v-else class="flex h-full w-full flex-col justify-between">
                      <span class="h-2 w-full rounded-sm bg-slate-300" />
                      <span class="h-2 w-full rounded-sm bg-slate-300" />
                      <span class="h-2 w-full rounded-sm bg-slate-300" />
                    </div>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-slate-800">{{ t.label }}</p>
                    <p class="mt-0.5 text-[11px] leading-snug text-slate-400">{{ t.description }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <BaseButton :loading="saving" @click="save">Guardar cambios</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-else-if="activeTab === 'account'">
          <template #header>
            <h2 class="text-base font-semibold text-slate-900">Cuenta</h2>
          </template>
          <form class="flex flex-col gap-4" @submit.prevent="notifyAccountUnavailable">
            <BaseInput :model-value="authState.user?.name" label="Nombre completo" disabled />
            <BaseInput :model-value="authState.user?.email" type="email" label="Correo electrónico" disabled />
            <BaseInput type="password" label="Nueva contraseña" placeholder="••••••••" disabled />
            <p class="text-xs text-slate-400">Editar estos datos todavía no está disponible.</p>
          </form>
        </BaseCard>
      </div>
    </div>
  </DashboardLayout>
</template>
