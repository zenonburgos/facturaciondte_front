import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // --- FUSIÓN DE LÓGICAS ---

  // 1. La Lista de Invitados: Simple y explícita para rutas estáticas.
  const publicRoutes = [
    '/',
    '/login', 
    '/register',
    // Si tienes una página de "olvidé mi contraseña", añádela aquí
  ];

  if (publicRoutes.includes(to.path)) {
    return; // Permite el acceso a /login y /register
  }

  // 2. El Sistema de Banderas: Flexible para páginas dinámicas y casos especiales.
  const requiresAuth = to.meta.auth ?? true;
  if (requiresAuth === false) {
    return; // Permite el acceso a cualquier página con 'auth: false'
  }
  
  // --- LÓGICA DEL GUARDIA DE SEGURIDAD (sin cambios) ---
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    // Si la ruta no es pública y el usuario no está autenticado, lo redirigimos.
    return navigateTo('/login', {
      query: {
        redirect: to.fullPath,
      },
    });
  }
});

