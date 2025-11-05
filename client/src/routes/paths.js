export const PATHS = {
  home: "/",
  login: "/login",
  register: "/register",
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
  eventEdit: (id) => `/events/${id}/edit`,
  ticketTypes: (eventId) => `/events/${eventId}/ticket-types`,
  orders: "/orders",
  orderDetail: (id) => `/orders/${id}`,
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",

  tickets: "/tickets",
  ticketDetail: (id) => `/tickets/${id}`,

  checkinsScan: "/checkins/scan",
  checkinsLive: "/checkins/live",
  checkinsLiveForEvent: (eventId) => `/checkins/live/${eventId}`,

  // Surveys
  surveyRespond: (id) => `/surveys/${id}/respond`,
  surveyResults: (id) => `/surveys/${id}/results`,
  
  // analytics
  eventAnalytics: (eventId) => `/events/${eventId}/analytics`,
  orgAnalytics: (orgSlug) => `/orgs/${orgSlug}/analytics`,

  speakers: (orgId) => `/orgs/${orgId}/speakers`,
  sessions: (eventId) => `/events/${eventId}/sessions`,

  notifications: "/notifications",
};
