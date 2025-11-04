import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const surveysApi = {
  create: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.surveys.create, data }),

  get: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.surveys.get(id) }),

  update: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.surveys.update(id), data }),

  delete: (id) =>
    apiClient({ method: 'DELETE', url: API_ROUTES.surveys.delete(id) }),

  listForEvent: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.surveys.listForEvent(eventId) }),

  listForOrg: (orgId) =>
    apiClient({ method: 'GET', url: API_ROUTES.surveys.listForOrg(orgId) }),

  listForUser: () =>
    apiClient({ method: 'GET', url: API_ROUTES.surveys.listForUser }),

  send: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.surveys.send, data }),

  saveDraft: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.surveys.saveDraft, data }),

  submit: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.surveys.submit, data }),

  getStats: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.surveys.getStats(id) }),

  getResponses: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.surveys.getResponses(id) }),
};

export default surveysApi;