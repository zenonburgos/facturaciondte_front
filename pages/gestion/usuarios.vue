<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">Gestión de Usuarios</h1>
      <v-btn color="primary" @click="openNewUserDialog" prepend-icon="mdi-plus">
        Nuevo Usuario
      </v-btn>
    </div>

    <v-dialog v-model="dialog.show" persistent max-width="700px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Nombre Completo*"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.email"
                  label="Correo Electrónico*"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <template v-if="!editedItem.id">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.password"
                    label="Contraseña*"
                    type="password"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.password_confirmation"
                    label="Confirmar Contraseña*"
                    type="password"
                    :rules="[rules.required, v => v === editedItem.password || 'Las contraseñas no coinciden.']"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </template>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.role"
                  :items="availableRoles"
                  label="Rol del Usuario*"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.punto_de_venta_ids"
                  :items="availablePos"
                  item-title="nombre"
                  item-value="id"
                  label="Puntos de Venta Permitidos"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialogs">Cancelar</v-btn>
          <v-btn color="blue-darken-1" variant="flat" @click="saveUser" :loading="dialog.loading">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.show" persistent max-width="500px">
        <v-card>
            <v-card-title class="text-h5">Confirmar Eliminación</v-card-title>
            <v-card-text>
                ¿Estás seguro de que quieres eliminar al usuario <strong>{{ deleteDialog.user?.name }}</strong>? Esta acción no se puede deshacer.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="closeDialogs">Cancelar</v-btn>
                <v-btn color="red-darken-1" variant="flat" @click="confirmDelete" :loading="deleteDialog.loading">Eliminar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    
    <v-dialog v-model="isDetailDialogVisible" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Detalles del Usuario</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="isDetailDialogVisible = false" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text>
          <div v-if="isLoadingDetails" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <div class="mt-4 text-grey">Cargando detalles...</div>
          </div>
          
          <UserDetailCard v-else-if="selectedUserDetails" :user="selectedUserDetails" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        item-value="id"
        class="elevation-1"
      >
        <template v-slot:item.roles="{ item }">
          <v-chip color="primary" size="small">{{ item.roles[0]?.name || 'Sin Rol' }}</v-chip>
        </template>

        <template v-slot:item.puntos_de_venta="{ item }">
            <div v-if="extractPosIds(item.permissions).length > 0">
                <v-chip v-for="posId in extractPosIds(item.permissions)" :key="posId" class="ma-1" size="small" variant="tonal">
                    {{ getPosName(posId) }}
                </v-chip>
            </div>
            <span v-else class="text-caption">Todos</span>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-icon class="me-2" @click="showUserDetails(item.id)" color="info">mdi-eye</v-icon>

            <v-icon class="me-2" @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon @click="openDeleteDialog(item)" color="error">mdi-delete</v-icon>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';
import UserDetailCard from '~/components/UserDetailCard.vue';

const isDetailDialogVisible = ref(false);
const selectedUserDetails = ref(null);
const isLoadingDetails = ref(false);

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// --- ESTADO ---
const users = ref([]);
const loading = ref(true);
const dialog = ref({ show: false, loading: false });
const deleteDialog = ref({ show: false, loading: false, user: null });

const defaultItem = {
  id: null,
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: null,
  punto_de_venta_ids: [],
};
const editedItem = ref({ ...defaultItem });

const availableRoles = ref([]); 
const availablePos = computed(() => authStore.user?.puntos_de_venta_permitidos || []);

const form = ref(null); // Referencia al v-form

