<template>
  <v-container>
    <h1 class="mb-4">Emitir Nuevo Documento Tributario</h1>

    <v-overlay :model-value="initialLoading" class="align-center justify-center" persistent>
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>

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
          
          <div v-if="form.tipo_dte === '03' && form.cliente?.id" class="mb-4">
            <p class="text-caption">Datos del Cliente Seleccionado:</p>
            <v-row dense>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nit" label="NIT" variant="underlined" readonly density="compact"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nrc" label="NRC" variant="underlined" readonly density="compact"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.correo" label="Correo" variant="underlined" readonly density="compact"></v-text-field></v-col>
            </v-row>
          </div>

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

const genericClient = ref(null);

const form = ref({
  tipo_dte: '01',
  condicion_operacion: '1',
  cliente: null, // Inicializamos como null para claridad
  items: [],
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
        isClientValid = !!cliente.nit && !!cliente.nrc && !!cliente.nombreComercial &&
                        !!cliente.codActividad && !!cliente.descActividad && 
                        !!cliente.direccion && !!cliente.telefono && !!cliente.correo;
        break;

      case '04': // Nota de Remisión
        isClientValid = !!cliente.tipoDocumento && !!cliente.numDocumento && 
                        !!cliente.nombre && !!cliente.direccion;
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
    
    // Hacemos la llamada a nuestro backend.
    const response = await $api('/api/invoices', {
      method: 'POST',
      body: payload,
    });

    // Interpretamos la respuesta de NUESTRO backend.
    if (response.estado === 'PROCESADO') {
      notificationStore.showNotification({ message: '¡DTE Procesado por Hacienda exitosamente!', color: 'success' });
      router.push('/historial');
    } else if (response.estado === 'CONTINGENCIA' || response.estado === 'CONTINGENCIA_PENDIENTE') {
      notificationStore.showNotification({ message: 'Hacienda no responde. El documento se guardó y se enviará más tarde.', color: 'info' });
      resetForm(); // Limpiamos el formulario para el siguiente DTE.
    } else {
      // Maneja otros posibles rechazos (ej. validación del backend que se nos escapó en el frontend).
      const errorMsg = response.observaciones ? response.observaciones.join(', ') : 'Respuesta de rechazo no especificada.';
      notificationStore.showNotification({ message: `Rechazado: ${errorMsg}`, color: 'error' });
    }

  } catch (err) {
    // Este bloque maneja errores de conexión (Frontend -> Backend) o cualquier otro error inesperado.
    console.error("Error en la petición de emisión:", err);
    const errorMsg = err.data?.message || 'Error de conexión con el servidor. Por favor, revise su internet.';
    notificationStore.showNotification({ 
      message: errorMsg, 
      color: 'error' 
    });
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
</script>