<template>
  <div>
    <client-only>
      <v-app>
        <v-navigation-drawer v-model="drawer" app>
          <v-list dense>
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

            <v-list-item link to="/historial">
              <template v-slot:prepend>
                <v-icon>mdi-history</v-icon>
              </template>
              <v-list-item-title>Historial</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>

        <v-app-bar app>
          <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
          <v-toolbar-title>SmartDTE</v-toolbar-title>
          <v-spacer></v-spacer>
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

const authStore = useAuthStore();
const drawer = ref(true);

async function handleLogout() {
  await authStore.logout();
}
</script>