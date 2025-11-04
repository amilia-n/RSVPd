import * as events from "../services/event.service.js";
import pool from "../db/pool.js";

export async function create(req, res) {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        org_id, venue, title, slug, summary, description_md,
        status, visibility, event_type, capacity,
        start_at, end_at, is_online, stream_url, cover_image_url, tags,
        ticket_types, speaker_ids, vendor_ids
      } = req.body;

      // 1. Create or get venue
      let venue_id = null;
      if (venue && venue.name) {
        const venueResult = await client.query(
          `INSERT INTO venues (org_id, name, address1, address2, city, state_code, postal_code, capacity)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [org_id, venue.name, venue.address1, venue.address2, venue.city, venue.state_code, venue.postal_code, venue.capacity]
        );
        venue_id = venueResult.rows[0].id;
      }

      // 2. Create event
      const eventResult = await client.query(
        `INSERT INTO events (
          org_id, venue_id, title, slug, summary, description_md,
          status, visibility, event_type, capacity,
          start_at, end_at, is_online, stream_url, cover_image_url, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          org_id, venue_id, title, slug, summary, description_md,
          status, visibility, event_type, capacity,
          start_at, end_at, is_online, stream_url, cover_image_url, tags || []
        ]
      );

      const event = eventResult.rows[0];

      // 3. Create ticket types
      if (ticket_types && Array.isArray(ticket_types)) {
        for (const tt of ticket_types) {
          await client.query(
            `INSERT INTO ticket_types (
              event_id, name, kind, price_cents, quantity_total, is_active
            )
            VALUES ($1, $2, $3, $4, $5, true)`,
            [
              event.id,
              tt.name,
              tt.kind || 'GENERAL',
              Math.round((tt.price || 0) * 100), // Convert dollars to cents
              tt.quantity || 100
            ]
          );
        }
      }

      // 4. Link speakers (create sessions for each)
      if (speaker_ids && Array.isArray(speaker_ids) && speaker_ids.length > 0) {
        for (const speaker_id of speaker_ids) {
          // Create a session
          const sessionResult = await client.query(
            `INSERT INTO sessions (event_id, title, starts_at, ends_at)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [event.id, 'Speaker Session', start_at, end_at]
          );
          // Link speaker to session
          await client.query(
            `INSERT INTO session_speakers (session_id, speaker_id)
             VALUES ($1, $2)`,
            [sessionResult.rows[0].id, speaker_id]
          );
        }
      }

      await client.query('COMMIT');
      return res.status(201).json({ event });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: e.message || "Bad Request" } });
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
