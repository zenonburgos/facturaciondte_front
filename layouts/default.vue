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
          <v-toolbar-title>SmartDTE</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="userHasRole(['Super-Admin', 'Admin', 'Contador', 'Cliente'])"
            href="https://api.sv-dte.com/admin" 
            target="_blank" 
            icon 
            title="Panel Administrativo"
          >
            <v-icon>mdi-shield-crown</v-icon>
          </v-btn>
          <!-- <v-btn icon title="Forzar Refresco de Token MH" @click="refreshToken" :loading="isRefreshing">
              <v-icon>mdi-sync-alert</v-icon>
          </v-btn> -->
          <span v-if="authStore.isAuthenticated" class="mr-2">
            Hola, {{ authStore.user?.name }}
          </span>
          <v-btn v-if="authStore.isAuthenticated" icon @click="handleLogout">
            <v-icon>mdi-logout</v-icon>
          </v-btn>
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
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth'; // Importamos nuestro store
import { useNotificationStore } from '~/stores/notifications';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const drawer = ref(true);
const isRefreshing = ref(false);

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