<template>
  <v-container>
    <h1 class="text-h4 mb-6">Configuraciones del Sistema</h1>

    <v-row>
      <v-col cols="12" md="8" lg="6">
        
        <v-card class="mb-4" variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon start color="blue">mdi-storefront-outline</v-icon>
            Punto de Venta (POS)
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list lines="two">
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-switch
                    v-model="form.imprimir_automaticamente_ticket"
                    color="primary"
                    hide-details
                    :loading="saving"
                  ></v-switch>
                </template>
                <v-list-item-title>Impresión Automática de Ticket</v-list-item-title>
                <v-list-item-subtitle>
                  Al activar, la ventana de impresión se abrirá inmediatamente después de emitir una factura exitosa.
                </v-list-item-subtitle>
              </v-list-item>

            </v-list>
          </v-card-text>
        </v-card>

        <v-card class="mb-4" variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon start color="orange">mdi-email-outline</v-icon>
            Notificaciones por Correo
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list lines="two">
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-switch
                    v-model="form.enviar_copia_emisor"
                    color="primary"
                    hide-details
                    :loading="saving"
                  ></v-switch>
                </template>
                <v-list-item-title>Recibir Copia de Ventas</v-list-item-title>
                <v-list-item-subtitle>
                  Se enviará una copia oculta (BCC) al correo de la empresa por cada DTE emitido.
                </v-list-item-subtitle>
              </v-list-item>

            </v-list>
          </v-card-text>
        </v-card>

        <div class="d-flex justify-end mt-4">
          <v-btn 
            color="primary" 
            size="large" 
            @click="guardarCambios" 
            :loading="saving"
            prepend-icon="mdi-content-save"
          >
            Guardar Cambios
          </v-btn>
        </div>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth'; // Ajusta la ruta de tu store
import { useNuxtApp } from '#app';

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const saving = ref(false);

// Inicializamos con los valores actuales del usuario
const form = ref({
  imprimir_automaticamente_ticket: false,
  enviar_copia_emisor: false
});

onMounted(() => {
  // Cargar configuración existente desde el store
  const config = authStore.user?.empresa?.configuracion || {};
  
  form.value.imprimir_automaticamente_ticket = config.imprimir_automaticamente_ticket ?? false;
  form.value.enviar_copia_emisor = config.enviar_copia_emisor ?? false;
});

async function guardarCambios() {
  saving.value = true;
  try {
    // Enviamos al backend
    const response = await $api('/api/empresa/configuracion', {
      method: 'PUT',
      body: form.value
    });

    // ACTUALIZAMOS EL STORE LOCALMENTE
    // Esto es vital para que el POS (emitir.vue) vea el cambio sin recargar página F5
    if (authStore.user && authStore.user.empresa) {
       // Aseguramos que el objeto configuracion exista
       if (!authStore.user.empresa.configuracion) {
           authStore.user.empresa.configuracion = {};
       }
       // Actualizamos los valores
       authStore.user.empresa.configuracion.imprimir_automaticamente_ticket = form.value.imprimir_automaticamente_ticket;
       authStore.user.empresa.configuracion.enviar_copia_emisor = form.value.enviar_copia_emisor;
    }

    // Notificación de éxito (puedes usar tu store de notificaciones)
    alert('Configuración guardada con éxito'); 

  } catch (error) {
    console.error(error);
    alert('Error al guardar la configuración');
  } finally {
    saving.value = false;
  }
}
</script>