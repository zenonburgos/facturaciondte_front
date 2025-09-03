<template>
  <div>
    <client-only>
      <v-app>
        <v-snackbar
          v-model="notificationStore.show"
          :color="notificationStore.color"
          :timeout="4000"
          location="top right"
          variant="tonal"
        >
          {{ notificationStore.message }}
          <template v-slot:actions>
            <v-btn icon="mdi-close" @click="notificationStore.show = false"></v-btn>
          </template>
        </v-snackbar>
        <!-- <v-alert
          v-if="!authStore.isBackendOnline"
          type="error"
          density="compact"
          class="text-center"
          style="position: sticky; top: 0; z-index: 1005;"
          tile
        >
          Se ha perdido la conexión con el servidor. Algunas funciones pueden no estar disponibles.
        </v-alert> -->
        <v-alert
          v-if="authStore.isContingencyMode"
          type="warning"
          variant="tonal"
          density="compact"
          class="text-center"
          style="position: sticky; top: 0; z-index: 1005;"
          tile
        >
          <v-icon left>mdi-wifi-off</v-icon>
          **MODO DE CONTINGENCIA ACTIVADO** - Los documentos se guardarán localmente para su envío posterior.
          <v-btn size="small" variant="text" class="ml-4">Sincronizar</v-btn>
        </v-alert>
        <v-navigation-drawer v-model="drawer" app>
          <v-list dense class="safe-area-top">
            <v-list-item link to="/">
              <template v-slot:prepend>
                <v-icon>mdi-view-dashboard</v-icon>
              </template>
              <v-list-item-title>Dashboard</v-list-item-title>
            </v-list-item>

            <v-list-item link to="/emitir">
              <template v-slot:prepend>
                <v-icon>mdi-plus-box</v-icon>
              </template>
              <v-list-item-title>Emitir DTE</v-list-item-title>
            </v-list-item>

            <!-- <v-list-item link to="/liquidaciones">
              <template v-slot:prepend>
                <v-icon>mdi-scale-balance</v-icon> </template>
              <v-list-item-title>Liquidaciones</v-list-item-title>
            </v-list-item> -->

            <v-list-item link to="/historial">
              <template v-slot:prepend>
                <v-icon>mdi-history</v-icon>
              </template>
              <v-list-item-title>Historial</v-list-item-title>
            </v-list-item>
          </v-list>

          <v-list>
            <v-list-subheader v-if="userHasRole(['Admin', 'Encargado de Negocio', 'Cajero'])">MANTENIMIENTO</v-list-subheader>

            <v-list-item 
              v-if="userHasRole(['Admin', 'Encargado de Negocio'])" 
              link 
              to="/gestion/usuarios"
            >
              <template v-slot:prepend>
                <v-icon>mdi-account-group</v-icon>
              </template>
              <v-list-item-title>Gestión de Usuarios</v-list-item-title>
            </v-list-item>

            <v-list-item 
              v-if="userHasRole(['Admin', 'Encargado de Negocio', 'Cajero'])" 
              link 
              to="/gestion/clientes"
            >
              <template v-slot:prepend>
                <v-icon>mdi-account-supervisor-circle</v-icon>
              </template>
              <v-list-item-title>Gestión de Clientes</v-list-item-title>
            </v-list-item>
            
            <v-list-item 
              v-if="userHasRole(['Admin', 'Encargado de Negocio'])" 
              link 
              to="/gestion/empresa"
            >
              <template v-slot:prepend>
                <v-icon>mdi-office-building-cog</v-icon>
              </template>
              <v-list-item-title>Datos de Mi Empresa</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>

        

        <v-app-bar app style="z-index: 1010;">
          <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

          <v-img
            src="/images/logo.svg"
            alt="SmartDTE Logo"
            contain
            max-height="40"
            max-width="150"
            class="mr-2"
          ></v-img>

          <v-chip
            v-if="activeCompanyName"
            class="d-none d-sm-flex" 
            color="primary"
            variant="tonal"
            label
            size="small"
          >
            <v-icon start icon="mdi-office-building-outline"></v-icon>
            {{ activeCompanyName }}
          </v-chip>
          
          <v-spacer></v-spacer>

          <v-menu v-if="authStore.isAuthenticated" location="bottom">
            <template v-slot:activator="{ props }">
              <v-chip v-bind="props" link pill>
                <v-avatar color="primary" size="small" class="mr-2">
                  <span class="text-caption font-weight-bold">{{ userInitials }}</span>
                </v-avatar>
                <span class="d-none d-sm-inline">{{ authStore.user?.name }}</span>
              </v-chip>
            </template>

            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="font-weight-bold">{{ authStore.user?.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ authStore.user?.email }}</v-list-item-subtitle>
              </v-list-item>
              <v-divider class="my-2"></v-divider>
              <v-list-item @click="handleLogout" link>
                <template v-slot:prepend>
                  <v-icon>mdi-logout</v-icon>
                </template>
                <v-list-item-title>Cerrar Sesión</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

        </v-app-bar>

        <v-main>
          <v-container fluid>
            <slot />
          </v-container>
        </v-main>
      </v-app>

      <template #fallback>
        <div class="d-flex justify-center align-center" style="height: 100vh;">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </div>
      </template>

    </client-only>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth'; // Importamos nuestro store
import { useNotificationStore } from '~/stores/notifications';

const config = useRuntimeConfig();
const adminUrl = config.public.adminUrl;
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const drawer = ref(true);
const isRefreshing = ref(false);

const activeCompanyName = computed(() => {
  // Si no hay usuario, no mostramos nada.
  if (!authStore.user) return '';

  // Si es super admin, mostramos un texto especial.
  if (authStore.user.is_super_admin) {
    return 'Vista de Super Administrador';
  }

  // Para usuarios normales, mostramos el nombre de su empresa.
  return authStore.user.empresa?.nombre_comercial || authStore.user.empresa?.nombre || 'Empresa no asignada';
});

const userInitials = computed(() => {
  const name = authStore.user?.name || '';
  // Divide el nombre por los espacios y toma la primera letra de las primeras dos palabras
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
});

async function handleLogout() {
  await authStore.logout();
}

async function refreshToken() {
  isRefreshing.value = true;
  try {
    const { $api } = useNuxtApp();
    // Llamamos al endpoint que ya existe en tu backend
    const response = await $api('/api/mh-token-refresh', { method: 'POST' });
    notificationStore.showNotification({ message: response.message, color: 'info' });
  } catch (error) {
    notificationStore.showNotification({ message: 'Error al refrescar el token.', color: 'error' });
  } finally {
    isRefreshing.value = false;
  }
}

function userHasRole(roles) {
  // 1. Si no hay un usuario o no tiene roles, devuelve falso.
  if (!authStore.user?.roles) return false;
  
  // 2. Comprueba si alguno de los roles del usuario (ej. 'Admin') 
  //    está incluido en la lista de roles que permitimos (ej. ['Admin', 'Encargado de Negocio']).
  return authStore.user.roles.some(userRole => roles.includes(userRole.name));
}
</script>

<style>
/* Aplica el relleno solo en pantallas de 960px de ancho o menos (tablets y móviles) */
@media (max-width: 960px) {
  .safe-area-top {
    padding-top: 64px;
  }
}
</style>