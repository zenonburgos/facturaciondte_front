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
        
        <!-- ✨ NUEVO CAMPO PARA BUSCAR CLIENTE ✨ -->
        <v-row>
            <v-col cols="12">
                <v-autocomplete
                  v-model="filters.cliente_id"
                  v-model:search="clienteSearch"
                  :items="clientesResultados"
                  item-title="nombre"
                  item-value="id"
                  label="Buscar Cliente (Opcional)"
                  density="compact"
                  variant="outlined"
                  :loading="clientesLoading"
                  clearable
                  no-filter
                  :disabled="!filters.empresa_id || filters.empresa_id === 'all'"
                  hint="Disponible solo al seleccionar una empresa. Escriba para buscar."
                  persistent-hint
                >
                    <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props" :title="item.raw.nombre" :subtitle="item.raw.nit || item.raw.num_documento"></v-list-item>
                    </template>
                </v-autocomplete>
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
import { ref, onMounted, computed, watch } from 'vue';
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
  cliente_id: null, // Se añade el filtro de cliente
});

const empresas = ref([]);
const isAdmin = computed(() => userHasRole(['Super Administrador']));

// --- Estado para la búsqueda de clientes ---
const clienteSearch = ref('');
const clientesResultados = ref([]);
const clientesLoading = ref(false);
let clienteDebounceTimer = null;

const userHasRole = (requiredRoles) => {
  if (!authStore.user || !Array.isArray(authStore.user.roles)) return false;
  return requiredRoles.some(role => authStore.user.roles.includes(role));
};

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

// Observador para la búsqueda de clientes
watch(clienteSearch, (newValue) => {
    if (clientesLoading.value) return;
    if (!newValue || newValue.length < 2) {
        clientesResultados.value = [];
        return;
    }
    fetchClientes(newValue);
});

// Función para buscar clientes con debounce
const fetchClientes = (searchTerm) => {
    clearTimeout(clienteDebounceTimer);
    clienteDebounceTimer = setTimeout(async () => {
        clientesLoading.value = true;
        try {
            const response = await $api(`/api/clients/search-for-export?term=${searchTerm}&empresa_id=${filters.value.empresa_id}`);
            clientesResultados.value = response;
        } catch (error) {
            notificationStore.showNotification({ message: 'Error al buscar clientes.', color: 'error'});
        } finally {
            clientesLoading.value = false;
        }
    }, 500);
};

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
    // Se añade el cliente_id a los parámetros si está seleccionado
    if (filters.value.cliente_id) {
      params.append('cliente_id', filters.value.cliente_id);
    }

    const url = `${config.public.apiBaseUrl}/api/export/signed-json?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/zip',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Error del servidor: ${response.statusText}` }));
      throw new Error(errorData.error || 'Error desconocido en el servidor.');
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;

    const disposition = response.headers.get('content-disposition');
    let fileName = `exportacion_dte_firmados.zip`;
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
    const friendlyMessage = error.message || 'No se pudo generar el archivo .zip. Revise los filtros o intente con un rango de fechas más pequeño.';
    errorMessage.value = friendlyMessage;
  } finally {
    loading.value = false;
  }
}
</script>