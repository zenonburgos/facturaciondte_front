<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4 pa-md-6 mt-5">
          <v-card-title class="text-h4 font-weight-bold mb-4">
            Acerca de SmartDTE
          </v-card-title>
          <v-card-text class="text-body-1">
            <p class="mb-4">
              Somos una empresa salvadoreña dedicada a simplificar la facturación electrónica para negocios de todos los tamaños. Nuestra misión es ofrecer una plataforma intuitiva, segura y confiable que permita a nuestros clientes cumplir con los requisitos fiscales del Ministerio de Hacienda de El Salvador de manera eficiente.
            </p>
            <p>
              Creemos en el poder de la tecnología para facilitar los procesos contables y administrativos, permitiendo a los emprendedores y empresas enfocarse en lo que realmente importa: hacer crecer su negocio.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn to="/" color="primary" variant="text">Volver al Inicio</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: 'login', // Usamos el mismo layout del login para mantener la consistencia
});
</script>