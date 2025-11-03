export const PATHS = {
  home: "/",
  login: "/login",
  logout: "/logout",
  profile: "/me",

  // role gates
  dashboard: "/dashboard", // auto-redirect to role-specific

  // dashboards
  admin: "/admin",
  organizer: "/organizer",
  vendor: "/vendor",
  attendee: "/attendee",

  // resources
  events: "/events",
  eventDetail: (id) => `/events/${id}`,
  ticketTypes: (eventId) => `/events/${eventId}/ticket-types`,
  orders: "/orders",
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",

  tickets: "/tickets",
  ticketDetail: (id) => `/tickets/${id}`,

  checkinsScan: "/checkins/scan",
  checkinsLive: "/checkins/live",

  // analytics
  eventAnalytics: (eventId) => `/events/${eventId}/analytics`,
  orgAnalytics: (orgSlug) => `/orgs/${orgSlug}/analytics`,

  speakers: (orgId) => `/orgs/${orgId}/speakers`,
  sessions: (eventId) => `/events/${eventId}/sessions`,
  
  notifications: "/notifications",
};
