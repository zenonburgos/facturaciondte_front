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
          
          <v-textarea
            v-model="empresa.direccion.complemento"
            label="Dirección Completa (Departamento, Municipio, Calle, Colonia, etc.)"
            rows="2"
          ></v-textarea>

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
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { useNotificationStore } from '~/stores/notifications';

const { $api } = useNuxtApp();
const notificationStore = useNotificationStore();

const form = ref(null);
const loading = ref(true);
const empresa = ref({
  // Inicializamos la estructura para evitar errores en el renderizado
  direccion: {
    complemento: ''
  }
});

const rules = {
  required: value => !!value || 'Este campo es requerido.',
};

// Al montar el componente, cargamos los datos de la empresa
onMounted(async () => {
  await fetchEmpresa();
});

async function fetchEmpresa() {
  loading.value = true;
  try {
    const data = await $api('/api/empresa');

    // --- INICIO DE LA CORRECCIÓN ---
    // Primero, verificamos si la dirección existe y es un string.
    if (data.direccion && typeof data.direccion === 'string') {
      try {
        // Si es un string, intentamos "desempaquetarlo" (parsearlo) para convertirlo en un objeto.
        data.direccion = JSON.parse(data.direccion);
      } catch (e) {
        // Si el string no es un JSON válido, lo registramos en consola y creamos un objeto vacío para evitar que la app falle.
        console.error("Error al parsear la dirección JSON:", e);
        data.direccion = { complemento: '' };
      }
    } else if (!data.direccion) {
      // Si la dirección viene como nula o indefinida, también nos aseguramos de que sea un objeto.
      data.direccion = { complemento: '' };
    }
    // --- FIN DE LA CORRECCIÓN ---

    empresa.value = data;

  } catch (error) {
    notificationStore.showNotification({ message: 'Error al cargar los datos de la empresa.', color: 'error' });
  } finally {
    loading.value = false;
  }
}

async function saveEmpresa() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await $api('/api/empresa', {
      method: 'PUT',
      body: empresa.value // Llama al método 'update' del EmpresaController
    });
    notificationStore.showNotification({ message: response.message || 'Datos actualizados exitosamente.' });
  } catch (error) {
    const message = error.data?.message || 'Ocurrió un error al guardar los cambios.';
    notificationStore.showNotification({ message, color: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>