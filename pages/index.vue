<template>
  <div>
    <h1>Panel Principal</h1>
    <v-alert
      v-if="pendingCount > 0"
      type="warning"
      variant="tonal"
      class="mt-4 mb-6"
      border="start"
      elevation="2"
    >
      <div class="d-flex justify-space-between align-center">
        <div>
          <h3 class="mb-1">Documentos Pendientes</h3>
          <p>Tienes **{{ pendingCount }}** documento(s) en contingencia que aún no han sido enviados a Hacienda.</p>
        </div>
        <v-btn color="warning" to="/historial?estado=CONTINGENCIA_PENDIENTE">
          Ver Documentos
        </v-btn>
        <v-btn color="warning" @click="triggerContingencyProcessing" :loading="isProcessing">
          Procesar Ahora
        </v-btn>
      </div>
    </v-alert>
    <!-- <p>Este es el contenido de nuestro dashboard. ¡El layout está funcionando!</p> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isProcessing = ref(false);
const pendingCount = ref(0);

onMounted(async () => {
  try {
    const { $api } = useNuxtApp();
    const response = await $api('/api/invoices/contingency-summary');
    pendingCount.value = response.pending_count;
  } catch (error) {
    console.error("Error al cargar el resumen de contingencia:", error);
  }
});

async function triggerContingencyProcessing() {
    isProcessing.value = true;
    const { $api } = useNuxtApp();
    const notificationStore = useNotificationStore(); // Asumiendo que ya lo usas

    try {
        const response = await $api('/api/contingency/process-now', {
            method: 'POST'
        });
        notificationStore.showNotification({ message: response.message, color: 'info' });
        // Opcional: podrías refrescar el contador de pendientes
        pendingCount.value = 0; 
    } catch (error) {
        const message = error.data?.message || 'Error al iniciar el proceso de contingencia.';
        notificationStore.showNotification({ message, color: 'error' });
    } finally {
        isProcessing.value = false;
    }
}
</script>