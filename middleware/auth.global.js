import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  // --- La Lista de Invitados ---
  // Rutas que NO requieren que el usuario haya iniciado sesión.
  const publicRoutes = ['/login', '/register'];

  // Si la ruta a la que se intenta acceder está en la lista pública,
  // no hacemos nada y permitimos el acceso.
  if (publicRoutes.includes(to.path)) {
    return; // Permite la navegación
  }
  
  // --- Lógica del Guardia de Seguridad ---
  // Si la ruta no es pública, revisamos si el usuario está autenticado.
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    // Si NO está autenticado, lo enviamos al login, guardando la ruta
    // a la que intentaba ir.
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});