<template>
  <v-container>
    <h1 class="mb-4">Historial de Documentos Emitidos</h1>

    <v-dialog v-model="invalidateDialog.show" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Invalidar Documento</span>
        </v-card-title>
        <v-card-text>
          <p>Estás a punto de invalidar el DTE con código:</p>
          <p class="font-weight-bold my-2">{{ invalidateDialog.dte?.codigo_generacion }}</p>
          
          <v-textarea
            v-model="invalidateDialog.motivo"
            label="Motivo de la invalidación*"
            rows="3"
            required
            class="mt-4"
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text" 
            @click="invalidateDialog.show = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="submitInvalidation"
            :loading="invalidateDialog.loading"
            :disabled="!invalidateDialog.motivo || invalidateDialog.loading"
          >
            Confirmar Invalidación
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card>
      <v-card-title>Filtros de Búsqueda</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" sm="12" md="6">
            <v-text-field
              v-model="filters.searchTerm"
              label="Buscar por Nº Control o Código Generación"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              @keyup.enter="applyFiltersAndReload"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.estado"
              :items="['PROCESADO', 'CONTINGENCIA_PENDIENTE', 'INVALIDADO', 'RECHAZADO']"
              label="Estado"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.tipo_dte"
              :items="documentTypes"
              item-title="title"
              item-value="value"
              label="Tipo de DTE"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
        </v-row>
        <v-col cols="12" sm="12" md="2" class="d-flex ga-2">
          <v-btn color="primary" @click="applyFiltersAndReload" block>Buscar</v-btn>
          <v-btn variant="tonal" @click="clearFilters" title="Limpiar Filtros">
            <v-icon>mdi-filter-remove</v-icon>
          </v-btn>
        </v-col>
      </v-card-text>
      
      <v-divider></v-divider>

      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        @update:options="loadItemsWithOptions"
      >
        <template v-slot:item.tipo_dte="{ item }">
          <v-chip small :color="getDteColor(item.tipo_dte)" density="compact" size="small">{{ getDteName(item.tipo_dte) }}</v-chip>
        </template>

        <template v-slot:item.codigo_generacion="{ item }">
          <div class="d-flex align-center">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <span v-bind="props" class="font-weight-bold text-blue-grey-darken-1 mr-1">
                  {{ item.codigo_generacion.slice(0, 8) }}...
                </span>
              </template>
              <span>{{ item.codigo_generacion }}</span>
            </v-tooltip>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              color="grey"
              size="x-small"
              @click="copyToClipboard(item.codigo_generacion)"
              title="Copiar Código"
            ></v-btn>
          </div>
        </template>
        
        <template v-slot:item.estado="{ item }">
          <v-chip small :color="getStatusColor(item.estado)" density="compact" size="small">{{ item.estado }}</v-chip>
        </template>

        <template v-slot:item.fh_procesamiento="{ item }">
          {{ formatDateTime(item.fh_procesamiento) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn 
            icon="mdi-download" 
            variant="text" 
            color="primary" 
            size="small" 
            @click="downloadPdf(item)" 
            title="Descargar PDF"
            :loading="item.pdfLoading" 
          ></v-btn>

          <v-btn 
            v-if="item.estado === 'PROCESADO' && item.tipo_dte === '01'" 
            icon="mdi-cancel" 
            variant="text" 
            color="error" 
            size="small" 
            @click.stop="openInvalidateDialog(item)"  
            title="Invalidar Documento"
          ></v-btn>

          <!-- <v-btn 
            v-if="item.estado === 'PROCESADO' && item.tipo_dte === '03'" 
            icon="mdi-file-undo" 
            variant="text" 
            color="blue" 
            size="small" 
            @click="crearNotaDeCredito(item)"  
            title="Crear Nota de Crédito"
          ></v-btn> -->
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications'; // La usaremos para la notificación de copiado
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const route = useRoute();

// --- ESTADO DE LA TABLA (se mantiene igual) ---
const serverItems = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const tableOptions = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
});

// --- ESTADO DE LOS FILTROS (se mantiene igual) ---
const filters = ref({
  searchTerm: '',
  estado: null,
  tipo_dte: null,
});

const documentTypes = ref([]);
const invalidateDialog = ref({
  show: false,
  dte: null,
  motivo: '',
  loading: false,
});

// === INICIO: CABECERAS DE TABLA ACTUALIZADAS ===
const headers = [
  { title: 'Tipo', key: 'tipo_dte', sortable: false },
  { title: 'Número de Control', key: 'numero_control', sortable: false },
  // Añadimos la nueva columna aquí
  { title: 'Código Generación', key: 'codigo_generacion', sortable: false },
  { title: 'Estado', key: 'estado' },
  { title: 'Fecha Procesamiento', key: 'fh_procesamiento' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];
// === FIN: CABECERAS DE TABLA ACTUALIZADAS ===


// === INICIO: NUEVA FUNCIÓN PARA COPIAR AL PORTAPAPELES ===
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    notificationStore.showNotification({ message: '¡Código copiado!', color: 'info' });
  } catch (err) {
    console.error('Error al copiar: ', err);
    notificationStore.showNotification({ message: 'No se pudo copiar el código.', color: 'error' });
  }
}
// === FIN: NUEVA FUNCIÓN ===


