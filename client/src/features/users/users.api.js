import apiClient from '../../lib/apiClient.js';
import { API_ROUTES } from '../../constants/apiRoutes.js';

export const usersApi = {
  // User CRUD
  getMe: () =>
    apiClient({ method: 'GET', url: API_ROUTES.users.me }),

  list: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.users.list, params }),

  get: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.users.get(id) }),

  update: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.users.update(id), data }),

  verify: (id) =>
    apiClient({ method: 'POST', url: API_ROUTES.users.verify(id) }),

  // Roles
  listRoles: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.users.listRoles(id) }),

  grantRole: (id, data) =>
    apiClient({ method: 'POST', url: API_ROUTES.users.grantRole(id), data }),

  revokeRole: (id, role) =>
    apiClient({ method: 'DELETE', url: API_ROUTES.users.revokeRole(id, role) }),

  // Organizations
  createOrg: (data) =>
    apiClient({ method: 'POST', url: API_ROUTES.users.createOrg, data }),

  listOrgs: (params) =>
    apiClient({ method: 'GET', url: API_ROUTES.users.listOrgs, params }),

  getOrgBySlug: (slug) =>
    apiClient({ method: 'GET', url: API_ROUTES.users.getOrgBySlug(slug) }),

  getOrg: (id) =>
    apiClient({ method: 'GET', url: API_ROUTES.users.getOrg(id) }),

  updateOrg: (id, data) =>
    apiClient({ method: 'PATCH', url: API_ROUTES.users.updateOrg(id), data }),

  // Org Members
  listOrgMembers: (orgId) =>
    apiClient({ method: 'GET', url: API_ROUTES.users.listOrgMembers(orgId) }),

  upsertOrgMember: (orgId, data) =>
    apiClient({ method: 'POST', url: API_ROUTES.users.upsertOrgMember(orgId), data }),

  removeOrgMember: (orgId, data) =>
    apiClient({ method: 'DELETE', url: API_ROUTES.users.removeOrgMember(orgId), data }),
};

export default usersApi;