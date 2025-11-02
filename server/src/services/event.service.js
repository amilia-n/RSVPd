import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function createEvent(payload) {
  const {
    org_id, venue_id = null, title, slug, summary = null, description_md = null,
    status = "DRAFT", visibility = "PUBLIC", event_type = "LIVE", capacity = null,
    start_at, end_at, sales_start_at = null, sales_end_at = null,
    is_online = false, stream_url = null, cover_image_url = null, tags = [],
  } = payload;

  const { rows } = await pool.query(queries.createEvent, [
    org_id, venue_id, title, slug, summary, description_md, status, visibility, event_type,
    capacity, start_at, end_at, sales_start_at, sales_end_at,
    is_online, stream_url, cover_image_url, tags,
  ]);
  return rows[0] || null;
}

export async function updateEvent(id, patch) {
  const {
    venue_id = null, title, slug, summary = null, description_md = null, status,
    visibility, event_type, capacity = null,
    start_at, end_at, sales_start_at = null, sales_end_at = null,
    is_online = false, stream_url = null, cover_image_url = null, tags = [],
  } = patch;

  const { rows } = await pool.query(queries.updateEvent, [
    id, venue_id, title, slug, summary, description_md, status, visibility, event_type,
    capacity, start_at, end_at, sales_start_at, sales_end_at,
    is_online, stream_url, cover_image_url, tags,
  ]);
  return rows[0] || null;
}

export async function getEvent(id) {
  const { rows } = await pool.query(queries.getEvent, [id]);
  return rows[0] || null;
}

export async function getEventWithVenue(id) {
  const { rows } = await pool.query(queries.getEventWithVenue, [id]);
  return rows[0] || null;
}

export async function findEventByOrgAndSlug(org_id, slug) {
  const { rows } = await pool.query(queries.findEventByOrgAndSlug, [org_id, slug]);
  return rows[0] || null;
}

export async function listEventsForOrg(org_id, status = null, limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listEventsForOrg, [org_id, status, limit, offset]);
  return rows;
}

export async function searchEventsPublic(q = "", limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.searchEventsPublic, [q, limit, offset]);
  return rows;
}

export async function publishEvent(id) {
  const { rows } = await pool.query(queries.publishEvent, [id]);
  return rows[0] || null;
}

export async function cancelEvent(id) {
  const { rows } = await pool.query(queries.cancelEvent, [id]);
  return rows[0] || null;
}

export async function listUpcomingPublicEvents(limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listUpcomingPublicEvents, [limit, offset]);
  return rows;
}

// Speakers
export async function createSpeaker(payload) {
  const { rows } = await pool.query(queries.createSpeaker, [
    payload.org_id, payload.full_name, payload.title ?? null, payload.company ?? null,
    payload.bio_md ?? null, payload.headshot_url ?? null,
  ]);
  return rows[0] || null;
}

export async function updateSpeaker(id, patch) {
  const { rows } = await pool.query(queries.updateSpeaker, [
    id, patch.full_name, patch.title ?? null, patch.company ?? null, patch.bio_md ?? null, patch.headshot_url ?? null,
  ]);
  return rows[0] || null;
}

export async function getSpeakerById(id) {
  const { rows } = await pool.query(queries.getSpeakerById, [id]);
  return rows[0] || null;
}

export async function listSpeakersForOrg(org_id) {
  const { rows } = await pool.query(queries.listSpeakersForOrg, [org_id]);
  return rows;
}

export async function deleteSpeaker(id) {
  const { rows } = await pool.query(queries.deleteSpeaker, [id]);
  return rows[0] || null;
}

// Sessions
export async function createSession(payload) {
  const { rows } = await pool.query(queries.createSession, [
    payload.event_id, payload.title, payload.description_md ?? null,
    payload.track ?? null, payload.room ?? null, payload.starts_at, payload.ends_at,
  ]);
  return rows[0] || null;
}

export async function updateSession(id, patch) {
  const { rows } = await pool.query(queries.updateSession, [
    id, patch.title, patch.description_md ?? null, patch.track ?? null, patch.room ?? null, patch.starts_at, patch.ends_at,
  ]);
  return rows[0] || null;
}

export async function getSessionById(id) {
  const { rows } = await pool.query(queries.getSessionById, [id]);
  return rows[0] || null;
}

export async function listSessionsForEvent(event_id) {
  const { rows } = await pool.query(queries.listSessionsForEvent, [event_id]);
  return rows;
}

export async function deleteSession(id) {
  const { rows } = await pool.query(queries.deleteSession, [id]);
  return rows[0] || null;
}

export async function linkSessionSpeaker(session_id, speaker_id, role = null) {
  const r = await pool.query(queries.linkSessionSpeaker, [session_id, speaker_id, role]);
  return r.rowCount > 0;
}

export async function unlinkSessionSpeaker(session_id, speaker_id) {
  const r = await pool.query(queries.unlinkSessionSpeaker, [session_id, speaker_id]);
  return r.rowCount > 0;
}

export async function listSessionsWithSpeakers(event_id) {
  const { rows } = await pool.query(queries.listSessionsWithSpeakers, [event_id]);
  return rows;
}

// Analytics
export async function salesByDayForEvent(event_id) {
  const { rows } = await pool.query(queries.salesByDayForEvent, [event_id]);
  return rows;
}

export async function revenueByDayForEvent(event_id) {
  const { rows } = await pool.query(queries.revenueByDayForEvent, [event_id]);
  return rows;
}

export async function ticketSalesByType(event_id) {
  const { rows } = await pool.query(queries.ticketSalesByType, [event_id]);
  return rows;
}

export async function orderStatusBreakdown(event_id) {
  const { rows } = await pool.query(queries.orderStatusBreakdown, [event_id]);
  return rows;
}

export async function attendanceTrend(event_id) {
  const { rows } = await pool.query(queries.attendanceTrend, [event_id]);
  return rows;
}

export async function eventCapacityUtilization(event_id) {
  const { rows } = await pool.query(queries.eventCapacityUtilization, [event_id]);
  return rows[0] || null;
}

export async function totalRevenueForEvent(event_id) {
  const { rows } = await pool.query(queries.totalRevenueForEvent, [event_id]);
  return rows[0] || null;
}

export async function promoCodeEffectiveness(event_id) {
  const { rows } = await pool.query(queries.promoCodeEffectiveness, [event_id]);
  return rows;
}

export async function waitlistStats(event_id) {
  const { rows } = await pool.query(queries.waitlistStats, [event_id]);
  return rows[0] || null;
}

export async function orgDashboardSummary(org_id) {
  const { rows } = await pool.query(queries.orgDashboardSummary, [org_id]);
  return rows[0] || null;
}

export async function eventPerformanceSummary(event_id) {
  const { rows } = await pool.query(queries.eventPerformanceSummary, [event_id]);
  return rows[0] || null;
}
