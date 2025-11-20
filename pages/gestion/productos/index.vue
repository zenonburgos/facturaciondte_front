<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi-package-variant-closed"></v-icon> &nbsp;
        Gestión de Productos
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          density="compact"
          label="Buscar"
          prepend-inner-icon="mdi-magnify"
          variant="solo-filled"
          flat
          hide-details
          single-line
          @input="debouncedSearch"
        ></v-text-field>
        <v-btn color="primary" class="ml-4" @click="openNewDialog">
          <v-icon left>mdi-plus</v-icon>
          Nuevo Producto
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items-length="totalItems"
        :items="products"
        :loading="loading"
        item-value="id"
        @update:options="loadItems"
      >
        <template v-slot:item.imagen_url="{ item }">
          <v-avatar size="40" class="my-2">
            <v-img :src="item.imagen_url || '/placeholder-image.png'" :alt="item.nombre"></v-img>
          </v-avatar>
        </template>
        <template v-slot:item.precio_unitario="{ item }">
          {{ formatCurrency(item.precio_unitario) }}
        </template>
        <template v-slot:item.es_exento_de_iva="{ item }">
          <v-chip :color="item.es_exento_de_iva ? 'blue' : 'grey'" small>
            {{ item.es_exento_de_iva ? 'Sí' : 'No' }}
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon class="me-2" size="small" @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon size="small" @click="openDeleteDialog(item)">mdi-delete</v-icon>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="dialog" persistent max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-row>
              <v-col cols="12" sm="3">
                 <v-img 
                    :src="previewImage || editedItem.imagen_url || '/placeholder-image.png'" 
                    aspect-ratio="1" 
                    class="grey lighten-2 rounded">
                </v-img>
                <v-file-input
                  v-model="editedItem.imagen_file"
                  label="Imagen"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  density="compact"
                  class="mt-2"
                  @change="onFileChange"
                  hide-details
                ></v-file-input>
              </v-col>
              <v-col cols="12" sm="9">
                <v-row>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="editedItem.codigo"
                      label="Cód. Interno"
                      :rules="[rules.required]"
                      variant="outlined" density="compact"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="editedItem.sku"
                      label="SKU"
                      hint="Actualmente contiene errores de importación"
                      persistent-hint
                      variant="outlined" density="compact"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="editedItem.barcode"
                      label="Barcode (GTIN/EAN)"
                      prepend-inner-icon="mdi-barcode"
                      variant="outlined" density="compact"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="editedItem.nombre"
                      label="Nombre del Producto"
                      :rules="[rules.required]"
                      variant="outlined" density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                     <v-textarea
                        v-model="editedItem.descripcion"
                        label="Descripción (Opcional)"
                        rows="2"
                        variant="outlined" density="compact"
                     ></v-textarea>
                  </v-col>
                   <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="editedItem.precio_unitario"
                      label="Precio Unitario ($)"
                      type="number"
                      :rules="[rules.required, rules.numeric]"
                      variant="outlined" density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="editedItem.stock"
                      label="Stock / Existencias"
                      type="number"
                       :rules="[rules.required, rules.integer]"
                      variant="outlined" density="compact"
                    ></v-text-field>
                  </v-col>
                   <v-col cols="12">
                    <v-switch
                      v-model="editedItem.es_exento_de_iva"
                      label="¿Este producto es exento de IVA?"
                      color="primary"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save" :loading="saving">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <v-dialog v-model="dialogDelete" max-width="500px">
        <v-card>
            <v-card-title class="text-h5">¿Estás seguro?</v-card-title>
            <v-card-text>Esta acción eliminará el producto permanentemente y no se puede deshacer.</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancelar</v-btn>
                <v-btn color="red-darken-1" variant="text" @click="deleteItemConfirm" :loading="saving">Eliminar</v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useNotificationStore } from '~/stores/notifications';

const { $api } = useNuxtApp();
const notificationStore = useNotificationStore();

// --- Estado de la Tabla y Búsqueda ---
const products = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const itemsPerPage = ref(10);
const search = ref('');
let searchTimeout = null;

