import argon2 from "argon2";
import pool from "./pool.js";

const DEFAULT_PW = "password123";
const ADMIN_PW   = "ADMINCONTROL123";

const ORGS = [
  { name: "Alpha Events Co.", slug: "org-one"   },
  { name: "Beta Productions", slug: "org-two"   },
  { name: "Gamma Collective", slug: "org-three" },
];

const ADMIN = { email: "admin@events.local", first: "System", last: "Admin" };

const ORGANIZERS = [
  { email: "olivia@org1.local", first: "Olivia", last: "Ray",   org: "org-one" },
  { email: "ben@org2.local",    first: "Ben",    last: "Tran",  org: "org-two" },
  { email: "gina@org3.local",   first: "Gina",   last: "Moore", org: "org-three" },
];

const VENDORS = [
  { email: "vendor1@org1.local", first: "Vendor", last: "One",   org: "org-one" },
  { email: "vendor2@org1.local", first: "Vendor", last: "Two",   org: "org-one" },
  { email: "vendor3@org2.local", first: "Vendor", last: "Three", org: "org-two" },
  { email: "vendor4@org2.local", first: "Vendor", last: "Four",  org: "org-two" },
  { email: "vendor5@org3.local", first: "Vendor", last: "Five",  org: "org-three" },
];

function makeAttendees(n = 60) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push({
      email: `attendee${i}@mail.local`,
      first: "Attendee",
      last: String(i).padStart(2, "0"),
    });
  }
  return out;
}
const ATTENDEES = makeAttendees(60);

// Map events to the attendee index ranges for purchases
const EVENT_RANGES = {
  "ny-tech-meetup-2025-12":       [1, 15],  // attendees 1..15
  "holiday-js-workshop-2026-01":  [16, 30], // attendees 16..30
  "ds-summit-2025-12":            [31, 45], // attendees 31..45
  "ai-demo-day-2026-02":          [46, 60], // attendees 46..60
  "fall-retro-2025-09":           [1, 15],  // reuse 1..15 for the past event
};

const TICKET_ROTATION = ["General Admission", "VIP", "Student"]; 

// NYC-ish demo tax + platform fee
const PLATFORM_FEE_RATE = 0.05;     // 5%
const TAX_RATE          = 0.08875;  // 8.875%

// ───────────────
// SQL helpers 
// ───────────────
async function q(c, sql, params) { return c.query(sql, params); }
async function one(c, sql, params) { const r = await c.query(sql, params); return r.rows[0] || null; }
async function getId(c, sql, arg) { 
  const r = await q(c, sql, Array.isArray(arg) ? arg : [arg]);
  return r.rowCount ? r.rows[0].id : null;
}
const getOrgIdBySlug = (c, slug) => getId(c, "SELECT id FROM organizations WHERE slug=$1", slug);
const getUserIdByEmail = (c, email) => getId(c, "SELECT id FROM users WHERE email=$1", email);
const getEvent = (c, slug) => one(c, "SELECT * FROM events WHERE slug=$1", [slug]);
const getTicketTypeId = (c, eventId, name) =>
  getId(c, "SELECT id FROM ticket_types WHERE event_id=$1 AND name=$2", [eventId, name]);

const getPromoId = (c, eventId, code) =>
  getId(c, "SELECT id FROM promo_codes WHERE event_id=$1 AND lower(code)=lower($2)", [eventId, code]);

async function upsertUser(c, { email, first, last, isAdmin=false }) {
  const pw = isAdmin ? ADMIN_PW : DEFAULT_PW;
  const hash = await argon2.hash(pw);
  const r = await q(
    c,
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, is_verified)
     VALUES ($1,$2,$3,$4,NULL,TRUE)
     ON CONFLICT (email) DO UPDATE
       SET first_name=EXCLUDED.first_name,
           last_name=EXCLUDED.last_name,
           is_verified=TRUE,
           updated_at=now()
     RETURNING id`,
    [email, hash, first, last]
  );
  return r.rows[0].id;
}

async function giveRole(c, userId, role) {
  await q(
    c,
    `INSERT INTO user_roles (user_id, role_name)
     VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [userId, role]
  );
}

