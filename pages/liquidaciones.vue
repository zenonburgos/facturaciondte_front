<template>
  <v-container>
    <h1 class="mb-4">Nuevo Comprobante de Liquidación (CLE)</h1>

    <v-card :loading="loading">
      <v-card-text>
        <h3 class="mb-2">1. Seleccione el Mandante a liquidar</h3>
        <v-autocomplete
          v-model="mandante"
          :items="clientResults"
          v-model:search="searchTerm"
          :loading="searchLoading"
          item-title="nombre"
          item-value="nit"
          return-object
          label="Buscar Mandante (por Nombre, NIT o NRC)"
          variant="outlined"
          placeholder="Escriba para buscar..."
          no-filter
          clearable
        ></v-autocomplete>

        <div v-if="mandante">
          <h3 class="mt-8 mb-2">2. Seleccione los Documentos a Liquidar</h3>
          <v-data-table
            v-model="selectedDtes"
            :headers="headers"
            :items="dtesPendientes"
            :loading="dtesLoading"
            item-value="codigo_generacion"
            show-select
            class="border"
          >
            <template v-slot:item.total="{ item }">
              ${{ parseFloat(item.total).toFixed(2) }}
            </template>
            <template v-slot:item.fh_procesamiento="{ item }">
              {{ new Date(item.fh_procesamiento).toLocaleDateString() }}
            </template>
          </v-data-table>
        </div>
        
      </v-card-text>

      <v-divider></v-divider>

      <div v-if="selectedDtes.length > 0">
        <h3 class="mt-8 mb-2">3. Datos de Entrega y Observaciones</h3>
        <v-row>
            <v-col cols="12" md="6">
            <v-text-field
                v-model="form.extension.nombEntrega"
                label="Nombre de quien entrega"
                variant="outlined"
                density="compact"
            ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
            <v-text-field
                v-model="form.extension.docuEntrega"
                label="Documento de quien entrega"
                variant="outlined"
                density="compact"
            ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
            <v-text-field
                v-model="form.extension.nombRecibe"
                label="Nombre de quien recibe"
                variant="outlined"
                density="compact"
            ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
            <v-text-field
                v-model="form.extension.docuRecibe"
                label="Documento de quien recibe"
                variant="outlined"
                density="compact"
            ></v-text-field>
            </v-col>
        </v-row>
        <v-textarea
            v-model="form.extension.observaciones"
            label="Observaciones Generales"
            variant="outlined"
            rows="2"
        ></v-textarea>
      </div>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          size="large"
          :disabled="!mandante || selectedDtes.length === 0"
          :loading="isSubmitting"
          @click="submitCle"
        >
          Generar CLE
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useNotificationStore } from '~/stores/notifications';

const { $api } = useNuxtApp();
const notificationStore = useNotificationStore();

// --- ESTADOS ---
const loading = ref(false);
const isSubmitting = ref(false);

// Mandante (Receptor del CLE)
const mandante = ref(null);
const searchTerm = ref('');
const searchLoading = ref(false);
const clientResults = ref([]);
let searchTimeout = null;



// DTEs a liquidar
const dtesPendientes = ref([]);
const dtesLoading = ref(false);
const selectedDtes = ref([]);
const headers = [
  { title: 'Tipo', key: 'tipo_dte' },
  { title: 'Nº Control', key: 'numero_control' },
  { title: 'Código Generación', key: 'codigo_generacion' },
  { title: 'Fecha', key: 'fh_procesamiento' },
  { title: 'Total', key: 'total', align: 'end' },
];

const form = ref({
  condicion_operacion: '1',
  receptor: null, // Será el objeto del mandante
  cuerpoDocumento: [], // Será el array de DTEs seleccionados
  extension: {
    nombEntrega: '',
    docuEntrega: '',
    nombRecibe: '',
    docuRecibe: '',
    observaciones: 'Liquidación de documentos según detalle.' // Valor por defecto
  }
});

// Watcher para buscar clientes (mandantes)
watch(searchTerm, (newVal) => {
  clearTimeout(searchTimeout);
  if (newVal && newVal.length >= 3) {
    searchTimeout = setTimeout(async () => {
      searchLoading.value = true;
      try {
        const response = await $api(`/api/clients/search?term=${newVal}`);
        clientResults.value = response.data;
      } finally {
        searchLoading.value = false;
      }
    }, 500);
  }
});

