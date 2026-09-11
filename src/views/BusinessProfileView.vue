<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MessageCircle, ExternalLink, Store } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import TemplatePicker from '@/components/negocio/TemplatePicker.vue'
import { getTemplate, templateOptions } from '@/data/templates'
import { useBusiness } from '@/composables/useBusiness'
import { useAuth } from '@/composables/useAuth'
import { slugify } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/api/http'
import { createSeccion } from '@/api/secciones'
import { listPestanas, createPestana } from '@/api/pestanas'

const { state: authState } = useAuth()
const route = useRoute()

const { success, error: toastError } = useToast()
const { state: businessState, business, ensureInitialized, save: saveNegocio } = useBusiness()
ensureInitialized()

// La sección activa la controla el submenú "Mi negocio" del sidebar (query param ?section=),
// no un tab interno — así la navegación entre secciones vive en un solo lugar de la app.
const section = computed(() => route.query.section || 'template')
const saving = ref(false)
const errors = ref({})

// Aplicar una plantilla solo precarga catalogLayout (necesario para que su estructura de
// catálogo se muestre) — nunca accentColor, font ni radius: color/tipografía/bordes son
// personalización del negocio y se editan aparte, en Apariencia, sin que la plantilla los
// toque. El resto de la identidad del negocio (nombre, logo, productos, etc.) tampoco.
async function applyTemplate(key) {
  business.appearance.template = key
  const template = getTemplate(key)
  if (!template) return

  Object.assign(business.appearance, template.defaultAppearance)

  // Estructura fija por ahora: cada negocio tiene como máximo 2 pestañas, "Inicio" y
  // "General" (esta última ya existe desde el alta, ver NegocioService.guardar) — el
  // backend rechaza cualquier otro nombre o una segunda de cada tipo (ver
  // PestanaService.crear). Elegir una plantilla por primera vez solo crea "Inicio" con
  // sus secciones sugeridas; volver a elegir una plantilla (o cambiar a otra) nunca la
  // vuelve a crear ni le toca sus secciones ya armadas.
  const tabPresets = template.tabPresets ?? []

  if (tabPresets.length) {
    try {
      const existentes = await listPestanas()
      const yaTieneInicio = existentes.some((p) => p.esHome)
      if (!yaTieneInicio) {
        const tabsCreadas = []
        const seccionesCreadas = []
        for (const { nombre: tabNombre, sectionPresets } of tabPresets) {
          const tab = await createPestana({ nombre: tabNombre })
          tabsCreadas.push(tab)
          for (const nombre of sectionPresets) {
            seccionesCreadas.push(await createSeccion({ nombre, pestanaId: tab.id }))
          }
        }
        success('Pestaña creada', {
          description: `Armamos la pestaña "${tabsCreadas[0].nombre}" con ${seccionesCreadas.length} secciones para tu catálogo.`,
        })
      }
    } catch (err) {
      toastError('No se pudieron crear las secciones sugeridas', { description: err.message })
    }
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

    <div v-else class="flex flex-col gap-6">
      <BaseCard v-if="section === 'template'">
        <template #header>
          <div>
            <h2 class="text-base font-semibold text-slate-900">Elige el estilo de tu catálogo</h2>
            <p class="text-sm text-slate-400">
              Define el diseño y la distribución de tu catálogo según tu rubro. Podrás seguir
              personalizando colores, tipografía y más en Estilo de página sin perder tus productos.
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
