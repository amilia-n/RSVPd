import * as events from "../services/event.service.js";

export async function create(req, res) {
  try {
    const row = await events.createEvent(req.body ?? {});
    return res.status(201).json({ event: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function update(req, res) {
  try {
    const row = await events.updateEvent(req.params.id, req.body ?? {});
    return res.json({ event: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function get(req, res) {
  try {
    const row = await events.getEventWithVenue(req.params.id);
    if (!row) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ event: row });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function listForOrg(req, res) {
  try {
    const { status, limit, offset } = req.query ?? {};
    const rows = await events.listEventsForOrg(
      req.params.orgId,
      status ?? null,
      Number(limit) || 25,
      Number(offset) || 0
    );
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function searchPublic(req, res) {
  try {
    const { q, limit, offset } = req.query ?? {};
    const rows = await events.searchEventsPublic(q ?? "", Number(limit) || 25, Number(offset) || 0);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function publish(req, res) {
  try {
    const row = await events.publishEvent(req.params.id);
    return res.json({ event: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function cancel(req, res) {
  try {
    const row = await events.cancelEvent(req.params.id);
    return res.json({ event: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function upcomingPublic(req, res) {
  try {
    const { limit, offset } = req.query ?? {};
    const rows = await events.listUpcomingPublicEvents(Number(limit) || 25, Number(offset) || 0);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

// Speakers
export async function createSpeaker(req, res) {
  try {
    const row = await events.createSpeaker(req.body ?? {});
    return res.status(201).json({ speaker: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function updateSpeaker(req, res) {
  try {
    const row = await events.updateSpeaker(req.params.id, req.body ?? {});
    return res.json({ speaker: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function getSpeaker(req, res) {
  try {
    const row = await events.getSpeakerById(req.params.id);
    if (!row) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ speaker: row });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function listSpeakersForOrg(req, res) {
  try {
    const rows = await events.listSpeakersForOrg(req.params.orgId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function deleteSpeaker(req, res) {
  try {
    const row = await events.deleteSpeaker(req.params.id);
    return res.json({ deleted: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

// Sessions
export async function createSession(req, res) {
  try {
    const row = await events.createSession(req.body ?? {});
    return res.status(201).json({ session: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function updateSession(req, res) {
  try {
    const row = await events.updateSession(req.params.id, req.body ?? {});
    return res.json({ session: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function getSession(req, res) {
  try {
    const row = await events.getSessionById(req.params.id);
    if (!row) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ session: row });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function listSessionsForEvent(req, res) {
  try {
    const rows = await events.listSessionsForEvent(req.params.eventId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function deleteSession(req, res) {
  try {
    const row = await events.deleteSession(req.params.id);
    return res.json({ deleted: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

// Analytics
export async function analytics(req, res) {
  try {
    const eventId = req.params.eventId;
    const [sales, revenue, byType, breakdown, trend, util, total, perf] = await Promise.all([
      events.salesByDayForEvent(eventId),
      events.revenueByDayForEvent(eventId),
      events.ticketSalesByType(eventId),
      events.orderStatusBreakdown(eventId),
      events.attendanceTrend(eventId),
      events.eventCapacityUtilization(eventId),
      events.totalRevenueForEvent(eventId),
      events.eventPerformanceSummary(eventId),
    ]);
    return res.json({ sales, revenue, byType, breakdown, trend, utilization: util, totals: total, performance: perf });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}
