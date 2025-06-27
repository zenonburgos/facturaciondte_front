<template>
  <v-container>
    <h1 class="mb-4">Emitir Nuevo Documento Tributario</h1>

    <v-overlay :model-value="initialLoading" class="align-center justify-center" persistent>
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>

    <!-- dialogo para indicar si se transmite o no -->
    <v-dialog v-model="resultDialog.show" persistent max-width="600px">
      <v-card :color="resultDialog.success ? 'green-lighten-5' : 'red-lighten-5'">
        <v-card-title class="d-flex align-center">
          <v-icon 
            :icon="resultDialog.success ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" 
            :color="resultDialog.success ? 'success' : 'error'" 
            class="mr-3"
            size="large"
          ></v-icon>
          <span class="text-h5">{{ resultDialog.title }}</span>
        </v-card-title>
        
        <v-card-text class="text-body-1 pt-4">
          {{ resultDialog.message }}
          <p v-if="resultDialog.details" class="text-caption mt-3">
            <strong>Detalles:</strong> {{ resultDialog.details }}
          </p>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="primary" variant="text" @click="closeResultDialog">
            Entendido
          </v-btn>

          <v-btn
            v-if="!resultDialog.success"
            color="secondary"
            variant="flat"
            @click="retrySubmit"
          >
            Reintentar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog.show" persistent max-width="800px">
      <v-card>
        <v-card-title><span class="text-h5">Nuevo Cliente</span></v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8"><v-text-field label="Nombre Completo o Razón Social*" v-model="dialog.newClient.nombre" required></v-text-field></v-col>
            <v-col cols="12" md="4"><v-text-field label="Nombre Comercial" v-model="dialog.newClient.nombre_comercial"></v-text-field></v-col>
            <v-col cols="12" md="4"><v-text-field label="NIT" v-model="dialog.newClient.nit"></v-text-field></v-col>
            <v-col cols="12" md="4"><v-text-field label="NRC" v-model="dialog.newClient.nrc"></v-text-field></v-col>
            <v-col cols="12" md="4"><v-text-field label="Teléfono" v-model="dialog.newClient.telefono"></v-text-field></v-col>
            <v-col cols="12" md="4"><v-text-field label="Código de Actividad" v-model="dialog.newClient.cod_actividad"></v-text-field></v-col>
            <v-col cols="12" md="8"><v-text-field label="Descripción de Actividad" v-model="dialog.newClient.desc_actividad"></v-text-field></v-col>
            <v-col cols="12"><v-text-field label="Correo Electrónico" v-model="dialog.newClient.correo" type="email"></v-text-field></v-col>
          </v-row>
          <v-card-text>
            <v-row>
              <v-divider class="my-3"></v-divider>
              <v-col cols="12" md="6">
                <v-select
                  label="Otro Tipo de Documento (Para NRE)"
                  v-model="dialog.newClient.tipo_documento"
                  :items="[{title:'DUI', value:'13'}, {title:'Pasaporte', value:'03'}, {title:'Otro', value:'37'}]"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field 
                  label="Número del Otro Documento"
                  v-model="dialog.newClient.num_documento"
                ></v-text-field>
              </v-col>
              <v-divider class="my-3"></v-divider>

            </v-row>
            </v-card-text>
          <h4 class="mt-4">Dirección</h4>
          <v-divider class="mb-2"></v-divider>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-select label="Departamento" v-model="dialog.newClient.direccion.departamento" :items="locations" item-title="nombre" item-value="codigo"></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select label="Municipio" v-model="dialog.newClient.direccion.municipio" :items="filteredMunicipios" item-title="nombre" item-value="codigo" :disabled="!dialog.newClient.direccion.departamento"></v-select>
            </v-col>
          </v-row>
          <v-textarea label="Complemento (Calle, # Casa, Colonia...)" v-model="dialog.newClient.direccion.complemento" rows="2"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveNewClient" :loading="dialog.loading">Guardar Cliente</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card class="mt-4" :loading="loading" :disabled="initialLoading">
      <v-card-text>
        <v-form @submit.prevent="submitDTE">
          <v-row>
            <v-col cols="12" md="6">
              <v-select v-model="form.tipo_dte" :items="documentTypes" item-title="title" item-value="value" label="Tipo de Documento" variant="outlined"></v-select>
            </v-col>
            <v-col v-if="form.tipo_dte !== '04'" cols="12" md="6">
              <v-select v-model="form.condicion_operacion" :items="[{title: 'Contado', value: '1'}, {title: 'A Crédito', value: '2'}, {title: 'Otro', value: '3'}]" label="Condición de la Operación" variant="outlined"></v-select>
            </v-col>
          </v-row>

          <v-row v-if="form.tipo_dte === '05' || form.tipo_dte === '06'" class="mt-4">
            <v-col cols="12">
              <v-autocomplete
                v-model="form.documento_relacionado"
                @update:modelValue="handleDocumentoSeleccionado" v-model:search="searchTermDoc"
                :items="searchResultsDoc"
                :loading="searchLoadingDoc"
                item-title="numero_control"
                return-object
                label="Buscar CCFE a afectar (por Nº Control o Código Generación)*"
                placeholder="Escriba para buscar el CCFE..."
                variant="outlined"
                clearable
                no-filter
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :subtitle="`Cod. Gen: ${item.raw.codigo_generacion.slice(0, 15)}...`"
                    :title="`Nº Control: ${item.raw.numero_control}`"
                  ></v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <v-autocomplete
            v-model="form.cliente"
            v-model:search="searchTerm"
            :items="searchResults"
            :loading="searchLoading"
            item-title="nombre"
            return-object
            label="Cliente"
            placeholder="Escriba para buscar..."
            variant="outlined"
            class="mt-2"
            clearable
          >
            <template v-slot:append>
              <v-btn density="compact" color="primary" @click="openDialog" icon="mdi-plus" title="Crear Nuevo Cliente"></v-btn>
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="`NIT: ${item.raw.nit || 'N/A'}`"></v-list-item>
            </template>
          </v-autocomplete>
          
          <v-card 
            v-if="['03', '05', '06'].includes(form.tipo_dte) && form.cliente?.id"
            variant="tonal"
            class="mt-4 mb-6 pa-3"
          >
            </v-card>

          <v-card
            v-if="form.tipo_dte === '14' && form.cliente"
            variant="tonal"
            class="mt-4 mb-6 pa-3"
          >
            <v-card-title class="pa-0">Datos del Sujeto Excluido</v-card-title>
            <p class="text-caption">Para este documento, solo se requiere el nombre y número de documento del cliente.</p>
            <v-row dense class="mt-2">
              <v-col cols="12" md="6">
                <p class="text-caption">Nombre</p>
                <p :class="!form.cliente.nombre && 'text-error font-weight-bold'">
                  {{ form.cliente.nombre || 'REQUERIDO' }}
                </p>
              </v-col>
              <v-col cols="12" md="6">
                <p class="text-caption">Documento</p>
                <p :class="!form.cliente.numDocumento && 'text-error font-weight-bold'">
                  {{ form.cliente.numDocumento || 'REQUERIDO' }}
                </p>
              </v-col>
            </v-row>
          </v-card>

          <v-card 
            v-if="form.tipo_dte === '03' && form.cliente?.id"
            variant="tonal"
            class="mt-4 mb-6 pa-3"
          >
            <div class="d-flex justify-space-between align-center mb-2">
              <v-card-title class="pa-0">Datos del Receptor (CCFE)</v-card-title>
              <v-btn size="small" variant="text" color="primary">Editar Cliente</v-btn>
            </div>
            
            <v-row dense>
              <v-col cols="12" md="4">
                <p class="text-caption">NIT</p>
                <p :class="!form.cliente.nit && 'text-error font-weight-bold'">{{ form.cliente.nit || 'REQUERIDO' }}</p>
              </v-col>
              <v-col cols="12" md="4">
                <p class="text-caption">NRC</p>
                <p :class="!form.cliente.nrc && 'text-error font-weight-bold'">{{ form.cliente.nrc || 'REQUERIDO' }}</p>
              </v-col>
              <v-col cols="12" md="4">
                <p class="text-caption">Nombre Comercial</p>
                <p :class="!form.cliente.nombre_comercial && 'text-error font-weight-bold'">{{ form.cliente.nombre_comercial || 'REQUERIDO' }}</p>
              </v-col>
              <v-col cols="12" md="8">
                <p class="text-caption">Actividad Económica</p>
                <p :class="!form.cliente.desc_actividad && 'text-error font-weight-bold'">{{ form.cliente.desc_actividad || 'REQUERIDO' }}</p>
              </v-col>
              <v-col cols="12" md="4">
                <p class="text-caption">Correo Electrónico</p>
                <p :class="!form.cliente.correo && 'text-error font-weight-bold'">{{ form.cliente.correo || 'REQUERIDO' }}</p>
              </v-col>
            </v-row>
          </v-card>

          <v-divider class="my-6"></v-divider>

          <v-row>
            <v-col>
              <v-checkbox
                v-model="esVentaTercero"
                label="¿Es una Venta por Cuenta de Tercero?"
              ></v-checkbox>
            </v-col>
          </v-row>

          <v-card v-if="esVentaTercero" variant="tonal" class="mb-6 pa-4">
            <h3 class="mb-4 text-h6">Datos del Tercero (Mandante)</h3>
            <v-autocomplete
              v-model="mandante"
              :items="mandanteResults"
              v-model:search="mandanteSearchTerm"
              :loading="mandanteSearchLoading"
              item-title="nombre"
              return-object
              label="Buscar Tercero (por Nombre, NIT o NRC)"
              variant="outlined"
              placeholder="Escriba para buscar un cliente..."
              no-filter
              clearable
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.nombre" :subtitle="`NIT: ${item.raw.nit}`"></v-list-item>
              </template>
            </v-autocomplete>
          </v-card>
          <v-divider class="my-6"></v-divider>
          
          <div v-if="form.tipo_dte === '03' && form.cliente?.id" class="mb-4">
            <p class="text-caption">Datos del Cliente Seleccionado:</p>
            <v-row dense>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nit" label="NIT" variant="underlined" readonly density="compact"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nrc" label="NRC" variant="underlined" readonly density="compact"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.correo" label="Correo" variant="underlined" readonly density="compact"></v-text-field></v-col>
            </v-row>
          </div>

          <div v-if="form.tipo_dte !== '07'">
            <h3 class="mt-8">Ítems</h3>
            <v-divider class="mb-4"></v-divider>
            <v-row align="center">
              <v-col cols="12" md="5"><v-text-field v-model="newItem.descripcion" label="Descripción" variant="outlined" density="compact"></v-text-field></v-col>
              <v-col cols="12" md="2"><v-text-field v-model.number="newItem.cantidad" label="Cantidad" type="number" variant="outlined" density="compact"></v-text-field></v-col>
              <v-col cols="12" md="3"><v-text-field v-model.number="newItem.precio_unitario" :label="precioUnitarioLabel" type="number" prefix="$" variant="outlined" density="compact"></v-text-field></v-col>
              <v-col cols="12" md="2"><v-btn color="primary" @click="addItem" prepend-icon="mdi-plus">Añadir</v-btn></v-col>
            </v-row>

            <v-table v-if="form.items.length > 0" density="compact" class="mt-4 border">
              <thead>
                <tr>
                  <th class="text-left">Descripción</th><th class="text-left">Cantidad</th><th class="text-left">P. Unitario</th><th class="text-right">Subtotal</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in form.items" :key="index">
                  <td>{{ item.descripcion }}</td><td>{{ item.cantidad }}</td>
                  <td>${{ item.precio_unitario.toFixed(2) }}</td>
                  <td class="text-right">${{ (item.cantidad * item.precio_unitario).toFixed(2) }}</td>
                  <td><v-btn icon="mdi-delete" variant="text" color="error" size="x-small" @click="removeItem(index)"></v-btn></td>
                </tr>
              </tbody>
              <tfoot v-if="subtotales.total > 0">
      
                <tr v-if="form.tipo_dte !== '01'">
                    <td colspan="3" class="text-right font-weight-bold">SUBTOTAL</td>
                    <td class="text-right font-weight-bold">${{ subtotales.subTotal.toFixed(2) }}</td>
                    <td></td>
                </tr>

                <tr v-if="form.tipo_dte === '03'">
                    <td colspan="3" class="text-right font-weight-bold">IVA (13%)</td>
                    <td class="text-right font-weight-bold">${{ subtotales.iva.toFixed(2) }}</td>
                    <td></td>
                </tr>

                <tr>
                    <td colspan="3" class="text-right text-h6">TOTAL</td>
                    <td class="text-right text-h6">${{ subtotales.total.toFixed(2) }}</td>
                    <td></td>
                </tr>

            </tfoot>
            </v-table>
          </div>
          <v-card class="mt-6" v-if="form.tipo_dte === '07'">
          <v-card-title>Documentos a los que se Aplica Retención</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Tipo DTE</th>
                  <th>Nº Documento</th>
                  <th>Monto Sujeto Ret.</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(doc, index) in form.documentos_retenidos" :key="index">
                  <td>{{ doc.tipoDte }}</td>
                  <td>{{ doc.numeroDocumento }}</td>
                  <td>${{ doc.montoSujetoGrav }}</td>
                  <td>
                    <v-btn icon="mdi-delete" size="x-small" color="error" @click="eliminarDocumentoRetenido(index)"></v-btn>
                  </td>
                </tr>
                <tr v-if="form.documentos_retenidos.length === 0">
                    <td colspan="4" class="text-center">Añada un documento para aplicar retención...</td>
                </tr>
              </tbody>
            </v-table>

            <v-divider class="my-4"></v-divider>

            <p class="mb-4 font-weight-bold">Añadir Documento:</p>
            <v-row>
                <v-col cols="12" md="3">
                    <v-select label="Tipo DTE afectado" :items="[{title: 'CCF', value: '03'}]" v-model="nuevoDocRetenido.tipoDte" variant="outlined"></v-select>
                </v-col>
                <v-col cols="12" md="3">
                    <v-select label="Tipo Generación" :items="[{title: 'Electrónico', value: 2}, {title: 'Físico', value: 1}]" v-model="nuevoDocRetenido.tipoDoc" variant="outlined"></v-select>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field label="Nº Documento o Código Generación" v-model="nuevoDocRetenido.numeroDocumento" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field type="date" label="Fecha Emisión" v-model="nuevoDocRetenido.fechaEmision" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field type="number" label="Monto Sujeto a Retención" v-model="nuevoDocRetenido.montoSujetoGrav" prefix="$" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field label="Descripción" v-model="nuevoDocRetenido.descripcion" variant="outlined"></v-text-field>
                </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="agregarDocumentoRetenido">Añadir Documento</v-btn>
          </v-card-actions>
        </v-card>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-alert v-if="error" type="error" dense class="flex-grow-1 mr-4" :text="error"></v-alert>
        <v-spacer v-else></v-spacer>
        <v-btn color="success" size="large" @click="submitDTE" :disabled="!isFormValid" :loading="loading">Emitir Documento</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';