async function loadItems() {
  console.trace(); 
  loading.value = true;
  
  try {
    const { $api } = useNuxtApp();
    const params = new URLSearchParams({
      page: tableOptions.value.page,
      per_page: tableOptions.value.itemsPerPage,
      ...(filters.value.searchTerm && { search: filters.value.searchTerm }),
      ...(filters.value.estado && { estado: filters.value.estado }),
      ...(filters.value.tipo_dte && { tipo_dte: filters.value.tipo_dte }),
    });

    const url = `/api/invoices?${params.toString()}`;
    const response = await $api(url);

    // Verificamos si la respuesta tiene la estructura que esperamos ANTES de usarla.
    if (response && typeof response === 'object' && 'data' in response && 'total' in response) {
      serverItems.value = response.data;
      totalItems.value = response.total;
    } else {
      // Si la estructura es incorrecta, lo registramos y mostramos una notificación.
      console.error("Error de Estructura: La respuesta de la API no tiene el formato esperado {data, total}.", response);
      notificationStore.showNotification({ message: 'La respuesta del servidor no fue válida.', color: 'error' });
    }

  } catch (error) {
    // Si la llamada a $api falla (ej. error 500, 404), entrará aquí.
    console.error("Error ATRAPADO en el bloque catch:", error);
    notificationStore.showNotification({ message: 'No se pudo cargar el historial.', color: 'error' });
  } finally {
    // Este bloque DEBE ejecutarse si no hay un error fatal que detenga el navegador.
    loading.value = false;
  }
}

onMounted(async () => {
    try {
        const { $api } = useNuxtApp();
        const types = await $api('/api/document-types');
        documentTypes.value = types;
    } catch (error) {
        console.error("Error al cargar los tipos de documento:", error);
    }

    if (route.query.estado) {
        filters.value.estado = route.query.estado;
        applyFiltersAndReload();
    }
});

async function downloadPdf(item) {
  // Para mostrar un indicador de carga en el botón y mejorar la UX
  item.pdfLoading = true; 
  
  try {
    const { $api } = useNuxtApp();
    const url = `/api/invoices/${item.codigo_generacion}/pdf`;

    // 1. Usamos $api para que la petición incluya el token de autorización.
    //    Pedimos que la respuesta sea de tipo 'blob' (un fichero binario).
    const pdfBlob = await $api(url, {
      responseType: 'blob'
    });

    // 2. Creamos una URL temporal en el navegador para este fichero binario.
    const objectUrl = URL.createObjectURL(pdfBlob);

    // 3. Creamos un elemento de enlace (<a>) temporal en memoria
    const link = document.createElement('a');
    link.href = objectUrl;

    // 4. Asignamos el nombre de archivo para la descarga.
    //    Usamos el numero_control si existe, si no, un trozo del código de generación.
    link.download = `dte_${item.numero_control || item.codigo_generacion.slice(0,8)}.pdf`;

    // 5. Añadimos el enlace al cuerpo del documento (es necesario para que funcione en todos los navegadores)
    document.body.appendChild(link);

    // 6. Simulamos un clic en el enlace para iniciar la descarga
    link.click();

    // 7. Eliminamos el enlace del cuerpo del documento para no dejar basura en el DOM
    document.body.removeChild(link);
    
    // 4. (Buena práctica) Liberamos la memoria del navegador después de un momento.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);

  } catch (error) {
    console.error("Error al descargar el PDF:", error);
    notificationStore.showNotification({ message: 'No se pudo descargar el PDF.', color: 'error' });
  } finally {
    // Nos aseguramos de ocultar siempre el indicador de carga
    item.pdfLoading = false; 
  }
}

function openInvalidateDialog(item) {
  
  invalidateDialog.value.dte = item;
  invalidateDialog.value.motivo = '';
  invalidateDialog.value.show = true;

}

async function submitInvalidation() {
  if (!invalidateDialog.value.motivo) {
    notificationStore.showNotification({ message: 'Debe ingresar un motivo.', color: 'warning' });
    return;
  }
  
  invalidateDialog.value.loading = true;
  const dteToInvalidate = invalidateDialog.value.dte;
  try {
    const { $api } = useNuxtApp();
    const response = await $api(`/api/invoices/${dteToInvalidate.codigo_generacion}/invalidation`, {
      method: 'POST',
      body: {
        tipo_invalidacion: '2', 
        motivo: invalidateDialog.value.motivo,
      }
    });

    if (response.estado === 'PROCESADO') {
      notificationStore.showNotification({ message: '¡Documento invalidado exitosamente!', color: 'success' });
      invalidateDialog.value.show = false;
      loadItems(); 
    } else {
      notificationStore.showNotification({ message: `Error al invalidar: ${response.observaciones?.join(', ')}`, color: 'error' });
    }
  } catch (error) {
    notificationStore.showNotification({ message: error.data?.message || 'Ocurrió un error al invalidar.', color: 'error' });
  } finally {
    invalidateDialog.value.loading = false;
  }
}

function getStatusColor(status) {
  const colors = {
    PROCESADO: 'success',
    CONTINGENCIA_PENDIENTE: 'warning',
    LOTE_ENVIADO: 'info',
    RECHAZADO: 'error',
    INVALIDADO: 'blue-grey',
  };
  return colors[status] || 'default';
}

function getDteColor(type) {
    const dte = documentTypes.value.find(t => t.value === type);
    return dte ? 'primary' : 'grey';
}

function getDteName(type) {
    const dte = documentTypes.value.find(t => t.value === type);
    return dte ? dte.title : type;
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('es-SV', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

function clearFilters() {
  filters.value = {
    searchTerm: '',
    estado: null,
    tipo_dte: null,
  };
  // Llamamos a la función que ya teníamos para aplicar los filtros y recargar
  applyFiltersAndReload();
}

// Asegúrate de que la función applyFiltersAndReload también exista
function applyFiltersAndReload() {
  tableOptions.value.page = 1;
  loadItems();
}

// Y renombra tu función @update:options para evitar confusiones
function loadItemsWithOptions(newOptions) {
  tableOptions.value = newOptions;
  loadItems();
}
</script>