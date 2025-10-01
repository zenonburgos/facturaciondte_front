// plugins/api.ts

import { ofetch } from 'ofetch';
import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  
  const publicAuthRoutes = ['/api/login', '/sanctum/csrf-cookie'];

  const apiFetch = ofetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',

    // CAMBIO 1: El hook nos da 'request' y 'options'
    onRequest({ request, options }) {
      options.headers = new Headers(options.headers);
      options.headers.set('X-Requested-With', 'XMLHttpRequest');
      options.headers.set('Accept', 'application/json');

      const csrfToken = useCookie('XSRF-TOKEN');
      if (csrfToken.value) {
        options.headers.set('X-XSRF-TOKEN', csrfToken.value);
      }
      
      // CAMBIO 2: Usamos 'request' en lugar de 'options.url'
      const requestUrl = request.toString();
      const isPublicAuthRoute = publicAuthRoutes.some(route => requestUrl.endsWith(route));

      const authStore = useAuthStore();
      if (authStore.isAuthenticated && !isPublicAuthRoute) {
        options.headers.set('Authorization', `Bearer ${authStore.token}`);
      }
    },

    onResponseError({ request, response }) {
      const requestUrl = request.toString();
      const isPublicAuthRoute = publicAuthRoutes.some(route => requestUrl.endsWith(route));

      if ((response.status === 401 || response.status === 419) && !isPublicAuthRoute) {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          console.warn('Sesión expirada o no válida. Forzando logout...');
          authStore.logout();
        }
      }
    }
  });

  return {
    provide: {
      api: apiFetch,
    }
  };
});