const headers = [
  { title: '', key: 'imagen_url', sortable: false, width: '60px' },
  { title: 'Código', key: 'codigo' },
  { title: 'SKU', key: 'sku' },          // <--- NUEVO
  { title: 'Barcode', key: 'barcode' },  // <--- NUEVO
  { title: 'Nombre', key: 'nombre' },
  { title: 'Precio', key: 'precio_unitario', align: 'end' },
  { title: 'Stock', key: 'stock', align: 'end' },
  { title: 'Exento IVA', key: 'es_exento_de_iva' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];

// --- Lógica del CRUD y Diálogos ---
const dialog = ref(false);
const dialogDelete = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const formRef = ref(null);
const editedItem = ref({
  id: null,
  codigo: '',
  sku: '',
  barcode: '',
  nombre: '',
  descripcion: '',
  precio_unitario: 0,
  stock: 0,
  es_exento_de_iva: false,
  imagen_url: null,
  imagen_file: null, // Campo para el nuevo archivo
});
const defaultItem = { ...editedItem.value };
const itemToDelete = ref(null);
const previewImage = ref(null);

const rules = {
  required: value => !!value || 'Este campo es requerido.',
  numeric: value => !isNaN(parseFloat(value)) && isFinite(value) || 'Debe ser un número válido.',
  integer: value => Number.isInteger(Number(value)) || 'Debe ser un número entero.'
};

// --- Funciones ---
async function loadItems({ page, itemsPerPage, sortBy }) {
  loading.value = true;
  try {
    const params = {
      page,
      per_page: itemsPerPage,
      search: search.value,
    };
    const response = await $api('/api/products', { params });
    products.value = response.data;
    totalItems.value = response.total;
  } catch (error) {
    notificationStore.showNotification({ message: 'Error al cargar los productos.', color: 'error' });
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] });
  }, 500); // 500ms de espera
}

function openNewDialog() {
  editedItem.value = { ...defaultItem };
  isEditing.value = false;
  previewImage.value = null;
  dialog.value = true;
}

function openEditDialog(item) {
  editedItem.value = { ...item, imagen_file: null }; // Clonamos el item para editar
  isEditing.value = true;
  previewImage.value = null;
  dialog.value = true;
}

function openDeleteDialog(item) {
  itemToDelete.value = item;
  dialogDelete.value = true;
}

function closeDialog() {
  dialog.value = false;
}

function closeDeleteDialog() {
    itemToDelete.value = null;
    dialogDelete.value = false;
}

function onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        previewImage.value = URL.createObjectURL(file);
        editedItem.value.imagen_file = file;
    } else {
        previewImage.value = null;
        editedItem.value.imagen_file = null;
    }
}


async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) {
    notificationStore.showNotification({ message: 'Revisa los campos del formulario.', color: 'warning' });
    return;
  }

  saving.value = true;
  
  // Usamos FormData para enviar el archivo
  const formData = new FormData();
  Object.keys(editedItem.value).forEach(key => {
    if (key === 'imagen_url') return; // Ignoramos la URL de la imagen

    if (key === 'es_exento_de_iva') {
      formData.append(key, editedItem.value[key] ? '1' : '0');
    } else if (editedItem.value[key] !== null) {
      formData.append(key, editedItem.value[key]);
    }
  });

  try {
    if (isEditing.value) {
      // Para actualizar, Laravel espera _method=PUT en FormData
      formData.append('_method', 'PUT');
      await $api(`/api/products/${editedItem.value.id}`, {
        method: 'POST', // Los navegadores solo soportan POST para FormData con archivos
        body: formData,
      });
      notificationStore.showNotification({ message: 'Producto actualizado con éxito.' });
    } else {
      await $api('/api/products', {
        method: 'POST',
        body: formData,
      });
      notificationStore.showNotification({ message: 'Producto creado con éxito.' });
    }
    closeDialog();
    loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] }); // Recargar tabla
  } catch (error) {
    const message = error.data?.message || 'Ocurrió un error.';
    notificationStore.showNotification({ message, color: 'error' });
  } finally {
    saving.value = false;
  }
}

async function deleteItemConfirm() {
    saving.value = true;
    try {
        await $api(`/api/products/${itemToDelete.value.id}`, { method: 'DELETE' });
        notificationStore.showNotification({ message: 'Producto eliminado.' });
        closeDeleteDialog();
        loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] }); // Recargar
    } catch (error) {
        notificationStore.showNotification({ message: 'Error al eliminar el producto.', color: 'error' });
    } finally {
        saving.value = false;
    }
}

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};
</script>