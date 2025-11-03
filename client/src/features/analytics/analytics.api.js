import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const analyticsApi = {
  eventAnalytics: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.analytics(eventId) }),
};

export default analyticsApi;