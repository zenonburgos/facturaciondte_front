import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';
import { useRouter } from 'vue-router'; 

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const apiFetch = $fetch.create({
    baseURL: config.public.apiBaseUrl,

    credentials: 'include', // Le dice al navegador que envíe las cookies.
    
    onRequest({ options }) {
      const authStore = useAuthStore();
      if (authStore.token) {
        options.headers = new Headers(options.headers);
        options.headers.set('Authorization', `Bearer ${authStore.token}`);
      }
    },
    
    // La lógica mejorada ahora está aquí
    onResponseError({ request, response, error }) {
        const authStore = useAuthStore();
        const notificationStore = useNotificationStore();
        const router = useRouter(); // Obtenemos la instancia del router

        const isAuthError = response && (response.status === 401 || response.status === 419);
        const isCriticalUserError = response && response.status === 500 && new URL(request).pathname === '/api/user';

        // Si es un error de autenticación...
        if (isAuthError || isCriticalUserError) {
          // ...y el usuario NO está ya en la página de login...
          if (router.currentRoute.value.path !== '/login') {
            notificationStore.showNotification({ 
              message: 'Tu sesión ha expirado o es inválida. Por favor, inicia sesión de nuevo.', 
              color: 'error' 
            });
            // ...entonces sí cerramos la sesión.
            authStore.logout();
          }
          return; // Detenemos la ejecución para no mostrar otros errores
        }
    }
  });

  return {
    provide: {
      api: apiFetch,
    }
  }
});