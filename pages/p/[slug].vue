<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4 pa-md-6 mt-5">
          <v-card-text v-if="processedContent" class="content-area" v-html="processedContent"></v-card-text>
          
          <v-card-text v-else>
            <div class="skeleton-placeholder" style="height: 40px; margin-bottom: 24px;"></div>
            <div class="skeleton-placeholder" style="height: 20px; margin-bottom: 16px;"></div>
            <div class="skeleton-placeholder" style="height: 80px;"></div>
          </v-card-text>

          <v-card-actions>
            <v-btn to="/login" color="primary" variant="text">Volver</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { usePlatformSettings } from '~/composables/usePlatformSettings';

definePageMeta({
  layout: 'login',
  auth: false,
});

const settings = usePlatformSettings();
const route = useRoute();
const slug = route.params.slug;

// Nueva propiedad computada que procesa el contenido
const processedContent = computed(() => {
  if (!settings.value) {
    return null; // Aún no han cargado los settings
  }
  
  const contentKey = `page_${slug}_content`;
  let rawContent = settings.value[contentKey];

  if (!rawContent) {
    return '<h1>Página no encontrada</h1><p>El contenido para esta página no ha sido configurado.</p>';
  }

  // Reemplazamos los placeholders con los datos reales de la plataforma
  // El 'g' al final de la expresión regular asegura que se reemplacen todas las ocurrencias.
  rawContent = rawContent.replace(/\[platform_name\]/g, settings.value.platform_name || '[Nombre no configurado]');
  rawContent = rawContent.replace(/\[contact_phone\]/g, settings.value.contact_phone || '[Teléfono no configurado]');
  // Aquí puedes añadir más reemplazos para otros campos como el email, etc.
  
  return rawContent;
});
</script>

<style scoped>
/* Usamos :deep() para aplicar estilos al contenido inyectado con v-html */
.content-area :deep(h1) {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  color: #333;
}
.content-area :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.7;
  font-size: 1rem;
}
.content-area :deep(strong) {
  font-weight: bold;
}

/* Estilos del esqueleto/placeholder */
.skeleton-placeholder {
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.12);
  animation: shimmer 1.5s infinite linear;
  background-image: linear-gradient(90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.4) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

