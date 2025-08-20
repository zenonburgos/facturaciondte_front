<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12 pa-6 text-center">
          <v-icon size="80" color="success" class="mb-5">mdi-check-decagram-outline</v-icon>

          <h1 class="text-h4 font-weight-bold mb-3">
            ¡Verificación Exitosa!
          </h1>

          <p class="text-body-1 mb-6">
            Tu dirección de correo electrónico ha sido confirmada correctamente.
            Ya puedes iniciar sesión en tu cuenta.
          </p>

          <v-btn
            to="/login"
            color="primary"
            block
            size="large"
            class="font-weight-bold"
          >
            Ir a Iniciar Sesión
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: 'login', // O el layout que uses para páginas públicas y sin autenticación
  auth: 'guest' 
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>