async function addOrgMember(c, orgSlug, userId, role) {
  const orgId = await getOrgIdBySlug(c, orgSlug);
  if (!orgId) return;
  await q(
    c,
    `INSERT INTO org_members (org_id, user_id, role_name)
     VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [orgId, userId, role]
  );
}

async function ensureAttendeeProfile(c, userId, email, first, last) {
  await q(
    c,
    `INSERT INTO attendees (user_id, full_name, email, phone)
     VALUES ($1, $2, $3, NULL)
     ON CONFLICT (email) DO UPDATE
       SET full_name=EXCLUDED.full_name,
           updated_at=now()`,
    [userId, `${first} ${last}`, email]
  );
}

function cents(n) { return Math.round(n); }

function computeTotals(unitPriceCents, applyEarly) {
  const discount = applyEarly ? Math.floor(unitPriceCents * 0.20) : 0;
  const fees     = Math.round(unitPriceCents * PLATFORM_FEE_RATE);
  const taxable  = unitPriceCents - discount;
  const tax      = Math.round(taxable * TAX_RATE);
  const total    = unitPriceCents - discount + fees + tax;
  return {
    subtotal_cents: unitPriceCents,
    discount_cents: discount,
    fees_cents: fees,
    tax_cents: tax,
    total_cents: total,
  };
}

async function createPaidOrderOneItem(c, { event, buyerUserId, buyerEmail, ticketTypeId, idxForTiming }) {
  const tt = await one(c, "SELECT price_cents FROM ticket_types WHERE id=$1", [ticketTypeId]);
  if (!tt) return null;
  const applyEarly = (idxForTiming % 3 === 0);
  const totals = computeTotals(tt.price_cents, applyEarly);

  const createdAt = new Date(new Date(event.sales_start_at).getTime() + idxForTiming * 60 * 60 * 1000);

  const insOrder = await one(
    c,
    `INSERT INTO orders (event_id, purchaser_user_id, purchaser_email, status,
                         subtotal_cents, discount_cents, fees_cents, tax_cents, total_cents, currency, created_at)
     VALUES ($1,$2,$3,'PAID',$4,$5,$6,$7,$8,'USD',$9)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [event.id, buyerUserId, buyerEmail,
     totals.subtotal_cents, totals.discount_cents, totals.fees_cents, totals.tax_cents, totals.total_cents, createdAt.toISOString()]
  );
  if (!insOrder) return null;

  if (applyEarly) {
    const promoId = await getPromoId(c, event.id, "EARLY BIRD");
    if (promoId) {
      await q(
        c,
        `INSERT INTO order_promos (order_id, promo_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [insOrder.id, promoId]
      );
    }
  }

  const insItem = await one(
    c,
    `INSERT INTO order_items (order_id, event_id, ticket_type_id, quantity, unit_price_cents, total_cents, metadata)
     VALUES ($1,$2,$3,1,$4,$4,'{}'::jsonb)
     RETURNING *`,
    [insOrder.id, event.id, ticketTypeId, tt.price_cents]
  );

  const paidAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
  await q(
    c,
    `INSERT INTO payments (order_id, provider, provider_payment_id, status, amount_cents, currency, method,
                           provider_session_id, checkout_mode, checkout_status, payment_intent_id, latest_charge_id, receipt_url,
                           received_at, created_at)
     VALUES ($1, 'STRIPE', 'seed_'||$1::text, 'SUCCEEDED', $2, 'USD', 'CARD',
             'seed_session', 'payment', 'complete', 'seed_pi', 'seed_ch', 'https://example.com/receipt/'||$1::text,
             $3, $3)
     ON CONFLICT DO NOTHING`,
    [insOrder.id, totals.total_cents, paidAt.toISOString()]
  );

  return { order: insOrder, item: insItem, issuedAt: new Date(paidAt.getTime() + 60 * 1000) };
}

async function issueTicket(c, { eventId, orderId, orderItemId, ticketTypeId, attendeeId, shortCode, issuedAt }) {
  await q(
    c,
    `INSERT INTO tickets (event_id, order_id, order_item_id, ticket_type_id, attendee_id, short_code, issued_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT DO NOTHING`,
    [eventId, orderId, orderItemId, ticketTypeId, attendeeId, shortCode, issuedAt.toISOString()]
  );
}

async function checkIn(c, { ticketId, eventId, scannerUserId, atMinutes, eventStart }) {
  const createdAt = new Date(new Date(eventStart).getTime() + atMinutes * 60 * 1000);
  await q(
    c,
    `INSERT INTO check_ins (ticket_id, event_id, scanned_by_user_id, device_label, created_at)
     VALUES ($1,$2,$3,'Front Gate iPad',$4)
     ON CONFLICT DO NOTHING`,
    [ticketId, eventId, scannerUserId, createdAt.toISOString()]
  );
}

async function leaveFeedback(c, { eventId, ticketId, userId, rating, comment, eventEnd, daysAfter=1 }) {
  const ts = new Date(new Date(eventEnd).getTime() + daysAfter * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000);
  await q(
    c,
    `INSERT INTO event_feedback (event_id, ticket_id, user_id, rating, comments_md, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT DO NOTHING`,
    [eventId, ticketId, userId, rating, comment, ts.toISOString()]
  );
}


async function seedUsersOrgMemberships(c) {
  // Admin
  const adminId = await upsertUser(c, { ...ADMIN, isAdmin: true });
  await giveRole(c, adminId, "ADMIN");

  // Organizers
  for (const o of ORGANIZERS) {
    const uid = await upsertUser(c, o);
    await giveRole(c, uid, "ORGANIZER");
    await addOrgMember(c, o.org, uid, "ORGANIZER");
  }

  // Vendors
  for (const v of VENDORS) {
    const uid = await upsertUser(c, v);
    await giveRole(c, uid, "VENDOR");
    await addOrgMember(c, v.org, uid, "VENDOR");
  }

  // Attendees + attendee profiles
  for (const a of ATTENDEES) {
    const uid = await upsertUser(c, a);
    await giveRole(c, uid, "ATTENDEE");
    await ensureAttendeeProfile(c, uid, a.email, a.first, a.last);
  }
}

async function seedPurchasesForEvent(c, eventSlug, shortPrefix) {
  const event = await getEvent(c, eventSlug);
  if (!event) { console.warn(`Event ${eventSlug} not found`); return; }

  const [startIdx, endIdx] = EVENT_RANGES[eventSlug];
  let index = 0;

  for (let i = startIdx; i <= endIdx; i++) {
    const buyer = ATTENDEES[i - 1];
    const buyerId = await getUserIdByEmail(c, buyer.email);
    if (!buyerId) continue;

    // rotate ticket type names
    const ttName = TICKET_ROTATION[index % TICKET_ROTATION.length];
    const ttId = await getTicketTypeId(c, event.id, ttName);
    if (!ttId) { index++; continue; }

    const ord = await createPaidOrderOneItem(c, {
      event,
      buyerUserId: buyerId,
      buyerEmail: buyer.email,
      ticketTypeId: ttId,
      idxForTiming: i - startIdx + 1
    });
    if (!ord) { index++; continue; }

    // ensure attendee row + get id
    await ensureAttendeeProfile(c, buyerId, buyer.email, buyer.first, buyer.last);
    const attendeeId = await getId(c, "SELECT id FROM attendees WHERE email=$1", buyer.email);

    // ticket
    const code = `${shortPrefix}-${String(i - startIdx + 1).padStart(3, "0")}`;
    await issueTicket(c, {
      eventId: event.id,
      orderId: ord.order.id,
      orderItemId: ord.item.id,
      ticketTypeId: ttId,
      attendeeId,
      shortCode: code,
      issuedAt: ord.issuedAt,
    });

    index++;
  }
}

async function seedPastEventCheckinsFeedback(c) {
  const event = await getEvent(c, "fall-retro-2025-09");
  if (!event) return;

  // choose organizer of org-three as scanner
  const scannerEmail = "gina@org3.local";
  const scannerId = await getUserIdByEmail(c, scannerEmail);

  // tickets for past event (if not already present)
  await seedPurchasesForEvent(c, "fall-retro-2025-09", "E5");

  // fetch issued tickets and check them in over 10..170 mins
  const { rows: tix } = await q(
    c,
    `SELECT t.id, t.attendee_id, o.purchaser_user_id
     FROM tickets t
     JOIN orders o ON o.id=t.order_id
     WHERE t.event_id=$1
     ORDER BY t.id`,
    [event.id]
  );

  // Distribute check-ins and feedback
  const comments = [
    'Loved the panel format and Q&A.',
    'Great venue and smooth check-in.',
    'Talks were insightful; would attend again.',
    'Audio could be clearer, but content was strong.',
    'Networking hour was the highlight!'
  ];

  for (let i = 0; i < tix.length; i++) {
    const t = tix[i];
    const minutesAfterStart = 10 + Math.floor(i * (170 / Math.max(1, tix.length - 1)));
    await checkIn(c, {
      ticketId: t.id,
      eventId: event.id,
      scannerUserId: scannerId,
      atMinutes: minutesAfterStart,
      eventStart: event.start_at
    });

    const purchaser = t.purchaser_user_id;
    const rating = (i % 5 === 0) ? 3 : (i % 4 === 0) ? 4 : 5;
    const comment = comments[i % comments.length];
    await leaveFeedback(c, {
      eventId: event.id,
      ticketId: t.id,
      userId: purchaser,
      rating,
      comment,
      eventEnd: event.end_at,
      daysAfter: (i % 3) + 1
    });
  }
}

// ─────────────
// MAIN
// ─────────────
async function main() {
  const client = await pool.connect();
  try {
    console.log("Seeding EVENTS...");
    await client.query("BEGIN");

    // Users, roles, org_members, attendees
    console.log("Upserting users & org memberships…");
    await seedUsersOrgMemberships(client);

    // Orders/Payments/Tickets for upcoming events
    console.log("Generating purchases for upcoming events…");
    await seedPurchasesForEvent(client, "ny-tech-meetup-2025-12",      "E1");
    await seedPurchasesForEvent(client, "holiday-js-workshop-2026-01", "E2");
    await seedPurchasesForEvent(client, "ds-summit-2025-12",           "E3");
    await seedPurchasesForEvent(client, "ai-demo-day-2026-02",         "E4");

    // Past event: include check-ins + feedback for analytics
    console.log("Populating past event orders + check-ins + feedback…");
    await seedPastEventCheckinsFeedback(client);

    await client.query("COMMIT");
    console.log("Seed complete :)");
    console.log(`   Admin login: ${ADMIN.email} / ${ADMIN_PW}`);
    console.log(`   Others use default password: ${DEFAULT_PW}`);
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Dang seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main();
