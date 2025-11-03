import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const ticketTypesApi = {
  create: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.ticketTypes.create, data }),

  get: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.ticketTypes.get(id) }),

  update: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.ticketTypes.update(id), data }),

  deactivate: (id) =>
    apiClient({ method: 'POST', url: API_ROUTES.ticketTypes.deactivate(id) }),

  listForEvent: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.ticketTypes.listForEvent(eventId) }),

  availability: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.ticketTypes.availability(id) }),
};

export default ticketTypesApi;