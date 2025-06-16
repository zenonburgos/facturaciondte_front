<template>
  <v-container>
    <h1 class="mb-4">Emitir Nuevo Documento Tributario</h1>

    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Nuevo Cliente</span>
        </v-card-title>
        <v-card-text>
          <v-text-field label="Nombre Completo o Razón Social*" v-model="newClient.nombre" required></v-text-field>
          <v-text-field label="NIT" v-model="newClient.nit"></v-text-field>
          <v-text-field label="NRC" v-model="newClient.nrc"></v-text-field>
          <v-text-field label="Correo Electrónico" v-model="newClient.correo" type="email"></v-text-field>
          </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveNewClient">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card class="mt-4">
      <v-card-text>
        <v-form @submit.prevent="submitDTE">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.tipo_dte"
                :items="documentTypes"
                item-title="title"
                item-value="value"
                label="Tipo de Documento"
                variant="outlined"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
                <v-select
                    v-model="form.condicion_operacion"
                    :items="[{title: 'Contado', value: '1'}, {title: 'A Crédito', value: '2'}]"
                    label="Condición de la Operación"
                    variant="outlined"
                ></v-select>
            </v-col>
          </v-row>

          <v-autocomplete
            v-model="selectedClient"
            v-model:search="searchTerm"
            :items="searchResults"
            :loading="searchLoading"
            item-title="nombre"
            return-object
            label="Cliente"
            placeholder="Escriba para buscar..."
            variant="outlined"
            class="mt-2"
          >
            <template v-slot:append>
              <v-btn density="compact" color="primary" @click="dialog = true" icon="mdi-plus" title="Crear Nuevo Cliente"></v-btn>
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="`NIT: ${item.raw.nit || 'N/A'}`"></v-list-item>
            </template>
          </v-autocomplete>
          
          <div v-if="form.tipo_dte === '03' && form.cliente.id">
            <p class="text-caption">Datos del Cliente Seleccionado:</p>
            <v-row dense>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nit" label="NIT" variant="underlined" readonly></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nrc" label="NRC" variant="underlined" readonly></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.correo" label="Correo" variant="underlined" readonly></v-text-field></v-col>
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
                <tr>
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
        <v-btn color="success" size="large" @click="submitDTE" :disabled="!isFormValid" :loading="loading">
          Emitir Documento
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

// Estado del Frontend
const documentTypes = ref([]);
const selectedClient = ref(null);
const dialog = ref(false);
const newClient = ref({ nombre: '', nit: '', nrc: '', correo: '' });
const loading = ref(false);
const error = ref(null);

const form = ref({
  tipo_dte: '01',
  condicion_operacion: '1',
  cliente: {},
  items: [],
});

const newItem = ref({
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
});

// Buscador
const searchLoading = ref(false);
const searchResults = ref([]);
const searchTerm = ref('');
let searchTimeout = null;

// ---- LÓGICA DEL COMPONENTE ----

// Al cargar, busca los tipos de DTE y el cliente por defecto
onMounted(async () => {
  try {
    const [types, genericClient] = await Promise.all([
      $fetch('http://localhost:8000/api/document-types', { headers: { 'Authorization': `Bearer ${authStore.token}` } }),
      $fetch('http://localhost:8000/api/clients/search?term=CLIENTE VARIOS', { headers: { 'Authorization': `Bearer ${authStore.token}` } })
    ]);
    documentTypes.value = types;
    console.log("Tipos de DTE cargados:", documentTypes.value);
    
    if(genericClient && genericClient.length > 0) {
      selectedClient.value = genericClient[0];
    }
  } catch (error) {
    console.error("Error al cargar datos iniciales:", error);
  }
});

// Observa cuando el usuario escribe para buscar
watch(searchTerm, (newVal) => {
  clearTimeout(searchTimeout);
  if (newVal && newVal.length >= 3) {
    searchTimeout = setTimeout(() => {
      fetchClients(newVal);
    }, 500); // Espera 500ms antes de buscar (debounce)
  } else {
    searchResults.value = [];
  }
});

// Observa cuando un cliente es seleccionado y actualiza el formulario
watch(selectedClient, (client) => {
  form.value.cliente = client || {};
});

// Llama a la API de búsqueda
async function fetchClients(term) {
  searchLoading.value = true;
  try {
    const clients = await $fetch(`http://localhost:8000/api/clients/search?term=${term}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    });
    searchResults.value = clients;
  } catch (e) {
    console.error("Error buscando clientes:", e);
  } finally {
    searchLoading.value = false;
  }
};

// Guarda un nuevo cliente desde el diálogo
async function saveNewClient() {
  if (!newClient.value.nombre) {
    alert("El nombre es requerido.");
    return;
  }
  try {
    const savedClient = await $fetch('http://localhost:8000/api/clients', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authStore.token}` },
      body: newClient.value,
    });
    searchResults.value.unshift(savedClient);
    selectedClient.value = savedClient;
    dialog.value = false;
    newClient.value = { nombre: '', nit: '', nrc: '', correo: '' };
  } catch (error) {
    alert("Error al guardar el cliente.");
  }
}

// Lógica para añadir y quitar ítems
function addItem() {
  if (!newItem.value.descripcion || newItem.value.cantidad <= 0 || newItem.value.precio_unitario <= 0) return;
  form.value.items.push({ ...newItem.value });
  newItem.value = { descripcion: '', cantidad: 1, precio_unitario: 0 };
}

function removeItem(index) {
  form.value.items.splice(index, 1);
}

// --- PROPIEDADES COMPUTADAS ---

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
  const clienteValido = !!form.value.cliente?.id || (form.value.tipo_dte === '01' && !!form.value.cliente?.nombre);
  return clienteValido && form.value.items.length > 0 && !loading.value;
});

// --- SUBMIT FINAL ---

async function submitDTE() {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch('http://localhost:8000/api/invoices', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authStore.token}`, 'Accept': 'application/json' },
      body: form.value,
    });

    if (response.estado === 'PROCESADO') {
      alert(`¡DTE Procesado! Sello: ${response.selloRecibido}`);
      router.push('/historial');
    } else {
      error.value = `Rechazado: ${response.observaciones?.join(', ')}`;
    }
  } catch (err) {
    error.value = err.data?.message || 'Ocurrió un error inesperado.';
  } finally {
    loading.value = false;
  }
}
</script>