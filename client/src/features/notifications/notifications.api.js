import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const notificationsApi = {
  enqueue: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.notifications.enqueue, data }),

  get: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.notifications.get(id) }),

  markSent: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.notifications.markSent(id), data }),

  updateStatus: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.notifications.updateStatus(id), data }),

  listForUser: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.notifications.listForUser, params }),

  listForEvent: (eventId) =>
    apiClient({ method: 'GET', url: API_ROUTES.notifications.listForEvent(eventId) }),

  listQueued: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.notifications.listQueued, params }),

  send: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.notifications.send, data }),

  createAndSend: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.notifications.createAndSend, data }),

  // Devices
  upsertDevice: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.notifications.upsertDevice, data }),

  listDevices: () =>
    apiClient({ method: 'GET', url: API_ROUTES.notifications.listDevices }),

  deleteDevice: (id) =>
    apiClient({ method: 'DELETE', url: API_ROUTES.notifications.deleteDevice(id) }),

  updateDeviceLastSeen: (id) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.notifications.updateDeviceLastSeen(id) }),

  disableDevice: (id) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.notifications.disableDevice(id) }),

  incrementDeviceFailCount: (id) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.notifications.incrementDeviceFailCount(id) }),

  // Preferences
  getUserPrefs: () =>
    apiClient({ method: 'GET', url: API_ROUTES.notifications.getUserPrefs }),

  upsertUserPrefs: (data) =>
    apiClient({ method: 'PUT', url: API_ROUTES.notifications.upsertUserPrefs, data }),
};

export default notificationsApi;