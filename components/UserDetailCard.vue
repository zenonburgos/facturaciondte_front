<script setup>
// Este componente recibe toda la información del usuario como un 'prop'.
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

// Pequeña función para formatear fechas de manera legible
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};
</script>

<template>
  <v-card v-if="user" :loading="!user">
    <v-card-title class="d-flex align-center">
      <v-avatar color="primary" class="mr-3">
        <span class="white--text text-h5">{{ user.name.charAt(0) }}</span>
      </v-avatar>
      <div>
        <div class="text-h6">{{ user.name }}</div>
        <div class="text-caption">{{ user.email }}</div>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <v-list dense>
      <v-list-item>
        <template v-slot:prepend>
          <v-icon>mdi-account-star</v-icon>
        </template>
        <v-list-item-title>Rol Principal</v-list-item-title>
        <v-list-item-subtitle>
          <v-chip color="info" size="small">{{ user.account_info.rol_principal }}</v-chip>
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <template v-slot:prepend>
          <v-icon :color="user.account_info.cuenta_verificada ? 'success' : 'warning'">
            {{ user.account_info.cuenta_verificada ? 'mdi-check-decagram' : 'mdi-alert-circle' }}
          </v-icon>
        </template>
        <v-list-item-title>Cuenta Verificada</v-list-item-title>
        <v-list-item-subtitle>
          {{ user.account_info.cuenta_verificada ? 'Sí' : 'No' }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <template v-slot:prepend>
          <v-icon>mdi-calendar-plus</v-icon>
        </template>
        <v-list-item-title>Miembro Desde</v-list-item-title>
        <v-list-item-subtitle>
          {{ formatDate(user.account_info.miembro_desde) }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>
    
    <v-card-text>
      <div class="text-subtitle-1 font-weight-bold mb-2">Permisos y Asignaciones</div>

      <div v-if="user.puntos_de_venta_permitidos && user.puntos_de_venta_permitidos.length > 0">
        <strong>Puntos de Venta:</strong>
        <div class="mt-1">
          <v-chip
            v-for="pos in user.puntos_de_venta_permitidos"
            :key="pos.id"
            class="mr-1 mb-1"
            size="small"
            prepend-icon="mdi-point-of-sale"
          >
            {{ pos.nombre }}
          </v-chip>
        </div>
      </div>

      <div v-if="user.empresas_asignadas && user.empresas_asignadas.length > 0" class="mt-3">
        <strong>Empresas Asignadas:</strong>
        <v-list-item
          v-for="empresa in user.empresas_asignadas"
          :key="empresa.id"
          density="compact"
          prepend-icon="mdi-domain"
        >
          <v-list-item-title class="text-body-2">{{ empresa.nombre }}</v-list-item-title>
        </v-list-item>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-text>
      <div class="text-subtitle-1 font-weight-bold mb-2">Actividad Reciente</div>
      <v-list-item density="compact" prepend-icon="mdi-file-document-multiple">
        <v-list-item-title>DTEs emitidos (últimos 30 días)</v-list-item-title>
        <template v-slot:append>
          <span class="text-h6 font-weight-bold text-primary">{{ user.metrics.dtes_last_30_days }}</span>
        </template>
      </v-list-item>
    </v-card-text>
  </v-card>
</template>