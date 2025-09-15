<template>
  <v-footer app name="footer" class="text-center d-flex flex-column pa-2">
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

    <v-divider class="my-2" style="width: 80%; max-width: 500px;"></v-divider>

    <div>
      © {{ new Date().getFullYear() }} — <strong>[Nombre de tu Aplicación]</strong> - Todos los derechos reservados.
    </div>
  </v-footer>
</template>

<style scoped>
/* Nos aseguramos que el footer no sea muy alto */
.v-footer {
  flex-grow: 0;
  flex-shrink: 1;
}
</style>