const { $api } = useNuxtApp();
// --- INICIALIZACIÓN ---
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

// --- ESTADOS ---
const initialLoading = ref(true);
const loading = ref(false);
const error = ref(null);
const documentTypes = ref([]);
const locations = ref([]);
const searchLoading = ref(false);
const searchResults = ref([]);
const searchTerm = ref('');
let searchTimeout = null;

const searchTermDoc = ref('');
const searchLoadingDoc = ref(false);
const searchResultsDoc = ref([]);
let searchTimeoutDoc = null;

const genericClient = ref(null);

const form = ref({
  tipo_dte: '01',
  condicion_operacion: '1',
  cliente: null, // Inicializamos como null para claridad
  items: [],
  documento_relacionado: null,
  documentos_retenidos: [],
});

const esVentaTercero = ref(false); // Checkbox para activar la sección
const mandante = ref(null); // Aquí guardaremos el objeto del tercero seleccionado
const mandanteSearchTerm = ref(''); // Para el input de búsqueda del tercero
const mandanteSearchLoading = ref(false);
const mandanteResults = ref([]);
let mandanteSearchTimeout = null;

const resultDialog = ref({
  show: false,
  success: false,
  title: '',
  message: '',
  details: ''
});

const nuevoDocRetenido = ref({
    tipoDte: '03', // Por defecto, un CCF
    tipoDoc: 2,    // Por defecto, Electrónico
    numeroDocumento: '',
    fechaEmision: new Date().toISOString().split('T')[0], // Fecha de hoy
    montoSujetoGrav: null,
    descripcion: ''
});

