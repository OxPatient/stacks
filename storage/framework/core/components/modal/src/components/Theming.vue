<script lang="ts" setup>
import { computed, ref } from 'vue'
// import { notification } from '../'
import { useCopyCode } from '../composables/useCopyCode'
import CheckIcon from './icons/CheckIcon.vue'
import CopyIcon from './icons/CopyIcon.vue'

const emit = defineEmits(['setTheme'])

const currentAction = ref('light')
const showCheckIcon = ref(false)

const renderedCode = computed(() => {
  return currentAction.value === 'light' ? `<Notification theme="light" />` : `<Notification theme="dark" />`
})

function handleClick(action: string) {
  currentAction.value = action
  emit('setTheme', action)
  // notification('Event has been created')
}

async function handleCopyCode() {
  await useCopyCode({ code: renderedCode.value, checkIconRef: showCheckIcon })
  // notification('Copied to your clipboard!')
}
</script>

<template>
  <div class="types">
    <h1 class="text-lg font-semibold my-2">
      Theme
    </h1>
    <p class="text-base my-3">
      You can smoothly switch between light mode and dark mode.
    </p>
    <div class="mb-4 flex gap-3 overflow-auto">
      <button
        class="btn-default"
        :class="{
          'bg-neutral-200/50 border-neutral-400/50': currentAction === 'light',
        }"
        @click="(e) => handleClick('light')"
      >
        Light
      </button>
      <button
        class="btn-default"
        :class="{
          'bg-neutral-200/50 border-neutral-400/50': currentAction === 'dark',
        }"
        @click="(e) => handleClick('dark')"
      >
        Dark
      </button>
    </div>
    <div class="code-block relative group">
      <Highlight
        language="javascript"
        class-name="rounded-md text-xs"
        :autodetect="false"
        :code="renderedCode"
      />
      <button
        aria-label="Copy code"
        title="Copy code"
        class="absolute right-2 top-2 btn-border p-1 hidden group-hover:block"
        @click="handleCopyCode"
      >
        <CheckIcon v-if="showCheckIcon" />
        <CopyIcon v-else />
      </button>
    </div>
  </div>
</template>
