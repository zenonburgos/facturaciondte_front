<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">Gestión de Clientes</h1>
      <v-btn color="primary" @click="openNewClientDialog" prepend-icon="mdi-plus">
        Nuevo Cliente
      </v-btn>
    </div>

    <v-dialog v-model="dialog.show" persistent max-width="800px">
      <v-card>
        <v-card-title><span class="text-h5">{{ formTitle }}</span></v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="12" md="8"><v-text-field label="Nombre Completo o Razón Social*" v-model="editedItem.nombre" required :rules="[rules.required]"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="Nombre Comercial" v-model="editedItem.nombre_comercial"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="NIT" v-model="editedItem.nit"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="NRC" v-model="editedItem.nrc"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="Teléfono" v-model="editedItem.telefono"></v-text-field></v-col>
             <v-col cols="12">
              <v-autocomplete
                v-model="selectedActividad"
                v-model:search="actividadSearchTerm"
                :items="actividadResults"
                :loading="actividadLoading"
                item-title="descripcion"
                item-value="codigo"
                return-object
                label="Buscar Actividad Económica (por código o descripción)"
                placeholder="Escribe para buscar..."
                no-filter
                clearable
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :title="item.raw.descripcion"
                    :subtitle="`Código: ${item.raw.codigo}`"
                  ></v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

              <v-col cols="12"><v-text-field label="Correo Electrónico" v-model="editedItem.correo" type="email"></v-text-field></v-col>
            </v-row>
            <!-- SECCIÓN PARA OTROS DOCUMENTOS (DUI, Pasaporte, etc.) -->
            <v-divider class="my-4"></v-divider>
            <v-row>
                <v-col cols="12" md="6">
                    <v-select
                        label="Otro Tipo de Documento"
                        v-model="editedItem.tipo_documento"
                        :items="[{title:'DUI', value:'13'}, {title:'Pasaporte', value:'03'}, {title:'Otro', value:'37'}]"
                        clearable
                    ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field 
                        label="Número del Otro Documento"
                        v-model="editedItem.num_documento"
                        :disabled="!editedItem.tipo_documento"
                    ></v-text-field>
                </v-col>
            </v-row>
            <v-divider class="my-4"></v-divider>
            <h4 class="mt-4">Dirección</h4>
            <v-divider class="mb-2"></v-divider>
            <v-row>
              <v-col cols="12" md="6">
                <v-select label="Departamento" v-model="editedItem.direccion.departamento" :items="locations" item-title="nombre" item-value="codigo"></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select label="Municipio" v-model="editedItem.direccion.municipio" :items="filteredMunicipios" item-title="nombre" item-value="codigo" :disabled="!editedItem.direccion.departamento"></v-select>
              </v-col>
            </v-row>
            <v-textarea label="Complemento (Calle, # Casa, Colonia...)" v-model="editedItem.direccion.complemento" rows="2"></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialogs">Cancelar</v-btn>
          <v-btn color="blue-darken-1" variant="flat" @click="saveClient" :loading="dialog.loading">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.show" persistent max-width="500px">
        <v-card>
            <v-card-title class="text-h5">Confirmar Eliminación</v-card-title>
            <v-card-text>
                ¿Estás seguro de que quieres eliminar al cliente <strong>{{ deleteDialog.client?.nombre }}</strong>? Esta acción no se puede deshacer.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="closeDialogs">Cancelar</v-btn>
                <v-btn color="red-darken-1" variant="flat" @click="confirmDelete" :loading="deleteDialog.loading">Eliminar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-card>
      <!-- CAMPO DE BÚSQUEDA -->
      <v-card-title>
        <v-text-field
          v-model="searchTerm"
          append-inner-icon="mdi-magnify"
          label="Buscar por Nombre, NIT, NRC o Teléfono"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        ></v-text-field>
      </v-card-title>
      
    </v-card>

    <v-card>
      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        :headers="headers"
        :items="clients"
        :items-length="totalItems"
        :loading="loading"
        :search="searchTerm"
        item-value="id"
        class="elevation-1"
        @update:options="loadItems"
      >
        <template v-slot:item.actions="{ item }">
          <v-icon class="me-2" @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon @click="openDeleteDialog(item)" :disabled="item.is_generic">mdi-delete</v-icon>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useNuxtApp } from '#app';