const newItem = ref({
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
});

const dialog = ref({
  show: false,
  loading: false,
  newClient: {
    nombre: '', nit: '', nrc: '', correo: '', nombre_comercial: '',
    cod_actividad: '', desc_actividad: '', telefono: '',
    direccion: { departamento: null, municipio: null, complemento: '' }
  }
});

// --- LÓGICA DE CARGA INICIAL ---
onMounted(async () => {
  initialLoading.value = true;
  try {
    const { $api } = useNuxtApp();
    const [types, fetchedGenericClient, fetchedLocations] = await Promise.all([
      $api('/api/document-types'),
      $api('/api/clients/generic'),
      $api('/api/locations')
    ]);
    
    documentTypes.value = types;
    locations.value = fetchedLocations;
    
    if (fetchedGenericClient && fetchedGenericClient.data.id) {
      genericClient.value = fetchedGenericClient.data;
      form.value.cliente = fetchedGenericClient.data; // Establecemos el cliente por defecto
    }
  } catch (err) {
    notificationStore.showNotification({ message: 'No se pudieron cargar los datos iniciales.', color: 'error' });
  } finally {
    initialLoading.value = false;
  }
});

watch(() => form.value.tipo_dte, (newType) => {
  // Definimos una lista de los DTEs que no pueden usar un cliente genérico.
  const requiresSpecificClient = ['03', '04', '05']; // CCFE, Nota de Remisión, Nota de Crédito

  // Si el nuevo tipo de documento REQUIERE un cliente específico...
  if (requiresSpecificClient.includes(newType)) {
    // ...limpiamos la selección actual para forzar al usuario a buscar uno.
    form.value.cliente = null;
  } else {
    // ...si NO lo requiere (como la Factura '01'), seleccionamos el cliente genérico.
    form.value.cliente = genericClient.value;
  }
});

