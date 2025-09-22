<template>
  <!-- REDISEÑO RADICAL: Eliminamos la prop 'app' y tomamos control total con CSS 'position: fixed' -->
  <v-footer name="footer" class="pa-0 custom-app-footer">
    
    <!-- La estructura interna se mantiene simple y predecible -->
    <div class="footer-container text-center py-2">
      
      <!-- ================================================================ -->
      <!-- SECCIÓN DE ENLACES DINÁMICOS -->
      <!-- ================================================================ -->
      <div class="d-flex flex-wrap justify-center ga-2">
        <!-- Si los settings existen y tienen footer_links, los mostramos -->
        <template v-if="settings && settings.footer_links && settings.footer_links.length">
          <NuxtLink 
            v-for="(link, index) in settings.footer_links" 
            :key="index" 
            :to="link.url" 
            custom 
            v-slot="{ navigate }"
          >
            <v-btn variant="text" class="text-capitalize" @click="navigate">{{ link.text }}</v-btn>
          </NuxtLink>
        </template>
      </div>

      <v-divider 
        class="my-2 mx-auto" 
        style="width: 80%; max-width: 500px;"
      ></v-divider>

      <div class="d-flex align-center justify-center text-body-2" style="min-height: 24px;">
        <div v-if="settings">
          © {{ new Date().getFullYear() }} — <strong>{{ settings.platform_name }}</strong> - Todos los derechos reservados.
        </div>
        <div v-else class="skeleton-placeholder"></div>
      </div>

    </div>
  </v-footer>
</template>

<script setup>
import { usePlatformSettings } from '~/composables/usePlatformSettings';
const settings = usePlatformSettings();
</script>

<style scoped>
/* ================================================================ */
/* CSS PARA EL REDISEÑO RADICAL */
/* Tomamos control total de la posición del footer para evitar
   el "salto" causado por el sistema de layout de Vuetify ('app'). */
.custom-app-footer {
  position: fixed !important; /* Usamos !important para sobreescribir cualquier estilo en línea de Vuetify */
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000; /* Asegura que esté por encima de otro contenido */
  
  /* Centramos el contenido interno con Flexbox */
  display: flex;
  justify-content: center;
  align-items: center;
  
  /* Agregamos un color de fondo para que no sea transparente */
  background-color: rgb(var(--v-theme-surface));
}
/* ================================================================ */

.footer-container {
  width: 100%;
}

/* Nuestro placeholder personalizado para el salto vertical */
.skeleton-placeholder {
  width: 300px;
  max-width: 80%;
  height: 20px; /* Altura similar a una línea de texto */
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.12); /* Color gris estándar de Vuetify para placeholders */
  animation: shimmer 1.5s infinite linear;
  background-image: linear-gradient(90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.4) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
}

/* Animación de brillo */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ================================================================ */
/* SOLUCIÓN PARA MÓVILES */
/* En pantallas pequeñas, el footer deja de ser fijo para no superponerse. */
@media (max-width: 600px) {
  .custom-app-footer {
    position: static !important;
  }
}
/* ================================================================ */
</style>

