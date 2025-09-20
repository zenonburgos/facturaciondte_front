<template>
  <v-footer app name="footer" class="pa-0">
    <v-row justify="center" no-gutters class="text-center py-2">
      <v-col cols="12">
        
        <div class="d-flex flex-wrap justify-center ga-2">
          <NuxtLink to="/about" custom v-slot="{ navigate }">
            <v-btn variant="text" class="text-capitalize" @click="navigate">Acerca de</v-btn>
          </NuxtLink>
          <NuxtLink to="/contact" custom v-slot="{ navigate }">
            <v-btn variant="text" class="text-capitalize" @click="navigate">Contacto</v-btn>
          </NuxtLink>
          <NuxtLink to="/privacy" custom v-slot="{ navigate }">
            <v-btn variant="text" class="text-capitalize" @click="navigate">Política de Privacidad</v-btn>
          </NuxtLink>
        </div>

        <v-divider 
          class="my-2 mx-auto" 
          style="width: 80%; max-width: 500px;"
        ></v-divider>

        <div v-if="settings">
          © {{ new Date().getFullYear() }} — <strong>{{ settings.platform_name || 'Mi Plataforma' }}</strong> - Todos los derechos reservados.
        </div>

      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup>
import { usePlatformSettings } from '~/composables/usePlatformSettings';
const settings = usePlatformSettings();
</script>

<style scoped>
/* Nos aseguramos que el footer no sea muy alto */
.v-footer {
  flex-grow: 0;
  flex-shrink: 1;
}
</style>