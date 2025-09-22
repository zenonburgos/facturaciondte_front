import { ofetch } from 'ofetch';
import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const apiFetch = ofetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: 'include', // ¡Crucial! Envía las cookies con cada petición.

    onRequest({ options }) {
      // Prepara las cabeceras para cada petición
      options.headers = new Headers(options.headers);
      options.headers.set('X-Requested-With', 'XMLHttpRequest');
      options.headers.set('Accept', 'application/json');

      // ================================================================
      // ESTA ES LA LÓGICA QUE FALTABA
      // Leemos la cookie XSRF y la enviamos de vuelta como una cabecera.
      // ================================================================
      const csrfToken = useCookie('XSRF-TOKEN');
      if (csrfToken.value) {
        options.headers.set('X-XSRF-TOKEN', csrfToken.value);
      }

      // Añadimos el token de autenticación si ya existe
      const authStore = useAuthStore();
      if (authStore.token) {
        options.headers.set('Authorization', `Bearer ${authStore.token}`);
      }
    },

    onResponseError({ response }) {
      // Manejo de sesión expirada
      if (response.status === 401 || response.status === 419) {
        const authStore = useAuthStore();
        authStore.logout();
      }
    }
  });

  // Hacemos que $api esté disponible en toda la aplicación.
  return {
    provide: {
      api: apiFetch,
    }
  };
});

