// stores/notification.js
import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    show: false,
    message: '',
    color: 'success',
  }),
  actions: {
    showNotification(payload) {
      this.message = payload.message;
      this.color = payload.color || 'success';
      this.show = true;
    },
  },
});