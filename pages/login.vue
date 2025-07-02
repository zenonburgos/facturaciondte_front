<template>
  <v-card class="elevation-12">
    <v-toolbar color="primary" dark flat>
      <v-toolbar-title>Inicio de Sesión</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-form>
        <v-text-field
          v-model="email"
          label="Correo Electrónico"
          name="login"
          prepend-icon="mdi-account"
          type="text"
        ></v-text-field>
        <v-text-field
          v-model="password"
          label="Contraseña"
          name="password"
          prepend-icon="mdi-lock"
          type="password"
        ></v-text-field>
      </v-form>
       <v-alert v-if="error" type="error" dense class="mb-4">
        {{ error }}
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn 
        color="primary" 
        @click="handleLogin"
        :loading="loading"
        :disabled="loading"
      >
        Ingresar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({
  layout: 'login',
});

const authStore = useAuthStore(); // Inicializamos el store
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref(null);
const loading = ref(false);

async function handleLogin() {
  error.value = null;
  loading.value = true;
  try {
    // Le pedimos al store que maneje el login
    const loggedIn = await authStore.login({
      email: email.value,
      password: password.value,
    });

    if (loggedIn) {
      // router.push('/');
      // Después del login exitoso, revisamos si veníamos de una redirección.
      if (route.query.redirect) {
        // Si hay una ruta guardada, navegamos hacia ella.
        // decodeURIComponent revierte la codificación que hicimos en el middleware.
        router.push(decodeURIComponent(route.query.redirect));
      } else {
        // Si no, vamos al dashboard como siempre.
        router.push('/');
      }
    }
  } catch (e) {
    error.value = e.data?.message || 'No se pudo iniciar sesión.';
  } finally {
    loading.value = false; 
  }
}
</script>