// --- OBSERVADORES (WATCHERS) ---
watch(searchTerm, (newVal) => {
  // Evitamos que la búsqueda se dispare si el texto es el del cliente ya seleccionado
  if (form.value.cliente && newVal === form.value.cliente.nombre) return;
  
  clearTimeout(searchTimeout);
  if (newVal && newVal.length >= 2) {
    searchTimeout = setTimeout(() => fetchClients(newVal), 500);
  } else {
    searchResults.value = [];
  }
});

watch(() => dialog.value.newClient.direccion.departamento, () => {
  dialog.value.newClient.direccion.municipio = null;
});

watch(searchTermDoc, (newVal) => {
  if (form.value.documento_relacionado && newVal === form.value.documento_relacionado.numero_control) return;

  clearTimeout(searchTimeoutDoc);
  if (newVal && newVal.length >= 3) {
    searchTimeoutDoc = setTimeout(() => fetchDocuments(newVal), 500);
  } else {
    searchResultsDoc.value = [];
  }
});

watch(esVentaTercero, (newVal) => {
  if (!newVal) {
    mandante.value = null;
  }
});

watch(mandanteSearchTerm, (newVal) => {
  clearTimeout(mandanteSearchTimeout);
  if (newVal && newVal.length >= 3) {
    mandanteSearchTimeout = setTimeout(async () => {
      mandanteSearchLoading.value = true;
      try {
        // Usamos el buscador de clientes general. ¡Cualquier cliente puede ser un tercero!
        const response = await $api(`/api/clients/search?term=${newVal}`);
        mandanteResults.value = response.data;
      } finally {
        mandanteSearchLoading.value = false;
      }
    }, 500);
  }
});

