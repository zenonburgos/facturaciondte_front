import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  // --- La Lista de Invitados (CORREGIDA) ---
  // Añadimos todas las páginas que deben ser públicas.
  const publicRoutes = [
    '/login', 
    '/register',
    '/privacy',      // ✅ AÑADIDO
    '/about',        // ✅ AÑADIDO
    '/contact'       // ✅ AÑADIDO
    // Agrega aquí cualquier otra página que no necesite login
  ];

  // Si la ruta a la que se intenta acceder está en la lista pública,
  // no hacemos nada y permitimos el acceso.
  if (publicRoutes.includes(to.path)) {
    return; // Permite la navegación
  }
  
  // --- Lógica del Guardia de Seguridad (se mantiene igual) ---
  // Si la ruta no es pública, revisamos si el usuario está autenticado.
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    // Si NO está autenticado, lo enviamos al login.
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});