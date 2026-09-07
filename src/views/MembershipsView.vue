<script setup>
import { computed, onMounted, ref } from 'vue'
import { Check, X, Sparkles, Calendar, Receipt } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useBusiness } from '@/composables/useBusiness'
import { useToast } from '@/composables/useToast'
import { plans, getPlan } from '@/data/plans'
import { createSolicitudMembresia } from '@/api/membresias'
import { listPagos } from '@/api/pagos'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import { formatCurrency, formatDate } from '@/utils/format'

// WhatsApp del equipo de Vendy (no el del negocio) — a donde llegan los pedidos de
// cambio de plan, ya que activar el cambio sigue siendo manual.
const VENDY_WHATSAPP = '+51963507712'

const { business } = useBusiness()
const { error: toastError } = useToast()

// 1. Membresía activa (arriba): de dónde sale "activo desde" — ver Suscripcion en el
// backend, expuesta como planActivoDesde en /api/v1/negocio.
const currentPlan = computed(() => getPlan(business.plan))

// 2. Historial de pagos (en medio): se cargan a mano por el equipo (ver Pago.java), acá
// solo se muestran — vacío hasta que el equipo registre el primero.
const payments = ref([])
const loadingPayments = ref(true)

onMounted(async () => {
  try {
    payments.value = await listPagos()
  } catch (err) {
    toastError('No se pudieron cargar tus pagos', { description: err.message })
  } finally {
    loadingPayments.value = false
  }
})

const paymentColumns = [
  { key: 'fechaPago', label: 'Fecha' },
  { key: 'membresiaNombre', label: 'Plan' },
  { key: 'metodo', label: 'Método' },
  { key: 'monto', label: 'Monto', align: 'right' },
]

// 3. Planes disponibles (abajo): comparación + pedido de cambio de plan. El cambio en sí
// sigue siendo manual (el equipo lo activa) — lo importante para el usuario es llegar a
// WhatsApp ya, así que eso se abre al toque; el registro en la base de datos (para el
// historial del equipo) corre en paralelo, sin bloquear ni mostrar loading por eso. El
// botón se puede volver a presionar las veces que haga falta (ej. si no abrió el WhatsApp
// o quiere volver a escribir), no se deshabilita después del primer clic.
function requestPlan(key) {
  const mensaje = `Hola, quiero solicitar el plan ${getPlan(key).label} para mi negocio${business.name ? ` "${business.name}"` : ''}.`
  window.open(buildWhatsAppLink(VENDY_WHATSAPP, mensaje), '_blank', 'noopener')

  createSolicitudMembresia(key).catch((err) => {
    toastError('No se pudo registrar la solicitud', { description: err.message })
  })
}
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6">
    <PageHeader
      title="Membresías"
      description="El plan de tu negocio define qué módulos y funciones tienes disponibles."
    />

    <!-- Membresía activa -->
    <BaseCard class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Sparkles class="size-6" />
        </span>
        <div>
          <div class="flex items-center gap-2">
            <p class="text-base font-semibold text-slate-900">{{ currentPlan.label }}</p>
            <BaseBadge variant="brand" size="sm">Activo</BaseBadge>
          </div>
          <p class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span class="flex items-center gap-1.5">
              <Calendar class="size-3.5" />
              <template v-if="business.planActivoDesde">
                Activo desde el {{ formatDate(business.planActivoDesde, { year: 'numeric' }) }}
              </template>
              <template v-else>Fecha de activación no disponible</template>
            </span>
            <span v-if="business.planVenceEl" class="flex items-center gap-1.5">
              <Calendar class="size-3.5" />
              Vence el {{ formatDate(business.planVenceEl, { year: 'numeric' }) }}
            </span>
          </p>
        </div>
      </div>
      <p class="text-sm text-slate-400 sm:max-w-xs sm:text-right">{{ currentPlan.tagline }}</p>
    </BaseCard>

    <!-- Historial de pagos -->
    <BaseCard>
      <template #header>
        <div class="flex items-center gap-2">
          <Receipt class="size-4 text-slate-400" />
          <h2 class="text-sm font-semibold text-slate-900">Historial de pagos</h2>
        </div>
      </template>

      <BaseTable :columns="paymentColumns" :rows="payments" :loading="loadingPayments">
        <template #cell-fechaPago="{ row }">{{ formatDate(row.fechaPago, { year: 'numeric' }) }}</template>
        <template #cell-membresiaNombre="{ row }">{{ row.membresiaNombre ?? '—' }}</template>
        <template #cell-metodo="{ row }">{{ row.metodo ?? '—' }}</template>
        <template #cell-monto="{ row }">{{ formatCurrency(row.monto) }}</template>
        <template #empty>
          <EmptyState
            :icon="Receipt"
            title="Todavía no hay pagos registrados"
            description="Cuando se registre un pago de tu suscripción, va a aparecer acá."
          />
        </template>
      </BaseTable>
    </BaseCard>

    <!-- Planes disponibles -->
    <div>
      <h2 class="mb-4 text-sm font-semibold text-slate-900">Planes disponibles</h2>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <BaseCard
          v-for="p in plans"
          :key="p.key"
          class="relative flex flex-col"
          :class="business.plan === p.key ? 'ring-2 ring-brand-500' : ''"
        >
          <span
            v-if="business.plan === p.key"
            class="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm"
          >
            Tu plan actual
          </span>

          <div class="flex flex-1 flex-col gap-5">
            <div>
              <div class="flex items-center gap-2">
                <Sparkles v-if="p.key === 'premium'" class="size-5 text-brand-600" />
                <h3 class="text-lg font-semibold text-slate-900">{{ p.label }}</h3>
              </div>
              <p class="mt-1 text-sm text-slate-500">{{ p.tagline }}</p>
            </div>

            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-bold tracking-tight text-slate-900">{{ p.price }}</span>
              <span class="text-sm text-slate-400">{{ p.priceNote }}</span>
            </div>

            <div class="flex flex-1 flex-col gap-2.5">
              <div v-for="f in p.features" :key="f" class="flex items-start gap-2.5 text-sm text-slate-700">
                <Check class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>{{ f }}</span>
              </div>
              <div v-for="f in p.notIncluded" :key="f" class="flex items-start gap-2.5 text-sm text-slate-400">
                <X class="mt-0.5 size-4 shrink-0 text-slate-300" />
                <span>{{ f }}</span>
              </div>
            </div>

            <BaseButton v-if="business.plan === p.key" variant="outline" disabled>
              Ya tienes este plan
            </BaseButton>
            <BaseButton v-else @click="requestPlan(p.key)">
              Solicitar suscripción
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>
    </div>
  </DashboardLayout>
</template>
