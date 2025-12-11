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
    <v-row align="center" class="mb-6">
      <v-col cols="12" sm="5" md="4">
        <v-select
          v-model="selectedMonth"
          :items="monthList"
          item-title="title"
          item-value="value"
          label="Mes de la consulta"
          prepend-inner-icon="mdi-calendar"
          variant="outlined"
          density="compact"
          hide-details
        ></v-select>
      </v-col>
    </v-row>
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
      <v-col cols="12" :md="canViewFinancials ? 6 : 12">
        <component 
          :is="canViewFinancials ? 'NuxtLink' : 'div'" 
          :to="canViewFinancials ? { path: '/historial', query: { month: selectedMonth } } : null" 
          class="text-decoration-none"
        >
          <v-card class="pa-2" elevation="2" :hover="canViewFinancials">
            <div class="d-flex align-center">
              <v-avatar color="blue-lighten-4" size="62" class="mr-4">
                <v-icon color="blue-darken-2">mdi-file-document-multiple-outline</v-icon>
              </v-avatar>
              <div>
                <p class="text-caption">DTEs Procesados ({{ formattedDisplayMonth }})</p>
                <p class="text-h4 font-weight-bold">
                  <span v-if="!loading">{{ summary.dtes_del_mes }}</span>
                  <v-progress-circular v-else indeterminate size="32"></v-progress-circular>
                </p>
              </div>
            </div>
          </v-card>
        </component>
      </v-col>

      <v-col cols="12" md="6" v-if="canViewFinancials">
        <NuxtLink :to="{ path: '/historial', query: { month: selectedMonth } }" class="text-decoration-none">
        <v-card class="pa-2" elevation="2" hover>
          <div class="d-flex align-center">
            <v-avatar color="green-lighten-4" size="62" class="mr-4">
              <v-icon color="green-darken-2">mdi-currency-usd</v-icon>
            </v-avatar>
            <div>
              <p class="text-caption">Total Facturado ({{ formattedDisplayMonth }})</p>
              <p class="text-h4 font-weight-bold">
                <span v-if="!loading">${{ summary.total_facturado_mes?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                <v-progress-circular v-else indeterminate size="32"></v-progress-circular>
              </p>
            </div>
          </div>
        </v-card>
        </NuxtLink>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useNuxtApp } from '#app';
import { useNotificationStore } from '~/stores/notifications';

import { useAuthStore } from '~/stores/auth';

const { $api } = useNuxtApp();
const notificationStore = useNotificationStore();

const authStore = useAuthStore();

const canViewFinancials = computed(() => {
  const userRole = authStore.user?.role; 
  const empresaConfig = authStore.user?.empresa || {};

  // 1. CORRECCIÓN: Usar los nombres EXACTOS de tu Base de Datos
  // Agregamos 'Gerente Tienda' y 'Contador' a la lista de "Jefes" que pueden ver todo siempre.
  const isBoss = [
      'Admin', 
      'Super Administrador', 
      'Gerente Tienda', 
      'Contador' // Asumo que el contador también debe ver los números
  ].includes(userRole);

  if (isBoss) return true;

  // 2. Si no es jefe (es Cajero o Demo), aplicamos la restricción
  // Si restringir es true (1), devolvemos false (ocultar)
  if (empresaConfig.restringir_dashboard_cajeros) {
      return false; 
  }

  return true; 
});

const loading = ref(true);
const summary = ref({
  dtes_del_mes: 0,
  total_facturado_mes: 0,
});

const contingency = ref({
  isProcessing: false,
  pendingCount: 0,
});

// --- ESTADO Y LÓGICA PARA EL NUEVO SELECTOR DE MES ---

const selectedMonth = ref(''); // Guardará el valor 'YYYY-MM'
const monthList = ref([]); // Almacenará la lista de meses para el dropdown

// Función para generar la lista de meses
function generateMonthList() {
  const months = [];
  const currentDate = new Date();
  for (let i = 0; i < 24; i++) { // Generamos los últimos 24 meses
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Formateamos el texto para mostrar (ej: "Septiembre de 2025")
    const displayFormat = date.toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });
    const capitalizedDisplay = displayFormat.charAt(0).toUpperCase() + displayFormat.slice(1);

    months.push({
      title: capitalizedDisplay,
      value: `${year}-${month}`, // ej: '2025-09'
    });
  }
  monthList.value = months;
  // Establecemos el mes actual como valor por defecto al cargar
  if (months.length > 0) {
    selectedMonth.value = months[0].value;
  }
}

// --- PROPIEDADES COMPUTADAS ---

// Propiedad para mostrar el nombre del mes seleccionado en los títulos de los cards
const formattedDisplayMonth = computed(() => {
  const found = monthList.value.find(m => m.value === selectedMonth.value);
  return found ? found.title : 'Mes Actual';
});

// --- LÓGICA DE CARGA DE DATOS ---

async function fetchDashboardData() {
  loading.value = true;
  try {
    const data = await $api('/api/dashboard-summary', {
      params: {
        month: selectedMonth.value // Usamos directamente el valor 'YYYY-MM'
      }
    });
    summary.value = data;
  } catch (error) {
    console.error("Error al cargar el resumen del dashboard:", error);
    notificationStore.showNotification({ message: 'No se pudo cargar la información del dashboard.', color: 'error' });
  } finally {
    loading.value = false;
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

// --- OBSERVADOR (WATCHER) ---
// Cada vez que 'selectedMonth' cambie, volvemos a llamar a la API
watch(selectedMonth, (newValue) => {
  if (newValue) { // Nos aseguramos de que no sea una selección vacía
    fetchDashboardData();
  }
});

onMounted(() => {
  generateMonthList(); // Generamos la lista de meses al montar el componente
  
  // Las llamadas a la API se dispararán automáticamente gracias al watcher
  // cuando 'selectedMonth' obtenga su valor inicial.
  fetchContingencySummary();
});
</script>