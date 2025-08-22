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
              <v-col cols="12" md="4"><v-text-field label="Código de Actividad" v-model="editedItem.cod_actividad"></v-text-field></v-col>
              <v-col cols="12" md="8"><v-text-field label="Descripción de Actividad" v-model="editedItem.desc_actividad"></v-text-field></v-col>
              <v-col cols="12"><v-text-field label="Correo Electrónico" v-model="editedItem.correo" type="email"></v-text-field></v-col>
            </v-row>
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
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="clients"
        :items-length="totalItems"
        :loading="loading"
        item-value="id"
        class="elevation-1"
        @update:options="fetchClients"
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
const itemsPerPage = ref(10); // Puedes cambiar el valor por defecto

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

watch(() => editedItem.value.direccion.departamento, () => {
  editedItem.value.direccion.municipio = null;
});

onMounted(async () => {
  await fetchLocations();
  // La tabla llamará a fetchClients por sí misma la primera vez
});

async function fetchLocations() {
    try {
        locations.value = await $api('/api/locations');
    } catch (error) {
        notificationStore.showNotification({ message: 'Error al cargar las ubicaciones.', color: 'error' });
    }
}

// === LA FUNCIÓN fetchClients CORREGIDA ===
async function fetchClients({ page, itemsPerPage, sortBy }) {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: page,
      per_page: itemsPerPage,
      // Aquí podrías añadir lógica para el orden (sortBy) en el futuro si lo necesitas
    });

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
  dialog.value.show = true;
}

function openEditDialog(item) {
  editedItem.value = JSON.parse(JSON.stringify(item));
  if (!editedItem.value.direccion) {
    editedItem.value.direccion = { departamento: null, municipio: null, complemento: '' };
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
  try {
    if (editedItem.value.id) {
      await $api(`/api/clients/${editedItem.value.id}`, {
        method: 'PUT',
        body: editedItem.value,
      });
      notificationStore.showNotification({ message: 'Cliente actualizado exitosamente.' });
    } else {
      await $api('/api/clients', {
        method: 'POST',
        body: editedItem.value,
      });
      notificationStore.showNotification({ message: 'Cliente creado exitosamente.' });
    }
    closeDialogs();
    // Forzamos a que la tabla se recargue pidiendo la primera página
    fetchClients({ page: 1, itemsPerPage: itemsPerPage.value });
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
        // Forzamos a que la tabla se recargue pidiendo la primera página
        fetchClients({ page: 1, itemsPerPage: itemsPerPage.value });
    } catch (error) {
        const message = error.data?.message || 'No se pudo eliminar el cliente.';
        notificationStore.showNotification({ message, color: 'error' });
    } finally {
        deleteDialog.value.loading = false;
    }
}
</script>