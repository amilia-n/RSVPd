export const queryKeys = {
  // ───────────────────────── Auth ─────────────────────────
  auth: {
    me: ['auth', 'me'],
  },

  // ───────────────────────── Users ─────────────────────────
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (filters) => [...queryKeys.users.lists(), filters],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id) => [...queryKeys.users.details(), id],
    roles: (id) => ['users', id, 'roles'],
    // Orgs
    orgs: {
      all: ['orgs'],
      lists: () => [...queryKeys.users.orgs.all, 'list'],
      list: (filters) => [...queryKeys.users.orgs.lists(), filters],
      details: () => [...queryKeys.users.orgs.all, 'detail'],
      detail: (id) => [...queryKeys.users.orgs.details(), id],
      bySlug: (slug) => [...queryKeys.users.orgs.all, 'slug', slug],
      members: (orgId) => ['orgs', orgId, 'members'],
      my: () => [...queryKeys.users.orgs.all, 'my'],
    },
  },

  // ───────────────────────── Events ─────────────────────────
  events: {
    all: ['events'],
    lists: () => [...queryKeys.events.all, 'list'],
    list: (filters) => [...queryKeys.events.lists(), filters],
    listForOrg: (orgId) => ['events', 'org', orgId],
    publicSearch: (query) => ['events', 'public', 'search', query],
    publicUpcoming: (filters) => ['events', 'public', 'upcoming', filters],
    details: () => [...queryKeys.events.all, 'detail'],
    detail: (id) => [...queryKeys.events.details(), id],
    // Speakers
    speakers: {
      all: (orgId) => ['speakers', orgId],
      lists: (orgId) => [...queryKeys.events.speakers.all(orgId), 'list'],
      details: () => ['speakers', 'detail'],
      detail: (id) => [...queryKeys.events.speakers.details(), id],
    },
    // Sessions
    sessions: {
      all: (eventId) => ['sessions', eventId],
      lists: (eventId) => [...queryKeys.events.sessions.all(eventId), 'list'],
      details: () => ['sessions', 'detail'],
      detail: (id) => [...queryKeys.events.sessions.details(), id],
    },
    // Analytics
    analytics: (eventId) => ['events', eventId, 'analytics'],
  },

  // ───────────────────────── Ticket Types ─────────────────────────
  ticketTypes: {
    all: ['ticketTypes'],
    lists: () => [...queryKeys.ticketTypes.all, 'list'],
    listForEvent: (eventId) => ['ticketTypes', 'event', eventId],
    details: () => [...queryKeys.ticketTypes.all, 'detail'],
    detail: (id) => [...queryKeys.ticketTypes.details(), id],
    availability: (id) => ['ticketTypes', id, 'availability'],
  },

  // ───────────────────────── Orders ─────────────────────────
  orders: {
    all: ['orders'],
    lists: () => [...queryKeys.orders.all, 'list'],
    listForUser: () => ['orders', 'user', 'me'],
    listForEvent: (eventId) => ['orders', 'event', eventId],
    details: () => [...queryKeys.orders.all, 'detail'],
    detail: (id) => [...queryKeys.orders.details(), id],
    // Items
    items: (orderId) => ['orders', orderId, 'items'],
  },

  // ───────────────────────── Payments ─────────────────────────
  payments: {
    all: ['payments'],
    details: () => [...queryKeys.payments.all, 'detail'],
    detail: (id) => [...queryKeys.payments.details(), id],
    listForOrder: (orderId) => ['payments', 'order', orderId],
  },

  // ───────────────────────── Tickets ─────────────────────────
  tickets: {
    all: ['tickets'],
    lists: () => [...queryKeys.tickets.all, 'list'],
    listForUser: () => ['tickets', 'user', 'me'],
    listForOrder: (orderId) => ['tickets', 'order', orderId],
    listForEvent: (eventId) => ['tickets', 'event', eventId],
    details: () => [...queryKeys.tickets.all, 'detail'],
    detail: (id) => [...queryKeys.tickets.details(), id],
    qr: (id) => ['tickets', id, 'qr'],
  },

  // ───────────────────────── Check-ins ─────────────────────────
  checkins: {
    all: ['checkins'],
    listForEvent: (eventId) => ['checkins', 'event', eventId],
    listByUser: () => ['checkins', 'user', 'me'],
    statsForEvent: (eventId) => ['checkins', 'event', eventId, 'stats'],
  },

  // ───────────────────────── Notifications ─────────────────────────
  notifications: {
    all: ['notifications'],
    details: () => [...queryKeys.notifications.all, 'detail'],
    detail: (id) => [...queryKeys.notifications.details(), id],
    listForUser: () => ['notifications', 'user', 'me'],
    listForEvent: (eventId) => ['notifications', 'event', eventId],
    listQueued: () => ['notifications', 'queued'],
    // Devices
    devices: {
      all: () => ['devices'],
      list: () => ['devices', 'me'],
    },
    // Preferences
    prefs: () => ['notifications', 'prefs', 'me'],
  },
};

export default queryKeys;