<template>
  <v-container class="fill-height justify-center">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12">
        <v-card class="elevation-12">
          <v-row no-gutters>

            <!-- CAMBIO PRINCIPAL: Eliminamos v-if y ajustamos el :style -->
            <v-col 
              cols="12" 
              md="6" 
              class="bg-primary d-flex flex-column justify-center align-center pa-8"
            >
            <!-- 
              Explicación:
              - Eliminamos el `v-if="settings"` para que la columna SIEMPRE se renderice.
              - En `:style`, usamos un operador ternario:
                - SI `settings` tiene datos, usa `settings.color_primary`.
                - SI NO (es decir, es null al inicio), usa un color por defecto '#1E88E5'.
              - Usamos '#1E88E5' porque es el mismo color 'primary' de tu tema de Vuetify,
                asegurando una carga visualmente consistente.
            -->

              <div v-if="settings" class="text-center" style="max-width: 500px;">
                <v-img 
                  v-if="settings.login_logo_path" 
                  :src="settings.login_logo_path" 
                  max-height="120" 
                  class="mb-6"
                ></v-img>
                <h1 class="text-h4 text-md-h4 ...">
                  {{ settings.slogan || 'La plataforma para tu Facturación Electrónica' }}
                </h1>
                
                <p class="text-body-1 font-weight-light text-white op-80 mb-8">
                  {{ $config.public.loginMessage }}
                </p>

                <v-list 
                  v-if="settings.login_features && settings.login_features.length > 0" 
                  bg-color="transparent" 
                  class="text-left"
                >
                  <v-list-item 
                    v-for="(feature, i) in settings.login_features" 
                    :key="i" 
                    class="text-white op-80"
                  >
                    <template v-slot:prepend>
                      <v-icon color="white">{{ feature.icon }}</v-icon>
                    </template>
                    <v-list-item-title>{{ feature.text }}</v-list-item-title>
                  </v-list-item>
                </v-list>
                <v-divider class="border-opacity-50 mb-8"></v-divider>

                <p class="text-white op-80 text-caption mb-2">¿Tienes preguntas?</p>
                <v-btn
                  v-if="settings.contact_phone"
                  variant="text"
                  color="white"
                  :href="`https://wa.me/${settings.contact_phone.replace(/\D/g, '')}`" 
                  target="_blank"
                  prepend-icon="mdi-whatsapp"
                >
                  {{ settings.contact_phone }}
                </v-btn>
              </div>

              <!-- Opcional: Un spinner mientras cargan los settings -->
              <div v-else>
                  <v-progress-circular indeterminate color="white"></v-progress-circular>
              </div>

            </v-col>

            <v-col cols="12" md="6" class="d-flex flex-column justify-center align-center pa-4">
              <div class="pa-4" style="width: 100%; max-width: 450px;">
                <h2 class="text-h5 font-weight-bold mb-4">
                  Iniciar Sesión
                </h2>
                
                <v-form @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="credentials.login"
                    label="Correo electrónico o Nombre de usuario"
                    type="text"
                    :rules="[rules.required]"
                    required
                    variant="outlined"
                    density="compact"
                    class="mb-4"
                    prepend-inner-icon="mdi-account-outline"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="credentials.password"
                    label="Contraseña"
                    type="password"
                    :rules="[rules.required]"
                    required
                    variant="outlined"
                    density="compact"
                    autocomplete="current-password"
                    prepend-inner-icon="mdi-lock-outline"
                  ></v-text-field>

                  <v-alert v-if="error" type="error" dense class="mt-4">
                    {{ error }}
                  </v-alert>

                  <v-card-actions class="pa-0 pt-6">
                    <v-btn 
                      color="primary" 
                      type="submit"
                      :loading="loading"
                      :disabled="loading"
                      block
                      size="large"
                    >
                      Ingresar
                    </v-btn>
                  </v-card-actions>
                </v-form>

                <v-divider class="my-4">O</v-divider>

                <div class="text-center">
                  <p class="mb-4 text-medium-emphasis">¿Eres nuevo en la plataforma?</p>
                  <!-- Asumiendo que tienes este componente -->
                  <!-- <RegisterButton /> -->
                </div>
              </div>
            </v-col>

          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter, useRoute } from 'vue-router';
import RegisterButton from '~/components/RegisterButton.vue';
import { usePlatformSettings } from '~/composables/usePlatformSettings';

definePageMeta({
  layout: 'login',
});

// URL del logo que te generé. Súbelo a tu carpeta `public` del frontend.
const logoUrl = '/sv-dte-logo.png'; 
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const settings = usePlatformSettings();

const credentials = ref({
  login: '',
  password: '',
});

const error = ref(null);
const loading = ref(false);

const rules = {
  required: value => !!value || 'Este campo es requerido.',
};

async function handleLogin() {
  error.value = null;
  loading.value = true;
  try {
    // 1. Intentamos iniciar sesión a través del store.
    const user = await authStore.login(credentials.value);

    // 2. Si el login es exitoso (devuelve un objeto de usuario)...
    if (user) {
      // 3. ...redirigimos SIEMPRE al dashboard del frontend.
      // La responsabilidad de ir a Filament ahora recae en el botón del layout.
      const redirectPath = route.query.redirect ? decodeURIComponent(route.query.redirect) : '/';
      router.push(redirectPath);
    }
  } catch (e) {
    console.error('Error detallado capturado en handleLogin:', e);
    error.value = e.response?._data?.message || e.message || 'Credenciales no válidas o error de conexión.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.op-80 {
  opacity: 0.8;
}
.text-body-1 {
  /* Estas dos propiedades son las mágicas */
  overflow-wrap: break-word;
  word-wrap: break-word; /* Para compatibilidad con navegadores antiguos */
  
  /* Adicionalmente, asegúrate de que el párrafo no tenga un alto fijo */
  height: auto; 
}
</style>