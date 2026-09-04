<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MessageCircle, LayoutGrid, MapPin, Camera, Music2, ThumbsUp, ChevronRight, ExternalLink, Sparkles, Wallet, Forward, Check } from '@lucide/vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FeaturedProductsCarousel from '@/components/storefront/FeaturedProductsCarousel.vue'
import AmbientBlobField from '@/components/storefront/AmbientBlobField.vue'
import { getPerfilPublico, getDestacadosPublico, getColeccionesPublico, buildNegocioPreviewUrl } from '@/api/tienda'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import { accentClasses, coverClasses, radiusValue } from '@/utils/theme'
import { setPageMeta } from '@/utils/head'
import { shareOrCopy } from '@/utils/share'
import { paymentMethodOptions } from '@/data/mock'
import { useToast } from '@/composables/useToast'

const { error: toastError } = useToast()

const route = useRoute()
const business = ref(null)
const featured = ref([])
const collections = ref([])
const loading = ref(true)
const notFound = ref(false)
const shared = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const [perfil, destacados, colecciones] = await Promise.all([
      getPerfilPublico(route.params.slug),
      getDestacadosPublico(route.params.slug).catch(() => []),
      getColeccionesPublico(route.params.slug).catch(() => []),
    ])
    business.value = perfil
    featured.value = destacados
    collections.value = colecciones
    setPageMeta({ title: business.value.name, description: business.value.description })
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.slug, load)

const accent = computed(() => (business.value ? accentClasses(business.value.appearance.accentColor) : null))
const cover = computed(() =>
  business.value ? coverClasses(business.value.appearance.accentColor, business.value.appearance.cover) : '',
)
const radius = computed(() => (business.value ? radiusValue(business.value.appearance.radius) : '16px'))

const whatsappLink = computed(() =>
  business.value
    ? buildWhatsAppLink(business.value.whatsapp, `Hola ${business.value.name}! vi tu página en Vendy y quiero más información.`)
    : '#',
)

const socialLinks = computed(() => {
  if (!business.value) return []
  const { social } = business.value
  return [
    social.instagram && { label: `@${social.instagram}`, icon: Camera, href: `https://instagram.com/${social.instagram}` },
    social.tiktok && { label: `@${social.tiktok}`, icon: Music2, href: `https://tiktok.com/@${social.tiktok}` },
    social.facebook && { label: social.facebook, icon: ThumbsUp, href: `https://facebook.com/${social.facebook}` },
  ].filter(Boolean)
})

const paymentMethods = computed(() =>
  (business.value?.paymentMethods ?? [])
    .map((m) => {
      const option = paymentMethodOptions.find((o) => o.key === m.key)
      return option && { label: option.label, value: m.value }
    })
    .filter(Boolean),
)

const hasPayments = computed(() => paymentMethods.value.length > 0)
const activeSection = ref('info')
const showInfoContent = computed(() => !hasPayments.value || activeSection.value === 'info')

// Se comparte el link de preview del backend (no window.location.href) para que
// WhatsApp/Facebook muestren un preview real con el nombre y la descripción del negocio.
async function shareProfile() {
  const url = buildNegocioPreviewUrl(route.params.slug)
  const result = await shareOrCopy({ title: business.value.name, text: business.value.description, url })

  if (result === 'copied') {
    shared.value = true
    setTimeout(() => (shared.value = false), 2000)
  } else if (result === 'failed') {
    toastError('No se pudo copiar el enlace', { description: url })
  }
}
</script>

