<script setup>
defineProps({
  live: Boolean,
})
</script>

<template>
  <div class="">
    <div class="w-full h-full bg-[#1D1F21] text-[#C5C8C6] font-mono flex flex-col rounded-lg shadow">
      <header class="flex items-center justify-between p-4 bg-[#373b41] border-b border-[#282a2e] rounded-t-lg">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-[#CC6666]" />
          <div class="w-3 h-3 rounded-full bg-[#E6E074]" />
          <div class="w-3 h-3 rounded-full bg-[#68B5BD]" />
        </div>

        <div v-if="live" class="text-sm">
          Live Terminal Output
        </div>
        <div v-else class="text-sm">
          root@localhost:~
        </div>
      </header>

      <div class="h-54 w-full overflow-auto p-4">
        <div class="text-sm leading-7">
          <p class="text-[#68B5BD]">
            root@localhost:~$ ls
          </p>
          <p>Desktop Documents Downloads Music Pictures Public Templates Videos</p>
          <p class="text-[#68B5BD] pt-2">
            root@localhost:~$ pwd
          </p>
          <p>/home/root</p>
          <p class="text-[#68B5BD] pt-2">
            root@localhost:~$ whoami
          </p>
          <p>root</p>
        </div>
      </div>

      <div v-if="!live" class="flex items-center gap-2 p-4 border-t border-[#282a2e]">
        <span class="text-[#68B5BD]">root@localhost:~$</span>
        <input
          class="bg-[#1D1F21] text-[#C5C8C6] w-full focus:outline-none"
          placeholder="Type your command..."
          type="text"
        >
        <button class="bg-[#68B5BD] text-[#1D1F21] px-4 py-2 rounded">
          Run
        </button>
      </div>
    </div>
  </div>
</template>
