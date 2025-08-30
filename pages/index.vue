  <template>
  <div>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-4">mdi-chart-line</v-icon>
      <div>
        <h1 class="text-h4">Resumen Mensual</h1>
        <h2 class="text-subtitle-1 text-medium-emphasis">Estado de tu facturación y DTEs</h2>
      </div>
    </div>
    <v-divider class="my-8"></v-divider>
    <v-alert
      v-if="contingency.pendingCount > 0"
      type="warning"
      variant="tonal"
      class="mt-4 mb-6"
      border="start"
      elevation="2"
    >
      <div class="d-flex justify-space-between align-center">
        <div>
          <h3 class="mb-1">Documentos Pendientes</h3>
          <p>Tienes <strong>{{ contingency.pendingCount }}</strong> documento(s) en contingencia que aún no han sido enviados a Hacienda.</p>
        </div>
        <v-btn color="warning" to="/historial?estado=CONTINGENCIA_PENDIENTE">
          Ver Documentos
        </v-btn>
        <v-btn color="warning" @click="triggerContingencyProcessing" :loading="contingency.isProcessing">
          Procesar Ahora
        </v-btn>
      </div>
    </v-alert>
    
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-2" elevation="2">
          <div class="d-flex align-center">
            <v-avatar color="blue-lighten-4" size="62" class="mr-4">
              <v-icon color="blue-darken-2">mdi-file-document-multiple-outline</v-icon>
            </v-avatar>
            <div>
              <p class="text-caption">DTEs Emitidos (Mes Actual)</p>
              <p class="text-h4 font-weight-bold">
                <span v-if="!loading">{{ summary.dtes_del_mes }}</span>
                <v-progress-circular v-else indeterminate size="32"></v-progress-circular>
              </p>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-2" elevation="2">
          <div class="d-flex align-center">
            <v-avatar color="green-lighten-4" size="62" class="mr-4">
              <v-icon color="green-darken-2">mdi-currency-usd</v-icon>
            </v-avatar>
            <div>
              <p class="text-caption">Total Facturado (Mes Actual)</p>
              <p class="text-h4 font-weight-bold">
                <span v-if="!loading">${{ summary.total_facturado_mes?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                <v-progress-circular v-else indeterminate size="32"></v-progress-circular>
              </p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { useNotificationStore } from '~/stores/notifications';

const { $api } = useNuxtApp();
const notificationStore = useNotificationStore();

const loading = ref(true);
const summary = ref({
  dtes_del_mes: 0,
  total_facturado_mes: 0,
});

// Mantengo tu lógica de contingencia en un objeto para mayor orden
const contingency = ref({
  isProcessing: false,
  pendingCount: 0,
});

async function fetchDashboardData() {
  try {
    const data = await $api('/api/dashboard-summary');
    summary.value = data;
  } catch (error) {
    console.error("Error al cargar el resumen del dashboard:", error);
    notificationStore.showNotification({ message: 'No se pudo cargar la información del dashboard.', color: 'error' });
  }
}

async function fetchContingencySummary() {
  try {
    const response = await $api('/api/invoices/contingency-summary');
    contingency.value.pendingCount = response.pending_count;
  } catch (error) {
    console.error("Error al cargar el resumen de contingencia:", error);
  }
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    fetchDashboardData(),
    fetchContingencySummary()
  ]);
  loading.value = false;
});
</script>