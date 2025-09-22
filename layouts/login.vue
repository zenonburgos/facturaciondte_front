<template>
  <v-app>
    <!-- Aplicamos un color de fondo al contenedor principal para evitar parpadeos blancos -->
    <v-main class="bg-grey-lighten-4">
      <slot />
    </v-main>

    <TheFooter />
  </v-app>
</template>

<script setup>
// Importamos el footer para que el layout pueda usarlo
import TheFooter from '~/components/TheFooter.vue';
</script>
