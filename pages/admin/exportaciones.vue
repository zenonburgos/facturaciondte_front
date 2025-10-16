<template>
  <v-container fluid>
    <h1 class="mb-4">Exportaciones Masivas de DTEs</h1>
    <v-card>
      <v-card-title>Seleccionar Criterios de Exportación</v-card-title>
      <v-card-subtitle>Genera un archivo .zip con los JSON firmados de los DTEs emitidos.</v-card-subtitle>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.fecha_inicio"
              label="Fecha Desde"
              type="date"
              density="compact"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.fecha_fin"
              label="Fecha Hasta"
              type="date"
              density="compact"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.empresa_id"
              :items="empresas"
              item-title="nombre"
              item-value="id"
              label="Empresa"
              density="compact"
              variant="outlined"
              :loading="empresasLoading"
              clearable
            >
              <template v-if="isAdmin" v-slot:prepend-item>
                <v-list-item
                  title="Todas las Empresas"
                  value="all"
                ></v-list-item>
                <v-divider class="mt-2"></v-divider>
              </template>
            </v-select>
          </v-col>
        </v-row>
        
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mt-4"
          density="compact"
        >
          {{ errorMessage }}
        </v-alert>

      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="exportarJson"
          :loading="loading"
          :disabled="!filters.fecha_inicio || !filters.fecha_fin"
          prepend-icon="mdi-file-zip-box"
        >
          Exportar JSON Firmados
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { $api } = useNuxtApp();

const config = useRuntimeConfig();

const loading = ref(false);
const empresasLoading = ref(true);
const errorMessage = ref('');

const filters = ref({
  fecha_inicio: null,
  fecha_fin: null,
  empresa_id: null,
});

const empresas = ref([]);

const userHasRole = (requiredRoles) => {
  if (!authStore.user || !Array.isArray(authStore.user.roles)) return false;
  return requiredRoles.some(role => authStore.user.roles.includes(role));
};

const isAdmin = computed(() => userHasRole(['Super Administrador']));

onMounted(async () => {
  try {
    const data = await $api('/api/empresas-for-select');
    empresas.value = data;
    if (!isAdmin.value && data.length === 1) {
      filters.value.empresa_id = data[0].id;
    }
  } catch (error) {
    notificationStore.showNotification({
      message: 'No se pudieron cargar las empresas.',
      color: 'error'
    });
  } finally {
    empresasLoading.value = false;
  }
});

async function exportarJson() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const params = new URLSearchParams({
      fecha_inicio: filters.value.fecha_inicio,
      fecha_fin: filters.value.fecha_fin,
    });
    if (filters.value.empresa_id) {
      params.append('empresa_id', filters.value.empresa_id);
    }

    const url = `${config.public.apiBaseUrl}/api/export/signed-json?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/zip',
      }
    });

    if (!response.ok) {
      // Intentamos leer el error del backend si es posible
      const errorData = await response.json().catch(() => ({ error: `Error del servidor: ${response.statusText}` }));
      throw new Error(errorData.error || 'Error desconocido en el servidor.');
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;

    const disposition = response.headers.get('content-disposition');
    let fileName = `exportacion_dte_firmados_${new Date().toISOString().slice(0, 10)}.zip`;
    if (disposition && disposition.includes('attachment')) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches?.[1]) { 
          fileName = matches[1].replace(/['"]/g, '');
        }
    }
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);

  } catch (error) {
    console.error("Error al exportar JSONs:", error);
    const friendlyMessage = error.message || 'No se pudo generar el archivo .zip. Revise los filtros o intente con un rango de fechas más pequeño.';
    errorMessage.value = friendlyMessage;
    // Ya no mostramos la notificación genérica, el v-alert es suficiente.
    // notificationStore.showNotification({ message: friendlyMessage, color: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>

