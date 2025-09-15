<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4 pa-md-6 mt-5">
          <v-card-title class="text-h4 font-weight-bold mb-4">
            Política de Privacidad
          </v-card-title>
          <v-card-text class="text-body-1">
            <p class="mb-2"><strong>Última actualización:</strong> {{ fechaActualizacion }}</p>
            
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

// DEFINIMOS LA FECHA AQUÍ PARA MANTENERLA FÁCILMENTE
const fechaActualizacion = new Date().toLocaleDateString('es-SV', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
</script>