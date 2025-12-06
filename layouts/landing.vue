<template>
  <v-app>
    <v-app-bar flat color="white" class="border-b">
      <v-container class="d-flex align-center py-0">
        <img :src="logoUrl" height="40" alt="Logo" /> 
        
        <v-spacer></v-spacer>

        <v-btn to="/login" variant="flat" color="primary">
          Ingresar
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
    
    <v-footer class="bg-grey-lighten-4 text-center d-flex flex-column py-4">
      <div class="text-caption text-medium-emphasis">
        &copy; {{ new Date().getFullYear() }} Smart DTE. Todos los derechos reservados.
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { computed } from 'vue';
import { usePlatformSettings } from '~/composables/usePlatformSettings';
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
const settings = usePlatformSettings();

// Lógica para recuperar el logo dinámicamente según el dominio
const logoUrl = computed(() => {
  if (settings.value?.logo_path) {
    // Construimos la URL completa apuntando a tu backend Laravel
    return `${config.public.apiBaseUrl}/storage/${settings.value.logo_path}`;
  }

  // Fallback por si la API falla o no hay logo configurado
  return '/images/logo.png'; 
});
</script>