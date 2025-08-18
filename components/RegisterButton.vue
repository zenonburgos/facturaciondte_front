<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        to="/register"
        variant="outlined"
        color="secondary"
        block
      >
        Regístrate aquí
      </v-btn>
    </template>
    <span>
      <strong>Para registrarte necesitarás:</strong>
      <ul class="text-left mt-2" style="padding-left: 20px;">
        <li>Datos de tu empresa (NIT, NRC, etc.)</li>
        <li>Credenciales de Hacienda</li>
        <li>Tu certificado de firma digital</li>
      </ul>
    </span>
  </v-tooltip>
</template>