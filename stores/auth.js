// stores/auth.js
import { defineStore } from 'pinia';
import { useNotificationStore } from '~/stores/notifications';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: useCookie('auth_token').value || null, // Leemos el token de una cookie si existe
    user: null,
    activeTenant: null, 
    backendStatus: 'online',
    isContingencyMode: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    // ✅ NUEVO: Getter para saber en qué empresa estamos trabajando
    // Para un usuario normal, siempre será su propia empresa.
    // Para un Super Admin, será la que haya seleccionado.
    getActiveTenant: (state) => {
      if (!state.user) return null;
      return state.user.is_super_admin ? state.activeTenant : state.user.empresa;
    },
    dteEnvironment(state) {
      // Usamos 'this.getActiveTenant' para obtener la empresa correcta,
      // ya sea la del usuario o la que el Super Admin seleccionó.
      const activeTenant = this.getActiveTenant;

      // Si no hay una empresa activa, no hay ambiente que mostrar.
      if (!activeTenant) {
        return null;
      }

      const ambiente = activeTenant.mh_ambiente;

      if (ambiente === '00') {
        return { text: 'Pruebas', color: 'blue-grey' };
      }
      if (ambiente === '01') {
        return { text: 'Producción', color: 'success' };
      }
      
      return { text: 'No Definido', color: 'grey' };
    },
  },

  actions: {
    async login(credentials) {
      const { $api } = useNuxtApp();
      
      try {
        // 1. Pedimos la cookie de sesión a Sanctum
        await $api('/sanctum/csrf-cookie');

        // 2. Intentamos el login con las credenciales
        const response = await $api('/api/login', {
          method: 'POST',
          body: credentials,
        });

        // 3. Si es exitoso, actualizamos el estado
        if (response.access_token) {
          this.setToken(response.access_token);
          this.setUser(response.user);
          
          // 4. Devolvemos el objeto del usuario para que el componente decida qué hacer
          return response.user; 
        }
        return null;

      } catch (error) {
        console.error('ERROR en el store de login:', error);
        throw error;
      }
    },

    // ✅ NUEVA ACCIÓN: Para que el Super Admin pueda cambiar de empresa
    async setActiveTenant(tenant) {
      // Nos aseguramos de que solo un Super Admin pueda ejecutar esto
      if (this.user && this.user.is_super_admin) {
        const { $api } = useNuxtApp();
        try {
          // 1. Notificamos al backend sobre el cambio de contexto
          await $api(`/api/set-active-tenant/${tenant.id}`, {
            method: 'POST',
          });
          
          // 2. Actualizamos el estado local en el store
          this.activeTenant = tenant;

          // 3. ¡CRUCIAL! Recargamos la página para refrescar todos los datos
          window.location.reload();

        } catch (error) {
          console.error("Error al cambiar de tenant:", error);
          const notificationStore = useNotificationStore();
          notificationStore.showNotification({ 
            message: 'No se pudo cambiar de empresa. Inténtalo de nuevo.', 
            color: 'error' 
          });
        }
      }
    },


    async logout() {
      const { $api } = useNuxtApp();
      const router = useRouter(); // Obtenemos el router para redirigir

        // Primero, le decimos al backend que invalide el token
        if (this.isAuthenticated) {
          try {
            await $api('/api/logout', {
              method: 'POST',
            });
          } catch (error) {
            console.error("Error al cerrar sesión en el backend (el token pudo haber expirado), pero se procederá con el logout local.", error);
          }
        }

        this.token = null;
        this.user = null;
        const authTokenCookie = useCookie('auth_token');
        authTokenCookie.value = null;

        // Redirigimos al usuario a la página de login
        // Usamos 'replace' para que el usuario no pueda volver atrás con el botón del navegador
        await router.replace('/login');
    },

    async fetchUser() {
      const { $api } = useNuxtApp();
      try {
        const userData = await $api('/api/user');
        this.user = userData; // Mantenemos la actualización del estado
        return userData; // <-- ¡AÑADIMOS ESTA LÍNEA CLAVE!
      } catch (error) {
        console.error("Error al obtener datos del usuario", error);
        this.user = null;
        return null; // <-- También retornamos null en caso de error
      }
    },

    setToken(token) {
      this.token = token;
      // Guardamos el token en una cookie que expira en 1 día para persistir la sesión
      const authTokenCookie = useCookie('auth_token', { maxAge: 60 * 60 * 24 });
      authTokenCookie.value = token;
    },

    setUser(user) {
        this.user = user;
        // ================================================================
        // LÓGICA MEJORADA
        // Ahora, el estado 'activeTenant' se inicializa con el valor que
        // viene del backend (que puede ser null o la última empresa usada).
        // ================================================================
        if (user && user.is_super_admin) {
            this.activeTenant = user.active_tenant || null;
        }
    },
    
    setBackendStatus(status) {
      this.backendStatus = status;
    },

    // setContingencyMode(status) {
    //   this.isContingencyMode = status;
    // },
  },
});