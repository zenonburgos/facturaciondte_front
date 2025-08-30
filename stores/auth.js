// stores/auth.js
import { defineStore } from 'pinia';
import { useNotificationStore } from '~/stores/notifications';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: useCookie('auth_token').value || null, // Leemos el token de una cookie si existe
    user: null,
    backendStatus: 'online',
    isContingencyMode: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    //isBackendOnline: (state) => state.backendStatus === 'online',
  },

  actions: {
    async login(credentials) {
      
      const notificationStore = useNotificationStore();
      notificationStore.show = false;
      const { $api } = useNuxtApp();
      try {
        //await $api('/sanctum/csrf-cookie');
        //console.log("Cookie CSRF obtenida con éxito."); // Log para verificar

        // --- PASO 2: Ahora sí, intentamos el login con las credenciales ---
        const response = await $api('/api/login', {
          method: 'POST',
          body: credentials,
        });

        if (response.access_token) {
          // Si es exitoso, guardamos el token y los datos del usuario
          this.setToken(response.access_token);
          // this.setUser(response.user);
          await this.fetchUser();
          console.log("Login exitoso. Token y usuario guardados."); // Log para verificar
          return true;
        }
      } catch (error) {
        console.error('Error en el store de login:', error.data);
        throw error;
      }
    },

    async logout() {
      console.log('TRACE 3: authStore.logout() ha sido llamado.');
      const { $api } = useNuxtApp();
      const router = useRouter(); // Obtenemos el router para redirigir
      console.log('TRACE 3.5: ¿El router existe?', router);

        // Primero, le decimos al backend que invalide el token
        try {
            await $api('/api/logout', {
              method: 'POST',
          });
        } catch (error) {
            console.error("Error al cerrar sesión en el backend, pero se procederá con el logout local.", error);
        } finally {
            // Limpiamos el estado y la cookie, sin importar si la llamada a la API falló
            console.log('TRACE 4: Limpiando estado local y preparando para redirigir.'); // <--- AÑADIR ESTO
            this.token = null;
            this.user = null;
            const authTokenCookie = useCookie('auth_token');
            authTokenCookie.value = null;

            // Redirigimos al usuario a la página de login
            await router.push('/login');
        }
    },

    async fetchUser() {
      if (this.token) {
        try {
          const { $api } = useNuxtApp();
          const fullUserData = await $api('/api/user'); 
          this.setUser(fullUserData);
          console.log("Usuario con permisos cargado en la tienda:", fullUserData);
        } catch (error) {
          console.error("Error al recuperar el usuario, token inválido.", error);
          this.logout();
        }
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
    },
    
    setBackendStatus(status) {
      this.backendStatus = status;
    },

    // setContingencyMode(status) {
    //   this.isContingencyMode = status;
    // },
  },
});