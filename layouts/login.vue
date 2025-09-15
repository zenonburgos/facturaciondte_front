<template>
  <v-app>
    <v-main>
      <slot />
    </v-main>

    <TheFooter />
  </v-app>
</template>

<script setup>
// Importamos el footer para que el layout pueda usarlo
import TheFooter from '~/components/TheFooter.vue';
</script>

<style>
/* Estilos globales para este layout si los necesitas */
</style>