import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const paymentsApi = {
  createCheckoutSession: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.payments.createCheckoutSession, data }),

  create: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.payments.create, data }),

  get: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.payments.get(id) }),

  updateStatus: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.payments.updateStatus(id), data }),

  listForOrder: (orderId) =>
    apiClient({ method: 'GET', url: API_ROUTES.payments.listForOrder(orderId) }),
};

export default paymentsApi;