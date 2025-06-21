import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const apiFetch = $fetch.create({
    baseURL: config.public.apiBaseUrl,
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

        // --- Caso 1: Error de Sesión (Logout Forzoso) ---
        const isAuthError = response && (response.status === 401 || response.status === 419);
        const isCriticalUserError = response && response.status === 500 && new URL(request).pathname === '/api/user';

        if (isAuthError || isCriticalUserError) {
            notificationStore.showNotification({ 
            message: 'Tu sesión ha expirado o es inválida. Por favor, inicia sesión de nuevo.', 
            color: 'error' 
            });
            authStore.logout();
            return;
        }
    }
  });

  return {
    provide: {
      api: apiFetch,
    }
  }
});