async function fetchDocuments(term) {
  searchLoadingDoc.value = true;
  try {
    const { $api } = useNuxtApp();
    // Este endpoint lo crearemos en el backend en un momento
    const response = await $api(`/api/invoices/search-for-credit-note?term=${term}`);
    searchResultsDoc.value = response; // Asumimos que la API devuelve un array directamente
  } catch (e) {
    notificationStore.showNotification({ message: 'Error al buscar documentos.', color: 'error' });
  } finally {
    searchLoadingDoc.value = false;
  }
}

// --- PROPIEDADES COMPUTADAS ---
const filteredMunicipios = computed(() => {
  if (!dialog.value.newClient.direccion.departamento) return [];
  const selectedDept = locations.value.find(d => d.codigo === dialog.value.newClient.direccion.departamento);
  return selectedDept ? selectedDept.municipios : [];
});

const precioUnitarioLabel = computed(() => 
  form.value.tipo_dte === '01' ? 'Precio Unitario (con IVA)' : 'Precio Unitario (sin IVA)'
);

const subtotales = computed(() => {
  const subTotal = form.value.items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
  if (form.value.tipo_dte === '01') {
    const total = subTotal;
    const baseImponible = total / 1.13;
    const iva = total - baseImponible;
    return { subTotal: baseImponible, iva: iva, total: total };
  } else {
    const iva = subTotal * 0.13;
    return { subTotal: subTotal, iva: iva, total: subTotal + iva };
  }
});

