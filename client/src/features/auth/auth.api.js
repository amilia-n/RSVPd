import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const authApi = {
  register: (data) =>
    apiClient({
      method: 'POST',
      url: API_ROUTES.auth.register,
      data: {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      }
    }),

  login: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.auth.login, data }),

  logout: () =>
    apiClient({ method: 'POST', url: API_ROUTES.auth.logout }),

  me: () =>
    apiClient({ method: 'GET', url: API_ROUTES.auth.me }),

  getMagicBellHmac: () =>
    apiClient({ method: 'GET', url: API_ROUTES.auth.magicBellHmac }),
};

export default authApi;