import { useNotificationStore } from '~/stores/notifications';

const { $api } = useNuxtApp();
const notificationStore = useNotificationStore();

// --- ESTADO ---
const clients = ref([]);
const locations = ref([]);
const dialog = ref({ show: false, loading: false });
const deleteDialog = ref({ show: false, loading: false, client: null });

// Estado para la tabla de servidor
const loading = ref(true);
const totalItems = ref(0);
const searchTerm = ref('');
const tableOptions = ref({
  page: 1,
  itemsPerPage: 15,
  sortBy: [],
});

const actividadSearchTerm = ref('');
const actividadResults = ref([]);
const actividadLoading = ref(false);
const selectedActividad = ref(null);
let actividadTimeout = null;

// --- CORRECCIÓN 1: Variable para el "debouncing" de la búsqueda ---
let searchTimeout = null;

const defaultItem = {
  id: null,
  nombre: '', nit: '', nrc: '', correo: '', nombre_comercial: '',
  cod_actividad: '', desc_actividad: '', telefono: '',
  direccion: { departamento: null, municipio: null, complemento: '' },
  tipo_documento: null, num_documento: null
};
const editedItem = ref({ ...defaultItem });
const form = ref(null);

const headers = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'NIT', key: 'nit' },
  { title: 'NRC', key: 'nrc' },
  { title: 'Teléfono', key: 'telefono' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];

const rules = {
  required: value => !!value || 'Este campo es requerido.',
};

// --- LÓGICA QUE NO CAMBIA ---
const formTitle = computed(() => (editedItem.value.id ? 'Editar Cliente' : 'Nuevo Cliente'));
const filteredMunicipios = computed(() => {
  if (!editedItem.value.direccion?.departamento) return [];
  const selectedDept = locations.value.find(d => d.codigo === editedItem.value.direccion.departamento);
  return selectedDept ? selectedDept.municipios : [];
});


watch(actividadSearchTerm, (newVal) => {
    // Si el texto de búsqueda es el de la actividad ya seleccionada, no hacemos nada.
    if (selectedActividad.value && newVal === selectedActividad.value.descripcion) return;

    clearTimeout(actividadTimeout);
    if (newVal && newVal.length >= 2) {
        actividadTimeout = setTimeout(async () => {
            actividadLoading.value = true;
            try {
                const response = await $api(`/api/actividades-economicas/search?term=${newVal}`);
                actividadResults.value = response;
            } catch (error) {
                notificationStore.showNotification({ message: 'Error al buscar actividades económicas.', color: 'error' });
            } finally {
                actividadLoading.value = false;
            }
        }, 500); // Debounce de 500ms
    } else {
        actividadResults.value = [];
    }
});

// --- NUEVO WATCHER PARA AUTO-COMPLETAR LOS CAMPOS ---
watch(selectedActividad, (selection) => {
    if (selection && typeof selection === 'object') {
        editedItem.value.cod_actividad = selection.codigo;
        editedItem.value.desc_actividad = selection.descripcion;
    } else if (!selection) {
        // Si el usuario limpia el campo, limpiamos los datos en el formulario
        editedItem.value.cod_actividad = '';
        editedItem.value.desc_actividad = '';
    }
});

watch(() => editedItem.value.direccion.departamento, () => {
  editedItem.value.direccion.municipio = null;
});

// --- CORRECCIÓN 2: Implementación del watch para la búsqueda ---
watch(searchTerm, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    // Cuando el usuario deja de escribir, reseteamos a la página 1 y cargamos
    tableOptions.value.page = 1; 
    loadItems(tableOptions.value);
  }, 500); // Espera 500ms después de la última pulsación de tecla
});


onMounted(async () => {
  await fetchLocations();
  // La tabla llamará a loadItems por sí misma la primera vez
});

async function fetchLocations() {
    try {
        locations.value = await $api('/api/locations');
    } catch (error) {
        notificationStore.showNotification({ message: 'Error al cargar las ubicaciones.', color: 'error' });
    }
}

