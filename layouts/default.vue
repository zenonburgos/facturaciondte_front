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

        <v-navigation-drawer v-model="drawer" app class="custom-sidebar">
          <v-list>
            <v-list-item
              class="px-4"
              :title="companyHeaderText"
              :subtitle="companyHeaderSubtitle"
              :to="companyLink"
              :link="!!companyLink"
            >
              <template v-slot:prepend>
                <v-avatar color="white">
                  <v-img
                    v-if="companyLogoUrl"
                    :src="companyLogoUrl"
                    :alt="companyHeaderText"
                    cover
                  ></v-img>
                  <span v-else class="text-h6 text-primary">{{ userInitials }}</span>
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-list nav>
            <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" value="dashboard" to="/"></v-list-item>
            <v-list-item prepend-icon="mdi-plus-box" title="Emitir DTE" value="emitir" to="/emitir"></v-list-item>
            <v-list-item prepend-icon="mdi-history" title="Historial" value="historial" to="/historial"></v-list-item>

            <template v-if="userHasRole(['Admin', 'Encargado de Negocio', 'Cajero'])">
              <v-divider class="my-2"></v-divider>
              <v-list-subheader>MANTENIMIENTO</v-list-subheader>
              
              <v-list-item
                v-if="userHasRole(['Admin', 'Encargado de Negocio'])"
                prepend-icon="mdi-account-group"
                title="Gestión de Usuarios"
                value="usuarios"
                to="/gestion/usuarios"
              ></v-list-item>
              <v-list-item
                v-if="userHasRole(['Admin', 'Encargado de Negocio', 'Cajero'])"
                prepend-icon="mdi-account-supervisor-circle"
                title="Gestión de Clientes"
                value="clientes"
                to="/gestion/clientes"
              ></v-list-item>
            </template>
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
            @click="goToDashboard"
            style="cursor: pointer;"
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

          <div v-if="authStore.user?.is_super_admin" class="mr-4" style="max-width: 300px;">
            <v-select
              v-model="selectedTenantId"
              :items="authStore.user.available_tenants || []"
              item-title="nombre"
              item-value="id"
              label="Trabajando en"
              density="compact"
              hide-details
              variant="solo-filled"
              @update:modelValue="handleTenantChange"
            >
              <template v-slot:prepend-inner>
                <v-icon icon="mdi-domain" class="mr-2"></v-icon>
              </template>
            </v-select>
          </div>

          <v-menu v-if="authStore.isAuthenticated" location="bottom">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" rounded="pill" variant="tonal" class="text-none pa-1" style="height: auto;">
                    <v-avatar color="primary" size="default">
                        <span class="text-subtitle-2 font-weight-bold">{{ userInitials }}</span>
                    </v-avatar>
                    <span class="d-none d-sm-inline ml-2 mr-1">{{ authStore.user?.name }}</span>
                </v-btn>
            </template>

            <v-list density="compact">
                <v-list-item>
                    <v-list-item-title class="font-weight-bold">{{ authStore.user?.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ authStore.user?.email }}</v-list-item-subtitle>
                </v-list-item>

                <v-divider class="my-2"></v-divider>

                <v-list-item v-if="authStore.user?.roles?.length > 0">
                    <template v-slot:prepend>
                        <v-icon size="small">mdi-shield-account-outline</v-icon>
                    </template>
                    <v-list-item-title class="text-caption">Rol</v-list-item-title>
                    <v-list-item-subtitle class="font-weight-medium">{{ authStore.user.roles[0].name }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="authStore.user?.defaultPuntoDeVenta">
                    <template v-slot:prepend>
                        <v-icon size="small">mdi-point-of-sale</v-icon>
                    </template>
                    <v-list-item-title class="text-caption">Punto de Venta</v-list-item-title>
                    <v-list-item-subtitle class="font-weight-medium">{{ authStore.user.defaultPuntoDeVenta.nombre }}</v-list-item-subtitle>
                </v-list-item>

                <template v-if="userHasRole(['Admin'])">
                    <v-divider class="my-2"></v-divider>
                    <v-list-item 
                        :href="adminUrl" 
                        target="_blank" 
                        link
                    >
                        <template v-slot:prepend>
                            <v-icon>mdi-cog</v-icon>
                        </template>
                        <v-list-item-title>Panel de Administración</v-list-item-title>
                    </v-list-item>
                </template>

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
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth'; // Importamos nuestro store
import { useNotificationStore } from '~/stores/notifications';
import { useRouter } from 'vue-router'; 

const selectedTenantId = ref(null);

const handleTenantChange = (tenantId) => {
  const selectedTenant = authStore.user.available_tenants.find(t => t.id === tenantId);
  if (selectedTenant) {
    // Usamos la acción que ya creamos en el store
    authStore.setActiveTenant(selectedTenant); 
  }
};

const config = useRuntimeConfig();
const adminUrl = config.public.adminUrl;
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
console.log('Roles del usuario en el frontend:', authStore.user?.roles);
const drawer = ref(true);
const isRefreshing = ref(false);

const router = useRouter();
const goToDashboard = () => router.push('/');

const companyLogoUrl = computed(() => {
  const logoPath = authStore.user?.empresa?.logo_path;
  if (!logoPath) {
    return null; // No hay logo
  }
  // Construimos la URL completa: http://localhost:8000/storage/logos-empresas/archivo.png
  return `${config.public.apiBaseUrl}/storage/${logoPath}`;
});

const companyHeaderText = computed(() => {
  if (!authStore.user) return '';
  if (authStore.user.is_super_admin) return 'Super Administrador';
  return authStore.user.empresa?.nombre_comercial || authStore.user.empresa?.nombre || 'Empresa';
});

const companyHeaderSubtitle = computed(() => {
  if (!authStore.user) return '';
  if (authStore.user.is_super_admin) return 'Control Total del Sistema';
  return `NIT: ${authStore.user.empresa?.nit || 'No especificado'}`;
});

const userInitials = computed(() => {
  const name = authStore.user?.name || '';
  // Divide el nombre por los espacios y toma la primera letra de las primeras dos palabras
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
});

const companyLink = computed(() => {
  if (userHasRole(['Admin', 'Encargado de Negocio', 'Contador'])) {
    return '/gestion/empresa';
  }
  return null; // No será un enlace para otros roles
});

onMounted(() => {
  const activeTenant = authStore.getActiveTenant;
  if (activeTenant) {
    selectedTenantId.value = activeTenant.id;
  }
});

watch(() => authStore.getActiveTenant, (newTenant) => {
  if (newTenant) {
    selectedTenantId.value = newTenant.id;
  }
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

/* --- ESTILOS PARA EL MENÚ LATERAL PERSONALIZADO (VERSIÓN CORREGIDA) --- */

/* 1. Color de fondo del menú */
.custom-sidebar .v-navigation-drawer__content {
  background-color: #F0F4F9 !important;
}
.custom-sidebar .v-list {
  background-color: transparent !important;
}

/* 2. Estilo y tamaño de la fuente para TODAS las opciones */
/* Usamos un selector más específico para asegurar que se aplique */
.custom-sidebar .v-list-item .v-list-item-title {
  font-family: 'Roboto', 'Arial', sans-serif !important;
  font-size: 0.95rem !important; /* Aumentamos el tamaño */
  font-weight: 500 !important;   /* Le damos un grosor medio */
}

/* 3. Estilos para la opción seleccionada (activa) */
.custom-sidebar .v-list-item--active {
  background-color: #D3E3FD !important;
  border-top-right-radius: 25px;
  border-bottom-right-radius: 25px;
}
/* CORRECCIÓN CLAVE: Aplicamos el color al título dentro de un item activo */
.custom-sidebar .v-list-item--active .v-list-item-title {
  color: #2C5EB0 !important;
}
.custom-sidebar .v-list-item--active .v-icon {
  color: #2C5EB0 !important;
}

/* 4. Estilos para cuando el mouse pasa por encima (hover) */
/* Usamos :hover en el v-list-item para detectar el evento */
.custom-sidebar .v-list-item:hover {
  background-color: #D3E3FD !important;
  border-top-right-radius: 25px;
  border-bottom-right-radius: 25px;
}
/* CORRECCIÓN CLAVE: Aplicamos el color al título cuando el mouse está encima del item */
.custom-sidebar .v-list-item:hover .v-list-item-title {
  color: #2C5EB0 !important;
}
.custom-sidebar .v-list-item:hover .v-icon {
  color: #2C5EB0 !important;
}
</style>