// Watcher para cargar los DTEs pendientes cuando se selecciona un mandante
watch(mandante, async (newMandante) => {
  dtesPendientes.value = [];
  selectedDtes.value = [];
  if (newMandante && newMandante.nit) {
    dtesLoading.value = true;
    try {
      dtesPendientes.value = await $api(`/api/dtes-por-liquidar/${newMandante.nit}`);
    } catch (e) {
      notificationStore.showNotification({ message: 'Error al cargar documentos pendientes.', color: 'error' });
    } finally {
      dtesLoading.value = false;
    }
  }
});

watch(searchTerm, (newVal) => {
  clearTimeout(searchTimeout);
  if (newVal && newVal.length >= 2) { // Puedes ajustar la longitud mínima si quieres
    searchTimeout = setTimeout(async () => {
      searchLoading.value = true;
      try {
        // ===== INICIO DE LA MODIFICACIÓN =====
        // Cambiamos la URL a nuestro nuevo endpoint especializado
        const response = await $api(`/api/mandantes/search?term=${newVal}`);
        // Asumimos que el backend ya devuelve un array en el formato correcto
        clientResults.value = response.data; 
        // ===== FIN DE LA MODIFICACIÓN =====
      } catch (e) {
        notificationStore.showNotification({ message: 'Error al buscar mandantes.', color: 'error' });
      }
      finally {
        searchLoading.value = false;
      }
    }, 500);
  }
});

async function submitCle() {
  isSubmitting.value = true;
  
  const dtesSeleccionadosCompletos = dtesPendientes.value.filter(dte => 
    selectedDtes.value.includes(dte.codigo_generacion)
  );

  // Construir el cuerpo del documento para el CLE
  const cuerpoDocumentoCle = dtesSeleccionadosCompletos.map((dte, index) => {
    // Accedemos al JSON original del DTE que estamos liquidando
    const jsonOriginal = dte.json_enviado; 
    const itemOriginal = (jsonOriginal.cuerpoDocumento && jsonOriginal.cuerpoDocumento.length > 0) 
        ? jsonOriginal.cuerpoDocumento[0] 
        : {}; // Creamos un objeto vacío si no hay ítems

    // Devolvemos el objeto con TODOS los campos requeridos por Hacienda
    return {
      numItem: index + 1,
      tipoDte: dte.tipo_dte,
      tipoGeneracion: 2, // 1 para fisico, 2 para electronico
      numeroDocumento: dte.codigo_generacion,
      fechaGeneracion: new Date(dte.fh_procesamiento).toISOString().split('T')[0],
      ventaNoSuj: itemOriginal.ventaNoSuj ?? 0,
      ventaExenta: itemOriginal.ventaExenta ?? 0,
      ventaGravada: itemOriginal.ventaGravada ?? 0,
      exportaciones: itemOriginal.exportaciones ?? 0,
      tributos: itemOriginal.tributos ?? null,
      ivaItem: itemOriginal.ivaItem ?? 0,
      obsItem: `Liquidación DTE: ${dte.numero_control}`
    };
  });

  const payload = {
    tipo_dte: '08',
    condicion_operacion: form.value.condicion_operacion,
    receptor: mandante.value,
    cuerpoDocumento: cuerpoDocumentoCle,
    extension: form.value.extension,
    // El apéndice es requerido, lo añadimos
    apendice: [{ "campo": "NA", "etiqueta": "NA", "valor": "NA" }]
  };

  // Log del payload que se va a enviar, para verificación final
  console.log("Payload a enviar:", JSON.stringify(payload, null, 2));

  try {
    const response = await $api('/api/invoices', { method: 'POST', body: payload });

    if (response.estado === 'PROCESADO') {
      notificationStore.showNotification({ message: '¡CLE Procesado por Hacienda exitosamente!', color: 'success' });
      mandante.value = null; 
      selectedDtes.value = [];
    } else {
      notificationStore.showNotification({ message: `Rechazado: ${response.observaciones?.join(', ')}`, color: 'error' });
    }
  } catch (error) {
    console.error('Error de validación recibido del backend:', error.data);
    let errorMessage = 'Ocurrió un error al emitir el CLE.';
    if (error.data && error.data.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0];
      errorMessage = error.data.errors[firstErrorKey][0];
    } else if (error.data && error.data.message) {
      errorMessage = error.data.message;
    }
    notificationStore.showNotification({ message: `Error: ${errorMessage}`, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>