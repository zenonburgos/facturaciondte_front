import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  // Si el usuario no está autenticado Y no está intentando ir a la página de login...
  if (!authStore.isAuthenticated && to.path !== '/login') {
    // ...lo redirigimos a la página de login.
    return navigateTo('/login');
  }

  // Si el usuario SÍ está autenticado y пытается ir a la página de login...
  if (authStore.isAuthenticated && to.path === '/login') {
    // ...lo redirigimos al dashboard porque ya tiene sesión.
    return navigateTo('/');
  }
});