import { useState } from '#app'

/**
 * Gestiona el estado de visibilidad del footer en toda la aplicación.
 * @returns Un ref de estado booleano. `true` para visible (por defecto), `false` para oculto.
 */
export const useFooterVisibility = () => {
  // Eliminamos la sintaxis de TypeScript (<boolean>) para que sea compatible con JavaScript.
  return useState('footer-visible', () => true)
}
