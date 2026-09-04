<script setup>
import { computed } from 'vue'
import { accentClasses } from '@/utils/theme'

const props = defineProps({
  accentColor: { type: String, default: 'brand' },
})

const blob = computed(() => accentClasses(props.accentColor).blob)
</script>

<template>
  <div class="pointer-events-none fixed inset-0 -z-10 hidden lg:block" aria-hidden="true">
    <div class="vendy-blob-a absolute -left-28 top-[18%] size-[26rem] rounded-full opacity-[0.16] blur-3xl" :class="blob" />
    <div class="vendy-blob-b absolute -right-36 top-[55%] size-[30rem] rounded-full opacity-[0.14] blur-3xl" :class="blob" />
    <div class="vendy-blob-c absolute -left-20 bottom-[4%] size-72 rounded-full opacity-[0.12] blur-3xl" :class="blob" />
  </div>
</template>

<style scoped>
@keyframes vendy-blob-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -50px) scale(1.08); }
}
@keyframes vendy-blob-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 40px) scale(1.06); }
}
@keyframes vendy-blob-c {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 30px) scale(1.12); }
}

.vendy-blob-a { animation: vendy-blob-a 20s ease-in-out infinite; }
.vendy-blob-b { animation: vendy-blob-b 24s ease-in-out infinite; }
.vendy-blob-c { animation: vendy-blob-c 28s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .vendy-blob-a, .vendy-blob-b, .vendy-blob-c { animation: none; }
}
</style>