<template>
  <StorefrontLayout :appearance="business?.appearance">
    <div v-if="loading" class="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
      Cargando…
    </div>

    <EmptyState
      v-else-if="notFound"
      :icon="LayoutGrid"
      title="No encontramos este negocio"
      description="El enlace puede estar mal escrito o el negocio ya no está disponible."
      class="min-h-[60vh]"
    />

    <div v-else class="relative z-0">
      <AmbientBlobField :accent-color="business.appearance.accentColor" />

      <div class="sm:mx-auto sm:max-w-2xl sm:px-6">
        <div class="relative">
          <img
            v-if="business.appearance.cover === 'imagen' && business.appearance.coverImageUrl"
            :src="business.appearance.coverImageUrl"
            class="h-48 w-full object-cover sm:h-60 sm:rounded-b-2xl"
            alt=""
          />
          <div v-else class="h-48 w-full sm:h-60 sm:rounded-b-2xl" :class="cover" />

          <div class="absolute right-4 top-4 flex items-center gap-2">
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 translate-x-1"
              leave-active-class="transition duration-150 ease-in"
              leave-to-class="opacity-0"
            >
              <span
                v-if="shared"
                class="rounded-full border border-white/30 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md"
              >
                ¡Enlace copiado!
              </span>
            </Transition>

            <button
              type="button"
              class="group flex size-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 active:scale-95"
              title="Compartir"
              @click="shareProfile"
            >
              <Check v-if="shared" class="size-5" />
              <Forward v-else class="size-[18px] transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>

      <div class="relative mx-auto -mt-14 flex max-w-sm flex-col items-center px-4 text-center sm:px-6">
        <span
          class="flex size-24 items-center justify-center overflow-hidden border-4 border-white bg-slate-900 text-2xl font-semibold text-white shadow-lg"
          :style="{ borderRadius: radius }"
        >
          <img v-if="business.logoUrl" :src="business.logoUrl" class="h-full w-full object-cover" alt="" />
          <template v-else>{{ business.logoInitials }}</template>
        </span>

        <h1 class="mt-4 text-xl font-semibold tracking-tight text-slate-900">{{ business.name }}</h1>
      </div>

      <div class="mx-auto mt-4 w-full max-w-sm px-4 sm:px-6" :class="{ 'pb-10': !showInfoContent }">
        <div v-if="hasPayments" class="mb-4 flex justify-center gap-1.5">
          <button
            class="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
            :class="activeSection === 'info' ? `${accent.solid} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
            @click="activeSection = 'info'"
          >
            Info
          </button>
          <button
            class="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
            :class="activeSection === 'payment' ? `${accent.solid} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
            @click="activeSection = 'payment'"
          >
            Métodos de pago
          </button>
        </div>

        <div v-if="showInfoContent" class="flex flex-col items-center text-center">
          <p class="text-sm leading-relaxed text-slate-500">{{ business.description }}</p>

          <p v-if="business.location" class="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <MapPin class="size-3.5" />
            {{ business.location }}
          </p>

          <div v-if="socialLinks.length" class="mt-3 flex items-center gap-2">
            <a
              v-for="s in socialLinks"
              :key="s.label"
              :href="s.href"
              target="_blank"
              rel="noopener"
              class="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
              :title="s.label"
            >
              <component :is="s.icon" class="size-4" />
            </a>
          </div>
        </div>

        <div v-else class="flex w-full flex-col gap-2.5">
          <div
            v-for="m in paymentMethods"
            :key="m.label"
            class="flex min-h-12 w-full items-center gap-2.5 border border-slate-200 px-5 py-2.5 text-left text-sm font-medium text-slate-700"
            :style="{ borderRadius: radius }"
          >
            <Wallet class="size-4 shrink-0 text-slate-400" />
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ m.label }}</span>
              <span v-if="m.value" class="block truncate text-xs font-normal text-slate-400">{{ m.value }}</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="showInfoContent && featured.length" class="mt-8">
        <FeaturedProductsCarousel :products="featured" :slug="route.params.slug" />
      </div>

      <div v-if="showInfoContent" class="mx-auto mt-8 flex max-w-sm flex-col items-center px-4 pb-10 text-center sm:px-6">
        <div class="flex w-full flex-col gap-3">
          <a
            :href="whatsappLink"
            target="_blank"
            rel="noopener"
            class="flex h-14 w-full items-center justify-center gap-2 bg-whatsapp-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-600"
            :style="{ borderRadius: radius }"
          >
            <MessageCircle class="size-5" />
            Chatear por WhatsApp
          </a>

          <router-link
            :to="{ name: 'storefront-catalog', params: { slug: route.params.slug } }"
            class="flex h-14 w-full items-center justify-between px-5 text-sm font-semibold text-white shadow-sm transition-colors"
            :class="accent.solid"
            :style="{ borderRadius: radius }"
          >
            <span class="flex items-center gap-2">
              <LayoutGrid class="size-5" />
              Ver catálogo
            </span>
            <ChevronRight class="size-4 opacity-80" />
          </router-link>

          <router-link
            v-for="c in collections"
            :key="c.slug"
            :to="{ name: 'storefront-collection', params: { slug: route.params.slug, collectionSlug: c.slug } }"
            class="flex h-12 w-full items-center justify-between border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            :style="{ borderRadius: radius }"
          >
            <span class="flex items-center gap-2 truncate">
              <Sparkles class="size-4 shrink-0 text-slate-400" />
              {{ c.nombre }}
            </span>
            <ChevronRight class="size-4 shrink-0 opacity-60" />
          </router-link>

          <a
            v-for="l in business.links"
            :key="l.id"
            :href="l.url"
            target="_blank"
            rel="noopener"
            class="flex h-12 w-full items-center justify-between border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            :style="{ borderRadius: radius }"
          >
            <span class="truncate">{{ l.label }}</span>
            <ExternalLink class="size-4 shrink-0 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  </StorefrontLayout>
</template>
