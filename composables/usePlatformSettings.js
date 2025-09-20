import { useState } from '#app'

export const usePlatformSettings = () => {
  // Esta función crea o accede al estado global 'platform-settings'
  // y lo inicializa como 'null' si aún no existe.
  return useState('platform-settings', () => null)
}