export const API_ROUTES = {
  // ───────────────────────── Auth ─────────────────────────
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    magicBellHmac: '/api/auth/magicbell-hmac',
  },

  // ───────────────────────── Users ─────────────────────────
  users: {
    me: '/api/users/me',
    list: '/api/users',
    get: (id) => `/api/users/${id}`,
    update: (id) => `/api/users/${id}`,
    verify: (id) => `/api/users/${id}/verify`,
    // Roles
    listRoles: (id) => `/api/users/${id}/roles`,
    grantRole: (id) => `/api/users/${id}/roles`,
    revokeRole: (id, role) => `/api/users/${id}/roles/${role}`,
    // Orgs
    createOrg: '/api/users/orgs',
    listMyOrgs: '/api/users/orgs/me', 
    listOrgs: '/api/users/orgs',
    getOrgBySlug: (slug) => `/api/users/orgs/slug/${slug}`,
    getOrg: (id) => `/api/users/orgs/${id}`,
    updateOrg: (id) => `/api/users/orgs/${id}`,
    // Org Members
    listOrgMembers: (orgId) => `/api/users/orgs/${orgId}/members`,
    upsertOrgMember: (orgId) => `/api/users/orgs/${orgId}/members`,
    removeOrgMember: (orgId) => `/api/users/orgs/${orgId}/members`,
    listOrgVenues: (orgId) => `/api/users/orgs/${orgId}/venues`, 
  },

  // ───────────────────────── Events ─────────────────────────
  events: {
    create: '/api/events',
    get: (id) => `/api/events/${id}`,
    update: (id) => `/api/events/${id}`,
    publish: (id) => `/api/events/${id}/publish`,
    cancel: (id) => `/api/events/${id}/cancel`,
    listForOrg: (orgId) => `/api/events/org/${orgId}`,
    searchPublic: '/api/events/public/search',
    upcomingPublic: '/api/events/public/upcoming',
    // Speakers
    createSpeaker: '/api/events/speakers',
    getSpeaker: (id) => `/api/events/speakers/${id}`,
    updateSpeaker: (id) => `/api/events/speakers/${id}`,
    deleteSpeaker: (id) => `/api/events/speakers/${id}`,
    listSpeakersForOrg: (orgId) => `/api/events/org/${orgId}/speakers`,
    // Sessions
    createSession: '/api/events/sessions',
    getSession: (id) => `/api/events/sessions/${id}`,
    updateSession: (id) => `/api/events/sessions/${id}`,
    deleteSession: (id) => `/api/events/sessions/${id}`,
    listSessionsForEvent: (eventId) => `/api/events/${eventId}/sessions`,
    // Analytics
    analytics: (eventId) => `/api/events/${eventId}/analytics`,
  },

  // ───────────────────────── Ticket Types ─────────────────────────
  ticketTypes: {
    create: '/api/ticket-types',
    get: (id) => `/api/ticket-types/${id}`,
    update: (id) => `/api/ticket-types/${id}`,
    deactivate: (id) => `/api/ticket-types/${id}/deactivate`,
    listForEvent: (eventId) => `/api/ticket-types/event/${eventId}`,
    availability: (id) => `/api/ticket-types/${id}/availability`,
  },

  // ───────────────────────── Orders ─────────────────────────
  orders: {
    create: '/api/orders',
    get: (id) => `/api/orders/${id}`,
    setStatus: (id) => `/api/orders/${id}/status`,
    updateTotals: (id) => `/api/orders/${id}/totals`,
    cancel: (id) => `/api/orders/${id}/cancel`,
    listForUser: '/api/orders/me/list',
    listForEvent: (eventId) => `/api/orders/event/${eventId}`,
    // Order Items
    checkAvailabilityForAdd: (id) => `/api/orders/${id}/items/check`,
    addItem: (id) => `/api/orders/${id}/items`,
    updateItem: (id, itemId) => `/api/orders/${id}/items/${itemId}`,
    deleteItem: (id, itemId) => `/api/orders/${id}/items/${itemId}`,
  },

  // ───────────────────────── Payments ─────────────────────────
  payments: {
    createCheckoutSession: '/api/payments/checkout-session',
    create: '/api/payments',
    get: (id) => `/api/payments/${id}`,
    updateStatus: (id) => `/api/payments/${id}/status`,
    listForOrder: (orderId) => `/api/payments/order/${orderId}`,
    webhook: '/api/payments/webhook', // Stripe webhook (no auth)
  },

  // ───────────────────────── Tickets ─────────────────────────
  tickets: {
    getById: (id) => `/api/tickets/${id}`,
    qrDataURL: (id) => `/api/tickets/${id}/qr`,
    cancel: (id) => `/api/tickets/${id}/cancel`,
    listForOrder: (orderId) => `/api/tickets/order/${orderId}`,
    listForUser: '/api/tickets/me/list',
    listForEvent: (eventId) => `/api/tickets/event/${eventId}`,
  },

  // ───────────────────────── Check-ins ─────────────────────────
  checkins: {
    scan: '/api/checkins/scan',
    listForEvent: (eventId) => `/api/checkins/event/${eventId}`,
    listByUser: '/api/checkins/me',
    statsForEvent: (eventId) => `/api/checkins/event/${eventId}/stats`,
  },

  // ───────────────────────── Notifications ─────────────────────────
  notifications: {
    enqueue: '/api/notifications',
    get: (id) => `/api/notifications/${id}`,
    markSent: (id) => `/api/notifications/${id}/sent`,
    updateStatus: (id) => `/api/notifications/${id}/status`,
    listForUser: '/api/notifications/user/me',
    listForEvent: (eventId) => `/api/notifications/event/${eventId}`,
    listQueued: '/api/notifications/queued/list',
    send: '/api/notifications/send',
    createAndSend: '/api/notifications/create-and-send',
    // Devices
    upsertDevice: '/api/notifications/devices',
    listDevices: '/api/notifications/devices/me',
    deleteDevice: (id) => `/api/notifications/devices/${id}`,
    updateDeviceLastSeen: (id) => `/api/notifications/devices/${id}/seen`,
    disableDevice: (id) => `/api/notifications/devices/${id}/disable`,
    incrementDeviceFailCount: (id) => `/api/notifications/devices/${id}/fail`,
    // Preferences
    getUserPrefs: '/api/notifications/prefs/me',
    upsertUserPrefs: '/api/notifications/prefs/me',
  },
    // ───────────────────────── Surveys ─────────────────────────
  surveys: {
    create: '/api/surveys',
    get: (id) => `/api/surveys/${id}`,
    update: (id) => `/api/surveys/${id}`,
    delete: (id) => `/api/surveys/${id}`,
    listForEvent: (eventId) => `/api/surveys/event/${eventId}`,
    listForOrg: (orgId) => `/api/surveys/org/${orgId}`,
    listForUser: '/api/surveys/user/me',
    send: '/api/surveys/send',
    saveDraft: '/api/surveys/draft',
    submit: '/api/surveys/submit',
    getStats: (id) => `/api/surveys/${id}/stats`,
    getResponses: (id) => `/api/surveys/${id}/responses`,
  },
};

export default API_ROUTES;