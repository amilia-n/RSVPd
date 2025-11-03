import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const ticketsApi = {
  getById: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.tickets.getById(id) }),

  qrDataURL: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.tickets.qrDataURL(id) }),

  cancel: (id) =>
    apiClient({ method: 'POST', url: API_ROUTES.tickets.cancel(id) }),

  listForOrder: (orderId) =>
    apiClient({ method: 'GET', url: API_ROUTES.tickets.listForOrder(orderId) }),

  listForUser: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.tickets.listForUser, params }),

  listForEvent: (eventId, params) =>
    apiClient({ method: 'GET', url: API_ROUTES.tickets.listForEvent(eventId), params }),
};

export default ticketsApi;