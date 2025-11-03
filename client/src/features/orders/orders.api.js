import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const ordersApi = {
  create: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.orders.create, data }),

  get: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.orders.get(id) }),

  setStatus: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.orders.setStatus(id), data }),

  updateTotals: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.orders.updateTotals(id), data }),

  cancel: (id) =>
    apiClient({ method: 'POST', url: API_ROUTES.orders.cancel(id) }),

  listForUser: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.orders.listForUser, params }),

  listForEvent: (eventId, params) =>
    apiClient({ method: 'GET', url: API_ROUTES.orders.listForEvent(eventId), params }),

  // Order Items
  checkAvailabilityForAdd: (id, data) =>
    apiClient({ method: 'POST', url: API_ROUTES.orders.checkAvailabilityForAdd(id), data }),

  addItem: (id, data) =>
    apiClient({ method: 'POST', url: API_ROUTES.orders.addItem(id), data }),

  updateItem: (id, itemId, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.orders.updateItem(id, itemId), data }),

  deleteItem: (id, itemId) =>
    apiClient({ method: 'DELETE', url: API_ROUTES.orders.deleteItem(id, itemId) }),
};

export default ordersApi;