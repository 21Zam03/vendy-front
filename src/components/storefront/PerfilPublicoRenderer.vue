<script setup>
import { computed, ref } from 'vue'
import { MessageCircle, LayoutGrid, MapPin, ChevronRight, ExternalLink, Sparkles, Wallet, Forward, Check } from '@lucide/vue'
import FeaturedProductsCarousel from './FeaturedProductsCarousel.vue'
import AmbientBlobField from './AmbientBlobField.vue'
import SocialDock from './SocialDock.vue'
import InstagramIcon from '@/components/icons/InstagramIcon.vue'
import TikTokIcon from '@/components/icons/TikTokIcon.vue'
import FacebookIcon from '@/components/icons/FacebookIcon.vue'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import { accentClasses, coverClasses, radiusValue } from '@/utils/theme'
import { paymentMethodOptions } from '@/data/mock'

// Motor de renderizado del PERFIL público: recibe los datos ya cargados y dibuja
// exactamente lo que ve un visitante real — compartido entre la página pública
// (StorefrontProfileView) y el editor en vivo de "Estilo de página"
// (BusinessAppearanceView), igual que CatalogTemplateRenderer para el catálogo.
// No hace fetch ni sabe de dónde vienen los datos.
//
// "links" viaja aparte de "business" (no como business.links) porque en el editor admin
// esa lista viene de un recurso propio (/api/v1/enlaces, con su propio alta/baja), no del
// objeto negocio — así este componente no necesita saber de dónde salió cada uno.
const props = defineProps({
  business: { type: Object, required: true },
  featured: { type: Array, default: () => [] },
  collections: { type: Array, default: () => [] },
  links: { type: Array, default: () => [] },
  slug: { type: String, required: true },
  editable: { type: Boolean, default: false },
  shared: { type: Boolean, default: false },
})

const emit = defineEmits(['share'])

const accent = computed(() => accentClasses(props.business.appearance.accentColor))
const cover = computed(() => coverClasses(props.business.appearance.accentColor, props.business.appearance.cover))
const radius = computed(() => radiusValue(props.business.appearance.radius))

const whatsappLink = computed(() =>
  buildWhatsAppLink(props.business.whatsapp, `Hola ${props.business.name}! vi tu página en Vendy y quiero más información.`),
)

// El negocio pone la URL completa de cada red (ver "Info del negocio" en el editor) — acá
// nunca se arma un link por defecto con el dominio de la red social, se usa tal cual la
// haya escrito.
const socialLinks = computed(() => {
  const { social } = props.business
  return [
    social.instagram && { label: 'Instagram', icon: InstagramIcon, href: social.instagram },
    social.tiktok && { label: 'TikTok', icon: TikTokIcon, href: social.tiktok },
    social.facebook && { label: 'Facebook', icon: FacebookIcon, href: social.facebook },
  ].filter(Boolean)
})

const paymentMethods = computed(() =>
  (props.business.paymentMethods ?? [])
    .map((m) => {
      const option = paymentMethodOptions.find((o) => o.key === m.key)
      return option && { label: option.label, value: m.value }
    })
    .filter(Boolean),
)

const hasPayments = computed(() => paymentMethods.value.length > 0)
const activeSection = ref('info')
const showInfoContent = computed(() => !hasPayments.value || activeSection.value === 'info')
</script>

<template>
  <div class="relative z-0">
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

        <!-- Compartir: solo tiene sentido para un visitante real, no mientras el negocio
             edita su propia página en vivo. -->
        <div v-if="!editable" class="absolute right-4 top-4 flex items-center gap-2">
          <button
            type="button"
            class="group flex size-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 active:scale-95"
            title="Compartir"
            @click="emit('share')"
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

        <SocialDock v-if="socialLinks.length" :items="socialLinks" class="mt-3" />
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
      <FeaturedProductsCarousel :products="featured" :slug="slug" />
    </div>

    <div v-if="showInfoContent" class="mx-auto mt-8 flex max-w-sm flex-col items-center px-4 pb-10 text-center sm:px-6">
      <div class="flex w-full flex-col gap-3">
        <component
          :is="editable ? 'div' : 'a'"
          :href="editable ? undefined : whatsappLink"
          :target="editable ? undefined : '_blank'"
          :rel="editable ? undefined : 'noopener'"
          class="flex h-14 w-full items-center justify-center gap-2 bg-whatsapp-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors"
          :class="editable ? '' : 'hover:bg-whatsapp-600'"
          :style="{ borderRadius: radius }"
        >
          <MessageCircle class="size-5" />
          Chatear por WhatsApp
        </component>

        <component
          :is="editable ? 'div' : 'router-link'"
          :to="editable ? undefined : { name: 'storefront-catalog', params: { slug } }"
          class="flex h-14 w-full items-center justify-between px-5 text-sm font-semibold text-white shadow-sm transition-colors"
          :class="accent.solid"
          :style="{ borderRadius: radius }"
        >
          <span class="flex items-center gap-2">
            <LayoutGrid class="size-5" />
            Ver catálogo
          </span>
          <ChevronRight class="size-4 opacity-80" />
        </component>

        <component
          :is="editable ? 'div' : 'router-link'"
          v-for="c in collections"
          :key="c.slug"
          :to="editable ? undefined : { name: 'storefront-collection', params: { slug, collectionSlug: c.slug } }"
          class="flex h-12 w-full items-center justify-between border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors"
          :class="editable ? '' : 'hover:bg-slate-50'"
          :style="{ borderRadius: radius }"
        >
          <span class="flex items-center gap-2 truncate">
            <Sparkles class="size-4 shrink-0 text-slate-400" />
            {{ c.nombre }}
          </span>
          <ChevronRight class="size-4 shrink-0 opacity-60" />
        </component>

        <component
          :is="editable ? 'div' : 'a'"
          v-for="l in links"
          :key="l.id"
          :href="editable ? undefined : l.url"
          :target="editable ? undefined : '_blank'"
          :rel="editable ? undefined : 'noopener'"
          class="flex h-12 w-full items-center justify-between border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors"
          :class="editable ? '' : 'hover:bg-slate-50'"
          :style="{ borderRadius: radius }"
        >
          <span class="truncate">{{ l.label }}</span>
          <ExternalLink class="size-4 shrink-0 opacity-60" />
        </component>
      </div>
    </div>
  </div>
</template>
