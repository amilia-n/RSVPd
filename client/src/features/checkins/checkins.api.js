import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const checkinsApi = {
  scan: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.checkins.scan, data }),

  listForEvent: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.checkins.listForEvent(eventId) }),

  listByUser: () =>
    apiClient({ method: 'GET', url: API_ROUTES.checkins.listByUser }),

  statsForEvent: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.checkins.statsForEvent(eventId) }),
};

export default checkinsApi;