const isFormValid = computed(() => {
  
  let isClientValid = false;
  const cliente = form.value.cliente;
  

  if (cliente) {
    switch (form.value.tipo_dte) {
      case '01': // Factura
        isClientValid = !!cliente.nombre;
        break;
      
      case '03': // Crédito Fiscal
      case '05':
      case '06':
        isClientValid = !!cliente.nit && !!cliente.nrc && !!cliente.nombreComercial &&
                        !!cliente.codActividad && !!cliente.descActividad && 
                        !!cliente.direccion && !!cliente.telefono && !!cliente.correo;
        break;

      case '04': // Nota de Remisión
        isClientValid = !!cliente.tipoDocumento && !!cliente.numDocumento && 
                        !!cliente.nombre && !!cliente.direccion;
        break;
      
      case '07': // Comprobante de Retención
          // La validación del cliente es igual a la de un CCF
          isClientValid = !!cliente.nit && !!cliente.nrc && !!cliente.nombre;
          // Y debe tener al menos un documento retenido
          return isClientValid && form.value.documentos_retenidos.length > 0 && !loading.value;
      case '14': // Factura de Sujeto Excluido
        // Solo validamos que el cliente tenga nombre y número de documento
        isClientValid = !!cliente.nombre && !!cliente.numDocumento;
        break;
      
      default:
        isClientValid = false;
        
    }
  }
  
  // El formulario es válido si el cliente es válido, hay ítems, y no estamos en medio de otra operación.
  return isClientValid && form.value.items.length > 0 && !loading.value;
});

// --- MÉTODOS ---
function openDialog() { dialog.value.show = true; }

function closeDialog() {
    dialog.value.show = false;
    dialog.value.newClient = {
        nombre: '', nit: '', nrc: '', correo: '', nombre_comercial: '',
        cod_actividad: '', desc_actividad: '', telefono: '',
        direccion: { departamento: null, municipio: null, complemento: '' }
    };
}

async function fetchClients(term) {
  searchLoading.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api(`/api/clients/search?term=${term}`);
    searchResults.value = response.data;
  } catch (e) {
    notificationStore.showNotification({ message: 'Error al buscar clientes.', color: 'error' });
  } finally {
    searchLoading.value = false;
  }
}

