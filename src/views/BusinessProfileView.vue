<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Link2,
  MessageCircle,
  Camera,
  Music2,
  ThumbsUp,
  MapPin,
  Clock,
  Check,
  ExternalLink,
  RotateCcw,
  Trash2,
  Plus,
  Loader2,
  ImageOff,
  Eye,
  Pipette,
  Store,
} from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppearancePreviewCard from '@/components/negocio/AppearancePreviewCard.vue'
import TemplatePicker from '@/components/negocio/TemplatePicker.vue'
import {
  accentColors,
  backgroundOptions,
  fontOptions,
  radiusOptions,
  coverOptions,
  paymentMethodOptions,
} from '@/data/mock'
import { getTemplate, templateOptions } from '@/data/templates'
import { useBusiness } from '@/composables/useBusiness'
import { useAuth } from '@/composables/useAuth'
import { formatPhone, slugify } from '@/utils/format'
import { coverClasses } from '@/utils/theme'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/api/http'
import { listEnlaces, createEnlace, deleteEnlace } from '@/api/enlaces'
import { uploadNegocioLogo, uploadNegocioCoverImage, uploadNegocioBackgroundImage } from '@/api/negocio'
import { createSeccion } from '@/api/secciones'
import { listPestanas, createPestana } from '@/api/pestanas'

const { state: authState } = useAuth()
const route = useRoute()

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

// La sección activa la controla el submenú "Mi negocio" del sidebar (query param ?section=),
// no un tab interno — así la navegación entre secciones vive en un solo lugar de la app.
const section = computed(() => route.query.section || 'profile')
const saving = ref(false)
const errors = ref({})

function generateSlug() {
  business.slug = slugify(business.name)
}

