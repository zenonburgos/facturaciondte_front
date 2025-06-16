// stores/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: useCookie('auth_token').value || null, // Leemos el token de una cookie si existe
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(credentials) {
      try {
        // Limpiamos cualquier estado previo
        this.logout();

        // Llamamos a la API de Laravel para iniciar sesión
        const response = await $fetch('http://localhost:8000/api/login', {
          method: 'POST',
          body: credentials,
        });

        if (response.access_token) {
          // Si es exitoso, guardamos el token y los datos del usuario
          this.setToken(response.access_token);
          this.setUser(response.user);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error en el store de login:', error.data);
        throw error;
      }
    },

    async logout() {
      const router = useRouter(); // Obtenemos el router para redirigir

        // Primero, le decimos al backend que invalide el token
        try {
            await $fetch('http://localhost:8000/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error("Error al cerrar sesión en el backend, pero se procederá con el logout local.", error);
        } finally {
            // Limpiamos el estado y la cookie, sin importar si la llamada a la API falló
            this.token = null;
            this.user = null;
            const authTokenCookie = useCookie('auth_token');
            authTokenCookie.value = null;

            // Redirigimos al usuario a la página de login
            await router.push('/login');
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
    }
  },
});