<template>
  <v-container>
    <v-card max-width="900px" class="mx-auto pa-4">
      <v-card-title class="text-h4 text-center mb-4">
        Crear Nueva Cuenta
      </v-card-title>
      <v-card-subtitle class="text-center">
        Un nuevo espacio para gestionar tus Documentos Tributarios Electrónicos.
      </v-card-subtitle>
      
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleRegister">
          
          <p class="text-h6 mb-4 mt-6">1. Datos de la Empresa</p>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_nombre" label="Nombre o Razón Social" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_nombre_comercial" label="Nombre Comercial (Opcional)" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_nit" label="NIT" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_nrc" label="NRC" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_telefono" label="Teléfono de Contacto" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_correo" label="Correo Electrónico de la Empresa" :rules="[rules.required, rules.email]" type="email" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_actividad_codigo" label="Código de Actividad Económica" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_actividad_desc" label="Descripción de Actividad Económica" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-select
                  v-model="form.empresa_direccion.departamento"
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
                  v-model="form.empresa_direccion.municipio"
                  :items="municipalities"
                  item-title="title"   
                  item-value="value"   
                  label="Municipio"
                  :disabled="!form.empresa_direccion.departamento"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                ></v-select>
            </v-col>
            <v-col cols="12">
                <v-textarea 
                  v-model="form.empresa_direccion.complemento" 
                  label="Complemento de la Dirección" 
                  :rules="[rules.required]" 
                  rows="2" 
                  variant="outlined" 
                  density="compact"
                ></v-textarea>
            </v-col>
          </v-row>

          <v-divider class="my-6"></v-divider>

          <p class="text-h6 mb-4">2. Datos del Usuario Administrador</p>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="form.user_name" label="Tu Nombre Completo" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.user_username"
                label="Nombre de Usuario (para iniciar sesión)"
                :rules="[rules.required, rules.username]"
                variant="outlined"
                density="compact"
                hint="Solo letras, números, guiones y guiones bajos."
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="form.user_email" label="Tu Correo (para el inicio de sesión)" :rules="[rules.required, rules.email]" type="email" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.user_password" label="Contraseña" :rules="[rules.required, rules.password]" type="password" variant="outlined" density="compact" hint="Mínimo 8 caracteres, una mayúscula y un número."></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.user_password_confirmation" label="Confirmar Contraseña" :rules="[rules.required, rules.passwordConfirmation]" type="password" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>
          
          <v-divider class="my-6"></v-divider>

          <p class="text-h6 mb-4">3. Credenciales de Hacienda</p>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.mh_password_api" label="Contraseña API de Hacienda" type="password" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.mh_password_certificado" label="Contraseña del Certificado (.p12)" type="password" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>

          <v-alert v-if="error" type="error" dense class="my-4" variant="tonal">
            <p class="font-weight-bold">{{ error.message }}</p>
            <ul v-if="error.errors" class="mt-2">
              <li v-for="(messages, field) in error.errors" :key="field">
                {{ messages[0] }}
              </li>
            </ul>
          </v-alert>

          <v-card-actions class="pa-0 pt-6">
            <v-btn to="/login" variant="text">Ya tengo una cuenta</v-btn>
            <v-spacer></v-spacer>
            <v-btn type="submit" color="primary" :loading="loading" size="large">
              Crear mi Cuenta
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '~/stores/notifications';

definePageMeta({
  layout: 'login', // Usamos el layout de login para una apariencia consistente
});

const router = useRouter();
const notificationStore = useNotificationStore();
const formRef = ref(null);
const form = ref({
  empresa_nombre: '',
  empresa_nombre_comercial: '',
  empresa_nit: '',
  empresa_nrc: '',
  empresa_telefono: '',
  empresa_correo: '',
  empresa_actividad_codigo: '',
  empresa_actividad_desc: '',
  empresa_direccion: { departamento: null, municipio: null, complemento: '' },
  mh_password_api: '',
  mh_password_certificado: '',
  user_name: '',
  user_username: '',
  user_email: '',
  user_password: '',
  user_password_confirmation: '',
});

const locations = ref([]);
const loadingLocations = ref(false);

const loading = ref(false);
const error = ref(null);

// --- Lógica de Ubicaciones (Departamentos/Municipios) ---
onMounted(async () => {
  try {
    const { $api } = useNuxtApp();
    locations.value = await $api('/api/locations');
  } catch (err) {
    notificationStore.showNotification({ message: 'No se pudieron cargar las ubicaciones.', color: 'error' });
  }
});

const departments = computed(() => {
  // Ahora cada opción tendrá un 'title' (para ver) y un 'value' (el código para guardar)
  return locations.value.map(dep => ({
    title: dep.nombre,
    value: dep.codigo, // <-- Usamos el CÓDIGO como valor
  }));
});

const municipalities = computed(() => {
  // El v-model de departamento ahora guardará el CÓDIGO, así que buscamos por código.
  if (!form.value.empresa_direccion.departamento) return [];

  const selectedDep = locations.value.find(dep => dep.codigo === form.value.empresa_direccion.departamento);

  if (!selectedDep) return [];

  // También creamos un objeto con 'title' (nombre) y 'value' (código)
  return selectedDep.municipios.map(mun => ({
    title: mun.nombre,
    value: mun.codigo, // <-- Usamos el CÓDIGO como valor
  }));
});

// WATCH: Observa si el usuario cambia el departamento
watch(() => form.value.empresa_direccion.departamento, (newDepartment, oldDepartment) => {
  // Si el departamento cambia, reseteamos el municipio seleccionado
  // para evitar que se quede un municipio de un departamento anterior.
  if (newDepartment !== oldDepartment) {
    form.value.empresa_direccion.municipio = null;
  }
});


// --- Lógica de Validación y Envío ---
const rules = {
  required: value => !!value || 'Este campo es requerido.',
  email: value => /.+@.+\..+/.test(value) || 'Debe ser un correo electrónico válido.',
  password: value => (value && value.length >= 8) || 'La contraseña debe tener al menos 8 caracteres.',
  passwordConfirmation: value => value === form.value.user_password || 'Las contraseñas no coinciden.',
  username: value => /^[a-zA-Z0-9_-]+$/.test(value) || 'Formato no válido. Solo letras, números, guiones y guiones bajos.',
};

async function handleRegister() {
  error.value = null;
  const { valid } = await formRef.value.validate();
  if (!valid) {
    notificationStore.showNotification({ message: 'Por favor, revisa los campos del formulario.', color: 'warning' });
    return;
  }
  
  loading.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api('/api/register', {
      method: 'POST',
      body: form.value,
    });
    
    // Al registrarse con éxito, lo enviamos a una página que le diga que revise su correo
    await router.push({ path: '/verificar-correo', query: { email: form.value.user_email } });

  } catch (err) {
    error.value = {
      message: err.data?.message || 'Ocurrió un error en el registro.',
      errors: err.data?.errors || null
    };
  } finally {
    loading.value = false;
  }
}
</script>