async function saveNewClient() {
  if (!dialog.value.newClient.nombre) {
    return notificationStore.showNotification({ message: 'El nombre del cliente es requerido.', color: 'warning' });
  }
  dialog.value.loading = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api('/api/clients', {
      method: 'POST',
      body: dialog.value.newClient,
    });

    const savedClientData = response.data;
    
    searchResults.value.unshift(savedClientData);
    form.value.cliente = savedClientData;

    notificationStore.showNotification({ message: 'Cliente guardado exitosamente.' });
    closeDialog();
  } catch (err) {
    notificationStore.showNotification({ message: err.data?.message || 'Error al guardar el cliente.', color: 'error' });
  } finally {
    dialog.value.loading = false;
  }
}

function addItem() {
  if (!newItem.value.descripcion || newItem.value.cantidad <= 0 || newItem.value.precio_unitario <= 0) return;
  form.value.items.push({ ...newItem.value });
  newItem.value = { descripcion: '', cantidad: 1, precio_unitario: 0 };
}

function removeItem(index) {
  form.value.items.splice(index, 1);
}

async function submitDTE() {
  // Verificación inicial. Si el formulario no es válido, no hacemos nada.
  if (!isFormValid.value) {
    notificationStore.showNotification({ message: 'Formulario inválido. Revisa los datos del cliente y los ítems.', color: 'warning' });
    return;
  }
  
  loading.value = true;
  error.value = null;

  try {
    const { $api } = useNuxtApp();
    
    // El payload ahora es una copia directa y limpia del estado del formulario.
    const payload = { ...form.value };

    if (['05', '06'].includes(payload.tipo_dte) && form.value.documento_relacionado) {
        const docRel = form.value.documento_relacionado;
        payload.documento_relacionado = {
            tipoDte: docRel.tipo_dte,
            codigoGeneracion: docRel.codigo_generacion,
            fecEmi: docRel.fh_procesamiento.split('T')[0] // Extrae solo la fecha YYYY-MM-DD
        };
    }

    if (esVentaTercero.value && mandante.value) {
      payload.ventaTercero = {
        nit: mandante.value.nit,
        nombre: mandante.value.nombre
      };
    }

    if (payload.tipo_dte === '07') {
        payload.documentos_retenidos = form.value.documentos_retenidos;
    } else {
        payload.items = form.value.items;
    }
    
    // Hacemos la llamada a nuestro backend.
    const response = await $api('/api/invoices', {
      method: 'POST',
      body: payload,
    });

    // Interpretamos la respuesta de NUESTRO backend.
    if (response.estado === 'PROCESADO') {
      resultDialog.value = {
        show: true,
        success: true,
        title: 'Transmisión Exitosa',
        message: 'El Documento Tributario Electrónico ha sido procesado y aceptado por el Ministerio de Hacienda.',
        details: `Nº Control: ${response.numeroControl}`
      };
    } else if (response.estado === 'CONTINGENCIA' || response.estado === 'CONTINGENCIA_PENDIENTE') {
      resultDialog.value = {
        show: true,
        success: true, // Lo marcamos como éxito para el usuario
        title: 'Documento en Contingencia',
        message: 'No hubo conexión con Hacienda. El documento se guardó correctamente y se enviará de forma automática más tarde.',
        details: `Nº Control: ${response.numero_control}` // Nota: el campo puede variar
      };
    } else {
      // const errorMsg = response.observaciones ? response.observaciones.join(', ') : 'Respuesta de rechazo no especificada.';
      // resultDialog.value = {
      //   show: true,
      //   success: false,
      //   title: 'Documento Rechazado',
      //   message: 'Hacienda rechazó el documento. Por favor, revisa los detalles del error.',
      //   details: errorMsg
      // };
      const errorMsg = response.observaciones ? response.observaciones.join(', ') : 'Respuesta de rechazo no especificada.';
      resultDialog.value = {
        show: true, success: false, title: 'Documento Rechazado',
        message: 'Hacienda rechazó el documento. Por favor, revisa los detalles del error.',
        details: errorMsg
      };
    }

  } catch (err) {
    // Este bloque maneja errores de conexión (Frontend -> Backend) o cualquier otro error inesperado.
    console.error("Error en la petición de emisión:", err);
    const errorMsg = err.data?.message || 'Error de conexión con el servidor. Por favor, revise su internet.';
    // notificationStore.showNotification({ 
    //   message: errorMsg, 
    //   color: 'error' 
    // });
    resultDialog.value = {
      show: true, success: false, title: 'Error de Transmisión',
      message: 'No se pudo completar la solicitud al servidor. Verifica tu conexión o contacta a soporte.',
      details: errorMsg
    };
  } finally {
    // Nos aseguramos de que el estado de carga siempre se desactive.
    loading.value = false;
  }
}

