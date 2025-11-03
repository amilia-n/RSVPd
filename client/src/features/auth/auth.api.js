import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const authApi = {
  register: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.auth.register, data }),

  login: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.auth.login, data }),

  logout: () =>
    apiClient({ method: 'POST', url: API_ROUTES.auth.logout }),

  me: () =>
    apiClient({ method: 'GET', url: API_ROUTES.auth.me }),
};

export default authApi;