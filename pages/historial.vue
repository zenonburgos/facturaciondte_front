<template>
  <v-container fluid  >
    <h1 class="mb-4">Historial de Documentos Emitidos</h1>
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-card variant="tonal" color="blue-grey">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="large" class="mr-3">mdi-poll</v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">Subtotal de la Búsqueda</div>
                <div class="text-h5 font-weight-bold">{{ formatCurrency(totals.subtotal) }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-card variant="tonal" color="teal">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="large" class="mr-3">mdi-percent-box-outline</v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">IVA de la Búsqueda</div>
                <div class="text-h5 font-weight-bold">{{ formatCurrency(totals.iva) }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="12" md="4">
        <v-card variant="tonal" color="primary">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="large" class="mr-3">mdi-calculator</v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">Total de la Búsqueda</div>
                <div class="text-h5 font-weight-bold">{{ formatCurrency(totals.total) }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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
    <v-dialog 
        v-model="jsonDialog.show" 
        max-width="900px" 
        scrollable
        :fullscreen="$vuetify.display.xs"
        transition="dialog-bottom-transition"
      >
      <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h5">Detalle del DTE</span>
        <v-btn icon="mdi-close" variant="text" @click="jsonDialog.show = false"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-card-text>
        <pre style="white-space: pre-wrap; word-break: break-all;"><code>{{ jsonDialog.content }}</code></pre>
      </v-card-text>

      <v-divider></v-divider>
      
      <v-card-actions class="pa-3 flex-wrap justify-end">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="red-darken-1"
              :icon="$vuetify.display.xs"
              variant="text"
              @click="downloadPdfFromDialog"
              :loading="jsonDialog.item?.pdfLoading"
            >
              <v-icon start>mdi-file-pdf-box</v-icon>
              <span class="d-none d-sm-inline">PDF</span>
            </v-btn>
          </template>
          <span>Descargar PDF</span>
        </v-tooltip>

        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="blue"
              :icon="$vuetify.display.xs"
              variant="text"
              @click="downloadJson"
            >
              <v-icon start>mdi-code-json</v-icon>
              <span class="d-none d-sm-inline">JSON</span>
            </v-btn>
          </template>
          <span>Descargar JSON</span>
        </v-tooltip>
        
        <v-btn
          v-if="jsonDialog.item?.json_enviado?.receptor?.telefono"
          color="green"
          :icon="$vuetify.display.xs"
          variant="elevated"
          class="ml-2"
          @click="shareOnWhatsAppFromDialog"
          :loading="jsonDialog.item?.whatsAppLoading"
        >
          <v-icon start>mdi-whatsapp</v-icon>
          <span class="d-none d-sm-inline">WhatsApp</span>
        </v-btn>
        
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <div v-bind="props">
              <v-btn
                color="grey"
                :icon="$vuetify.display.xs"
                variant="elevated"
                class="ml-2"
                :loading="item.isSendingEmail"
                :disabled="item.isSendingEmail"
                @click="reenviarCorreo(item)"
              >
                <v-icon start>mdi-email</v-icon>
                <span class="d-none d-sm-inline">Correo</span>
              </v-btn>
            </div>
          </template>
          <span>Reenviar DTE por correo</span>
        </v-tooltip>
        
        <v-btn
          v-if="jsonDialog.item?.estado === 'PROCESADO'"
          color="error"
          :icon="$vuetify.display.xs"
          variant="elevated"
          class="ml-2"
          @click="invalidateFromDialog"
        >
          <v-icon start>mdi-cancel</v-icon>
          <span class="d-none d-sm-inline">Invalidar</span>
        </v-btn>
      </v-card-actions>
    </v-card>
    </v-dialog>
      <v-card>
      <v-card-title>Filtros de Búsqueda</v-card-title>

      <v-card-text>
        <v-form ref="form">
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

        <v-row class="mt-4 align-center">
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.fecha_inicio"
              label="Fecha Desde"
              type="date"
              density="compact"
              variant="outlined"
              hide-details="auto" clearable
              :rules="dateRule"   ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.fecha_fin"
              label="Fecha Hasta"
              type="date"
              density="compact"
              variant="outlined"
              hide-details="auto" clearable
              :rules="dateRule"   >
            </v-text-field>
          </v-col>

          <v-col cols="12" sm="12" md="6" class="d-flex ga-2 flex-wrap">
            <v-btn color="primary" @click="applyFiltersAndReload">
              <v-icon start>mdi-magnify</v-icon>
              Buscar
            </v-btn>
            <v-btn variant="tonal" @click="clearFilters" title="Limpiar Filtros">
              <v-icon>mdi-filter-remove</v-icon>
            </v-btn>
            
            <v-tooltip 
              location="top" 
              text="No hay datos para exportar con los filtros actuales"
              :disabled="totalItems > 0" >
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-btn 
                    color="success" 
                    @click="exportToExcel"
                    :loading="exportLoading"
                    prepend-icon="mdi-file-excel"
                    :disabled="totalItems === 0"
                  >
                    Exportar
                  </v-btn>
                </div>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        </v-form>
      </v-card-text>
      
      <v-divider></v-divider>

      <v-data-table-server
         v-model:items-per-page="tableOptions.itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        @update:options="loadItemsWithOptions"
        :row-props="getRowProps"
      >
      <template v-slot:no-data>
        <div class="pa-4 text-center">
          <v-icon size="x-large" color="grey-lighten-1" class="mb-2">mdi-magnify-remove-outline</v-icon>
          <h4 class="text-grey-darken-1">No se encontraron resultados</h4>
          <p class="text-grey-darken-2 text-body-2">Intente ajustar los filtros de búsqueda.</p>
        </div>
      </template>
        <!-- <template v-slot:item.tipo_dte="{ item }">
          <v-avatar small :color="getDteColor(item.tipo_dte)" density="compact" size="small">
            {{ getDteName(item.tipo_dte) }}
          </v-avatar>
        </template> -->
      <template v-slot:item.tipo_dte="{ item }">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-avatar v-bind="props" :color="getDteColor(item.tipo_dte)" size="32">
              <span class="text-white text-caption font-weight-bold">{{ getDteAbbreviation(item.tipo_dte) }}</span>
            </v-avatar>
          </template>
          <span>{{ getDteName(item.tipo_dte) }}</span>
        </v-tooltip>
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

        <!-- <template v-slot:item.subtotal="{ item }">
          <span>${{ item.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </template>

        <template v-slot:item.iva="{ item }">
          <span>${{ item.iva?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </template> -->
        <template v-slot:item.montos="{ item }">
            <div>
                <span>${{ item.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                
                <!-- Mostramos el IVA solo si es un Crédito Fiscal (tipo 03) -->
                <div v-if="item.tipo_dte === '03'" class="text-caption text-grey-darken-1">
                    <span class="font-weight-bold">IVA:</span> ${{ item.iva?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </div>
            </div>
        </template>

        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold">${{ item.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </template>
        
        <!-- <template v-slot:item.estado="{ item }">
          <v-chip small :color="getStatusColor(item.estado)" density="compact" size="small">{{ item.estado }}</v-chip>
        </template> -->

        <template v-slot:item.estado="{ item }">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-icon
                v-bind="props"
                :icon="getStatusIcon(item.estado)"
                :color="getStatusColor(item.estado)"
              ></v-icon>
            </template>
            <span>{{ item.estado }}</span>
          </v-tooltip>
        </template>

        <template v-slot:item.fh_procesamiento="{ item }">
          {{ formatDateTime(item.fh_procesamiento) }}
        </template>

        <!-- <template v-slot:item.actions="{ item }">
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
              icon="mdi-code-json"
              variant="text"
              color="indigo-lighten-1"
              size="small"
              @click="viewJson(item)"
              title="Ver JSON Enviado"
              :loading="item.jsonLoading"
          ></v-btn>

          <v-btn
            v-if="item.json_enviado?.receptor?.telefono"
            icon="mdi-whatsapp"
            variant="text"
            color="green"
            size="small"
            @click="shareOnWhatsApp(item)"
            title="Enviar por WhatsApp"
            :loading="item.whatsAppLoading" >
          </v-btn>

          <v-btn 
            v-if="item.estado === 'PROCESADO'" 
            icon="mdi-cancel" 
            variant="text" 
            color="error" 
            size="small" 
            @click.stop="openInvalidateDialog(item)"  
            title="Invalidar Documento"
          ></v-btn>
        </template> -->
        <template v-slot:item.actions="{ item }">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
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
                v-bind="props"
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                @click="viewJson(item)"
                :loading="item.jsonLoading"
              ></v-btn>
            </template>
            <span>Acciones</span>
          </v-tooltip>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify'

const { display } = useDisplay()
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const route = useRoute();

const form = ref(null);

const dateRule = [
  value => {
    if (!value) return true;
    const date = new Date(value + 'T00:00:00');
    if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      return 'Fecha inválida.';
    }
    return true;
  }
];

// --- ESTADO ---
const serverItems = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const tableOptions = ref({ page: 1, itemsPerPage: 10, sortBy: [] });

const getInitialDates = () => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const formatDate = (d) => d.toISOString().split('T')[0];
  return { inicio: formatDate(firstDay), fin: formatDate(lastDay) };
};

const filters = ref({
  searchTerm: '',
  estado: null,
  tipo_dte: null,
  fecha_inicio: getInitialDates().inicio,
  fecha_fin: getInitialDates().fin,
});

const totals = ref({
  subtotal: 0,
  iva: 0,
  total: 0,
});

const showLoadingOverlay = ref(false);
const loadingMessage = ref('');

const documentTypes = ref([]);
const exportLoading = ref(false);
const invalidateDialog = ref({ show: false, dte: null, motivo: '', loading: false });
const jsonDialog = ref({ show: false, content: '', data: null, item: null });

const headers = [
  { title: 'Tipo', key: 'tipo_dte', sortable: false },
  { title: 'Número de Control', key: 'numero_control', sortable: false },
  { title: 'Código Generación', key: 'codigo_generacion', sortable: false },
  { title: 'Estado', key: 'estado' },
  // { title: 'Subtotal', key: 'subtotal', align: 'end', sortable: true },
  // { title: 'IVA', key: 'iva', align: 'end', sortable: true },
  { title: 'Montos', key: 'montos', align: 'end', sortable: false },
  { title: 'Total', key: 'total', align: 'end', sortable: true },
  { title: 'Fecha Procesamiento', key: 'fh_procesamiento' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];

// --- LÓGICA PRINCIPAL ---

onMounted(async () => {
  try {
    const { $api } = useNuxtApp();
    documentTypes.value = await $api('/api/document-types');
  } catch (error) {
    notificationStore.showNotification({ message: 'No se pudieron cargar los tipos de DTE.', color: 'error' });
  }
  
  // Mantenemos la lógica para el estado
  if (route.query.estado) {
    filters.value.estado = route.query.estado;
  }
  
  if (route.query.month) {
    // 1. Extraemos el año y el mes del parámetro 'YYYY-MM'
    const [year, month] = route.query.month.split('-').map(Number);
    
    // 2. Creamos las fechas de inicio y fin para ese mes
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0); // El día 0 del siguiente mes es el último del actual
    
    // Función para formatear a 'YYYY-MM-DD'
    const formatDate = (d) => d.toISOString().split('T')[0];
    
    // 3. Establecemos los filtros de fecha
    filters.value.fecha_inicio = formatDate(firstDay);
    filters.value.fecha_fin = formatDate(lastDay);

    const monthName = firstDay.toLocaleDateString('es-SV', { month: 'long' });
    loadingMessage.value = `Espera, estamos consultando el mes de ${monthName} del año ${year}...`;
    showLoadingOverlay.value = true;
    // Opcional: Limpiamos el query de la URL para que no quede "pegado"
    // router.replace({ query: { ...route.query, month: undefined } });
  }
  await loadItems();
});

function loadItemsWithOptions(newOptions) {
  tableOptions.value = newOptions;
  loadItems();
}

async function loadItems() {
  loading.value = true;
  try {
    const { $api } = useNuxtApp();
    const params = new URLSearchParams({
      page: tableOptions.value.page,
      per_page: tableOptions.value.itemsPerPage,
    });
    if (filters.value.searchTerm) params.append('search', filters.value.searchTerm);
    if (filters.value.estado) params.append('estado', filters.value.estado);
    if (filters.value.tipo_dte) params.append('tipo_dte', filters.value.tipo_dte);
    if (filters.value.fecha_inicio) params.append('fecha_inicio', filters.value.fecha_inicio);
    if (filters.value.fecha_fin) params.append('fecha_fin', filters.value.fecha_fin);
    
    const response = await $api(`/api/invoices?${params.toString()}`);
    if (response && Array.isArray(response.data)) {
      serverItems.value = response.data.map(item => ({ ...item, pdfLoading: false, jsonLoading: false, whatsAppLoading: false }));
      totalItems.value = response.total;

      if (response.totals) {
        totals.value = response.totals;
      }
    }
  } catch (error) {
    notificationStore.showNotification({ message: error.data?.message || 'No se pudo cargar el historial.', color: 'error' });
  } finally {
    loading.value = false;
  }
}

function formatCurrency(value) {
  // Convierte el valor a un número de punto flotante.
  const numberValue = parseFloat(value);

  // Si el resultado no es un número válido (ej. null, undefined), devuelve $0.00.
  if (isNaN(numberValue)) {
    return '$0.00';
  }

  // Si es un número válido, le da el formato de moneda.
  return `$${numberValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- LÓGICA DE FILTROS Y VALIDACIÓN ---

function areDatesValid() {
  const validate = (value) => {
    if (!value) return true; // Permitir campos vacíos
    const date = new Date(value + 'T00:00:00');
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };

  if (!validate(filters.value.fecha_inicio) || !validate(filters.value.fecha_fin)) {
    notificationStore.showNotification({
      message: 'Por favor, corrija las fechas. Una o ambas son inválidas (ej. 31 de Junio).',
      color: 'error',
    });
    return false;
  }
  return true;
}

async function applyFiltersAndReload() {
  console.log("Intentando validar el formulario..."); // <-- PRUEBA 1
  const { valid } = await form.value.validate();
  console.log("Resultado de la validación:", valid); // <-- PRUEBA 2

  // Si no es válido, detenemos todo aquí
  if (!valid) {
    notificationStore.showNotification({
      message: 'Por favor, corrija las fechas antes de buscar.',
      color: 'warning',
    });
    return;
  }
  
  // Si es válido, procedemos con la búsqueda
  tableOptions.value.page = 1;
  loadItems();
}

function clearFilters() {
  const initialDates = getInitialDates();
  filters.value = {
    searchTerm: '',
    estado: null,
    tipo_dte: null,
    fecha_inicio: initialDates.inicio,
    fecha_fin: initialDates.fin,
  };
  applyFiltersAndReload();
}

async function exportToExcel() {
  exportLoading.value = true;
  try {
    // Prepara los parámetros de los filtros
    const params = new URLSearchParams();
    if (filters.value.searchTerm) params.append('search', filters.value.searchTerm);
    if (filters.value.estado) params.append('estado', filters.value.estado);
    if (filters.value.tipo_dte) params.append('tipo_dte', filters.value.tipo_dte);
    if (filters.value.fecha_inicio) params.append('fecha_inicio', filters.value.fecha_inicio);
    if (filters.value.fecha_fin) params.append('fecha_fin', filters.value.fecha_fin);

    const { $api } = useNuxtApp();
    
    // Apunta a la URL final y correcta
    const url = `/api/invoices/export?${params.toString()}`;
    
    // Pide el archivo como 'blob'
    const blob = await $api(url, { responseType: 'blob' });
    
    // Crea un enlace temporal para iniciar la descarga
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `dtes_exportados_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
    
  } catch (error) {
    // Manejo de error para el usuario
    console.error("Error al exportar:", error);
    notificationStore.showNotification({ message: 'No se pudo generar el archivo Excel. Verifique los filtros.', color: 'error' });
  } finally {
    exportLoading.value = false;
  }
}

// --- FUNCIONES DE AYUDA Y ACCIONES DE LA TABLA (COMPLETAS) ---

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    notificationStore.showNotification({ message: '¡Código copiado!', color: 'info' });
  } catch (err) {
    notificationStore.showNotification({ message: 'No se pudo copiar el código.', color: 'error' });
  }
}

async function downloadPdf(item) {
  item.pdfLoading = true; 
  try {
    const { $api } = useNuxtApp();
    const url = `/api/invoices/${item.codigo_generacion}/pdf`;
    const pdfBlob = await $api(url, { responseType: 'blob' });
    const objectUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `dte_${item.numero_control || item.codigo_generacion.slice(0,8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
  } catch (error) {
    notificationStore.showNotification({ message: 'No se pudo descargar el PDF.', color: 'error' });
  } finally {
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
      body: { tipo_invalidacion: '2', motivo: invalidateDialog.value.motivo },
    });
    if (response.estado === 'PROCESADO') {
      notificationStore.showNotification({ message: '¡Documento invalidado exitosamente!', color: 'success' });
      invalidateDialog.value.show = false;
      loadItems(); 
    } else {
      notificationStore.showNotification({ message: `Error: ${response.observaciones?.join(', ')}`, color: 'error' });
    }
  } catch (error) {
    notificationStore.showNotification({ message: error.data?.message || 'Ocurrió un error al invalidar.', color: 'error' });
  } finally {
    invalidateDialog.value.loading = false;
  }
}

// function getStatusColor(status) {
//   const colors = {
//     PROCESADO: 'success',
//     CONTINGENCIA_PENDIENTE: 'warning',
//     LOTE_ENVIADO: 'info',
//     RECHAZADO: 'error',
//     INVALIDADO: 'blue-grey',
//   };
//   return colors[status] || 'default';
// }

// function getDteColor(type) {
//   const dte = documentTypes.value.find(t => t.value === type);
//   return dte ? 'primary' : 'grey';
// }

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

async function viewJson(item) {
  item.jsonLoading = true;
  jsonDialog.value.item = item;
  try {
    const { $api } = useNuxtApp();
    const responseJson = await $api(`/api/invoices/${item.codigo_generacion}`);

    if (responseJson) {
      jsonDialog.value.content = JSON.stringify(responseJson, null, 2);
      jsonDialog.value.data = responseJson; // <-- ¡Línea clave! Guardamos el objeto
      jsonDialog.value.show = true;
    } else {
      notificationStore.showNotification({ message: 'No se recibió contenido para mostrar.', color: 'warning' });
    }

  } catch (error) {
    notificationStore.showNotification({ message: 'No se pudo cargar el JSON del documento.', color: 'error' });
  } finally {
    item.jsonLoading = false;
  }
}

function downloadJson() {
  if (!jsonDialog.value.content) return;

  const blob = new Blob([jsonDialog.value.content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = generatedFilename.value; // Usamos la propiedad computada
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



async function copyJsonToClipboard() {
  if (!jsonDialog.value.content) return;
  try {
    await navigator.clipboard.writeText(jsonDialog.value.content);
    notificationStore.showNotification({ message: '¡JSON copiado!', color: 'info' });
  } catch (err) {
    notificationStore.showNotification({ message: 'No se pudo copiar el JSON.', color: 'error' });
  }
}

async function shareOnWhatsApp() {
  if (!jsonDialog.value.data) return;

  const codigoGeneracion = jsonDialog.value.data.identificacion.codigoGeneracion;
  
  try {
    // 1. Pedimos la URL completa y correcta al backend
    const { $api } = useNuxtApp();
    const response = await $api(`/api/invoices/${codigoGeneracion}/public-link`);
    const shareableLink = response.url;

    // 2. Construimos el mensaje con la URL recibida
    let message = `Hola ${jsonDialog.value.data.receptor.nombre},\n`;
    message += `Te compartimos tu DTE de ${jsonDialog.value.data.emisor.nombreComercial}.\n\n`;
    message += `Puedes verlo y descargarlo aquí:\n${shareableLink}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');

  } catch (error) {
    // Aquí puedes usar tu 'notificationStore' para mostrar un error
    console.error("No se pudo obtener el enlace para compartir:", error);
    // notificationStore.showNotification({ message: 'No se pudo generar el enlace.', color: 'error' });
  }
}

function getDteAbbreviation(type) {
  const abbreviations = {
    '01': 'FAC',
    '03': 'CCF',
    '04': 'REM',
    '05': 'NC',
    '06': 'ND',
    '07': 'CR',
    '11': 'FEX',
    '14': 'FSE',
  };
  return abbreviations[type] || 'DTE';
}

function getDteColor(type) {
  const colors = {
    '01': 'blue',
    '03': 'green',
    '04': 'blue-grey',
    '05': 'orange-darken-2',
    '06': 'purple',
    '07': 'teal',
    '11': 'indigo',
    '14': 'cyan-darken-1',
  };
  return colors[type] || 'grey';
}

function getStatusColor(status) {
  const colors = {
    'PROCESADO': 'success',
    'INVALIDADO': 'error',
    'RECHAZADO': 'red-darken-3',
    'CONTINGENCIA_PENDIENTE': 'warning',
  };
  return colors[status] || 'grey';
}

function getStatusIcon(status) {
  const icons = {
    'PROCESADO': 'mdi-check-circle',
    'INVALIDADO': 'mdi-cancel',
    'RECHAZADO': 'mdi-alert-circle',
    'CONTINGENCIA_PENDIENTE': 'mdi-clock-alert-outline',
  };
  return icons[status] || 'mdi-help-circle';
}

function getRowProps({ item }) {
  if (item.estado === 'INVALIDADO') {
    return { class: 'invalid-row' };
  }
  return {};
}

const generatedFilename = computed(() => {
  if (!jsonDialog.value.data) {
    return 'dte.json';
  }

  try {
    const emisor = jsonDialog.value.data.emisor.nombre.split(',')[0].trim().replace(/\s+/g, '-');
    const receptor = jsonDialog.value.data.receptor.nombre.split(',')[0].trim().replace(/\s+/g, '-');
    const fecha = new Date(jsonDialog.value.data.identificacion.fecEmi + 'T00:00:00');
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');

    return `${emisor}_${receptor}_${anio}_${mes}.json`;
  } catch (e) {
    console.error("Error generando el nombre del archivo:", e);
    return `DTE_${jsonDialog.value.data.identificacion.codigoGeneracion.substring(0, 8)}.json`;
  }
});

function downloadPdfFromDialog() {
  const item = jsonDialog.value.item;
  if (item) {
    downloadPdf(item); // Correcto, llama a la función que maneja el blob.
  }
}

async function shareOnWhatsAppFromDialog() {
  const item = jsonDialog.value.item;
  if (!item) return;

  // Obtenemos los datos necesarios del diálogo
  const dteData = jsonDialog.value.data;
  if (!dteData) return;
  
  // 1. Obtenemos el número de teléfono del receptor
  let telefono = dteData.receptor?.telefono;

  if (!telefono) {
    notificationStore.showNotification({ message: 'Este cliente no tiene un número de teléfono registrado.', color: 'warning' });
    return;
  }

  // 2. Limpiamos el número: quitamos guiones, espacios, paréntesis, etc.
  let telefonoLimpio = telefono.replace(/[\s-()]/g, '');

  // 3. (IMPORTANTE) Nos aseguramos de que tenga el código de país (503 para El Salvador)
  // Si el número tiene 8 dígitos, asumimos que es local y le agregamos el 503.
  if (telefonoLimpio.length === 8) {
    telefonoLimpio = '503' + telefonoLimpio;
  }
  
  // Inicia la carga justo antes de pedir el link
  item.whatsAppLoading = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api(`/api/invoices/${dteData.identificacion.codigoGeneracion}/public-link`);
    const shareableLink = response.url;

    let message = `Hola ${dteData.receptor.nombre},\n`;
    message += `Te compartimos tu DTE de ${dteData.emisor.nombreComercial}.\n\n`;
    message += `Puedes verlo y descargarlo aquí:\n${shareableLink}`;
    
    // 4. Construimos la URL final CON el número de teléfono
    const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');

  } catch (error) {
    notificationStore.showNotification({ message: 'No se pudo obtener el enlace para compartir.', color: 'error' });
  } finally {
    item.whatsAppLoading = false;
  }
}

function invalidateFromDialog() {
  const item = jsonDialog.value.item;
  if (item) {
    openInvalidateDialog(item);
    jsonDialog.value.show = false; // Cerramos el diálogo para abrir el de invalidar
  }
}

async function reenviarCorreo(item) {
  // Estado de carga individual para el botón
  item.isSendingEmail = true; 

  try {
    const { $api } = useNuxtApp();
    const url = `/api/invoices/${item.id}/resend-email`;

    // Usamos el método POST para ejecutar la acción
    const response = await $api(url, { 
      method: 'POST' 
    });

    // Usamos tu notificationStore para el feedback
    notificationStore.showNotification({ 
      message: response.message || 'Correo encolado exitosamente.', 
      color: 'success' 
    });

  } catch (error) {
    const errorMessage = error.data?.message || 'No se pudo reenviar el correo.';
    notificationStore.showNotification({ message: errorMessage, color: 'error' });
    console.error("Error al reenviar correo:", error);
    
  } finally {
    // Quitamos el estado de carga
    item.isSendingEmail = false; 
  }
}
</script>

<style>

.invalid-row {
  filter: grayscale(90%);
  opacity: 0.6;
  transition: all 0.2s ease-in-out;
}
.invalid-row:hover {
  filter: grayscale(0%);
  opacity: 1;
}
</style>