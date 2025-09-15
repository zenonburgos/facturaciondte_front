<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4 pa-md-6 mt-5">
          <v-card-title class="text-h4 font-weight-bold mb-4">
            Contacto
          </v-card-title>
          <v-card-text class="text-body-1">
            <p class="mb-4">
              ¿Tienes preguntas o necesitas ayuda? Estamos aquí para servirte.
            </p>
            <v-list>
              <v-list-item prepend-icon="mdi-email-outline">
                <v-list-item-title>Correo Electrónico</v-list-item-title>
                <v-list-item-subtitle>factura.dte.sv@gmail.com</v-list-item-subtitle>
              </v-list-item>
              <v-list-item prepend-icon="mdi-whatsapp">
                <v-list-item-title>WhatsApp</v-list-item-title>
                <v-list-item-subtitle>+503 7600 4988</v-list-item-subtitle>
              </v-list-item>
              <v-list-item prepend-icon="mdi-map-marker-outline">
                <v-list-item-title>Ubicación</v-list-item-title>
                <v-list-item-subtitle>San Salvador, El Salvador</v-list-item-subtitle>
              </v-list-item>
            </v-list>
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
  layout: 'login',
});
</script>