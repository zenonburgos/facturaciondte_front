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
            <v-col cols="12">
                <v-file-input
                    v-model="form.logo_file"
                    label="Logotipo de la Empresa (Opcional)"
                    accept="image/*"
                    prepend-icon="mdi-camera"
                    variant="outlined"
                    density="compact"
                ></v-file-input>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_nombre" label="Nombre o Razón Social" :rules="[rules.required]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_nombre_comercial" label="Nombre Comercial (Opcional)" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model="form.empresa_nit" 
                label="NIT" 
                :rules="[rules.required, rules.nit]" 
                variant="outlined" 
                density="compact"
                hint="Escribe los 14 dígitos sin guiones."
                persistent-hint
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.empresa_nrc" label="NRC" :rules="[rules.required, rules.nrc]" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field 
                  v-model="form.empresa_telefono" 
                  label="Teléfono de Contacto" 
                  :rules="[rules.required, rules.phone]" 
                  variant="outlined" 
                  density="compact"
                  hint="Número de 8 dígitos (Ej: 78787878)."
                  persistent-hint
              ></v-text-field>
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
                @focus="isUsernameManuallyEdited = true" >
              </v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="form.user_email" label="Tu Correo (para el inicio de sesión)" :rules="[rules.required, rules.email]" type="email" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field 
                  v-model="form.user_password" 
                  label="Contraseña" 
                  :rules="[rules.required, rules.password]" 
                  type="password" 
                  variant="outlined" 
                  density="compact" 
                  hint="Mínimo 8 caracteres, una mayúscula, una minúscula y un número."  ></v-text-field>
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
          <v-row>
            <v-col cols="12">
              <v-file-input
                v-model="form.certificado_file"
                label="Certificado de Firma (.crt)"
                accept=".crt"
                :rules="[rules.required, rules.certificateName]"
                variant="outlined"
                density="compact"
                hint="El nombre del archivo debe ser su NIT. Ejemplo: 01010101010101.crt"
                persistent-hint
              ></v-file-input>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.mh_password_api" label="Contraseña API de Hacienda" type="password" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.mh_password_certificado" label="Contraseña del Certificado (.p12)" type="password" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>
          <v-alert v-if="error" type="error" dense class="my-4" variant="tonal">
            <template v-slot:title>
              <span class="font-weight-bold">Error en el Registro</span>
            </template>
            
            <div v-if="error.errors">
                Por favor, corrige los siguientes errores:
                <ul class="mt-2" style="padding-left: 20px;">
                  <li v-for="(messages, field) in error.errors" :key="field">
                    <strong>{{ field }}:</strong> {{ messages[0] }}
                  </li>
                </ul>
            </div>
            <div v-else>
                {{ error.message }}
            </div>
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

const isUsernameManuallyEdited = ref(false);

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
  logo_file: null,
  user_name: '',
  user_username: '',
  user_email: '',
  user_password: '',
  user_password_confirmation: '',
  certificado_file: null,
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
  if (!form.value.empresa_direccion.departamento) return [];
  const selectedDep = locations.value.find(dep => dep.codigo === form.value.empresa_direccion.departamento);
  if (!selectedDep) return [];

  return selectedDep.municipios.map(mun => ({
    title: mun.nombre,
    value: mun.codigo, // <-- Simple y directo. Sin .substr()
  }));
});

// WATCH: Observa si el usuario cambia el departamento
watch(() => form.value.empresa_direccion.departamento, (newDepartment, oldDepartment) => {
  if (newDepartment !== oldDepartment) {
    form.value.empresa_direccion.municipio = null;
  }
});

watch(() => form.value.empresa_correo, (newEmail) => {
  form.value.user_email = newEmail;
});

watch(() => form.value.user_email, (newEmail) => {
  if (newEmail && !isUsernameManuallyEdited.value) {
    // Tomamos la parte antes del @
    form.value.user_username = newEmail.split('@')[0];
  }
});


// --- Lógica de Validación y Envío ---
const rules = {
  required: value => !!value || 'Este campo es requerido.',
  email: value => /.+@.+\..+/.test(value) || 'Debe ser un correo electrónico válido.',
  
  // NUEVA: Regla de contraseña más estricta
   password: value => {
    if (!value || value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula.';
    if (!/[a-z]/.test(value)) return 'Debe contener al menos una minúscula.'; // <-- REGLA AÑADIDA
    if (!/[0-9]/.test(value)) return 'Debe contener al menos un número.';
    return true;
  },
  
  passwordConfirmation: value => value === form.value.user_password || 'Las contraseñas no coinciden.',
  username: value => /^[a-zA-Z0-9_-]+$/.test(value) || 'Formato no válido. Solo letras, números, guiones y guiones bajos.',
  
  // NUEVA: Regla para NIT (14 dígitos)
  nit: value => /^[0-9]{14}$/.test(value) || 'El NIT debe consistir en 14 dígitos numéricos.',

  // NUEVA: Regla para NRC
  nrc: value => /^[0-9]+(-[0-9])?$/.test(value) || 'El NRC tiene un formato inválido.',
  
  // NUEVA: Regla para Teléfono de El Salvador
  phone: value => /^[67][0-9]{7}$/.test(value) || 'Debe ser un teléfono válido de 8 dígitos (iniciar con 6 o 7).',

  certificateName: value => {
    if (!value || value.length === 0) return true; // No validar si está vacío, para eso está 'required'
    const fileName = value[0].name;
    const expectedName = `${form.value.empresa_nit}.crt`;
    return fileName === expectedName || `El nombre del archivo debe ser exactamente '${expectedName}'.`;
  }
};

async function handleRegister() {
  error.value = null;
  const { valid } = await formRef.value.validate();
  if (!valid) {
    notificationStore.showNotification({ message: 'Por favor, revisa los campos del formulario.', color: 'warning' });
    return;
  }
  
  loading.value = true;

  // Usa FormData para enviar archivos y texto juntos
  const formData = new FormData();

  // Añadir todos los campos de texto al FormData
  Object.keys(form.value).forEach(key => {
    if (key !== 'logo_file' && key !== 'empresa_direccion') {
        formData.append(key, form.value[key] || '');
    }
  });

  // Añade los campos de dirección anidados correctamente
  formData.append('empresa_direccion[departamento]', form.value.empresa_direccion.departamento || '');
  formData.append('empresa_direccion[municipio]', form.value.empresa_direccion.municipio || '');
  formData.append('empresa_direccion[complemento]', form.value.empresa_direccion.complemento || '');

  // Añadir el archivo del logo si fue seleccionado
  if (form.value.logo_file && form.value.logo_file.length > 0) {
    formData.append('logo_file', form.value.logo_file[0]);
  }

  if (form.value.certificado_file && form.value.certificado_file.length > 0) {
    formData.append('certificado_file', form.value.certificado_file[0]);
  }

  try {
    const { $api } = useNuxtApp();
    await $api('/api/register', {
      method: 'POST',
      body: formData,
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