const headers = [
  { title: 'Nombre', key: 'name' },
  { title: 'Correo Electrónico', key: 'email' },
  { title: 'Rol', key: 'roles' },
  { title: 'Puntos de Venta', key: 'puntos_de_venta', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];

const rules = {
  required: value => !!value || 'Este campo es requerido.',
  email: value => /.+@.+\..+/.test(value) || 'Debe ser un correo electrónico válido.',
};

// --- PROPIEDADES COMPUTADAS ---
const formTitle = computed(() => (editedItem.value.id ? 'Editar Usuario' : 'Nuevo Usuario'));

// --- MÉTODOS ---
onMounted(() => {
  fetchUsers();
  fetchRoles();
  //availablePos.value = authStore.user?.puntos_de_venta_permitidos || [];
});

async function fetchUsers() {
  loading.value = true;
  try {
    console.log('TRACE A: Intentando hacer fetch de usuarios...'); // <--- AÑADIR ESTO
    users.value = await $api('/api/users');
    console.log('TRACE B: Fetch de usuarios exitoso.'); // <--- AÑADIR ESTO
  } catch (error) {
    console.log('TRACE C: ¡ERROR! El catch del componente usuarios.vue se ha ejecutado.'); // <--- AÑADIR ESTO
    notificationStore.showNotification({ message: 'Error al cargar los usuarios.', color: 'error' });
  } finally {
    loading.value = false;
  }
}

async function fetchRoles() {
  try {
    availableRoles.value = await $api('/api/roles');
  } catch (error) {
    notificationStore.showNotification({ message: 'Error al cargar los roles disponibles.', color: 'error' });
  }
}

function openNewUserDialog() {
  editedItem.value = { ...defaultItem };
  dialog.value.show = true;
}

function openEditDialog(item) {
  editedItem.value = {
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.roles[0]?.name || null,
    punto_de_venta_ids: extractPosIds(item.permissions),
  };
  dialog.value.show = true;
}

function openDeleteDialog(item) {
  deleteDialog.value.user = item;
  deleteDialog.value.show = true;
}

function closeDialogs() {
  dialog.value.show = false;
  deleteDialog.value.show = false;
}

async function saveUser() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  dialog.value.loading = true;
  try {
    if (editedItem.value.id) {
      // Actualizar usuario
      await $api(`/api/users/${editedItem.value.id}`, {
        method: 'PUT',
        body: editedItem.value,
      });
      notificationStore.showNotification({ message: 'Usuario actualizado exitosamente.' });
    } else {
      // Crear usuario
      await $api('/api/users', {
        method: 'POST',
        body: editedItem.value,
      });
      notificationStore.showNotification({ message: 'Usuario creado exitosamente.' });
    }
    closeDialogs();
    fetchUsers();
  } catch (error) {
    const message = error.data?.message || 'Ocurrió un error al guardar el usuario.';
    notificationStore.showNotification({ message, color: 'error' });
  } finally {
    dialog.value.loading = false;
  }
}

async function confirmDelete() {
    deleteDialog.value.loading = true;
    try {
        await $api(`/api/users/${deleteDialog.value.user.id}`, {
            method: 'DELETE',
        });
        notificationStore.showNotification({ message: 'Usuario eliminado.' });
        closeDialogs();
        fetchUsers();
    } catch (error) {
        const message = error.data?.message || 'No se pudo eliminar el usuario.';
        notificationStore.showNotification({ message, color: 'error' });
    } finally {
        deleteDialog.value.loading = false;
    }
}

// --- FUNCIONES UTILITARIAS ---
function extractPosIds(permissions) {
    if (!permissions) return [];
    return permissions
        .filter(p => p.name.startsWith('acceder pos '))
        .map(p => parseInt(p.name.replace('acceder pos ', ''), 10));
}

function getPosName(posId) {
    const pos = availablePos.value.find(p => p.id === posId);
    return pos ? pos.nombre : `ID: ${posId}`;
}

async function showUserDetails(userId) {
  // Reseteamos el estado anterior y mostramos el loader
  selectedUserDetails.value = null;
  isLoadingDetails.value = true;
  isDetailDialogVisible.value = true;

  try {
    const { $api } = useNuxtApp();
    // 2. Llamamos al endpoint del backend que preparamos
    const userData = await $api(`/api/users/${userId}`);
    selectedUserDetails.value = userData;
  } catch (error) {
    console.error("Error al cargar los detalles del usuario:", error);
    // Aquí podrías mostrar una notificación de error
    isDetailDialogVisible.value = false; // Cierra el diálogo si hay error
  } finally {
    isLoadingDetails.value = false;
  }
}
</script>