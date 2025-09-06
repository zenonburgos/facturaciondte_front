<template>
  <v-container class="fill-height justify-center">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12">
        <v-card class="elevation-12">
          <v-row no-gutters>

            <v-col cols="12" md="6" class="bg-primary d-flex flex-column justify-center align-center pa-8">
              <div class="text-center" style="max-width: 500px;">
                <h1 class="text-h4 text-md-h4 font-weight-bold text-white mb-6">
                  La plataforma para tu Facturación Electrónica
                </h1>
                
                <p class="text-body-1 font-weight-light text-white op-80 mb-8">
                  {{ $config.public.loginMessage }}
                </p>

                <v-list bg-color="transparent" class="text-left">
                  <v-list-item class="text-white op-80">
                    <template v-slot:prepend><v-icon color="white">mdi-check-circle-outline</v-icon></template>
                    <v-list-item-title>Emite DTEs ilimitados.</v-list-item-title>
                  </v-list-item>
                  <v-list-item class="text-white op-80">
                    <template v-slot:prepend><v-icon color="white">mdi-check-circle-outline</v-icon></template>
                    <v-list-item-title>Consulta tu historial en cualquier momento.</v-list-item-title>
                  </v-list-item>
                  <v-list-item class="text-white op-80">
                    <template v-slot:prepend><v-icon color="white">mdi-check-circle-outline</v-icon></template>
                    <v-list-item-title>Seguridad y respaldo garantizado.</v-list-item-title>
                  </v-list-item>
                </v-list>
                <v-divider class="border-opacity-50 mb-8"></v-divider>

                <p class="text-white op-80 text-caption mb-2">¿Tienes preguntas?</p>
                <v-btn
                  variant="text"
                  color="white"
                  href="https://wa.me/50377429495" target="_blank"
                  prepend-icon="mdi-whatsapp"
                >
                  +503 7742-9495 </v-btn>
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
                  <RegisterButton />
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
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter, useRoute } from 'vue-router';
import RegisterButton from '~/components/RegisterButton.vue'; // Importamos el nuevo botón

definePageMeta({
  layout: 'login',
});

// URL del logo que te generé. Súbelo a tu carpeta `public` del frontend.
const logoUrl = '/sv-dte-logo.png'; 

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

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
    const loggedIn = await authStore.login(credentials.value);
    if (loggedIn) {
      const redirectPath = route.query.redirect ? decodeURIComponent(route.query.redirect) : '/';
      router.push(redirectPath);
    }
  } catch (e) {
    error.value = e.data?.message || 'No se pudo iniciar sesión.';
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