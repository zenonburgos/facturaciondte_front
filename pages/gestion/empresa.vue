<template>
  <v-container>
    <h1 class="text-h4 mb-6">Datos de Mi Empresa</h1>

    <v-card :loading="loading">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="primary" height="4" indeterminate></v-progress-linear>
      </template>

      <v-form ref="form" @submit.prevent="saveEmpresa">
        <v-card-text>
          <v-row>
            <!-- Sección del Logo -->
            <v-col cols="12" class="d-flex flex-column align-center">
              <p class="text-subtitle-1 font-weight-medium mb-2">Logotipo de la Empresa</p>
              <v-avatar color="grey-lighten-3" size="120" class="mb-4 elevation-2">
                <v-img
                  v-if="logoPreviewUrl"
                  :src="logoPreviewUrl"
                  :alt="empresa.nombre"
                  cover
                ></v-img>
                <v-icon v-else size="x-large" color="grey-darken-1">mdi-domain</v-icon>
              </v-avatar>
              <v-file-input
                v-model="logoFile"
                label="Cambiar Logotipo (Máx. 2MB)"
                accept="image/jpeg, image/png, image/gif"
                prepend-icon="mdi-camera"
                variant="outlined"
                density="compact"
                :rules="logoRules"
                @update:model-value="onFileChange"
                style="max-width: 400px;"
                clearable
              ></v-file-input>
            </v-col>

            <!-- Campos de Texto -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="empresa.nombre"
                label="Nombre o Razón Social"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="empresa.nombre_comercial"
                label="Nombre Comercial"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="empresa.nit"
                label="NIT"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="empresa.nrc"
                label="NRC"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="empresa.telefono"
                label="Teléfono"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="empresa.correo_electronico"
                label="Correo Electrónico"
                type="email"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>
          <h4 class="mb-2">Dirección</h4>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="empresa.direccion.departamento"
                :items="departments"
                item-title="title"
                item-value="value"
                label="Departamento"
                :loading="loadingLocations"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="empresa.direccion.municipio"
                :items="municipalities"
                item-title="title"
                item-value="value"
                label="Municipio"
                :disabled="!empresa.direccion.departamento"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="empresa.direccion.complemento"
                label="Complemento (Calle, # Casa, Colonia...)"
                rows="2"
                :rules="[rules.required]"
                variant="outlined"
              ></v-textarea>
            </v-col>
          </v-row>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            type="submit"
            :loading="loading"
          >
            Guardar Cambios
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useNuxtApp } from '#app';
import { useNotificationStore } from '~/stores/notifications';
import { useAuthStore } from '~/stores/auth';

const { $api } = useNuxtApp();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();
const config = useRuntimeConfig();

const form = ref(null);
const loading = ref(true);
const empresa = ref({
  direccion: { departamento: null, municipio: null, complemento: '' }
});
const logoFile = ref(null);
const logoPreviewUrl = ref(null);

const locations = ref([]);
const loadingLocations = ref(false);

const isInitialLoad = ref(true); // Flag to prevent watcher on initial load

const rules = {
  required: value => !!value || 'Este campo es requerido.',
};

const logoRules = [
  (file) => {
    // Si no hay archivo (es null), la regla pasa
    if (!file) return true;
    
    // 'file' es el objeto de archivo, no un array
    if (file.size > 2 * 1024 * 1024) { // 2MB
      return 'El logo no puede pesar más de 2MB.';
    }
    return true;
  },
];


onMounted(async () => {
  loading.value = true;
  await fetchLocations();
  await fetchEmpresa();
  loading.value = false;
  // After the DOM has had a chance to update with the fetched data...
  nextTick(() => {
    // ...we can safely say the initial load is complete.
    isInitialLoad.value = false;
  });
});

async function fetchLocations() {
    loadingLocations.value = true;
    try {
        locations.value = await $api('/api/locations');
    } catch (err) {
        notificationStore.showNotification({ message: 'No se pudieron cargar las ubicaciones.', color: 'error' });
    } finally {
        loadingLocations.value = false;
    }
}

const departments = computed(() => {
  return locations.value.map(dep => ({
    title: dep.nombre,
    value: dep.codigo,
  }));
});

const municipalities = computed(() => {
  if (!empresa.value.direccion.departamento) return [];
  const selectedDep = locations.value.find(dep => dep.codigo === empresa.value.direccion.departamento);
  return selectedDep ? selectedDep.municipios.map(mun => ({ title: mun.nombre, value: mun.codigo })) : [];
});

watch(() => empresa.value.direccion.departamento, (newVal, oldVal) => {
    // Now, this only runs on changes made BY THE USER after the initial load.
    if (!isInitialLoad.value && newVal !== oldVal) {
        empresa.value.direccion.municipio = null;
    }
});


async function fetchEmpresa() {
  try {
    const data = await $api('/api/empresa');
    
    if (data.direccion && typeof data.direccion === 'string') {
      try {
        data.direccion = JSON.parse(data.direccion);
      } catch (e) {
        console.error("Error al parsear la dirección JSON:", e);
        data.direccion = { departamento: null, municipio: null, complemento: '' };
      }
    } else if (!data.direccion) {
      data.direccion = { departamento: null, municipio: null, complemento: '' };
    }
    
    empresa.value = data;
    
    if (data.logo_path) {
      logoPreviewUrl.value = `${config.public.apiBaseUrl}/storage/${data.logo_path}?v=${new Date().getTime()}`;
    }

  } catch (error) {
    notificationStore.showNotification({ message: 'Error al cargar los datos de la empresa.', color: 'error' });
  }
}

function onFileChange(file) {
  if (file) {
    // Si se selecciona un archivo, crea una URL para la vista previa
    logoPreviewUrl.value = URL.createObjectURL(file);
  } else {
    // Si el usuario borra la selección, volvemos a mostrar el logo original
    logoPreviewUrl.value = empresa.value.logo_path ? `${config.public.apiBaseUrl}/storage/${empresa.value.logo_path}?v=${new Date().getTime()}` : null;
  }
}



async function saveEmpresa() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;

  const formData = new FormData();

  formData.append('nombre', empresa.value.nombre || '');
  formData.append('nombre_comercial', empresa.value.nombre_comercial || '');
  formData.append('nit', empresa.value.nit || '');
  formData.append('nrc', empresa.value.nrc || '');
  formData.append('telefono', empresa.value.telefono || '');
  formData.append('correo_electronico', empresa.value.correo_electronico || '');
  
  formData.append('departamento', empresa.value.direccion.departamento || '');
  formData.append('municipio', empresa.value.direccion.municipio || '');
  formData.append('complemento', empresa.value.direccion.complemento || '');

  if (logoFile.value) {
    formData.append('logo', logoFile.value);
  }

  try {
    const response = await $api('/api/empresa', {
      method: 'POST',
      body: formData,
    });

    notificationStore.showNotification({ message: response.message || 'Datos actualizados exitosamente.' });
    
    await authStore.fetchUser();
    
    // Asignamos la respuesta del servidor, que ya viene con la dirección como objeto
    empresa.value = response.empresa;

    if (response.empresa.logo_path) {
        logoPreviewUrl.value = `${config.public.apiBaseUrl}/storage/${response.empresa.logo_path}?t=${new Date().getTime()}`;
    }
    logoFile.value = null;

  } catch (error) {
    const message = error.data?.message || 'Ocurrió un error al guardar los cambios.';
    notificationStore.showNotification({ message, color: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>

