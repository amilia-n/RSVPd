import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const eventsApi = {
  // Events CRUD
  create: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.events.create, data }),

  get: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.get(id) }),

  update: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.events.update(id), data }),

  publish: (id) =>
    apiClient({ method: 'POST', url: API_ROUTES.events.publish(id) }),

  cancel: (id) =>
    apiClient({ method: 'POST', url: API_ROUTES.events.cancel(id) }),

  listForOrg: (orgId, params) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.listForOrg(orgId), params }),

  searchPublic: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.searchPublic, params }),

  upcomingPublic: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.upcomingPublic, params }),

  // Speakers
  createSpeaker: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.events.createSpeaker, data }),

  getSpeaker: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.getSpeaker(id) }),

  updateSpeaker: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.events.updateSpeaker(id), data }),

  deleteSpeaker: (id) =>
    apiClient({ method: 'DELETE', url: API_ROUTES.events.deleteSpeaker(id) }),

  listSpeakersForOrg: (orgId) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.listSpeakersForOrg(orgId) }),

  // Sessions
  createSession: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.events.createSession, data }),

  getSession: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.getSession(id) }),

  updateSession: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.events.updateSession(id), data }),

  deleteSession: (id) =>
    apiClient({ method: 'DELETE', url: API_ROUTES.events.deleteSession(id) }),

  listSessionsForEvent: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.listSessionsForEvent(eventId) }),

  // Analytics
  analytics: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.events.analytics(eventId) }),
};

export default eventsApi;