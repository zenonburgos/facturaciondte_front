import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // Leemos la bandera 'auth' de los metadatos de la ruta a la que vamos.
  // Si la bandera no está definida o es 'undefined', asumimos que la ruta SÍ requiere autenticación (?? true).
  const requiresAuth = to.meta.auth ?? true;

  // Si la ruta está marcada explícitamente como pública (auth: false),
  // como en nuestro archivo pages/p/[slug].vue, detenemos el middleware y permitimos el acceso.
  if (requiresAuth === false) {
    return; // Permite la navegación
  }
  
  // Si la ruta es la de login, tampoco hacemos nada para evitar un bucle de redirección.
  if (to.path === '/login') {
    return;
  }

  // A partir de aquí, es la lógica para rutas protegidas que no son públicas.
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    // Si el usuario no está autenticado, lo redirigimos al login,
    // guardando la ruta a la que intentaba ir.
    return navigateTo('/login', {
      query: {
        redirect: to.fullPath,
      },
    });
  }
});

