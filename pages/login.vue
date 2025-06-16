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
      <v-btn color="primary" @click="handleLogin">Ingresar</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth'; // Importamos nuestro store

definePageMeta({
  layout: 'login',
});

const authStore = useAuthStore(); // Inicializamos el store
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref(null);

async function handleLogin() {
  error.value = null;
  try {
    // Le pedimos al store que maneje el login
    const loggedIn = await authStore.login({
      email: email.value,
      password: password.value,
    });

    if (loggedIn) {
      // Si el store confirma que el login fue exitoso, redirigimos
      router.push('/');
    }
  } catch (e) {
    error.value = e.data?.message || 'No se pudo iniciar sesión.';
  }
}
</script>