async function loadItems(options) {
  loading.value = true;
  tableOptions.value = options;

  try {
    const params = new URLSearchParams({
      page: options.page,
      per_page: options.itemsPerPage,
    });

    // --- CORRECCIÓN 3: La lógica para añadir el término de búsqueda ya estaba aquí, ahora será utilizada por el watch ---
    if (searchTerm.value) {
      params.append('search', searchTerm.value);
    }

    const response = await $api(`/api/clients?${params.toString()}`);
    
    clients.value = response.data;
    totalItems.value = response.meta.total;
  } catch (error) {
    notificationStore.showNotification({ message: 'Error al cargar los clientes.', color: 'error' });
  } finally {
    loading.value = false;
  }
}


function openNewClientDialog() {
    editedItem.value = JSON.parse(JSON.stringify(defaultItem));
    selectedActividad.value = null; // Aseguramos que el campo esté vacío para un nuevo cliente
    dialog.value.show = true;
}

function openEditDialog(item) {
  editedItem.value = JSON.parse(JSON.stringify(item));
    if (!editedItem.value.direccion) {
        editedItem.value.direccion = { departamento: null, municipio: null, complemento: '' };
    }
    // Para que el v-autocomplete muestre la actividad actual al editar
    if (item.cod_actividad && item.desc_actividad) {
        selectedActividad.value = { 
            codigo: item.cod_actividad, 
            descripcion: item.desc_actividad 
        };
    } else {
        selectedActividad.value = null;
    }
    dialog.value.show = true;
}

function openDeleteDialog(item) {
  deleteDialog.value.client = item;
  deleteDialog.value.show = true;
}

function closeDialogs() {
  dialog.value.show = false;
  deleteDialog.value.show = false;
}

async function saveClient() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  dialog.value.loading = true;

  // --- INICIO DE LA CORRECCIÓN ---
  // Creamos un objeto 'payload' para enviar al backend.
  // Copiamos todos los datos del cliente que estamos editando.
  const payload = { ...editedItem.value };

  // Tomamos los valores del objeto anidado 'direccion'
  // y los ponemos en el nivel principal del payload.
  payload.departamento = editedItem.value.direccion.departamento;
  payload.municipio = editedItem.value.direccion.municipio;
  payload.complemento = editedItem.value.direccion.complemento;

  // Eliminamos el objeto 'direccion' anidado para no enviar datos duplicados.
  delete payload.direccion;
  // --- FIN DE LA CORRECCIÓN ---
  
  try {
    if (editedItem.value.id) {
      await $api(`/api/clients/${editedItem.value.id}`, {
        method: 'PUT',
        body: payload, // <-- Enviamos el payload corregido
      });
      notificationStore.showNotification({ message: 'Cliente actualizado exitosamente.' });
    } else {
      await $api('/api/clients', {
        method: 'POST',
        body: payload, // <-- Enviamos el payload corregido
      });
      notificationStore.showNotification({ message: 'Cliente creado exitosamente.' });
    }
    closeDialogs();
    loadItems(tableOptions.value);
  } catch (error) {
    const message = error.data?.message || 'Ocurrió un error al guardar el cliente.';
    notificationStore.showNotification({ message, color: 'error' });
  } finally {
    dialog.value.loading = false;
  }
}


async function confirmDelete() {
    deleteDialog.value.loading = true;
    try {
        await $api(`/api/clients/${deleteDialog.value.client.id}`, {
            method: 'DELETE',
        });
        notificationStore.showNotification({ message: 'Cliente eliminado.' });
        closeDialogs();
        
        // --- CORRECCIÓN 4: Llamada correcta para recargar la tabla ---
        // Usamos loadItems y le pasamos el estado actual de la tabla.
        // Esto mantiene al usuario en su página actual si hay más items.
        loadItems(tableOptions.value);

    } catch (error) {
        const message = error.data?.message || 'No se pudo eliminar el cliente.';
        notificationStore.showNotification({ message, color: 'error' });
    } finally {
        deleteDialog.value.loading = false;
    }
}
</script>