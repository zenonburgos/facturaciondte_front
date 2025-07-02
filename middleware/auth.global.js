import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  // Si el usuario no está autenticado Y no está intentando ir a la página de login...
  if (!authStore.isAuthenticated && to.path !== '/login') {
    // return navigateTo('/login');
    // Guardamos la ruta completa a la que se intentaba acceder (incluyendo los parámetros).
    const redirectPath = encodeURIComponent(to.fullPath);
    
    // Redirigimos al login, pero ahora añadiendo la ruta guardada como un parámetro.
    return navigateTo(`/login?redirect=${redirectPath}`);
  }

  // Si el usuario SÍ está autenticado y пытается ir a la página de login...
  if (authStore.isAuthenticated && to.path === '/login') {
    // ...lo redirigimos al dashboard porque ya tiene sesión.
    return navigateTo('/');
  }
});