function resetForm() {
  // Limpiamos la lista de ítems
  form.value.items = [];
  
  // Volvemos a la lógica que define el cliente por defecto
  const requiresSpecificClient = ['03', '04', '05'];
  if (!requiresSpecificClient.includes(form.value.tipo_dte)) {
      form.value.cliente = genericClient.value;
  } else {
      form.value.cliente = null;
  }
}

async function handleDocumentoSeleccionado(selectedDoc) {
  // Si el usuario borra la selección, limpiamos el formulario
  if (!selectedDoc) {
    form.value.cliente = genericClient.value; // Volvemos al cliente genérico o null
    form.value.items = [];
    return;
  }

  loading.value = true; // Activa el indicador de carga del formulario
  try {
    const { $api } = useNuxtApp();
    // Llamamos al nuevo endpoint que creamos en Laravel
    const originalDte = await $api(`/api/invoices/${selectedDoc.codigo_generacion}`);

    // 1. Autocompletamos el cliente con los datos del receptor del DTE original
    form.value.cliente = originalDte.json_enviado.receptor;

    // 2. Autocompletamos los ítems
    // Mapeamos los ítems del CCFE original al formato que necesita nuestro formulario
    form.value.items = originalDte.json_enviado.cuerpoDocumento.map(item => ({
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario: item.precioUni,
      codigo: item.codigo, // Incluimos el código si existe
    }));

    notificationStore.showNotification({ message: 'Cliente e ítems cargados desde el CCFE original.', color: 'info' });

  } catch (error) {
    notificationStore.showNotification({ message: 'No se pudieron cargar los detalles del documento seleccionado.', color: 'error' });
    // Limpiamos los campos en caso de error para evitar inconsistencias
    form.value.cliente = null;
    form.value.items = [];
  } finally {
    loading.value = false;
  }
}

function agregarDocumentoRetenido() {
  // Validación simple
  if (!nuevoDocRetenido.value.numeroDocumento || !nuevoDocRetenido.value.montoSujetoGrav) {
    notificationStore.showNotification({ message: 'Debe rellenar al menos el número de documento y el monto.', color: 'warning' });
    return;
  }

  form.value.documentos_retenidos.push({ ...nuevoDocRetenido.value });

  // Limpiar para el siguiente
  nuevoDocRetenido.value = {
    tipoDte: '03',
    tipoDoc: 2,
    numeroDocumento: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    montoSujetoGrav: null,
    descripcion: ''
  };
}

function eliminarDocumentoRetenido(index) {
  form.value.documentos_retenidos.splice(index, 1);
}

function closeResultDialog() {
  const wasSuccess = resultDialog.value.success;
  resultDialog.value.show = false; // Siempre oculta el diálogo

  if (wasSuccess) {
    // Solo redirigimos o reseteamos el form si fue un éxito
    router.push('/historial');
  }
  // Si fue un error, no hacemos nada más. El usuario se queda en la página.
}

function retrySubmit() {
  resultDialog.value.show = false; // Cierra el diálogo de error
  submitDTE(); // Vuelve a intentar la misma sumisión
}
</script>