// Aplicar una plantilla solo precarga catalogLayout (necesario para que su estructura de
// catálogo se muestre) — nunca accentColor, font ni radius: color/tipografía/bordes son
// personalización del negocio y se editan aparte, en Apariencia, sin que la plantilla los
// toque. El resto de la identidad del negocio (nombre, logo, productos, etc.) tampoco.
async function applyTemplate(key) {
  business.appearance.template = key
  const template = getTemplate(key)
  if (!template) return

  Object.assign(business.appearance, template.defaultAppearance)

  // Las pestañas y secciones sugeridas solo se crean si el negocio todavía no armó
  // ninguna pestaña propia — cambiar o probar plantillas nunca pisa una organización que
  // el negocio ya hizo. Una plantilla con tabPresets arranca con varias pestañas (ej.
  // Moda: Home/Varones/Mujeres); el resto arranca con una sola, llamada como la plantilla.
  const tabPresets = template.tabPresets?.length
    ? template.tabPresets
    : template.sectionPresets?.length
      ? [{ nombre: template.label, sectionPresets: template.sectionPresets }]
      : []

  if (tabPresets.length) {
    try {
      const existentes = await listPestanas()
      // Toda cuenta nueva arranca con una pestaña "General" por defecto — no cuenta como
      // "estructura propia" para este chequeo, así que elegir una plantilla por primera
      // vez sigue creando sus pestañas sugeridas aunque ya exista esa General.
      const yaTieneEstructuraPropia = existentes.some((p) => !p.esGeneral)
      if (!yaTieneEstructuraPropia) {
        const tabsCreadas = []
        const seccionesCreadas = []
        for (const { nombre: tabNombre, esHome, sectionPresets } of tabPresets) {
          const tab = await createPestana({ nombre: tabNombre, esHome })
          tabsCreadas.push(tab)
          for (const nombre of sectionPresets) {
            seccionesCreadas.push(await createSeccion({ nombre, pestanaId: tab.id }))
          }
        }
        success('Pestañas y secciones creadas', {
          description:
            tabsCreadas.length > 1
              ? `Armamos ${tabsCreadas.length} pestañas (${tabsCreadas.map((t) => t.nombre).join(', ')}) para tu catálogo.`
              : `Armamos la pestaña "${tabsCreadas[0].nombre}" con ${seccionesCreadas.length} secciones para tu catálogo.`,
        })
      }
    } catch (err) {
      toastError('No se pudieron crear las secciones sugeridas', { description: err.message })
    }
  }
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

const previewOpen = ref(false)

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

// Bienvenida obligatoria mientras el negocio no exista todavía (cuenta nueva por Google,
// o cualquier cuenta sin completar): el router (ver router/index.js) ya bloquea la
// navegación a cualquier otro módulo en ese caso, y este modal —que no se puede cerrar
// sin guardar— es lo único que ve al entrar acá.
const showWelcomeModal = ref(false)
const welcomeName = ref('')
const welcomeWhatsapp = ref('')
const welcomeRubro = ref(null)

watch(
  () => businessState.loading,
  (loading) => {
    if (!loading && !businessState.exists) {
      showWelcomeModal.value = true
    }
  },
  { immediate: true },
)

// Ignora cualquier intento de cerrarlo (X, click afuera) mientras el negocio no exista.
function onWelcomeModalUpdate(value) {
  if (businessState.exists) {
    showWelcomeModal.value = value
  }
}

async function saveWelcome() {
  if (!welcomeName.value.trim() || !welcomeWhatsapp.value.trim()) return

  business.name = welcomeName.value.trim()
  business.whatsapp = welcomeWhatsapp.value.trim()
  if (!business.slug) business.slug = slugify(business.name)
  // Guarda el rubro como dato para recomendarle esa plantilla más adelante — a
  // diferencia de "appearance.template" (la plantilla real, bloqueada por plan), esto
  // nunca lo rechaza el backend sin importar el plan actual.
  business.rubroPreferido = welcomeRubro.value

  // Se usa el resultado real de save() en vez de mirar "errors" (que solo se llena en
  // errores 400) para saber si de verdad guardó.
  const guardadoOk = await save()
  if (guardadoOk) {
    showWelcomeModal.value = false
  }
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

    <div v-else class="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div class="xl:min-w-0 xl:flex-1">
        <BaseCard v-if="section === 'profile'">
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
            <BaseInput v-model="business.schedule" label="Horario de atención (opcional)" placeholder="Lun-Sáb 9am-8pm">
              <template #icon><Clock class="size-4" /></template>
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

        <BaseCard v-else-if="section === 'template'">
          <template #header>
            <div>
              <h2 class="text-base font-semibold text-slate-900">Elige el estilo de tu catálogo</h2>
              <p class="text-sm text-slate-400">
                Define el diseño y la distribución de tu página pública según tu rubro. Podrás seguir
                personalizando colores, tipografía y más en Apariencia sin perder tus productos.
              </p>
            </div>
          </template>

          <TemplatePicker
            :selected="business.appearance.template"
            :locked="business.plan === 'gratis'"
            :recommended="business.rubroPreferido"
            @pick="applyTemplate"
            @locked="
              toastError('Tu plan actual no incluye plantillas', {
                description: 'Mejora al plan Vendy Go para elegir una plantilla de catálogo.',
              })
            "
          />

          <p class="mt-6 text-xs text-slate-400">
            El estilo elegido arriba arma tus pestañas y secciones automáticamente. Para renombrar tus
            pestañas, ve a Mi catálogo → Editar catálogo.
          </p>

          <div class="mt-6 flex justify-end">
            <BaseButton :loading="saving" @click="save">Guardar cambios</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-else-if="section === 'contact'">
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

        <BaseCard v-else-if="section === 'payment'">
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

        <BaseCard v-else-if="section === 'links'">
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

        <BaseCard v-else-if="section === 'appearance'">
          <template #header>
            <div>
              <h2 class="text-base font-semibold text-slate-900">Apariencia</h2>
              <p class="text-sm text-slate-400">Personaliza cómo se ve tu página</p>
            </div>
            <button class="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600" @click="reset">
              <RotateCcw class="size-3.5" />
              Restablecer
            </button>
          </template>

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

                <button
                  type="button"
                  class="flex flex-col items-center gap-1.5"
                  @click="business.appearance.accentColor = 'custom'"
                >
                  <span
                    class="relative flex size-11 items-center justify-center rounded-full"
                    :style="{ backgroundColor: business.appearance.accentColorHex }"
                  >
                    <Check v-if="business.appearance.accentColor === 'custom'" class="size-5 text-white drop-shadow" />
                    <Pipette v-else class="size-4 text-white drop-shadow" />
                  </span>
                  <span class="text-xs text-slate-500">Personalizado</span>
                </button>
              </div>

              <div v-if="business.appearance.accentColor === 'custom'" class="mt-3 flex items-center gap-3">
                <input
                  v-model="business.appearance.accentColorHex"
                  type="color"
                  class="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 p-1"
                />
                <p class="text-xs text-slate-500">Elige cualquier color para tu página</p>
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

                <button
                  type="button"
                  class="flex flex-col items-center gap-1.5"
                  @click="business.appearance.background = 'imagen'"
                >
                  <span
                    class="relative flex size-11 items-center justify-center overflow-hidden rounded-full border-2"
                    :class="business.appearance.background === 'imagen' ? 'border-brand-500' : 'border-slate-200'"
                  >
                    <img
                      v-if="business.appearance.backgroundImageUrl"
                      :src="business.appearance.backgroundImageUrl"
                      class="h-full w-full object-cover"
                      alt=""
                    />
                    <ImageOff v-else class="size-4 text-slate-400" />
                    <Check
                      v-if="business.appearance.background === 'imagen'"
                      class="absolute size-4 text-white drop-shadow"
                    />
                  </span>
                  <span class="text-xs text-slate-500">Foto</span>
                </button>
              </div>

              <div v-if="business.appearance.background === 'imagen'" class="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <label
                  class="relative flex h-14 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-100"
                >
                  <img
                    v-if="business.appearance.backgroundImageUrl"
                    :src="business.appearance.backgroundImageUrl"
                    class="h-full w-full object-cover"
                    alt=""
                  />
                  <ImageOff v-else class="size-5 text-slate-300" />
                  <span
                    v-if="uploadingBackground"
                    class="absolute inset-0 flex items-center justify-center bg-slate-900/50"
                  >
                    <Loader2 class="size-5 animate-spin text-white" />
                  </span>
                  <input type="file" accept="image/*" class="hidden" :disabled="uploadingBackground" @change="handleBackgroundUpload" />
                </label>
                <div class="flex flex-col gap-1">
                  <p class="text-xs text-slate-500">
                    Se muestra con opacidad baja detrás de tu página, para no competir con tus productos.
                  </p>
                  <button
                    v-if="business.appearance.backgroundImageUrl"
                    type="button"
                    class="flex w-fit items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                    @click="business.appearance.backgroundImageUrl = ''"
                  >
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

          </div>

            <div class="mt-6 flex justify-end">
              <BaseButton :loading="saving" @click="save">Guardar cambios</BaseButton>
            </div>
        </BaseCard>

        <BaseCard v-else-if="section === 'account'">
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

      <!-- Vista previa en vivo: panel fijo junto a los controles, solo con espacio de sobra (xl+) -->
      <div class="hidden xl:sticky xl:top-20 xl:block xl:w-72 xl:shrink-0">
        <p class="mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
          <Eye class="size-3.5" />
          Vista previa en vivo
        </p>
        <AppearancePreviewCard :business="business" />
      </div>
    </div>

    <!-- En móvil/tablet no hay espacio para mostrar controles y vista previa a la vez, así que se
         abre bajo demanda en un modal, siempre accesible mientras se edita el negocio. -->
    <button
      v-if="!businessState.loading"
      type="button"
      class="fixed bottom-5 right-4 z-30 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform active:scale-95 xl:hidden"
      @click="previewOpen = true"
    >
      <Eye class="size-4" />
      Vista previa
    </button>

    <BaseModal v-model="previewOpen" title="Vista previa">
      <AppearancePreviewCard :business="business" />
    </BaseModal>

    <BaseModal
      :model-value="showWelcomeModal"
      title="¡Bienvenido a Vendy!"
      description="Completa estos datos para empezar a usar Vendy — el resto (logo, descripción, colores) lo puedes personalizar después."
      @update:model-value="onWelcomeModalUpdate"
    >
      <div class="flex flex-col gap-4">
        <BaseInput v-model="welcomeName" label="Nombre del negocio" placeholder="Casa Aurora">
          <template #icon><Store class="size-4" /></template>
        </BaseInput>

        <BaseInput v-model="welcomeWhatsapp" label="Número de WhatsApp" placeholder="51987654321">
          <template #icon><MessageCircle class="size-4" /></template>
        </BaseInput>

        <div>
          <p class="mb-2 text-sm font-medium text-slate-700">
            Rubro de tu negocio <span class="font-normal text-slate-400">(opcional)</span>
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="t in templateOptions"
              :key="t.key"
              type="button"
              class="flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-medium transition-colors"
              :class="
                welcomeRubro === t.key
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              "
              @click="welcomeRubro = welcomeRubro === t.key ? null : t.key"
            >
              <span class="text-xl">{{ t.emoji }}</span>
              {{ t.label }}
            </button>
          </div>
          <p class="mt-2 text-xs text-slate-400">
            Tu catálogo arranca en el estilo general — con esto solo te vamos a recomendar la
            plantilla que más te conviene cuando mejores de plan.
          </p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <BaseButton
          :loading="saving"
          :disabled="!welcomeName.trim() || !welcomeWhatsapp.trim()"
          @click="saveWelcome"
        >
          Guardar y continuar
        </BaseButton>
      </div>
    </BaseModal>
  </DashboardLayout>
</template>
