import { api } from './api.js';

export const userService = {
  async updateProfile(values) {
    const { data } = await api.patch('/api/v1/users/me', values);
    return data.data;
  },
  async changePassword(values) {
    await api.patch('/api/v1/users/me/password', values);
  },
  async deleteAccount(password) {
    await api.delete('/api/v1/users/me', { data: { password } });
  },
  async addConsent(type, action = 'granted') {
    const { data } = await api.post('/api/v1/users/me/consent-events', {
      type,
      action,
      documentVersion: import.meta.env.VITE_PRIVACY_VERSION || '1.0',
    });
    return data.data;
  },
};
