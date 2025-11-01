export const queries = {

  // ═══════════════════════════════════════════════════════════════
  // USERS & AUTH
  // ═══════════════════════════════════════════════════════════════
  userByEmail: `SELECT * FROM users WHERE email = $1`,
  userById:    `SELECT * FROM users WHERE id = $1`,

  insertUser: `
    INSERT INTO users (email, password_hash, first_name, last_name, phone, timezone, magicbell_external_id, stripe_customer_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,

  updateUser: `
    UPDATE users
    SET email=$2, first_name=$3, last_name=$4, phone=$5, timezone=$6, magicbell_external_id=$7, stripe_customer_id=$8, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  updateUserPassword: `
    UPDATE users SET password_hash=$2, updated_at=now() WHERE id=$1 RETURNING id, email`,

  verifyUser: `UPDATE users SET is_verified=true, updated_at=now() WHERE id=$1 RETURNING *`,

  listUsers: `
    SELECT * FROM users
    WHERE ($1::text IS NULL OR email ILIKE '%'||$1||'%' OR first_name ILIKE '%'||$1||'%' OR last_name ILIKE '%'||$1||'%')
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,

  grantGlobalRole: `
    INSERT INTO user_roles (user_id, role_name) VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *`,

  revokeGlobalRole: `DELETE FROM user_roles WHERE user_id=$1 AND role_name=$2`,
  rolesForUser:     `SELECT role_name FROM user_roles WHERE user_id=$1`,

  upsertOrgMember: `
    INSERT INTO org_members (org_id, user_id, role_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (org_id, user_id, role_name) DO UPDATE SET granted_at=now()
    RETURNING *`,

  removeOrgMember: `DELETE FROM org_members WHERE org_id=$1 AND user_id=$2 AND role_name=$3`,
  orgRolesForUser: `SELECT role_name FROM org_members WHERE user_id=$1 AND org_id=$2`,

  listOrgMembers: `
    SELECT u.*, om.role_name, om.granted_at
    FROM org_members om
    JOIN users u ON u.id = om.user_id
    WHERE om.org_id = $1
    ORDER BY om.granted_at DESC`,


  // ═══════════════════════════════════════════════════════════════
  // ORGANIZATIONS
  // ═══════════════════════════════════════════════════════════════
  createOrg: `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING *`,
  updateOrg: `UPDATE organizations SET name=$2, slug=$3, updated_at=now() WHERE id=$1 RETURNING *`,
  orgById:   `SELECT * FROM organizations WHERE id=$1`,
  orgBySlug: `SELECT * FROM organizations WHERE slug=$1`,

  listOrgs: `
    SELECT * FROM organizations
    WHERE ($1::text IS NULL OR name ILIKE '%'||$1||'%' OR slug ILIKE '%'||$1||'%')
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,


  // ═══════════════════════════════════════════════════════════════
  // VENUES
  // ═══════════════════════════════════════════════════════════════
  createVenue: `
    INSERT INTO venues (org_id, name, address1, address2, city, state_code, postal_code, country_code, timezone, capacity)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,

  updateVenue: `
    UPDATE venues
    SET name=$2, address1=$3, address2=$4, city=$5, state_code=$6, postal_code=$7, country_code=$8, timezone=$9, capacity=$10, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  getVenueById:     `SELECT * FROM venues WHERE id=$1`,
  listVenuesByOrg:  `SELECT * FROM venues WHERE org_id=$1 ORDER BY name`,
  deleteVenue:      `DELETE FROM venues WHERE id=$1 RETURNING id`,


  // ═══════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════
  createEvent: `
    INSERT INTO events (
      org_id, venue_id, title, slug, summary, description_md, status, visibility, event_type,
      capacity, timezone, start_at, end_at, sales_start_at, sales_end_at,
      is_online, stream_url, cover_image_url, tags
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    RETURNING *`,

  updateEvent: `
    UPDATE events SET
      venue_id=$2, title=$3, slug=$4, summary=$5, description_md=$6, status=$7, visibility=$8, event_type=$9,
      capacity=$10, timezone=$11, start_at=$12, end_at=$13, sales_start_at=$14, sales_end_at=$15,
      is_online=$16, stream_url=$17, cover_image_url=$18, tags=$19, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  getEvent: `SELECT * FROM events WHERE id=$1`,

  getEventWithVenue: `
    SELECT e.*, v.name AS venue_name, v.address1, v.address2, v.city, v.state_code, v.postal_code
    FROM events e
    LEFT JOIN venues v ON v.id = e.venue_id
    WHERE e.id = $1`,

  findEventByOrgAndSlug: `SELECT * FROM events WHERE org_id=$1 AND slug=$2`,

  listEventsForOrg: `
    SELECT * FROM events
    WHERE org_id=$1 AND ($2::event_status IS NULL OR status=$2)
    ORDER BY start_at DESC
    LIMIT $3 OFFSET $4`,

  searchEventsPublic: `
    SELECT e.*, o.name AS org_name
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    WHERE visibility='PUBLIC' AND status IN ('PUBLISHED','COMPLETED')
      AND ( $1 = '' OR e.search_vector @@ plainto_tsquery('english', $1) )
    ORDER BY start_at DESC
    LIMIT $2 OFFSET $3`,

  publishEvent: `UPDATE events SET status='PUBLISHED', updated_at=now() WHERE id=$1 RETURNING *`,
  cancelEvent:  `UPDATE events SET status='CANCELLED', updated_at=now() WHERE id=$1 RETURNING *`,

  listUpcomingPublicEvents: `
    SELECT e.*, o.name AS org_name, v.name AS venue_name
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    LEFT JOIN venues v ON v.id = e.venue_id
    WHERE visibility='PUBLIC' AND status='PUBLISHED' AND start_at > now()
    ORDER BY start_at ASC
    LIMIT $1 OFFSET $2`,


  // ═══════════════════════════════════════════════════════════════
  // SPEAKERS
  // ═══════════════════════════════════════════════════════════════
  createSpeaker: `
    INSERT INTO speakers (org_id, full_name, title, company, bio_md, headshot_url)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`,

  updateSpeaker: `
    UPDATE speakers
    SET full_name=$2, title=$3, company=$4, bio_md=$5, headshot_url=$6, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  getSpeakerById:     `SELECT * FROM speakers WHERE id=$1`,
  listSpeakersForOrg: `SELECT * FROM speakers WHERE org_id=$1 ORDER BY full_name`,
  deleteSpeaker:      `DELETE FROM speakers WHERE id=$1 RETURNING id`,


  // ═══════════════════════════════════════════════════════════════
  // SESSIONS
  // ═══════════════════════════════════════════════════════════════
  createSession: `
    INSERT INTO sessions (event_id, title, description_md, track, room, starts_at, ends_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,

  updateSession: `
    UPDATE sessions
    SET title=$2, description_md=$3, track=$4, room=$5, starts_at=$6, ends_at=$7, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  getSessionById:       `SELECT * FROM sessions WHERE id=$1`,
  listSessionsForEvent: `SELECT * FROM sessions WHERE event_id=$1 ORDER BY starts_at`,
  deleteSession:        `DELETE FROM sessions WHERE id=$1 RETURNING id`,

  linkSessionSpeaker: `
    INSERT INTO session_speakers (session_id, speaker_id, role)
    VALUES ($1,$2,$3)
    ON CONFLICT (session_id, speaker_id) DO UPDATE SET role=EXCLUDED.role`,

  unlinkSessionSpeaker: `DELETE FROM session_speakers WHERE session_id=$1 AND speaker_id=$2`,

  listSessionsWithSpeakers: `
    SELECT s.*,
           json_agg(
             json_build_object('id', sp.id, 'full_name', sp.full_name, 'title', sp.title, 'role', ss.role)
           ) FILTER (WHERE sp.id IS NOT NULL) AS speakers
    FROM sessions s
    LEFT JOIN session_speakers ss ON ss.session_id = s.id
    LEFT JOIN speakers sp ON sp.id = ss.speaker_id
    WHERE s.event_id = $1
    GROUP BY s.id
    ORDER BY s.starts_at`,


  // ═══════════════════════════════════════════════════════════════
  // TICKET TYPES & AVAILABILITY
  // ═══════════════════════════════════════════════════════════════
  createTicketType: `
    INSERT INTO ticket_types (
      event_id, name, description_md, kind, price_cents, currency, quantity_total,
      per_user_limit, sales_start_at, sales_end_at, is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,

  updateTicketType: `
    UPDATE ticket_types
    SET name=$2, description_md=$3, kind=$4, price_cents=$5, currency=$6, quantity_total=$7,
        per_user_limit=$8, sales_start_at=$9, sales_end_at=$10, is_active=$11, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  getTicketTypeById:        `SELECT * FROM ticket_types WHERE id=$1`,
  listTicketTypesForEvent:  `SELECT * FROM ticket_types WHERE event_id=$1 AND is_active=true ORDER BY price_cents`,
  listAllTicketTypesForEvent:`SELECT * FROM ticket_types WHERE event_id=$1 ORDER BY price_cents`,
  deactivateTicketType:     `UPDATE ticket_types SET is_active=false, updated_at=now() WHERE id=$1 RETURNING *`,

  countSoldForType: `
    SELECT COUNT(*)::int AS sold
    FROM tickets
    WHERE ticket_type_id=$1 AND status='ACTIVE'`,

  sumReservationsForType: `
    SELECT COALESCE(SUM(quantity),0)::int AS qty
    FROM inventory_reservations
    WHERE ticket_type_id=$1 AND expires_at > now()`,

  // One-shot net availability (qty - sold - active holds)
  netAvailableForType: `
    SELECT
      COALESCE(tt.quantity_total, 999999)
        - COALESCE((SELECT COUNT(*) FROM tickets t WHERE t.ticket_type_id=tt.id AND t.status='ACTIVE'), 0)
        - COALESCE((SELECT SUM(ir.quantity) FROM inventory_reservations ir WHERE ir.ticket_type_id=tt.id AND ir.expires_at>now()), 0)
      AS available
    FROM ticket_types tt
    WHERE tt.id=$1`,

  // Lock before computing availability to avoid races
  lockTicketType: `SELECT * FROM ticket_types WHERE id=$1 FOR UPDATE`,


  // ═══════════════════════════════════════════════════════════════
  // ORDERS & ITEMS
  // ═══════════════════════════════════════════════════════════════
  createOrder: `
    INSERT INTO orders (
      event_id, purchaser_user_id, purchaser_email, status,
      subtotal_cents, discount_cents, fees_cents, tax_cents, total_cents, currency,
      customer_address_line1, customer_address_line2, customer_city,
      customer_state_code, customer_postal_code, customer_country_code,
      payment_due_at, expires_at
    )
    VALUES ($1,$2,$3,'DRAFT',0,0,0,0,0,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,

  getOrder:           `SELECT * FROM orders WHERE id=$1`,
  getOrderWithEvent:  `SELECT * FROM orders WHERE id=$1 AND event_id=$2`,

  getOrderWithItems: `
    SELECT o.*,
           json_agg(
             json_build_object(
               'id', oi.id, 'ticket_type_id', oi.ticket_type_id, 'quantity', oi.quantity,
               'unit_price_cents', oi.unit_price_cents, 'total_cents', oi.total_cents,
               'ticket_type_name', tt.name, 'ticket_type_kind', tt.kind
             )
           ) FILTER (WHERE oi.id IS NOT NULL) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN ticket_types tt ON tt.id = oi.ticket_type_id
    WHERE o.id = $1
    GROUP BY o.id`,

  updateOrderTotals: `
    UPDATE orders
    SET subtotal_cents=$2, discount_cents=$3, fees_cents=$4, tax_cents=$5, total_cents=$6, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  setOrderStatus: `UPDATE orders SET status=$2, updated_at=now() WHERE id=$1 RETURNING *`,

  listOrdersForUser: `
    SELECT * FROM orders
    WHERE purchaser_user_id=$1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,

  listOrdersForEvent: `
    SELECT * FROM orders
    WHERE event_id=$1 AND ($2::order_status IS NULL OR status=$2)
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4`,

  listOrdersForOrg: `
    SELECT o.*
    FROM orders o
    JOIN events e ON e.id = o.event_id
    WHERE e.org_id=$1 AND ($2::order_status IS NULL OR o.status=$2)
    ORDER BY o.created_at DESC
    LIMIT $3 OFFSET $4`,

  cancelOrder:  `UPDATE orders SET status='CANCELLED', updated_at=now() WHERE id=$1 RETURNING *`,
  expireOrders: `UPDATE orders SET status='EXPIRED',   updated_at=now() WHERE id=ANY($1::uuid[]) RETURNING id`,

  // Discover which DRAFT/PENDING orders to expire
  listOrdersToExpire: `
    SELECT id
    FROM orders
    WHERE status IN ('DRAFT','PENDING') AND expires_at < now()
    ORDER BY expires_at ASC`,

  // Items
  addOrderItem: `
    INSERT INTO order_items (order_id, event_id, ticket_type_id, quantity, unit_price_cents, total_cents, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,

  listOrderItems:      `SELECT * FROM order_items WHERE order_id=$1`,
  getOrderItemById:    `SELECT * FROM order_items WHERE id=$1 AND order_id=$2`,

  updateOrderItem: `
    UPDATE order_items
    SET quantity=$3, unit_price_cents=$4, total_cents=$5, metadata=$6
    WHERE id=$1 AND order_id=$2
    RETURNING *`,

  deleteOrderItem: `DELETE FROM order_items WHERE id=$1 AND order_id=$2 RETURNING id`,


  // ═══════════════════════════════════════════════════════════════
  // PER-USER LIMITS (by user_id or email)
  // ═══════════════════════════════════════════════════════════════
  countUserTicketsForType: `
    SELECT COUNT(*)::int AS qty
    FROM tickets t
    JOIN orders o ON o.id = t.order_id
    WHERE t.ticket_type_id = $1
      AND t.status = 'ACTIVE'
      AND (
        ($2::uuid  IS NOT NULL AND o.purchaser_user_id = $2) OR
        ($3::citext IS NOT NULL AND o.purchaser_email   = $3)
      )`,

  countUserActiveReservationsForType: `
    SELECT COALESCE(SUM(ir.quantity),0)::int AS qty
    FROM inventory_reservations ir
    JOIN orders o ON o.id = ir.order_id
    WHERE ir.ticket_type_id = $1
      AND ir.expires_at > now()
      AND (
        ($2::uuid  IS NOT NULL AND o.purchaser_user_id = $2) OR
        ($3::citext IS NOT NULL AND o.purchaser_email   = $3)
      )`,


  // ═══════════════════════════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════════════════════════
  insertPayment: `
    INSERT INTO payments (
      order_id, provider, provider_payment_id, status, amount_cents, currency, method,
      provider_session_id, checkout_mode, checkout_status, payment_intent_id, latest_charge_id, receipt_url, received_at
    )
    VALUES ($1, 'STRIPE', $2, $3, $4, $5, 'CARD', $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,

  getPaymentById:           `SELECT * FROM payments WHERE id=$1`,
  findPaymentBySession:     `SELECT * FROM payments WHERE provider_session_id=$1`,
  findPaymentByIntentId:    `SELECT * FROM payments WHERE payment_intent_id=$1`,

  updatePaymentOnSessionComplete: `
    UPDATE payments
    SET status=$2, checkout_status='complete', payment_intent_id=$3, latest_charge_id=$4, receipt_url=$5,
        received_at=now(), updated_at=now()
    WHERE provider_session_id=$1
    RETURNING *`,

  updatePaymentStatus: `
    UPDATE payments
    SET status=$2, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  listPaymentsForOrder: `SELECT * FROM payments WHERE order_id=$1 ORDER BY created_at DESC`,


  // ═══════════════════════════════════════════════════════════════
  // ATTENDEES
  // ═══════════════════════════════════════════════════════════════
  insertAttendee: `
    INSERT INTO attendees (user_id, full_name, email, phone)
    VALUES ($1,$2,$3,$4)
    RETURNING *`,

  // Requires UNIQUE INDEX attendees(lower(email))
  findOrCreateAttendee: `
    WITH ins AS (
      INSERT INTO attendees (user_id, full_name, email, phone)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (email) DO NOTHING
      RETURNING *
    )
    SELECT * FROM ins
    UNION ALL
    SELECT * FROM attendees WHERE email = $3
    LIMIT 1`,

  getAttendeeById:     `SELECT * FROM attendees WHERE id=$1`,
  getAttendeeByEmail:  `SELECT * FROM attendees WHERE email=$1 LIMIT 1`,
  listAttendeesForUser:`SELECT * FROM attendees WHERE user_id=$1 ORDER BY created_at DESC`,

  listAttendeesForEvent: `
    SELECT DISTINCT a.*
    FROM attendees a
    JOIN tickets t ON t.attendee_id = a.id
    WHERE t.event_id = $1
    ORDER BY a.created_at DESC`,

  updateAttendee: `
    UPDATE attendees
    SET full_name=$2, email=$3, phone=$4, updated_at=now()
    WHERE id=$1
    RETURNING *`,


  // ═══════════════════════════════════════════════════════════════
  // TICKETS
  // ═══════════════════════════════════════════════════════════════
  issueTicket: `
    INSERT INTO tickets (event_id, order_id, order_item_id, ticket_type_id, attendee_id, short_code)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`,

  getTicketById: `SELECT * FROM tickets WHERE id=$1`,

  getTicketWithDetails: `
    SELECT t.*,
           e.title AS event_title, e.start_at AS event_start,
           tt.name AS ticket_type_name, tt.kind AS ticket_type_kind,
           a.full_name AS attendee_name, a.email AS attendee_email,
           o.purchaser_email, o.status AS order_status
    FROM tickets t
    JOIN events e ON e.id = t.event_id
    JOIN ticket_types tt ON tt.id = t.ticket_type_id
    JOIN attendees a ON a.id = t.attendee_id
    JOIN orders o ON o.id = t.order_id
    WHERE t.id = $1`,

  findTicketByQr:        `SELECT * FROM tickets WHERE qr_token=$1`,
  findTicketByShortCode: `SELECT * FROM tickets WHERE short_code=$1`,
  listTicketsForOrder:   `SELECT * FROM tickets WHERE order_id=$1 ORDER BY issued_at`,
  listTicketsForUser: `
    SELECT t.*, e.title AS event_title, e.start_at AS event_start
    FROM tickets t
    JOIN orders o ON o.id = t.order_id
    JOIN events e ON e.id = t.event_id
    WHERE o.purchaser_user_id = $1
    ORDER BY e.start_at DESC, t.issued_at DESC`,

  listTicketsForEvent:      `SELECT * FROM tickets WHERE event_id=$1 ORDER BY issued_at`,
  listTicketsForAttendee:   `SELECT * FROM tickets WHERE attendee_id=$1 ORDER BY issued_at DESC`,
  listTicketsForTicketType: `SELECT * FROM tickets WHERE ticket_type_id=$1 ORDER BY issued_at`,

  updateTicketStatus: `
    UPDATE tickets
    SET status=$2,
        cancelled_at=CASE WHEN $2 IN ('CANCELLED','REFUNDED') THEN now() ELSE NULL END,
        updated_at=now()
    WHERE id=$1
    RETURNING *`,

  cancelTicket: `UPDATE tickets SET status='CANCELLED', cancelled_at=now() WHERE id=$1 RETURNING *`,

  // Scan-time row lock to prevent double check-in races
  getTicketForScanLock: `
    SELECT * FROM tickets
    WHERE qr_token = $1
    FOR UPDATE SKIP LOCKED`,


  // ═══════════════════════════════════════════════════════════════
  // CHECK-INS
  // ═══════════════════════════════════════════════════════════════
  markTicketCheckedIn: `
    INSERT INTO check_ins (ticket_id, event_id, scanned_by_user_id, device_label)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (ticket_id) DO NOTHING
    RETURNING *`,

  getCheckInByTicketId: `SELECT * FROM check_ins WHERE ticket_id=$1`,

  listCheckInsForEvent: `
    SELECT ci.*, t.qr_token, t.short_code, a.full_name AS attendee_name, a.email AS attendee_email,
           u.first_name || ' ' || u.last_name AS scanned_by_name
    FROM check_ins ci
    JOIN tickets t ON t.id = ci.ticket_id
    JOIN attendees a ON a.id = t.attendee_id
    LEFT JOIN users u ON u.id = ci.scanned_by_user_id
    WHERE ci.event_id=$1
    ORDER BY ci.created_at DESC`,

  listCheckInsByUser: `
    SELECT ci.*, e.title AS event_title, t.qr_token, a.full_name AS attendee_name
    FROM check_ins ci
    JOIN events e ON e.id = ci.event_id
    JOIN tickets t ON t.id = ci.ticket_id
    JOIN attendees a ON a.id = t.attendee_id
    WHERE ci.scanned_by_user_id = $1
    ORDER BY ci.created_at DESC`,

  getCheckInStatsForEvent: `
    SELECT
      COUNT(*)::int AS total_check_ins,
      COUNT(DISTINCT ci.ticket_id)::int AS unique_tickets_checked_in,
      COUNT(DISTINCT date_trunc('hour', ci.created_at))::int AS active_hours
    FROM check_ins ci
    WHERE ci.event_id = $1`,


  // ═══════════════════════════════════════════════════════════════
  // INVENTORY RESERVATIONS
  // ═══════════════════════════════════════════════════════════════
  createReservation: `
    INSERT INTO inventory_reservations (ticket_type_id, order_id, quantity, expires_at)
    VALUES ($1,$2,$3,$4)
    RETURNING *`,

  getReservationsForOrder: `SELECT * FROM inventory_reservations WHERE order_id=$1`,
  deleteReservation:       `DELETE FROM inventory_reservations WHERE id=$1 RETURNING id`,
  deleteReservationsForOrder: `DELETE FROM inventory_reservations WHERE order_id=$1`,
  cleanExpiredReservations:   `DELETE FROM inventory_reservations WHERE expires_at < now() RETURNING id`,


  // ═══════════════════════════════════════════════════════════════
  // WAITLIST
  // ═══════════════════════════════════════════════════════════════
  joinWaitlist: `
    INSERT INTO waitlist_entries (event_id, ticket_type_id, user_id, email, full_name, status, priority, notes)
    VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7)
    RETURNING *`,

  getWaitlistEntryById:   `SELECT * FROM waitlist_entries WHERE id=$1`,

  listWaitlistForEvent: `
    SELECT * FROM waitlist_entries
    WHERE event_id=$1
    ORDER BY priority DESC, created_at ASC`,

  listWaitlistForTicketType: `
    SELECT * FROM waitlist_entries
    WHERE ticket_type_id=$1 AND status='PENDING'
    ORDER BY priority DESC, created_at ASC`,

  updateWaitlistStatus: `
    UPDATE waitlist_entries
    SET status=$2, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  getNextWaitlistEntry: `
    SELECT * FROM waitlist_entries
    WHERE ticket_type_id=$1 AND status='PENDING'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED`,

  deleteWaitlistEntry: `DELETE FROM waitlist_entries WHERE id=$1 RETURNING id`,


  // ═══════════════════════════════════════════════════════════════
  // PROMO CODES
  // ═══════════════════════════════════════════════════════════════
  createPromoCode: `
    INSERT INTO promo_codes (
      org_id, event_id, code, percent_off, amount_off_cents, currency,
      max_redemptions, per_user_limit, starts_at, ends_at, is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,

  updatePromoCode: `
    UPDATE promo_codes
    SET code=$2, percent_off=$3, amount_off_cents=$4, currency=$5,
        max_redemptions=$6, per_user_limit=$7, starts_at=$8, ends_at=$9, is_active=$10, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  getPromoById: `SELECT * FROM promo_codes WHERE id=$1`,

  findPromo: `
    SELECT * FROM promo_codes
    WHERE (
      (event_id=$1 AND event_id IS NOT NULL) OR (org_id=$2 AND event_id IS NULL)
    )
    AND lower(code)=lower($3)
    AND is_active=true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >= now())`,

  listPromosForEvent: `SELECT * FROM promo_codes WHERE event_id=$1 ORDER BY created_at DESC`,
  listPromosForOrg:   `SELECT * FROM promo_codes WHERE org_id=$1 AND event_id IS NULL ORDER BY created_at DESC`,
  deactivatePromoCode:`UPDATE promo_codes SET is_active=false, updated_at=now() WHERE id=$1 RETURNING *`,

  getPromoUsageCount: `
    SELECT COUNT(*)::int AS usage_count
    FROM order_promos
    WHERE promo_id=$1`,

  attachPromoToOrder: `
    INSERT INTO order_promos (order_id, promo_id)
    VALUES ($1,$2)
    ON CONFLICT DO NOTHING
    RETURNING *`,

  getOrderPromos: `
    SELECT pc.*
    FROM order_promos op
    JOIN promo_codes pc ON pc.id = op.promo_id
    WHERE op.order_id = $1`,


  // ═══════════════════════════════════════════════════════════════
  // NOTIFICATIONS & DEVICES
  // ═══════════════════════════════════════════════════════════════
  enqueueNotification: `
    INSERT INTO notifications (
      org_id, event_id, title, body_md, channel, status,
      target_user_id, target_attendee_email, published_by, scheduled_at
    )
    VALUES ($1,$2,$3,$4,$5,'QUEUED',$6,$7,$8,$9)
    RETURNING *`,

  getNotificationById: `SELECT * FROM notifications WHERE id=$1`,

  markNotificationSent: `
    UPDATE notifications
    SET status='SENT', sent_at=now(), magicbell_notification_id=$2, updated_at=now()
    WHERE id=$1`,

  updateNotificationStatus: `
    UPDATE notifications
    SET status=$2, error_message=$3, updated_at=now()
    WHERE id=$1
    RETURNING *`,

  listNotificationsForUser: `
    SELECT * FROM notifications
    WHERE target_user_id=$1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,

  listNotificationsForEvent: `
    SELECT * FROM notifications
    WHERE event_id=$1
    ORDER BY created_at DESC`,

  listQueuedNotifications: `
    SELECT * FROM notifications
    WHERE status='QUEUED' AND (scheduled_at IS NULL OR scheduled_at <= now())
    ORDER BY created_at ASC
    LIMIT $1`,

  upsertDevice: `
    INSERT INTO devices (user_id, device_type, push_token, web_p256dh, web_auth, app_version, os_version, locale, last_seen_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (device_type, push_token)
    DO UPDATE SET
      user_id=EXCLUDED.user_id,
      web_p256dh=EXCLUDED.web_p256dh,
      web_auth=EXCLUDED.web_auth,
      app_version=EXCLUDED.app_version,
      os_version=EXCLUDED.os_version,
      locale=EXCLUDED.locale,
      last_seen_at=EXCLUDED.last_seen_at,
      fail_count=0,
      disabled_at=NULL,
      updated_at=now()
    RETURNING *`,

  listDevicesForUser: `
    SELECT * FROM devices
    WHERE user_id=$1 AND disabled_at IS NULL
    ORDER BY last_seen_at DESC NULLS LAST`,

  deleteDevice:            `DELETE FROM devices WHERE id=$1 RETURNING id`,
  updateDeviceLastSeen:    `UPDATE devices SET last_seen_at=now(), updated_at=now() WHERE id=$1 RETURNING *`,
  disableDevice:           `UPDATE devices SET disabled_at=now(), updated_at=now() WHERE id=$1 RETURNING *`,
  incrementDeviceFailCount:`UPDATE devices SET fail_count=fail_count+1, updated_at=now() WHERE id=$1 RETURNING *`,

  getUserNotificationPrefs: `SELECT * FROM user_notification_prefs WHERE user_id=$1`,

  upsertUserNotificationPrefs: `
    INSERT INTO user_notification_prefs (user_id, email_enabled, push_enabled, sms_enabled, in_app_enabled, quiet_hours_json, locale)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (user_id)
    DO UPDATE SET
      email_enabled=EXCLUDED.email_enabled,
      push_enabled=EXCLUDED.push_enabled,
      sms_enabled=EXCLUDED.sms_enabled,
      in_app_enabled=EXCLUDED.in_app_enabled,
      quiet_hours_json=EXCLUDED.quiet_hours_json,
      locale=EXCLUDED.locale`,


  // ═══════════════════════════════════════════════════════════════
  // IDEMPOTENCY & WEBHOOKS & OUTBOX
  // ═══════════════════════════════════════════════════════════════
  getOrLockIdempotencyKey: `
    INSERT INTO idempotency_keys (scope, key, request_hash, locked_at)
    VALUES ($1,$2,$3,now())
    ON CONFLICT (scope, key) DO UPDATE SET locked_at=now()
    RETURNING *`,

  setIdempotencyResponse: `
    UPDATE idempotency_keys
    SET response_status=$3, response_body=$4, locked_at=NULL
    WHERE scope=$1 AND key=$2
    RETURNING *`,

  releaseIdempotencyLock: `UPDATE idempotency_keys SET locked_at=NULL WHERE scope=$1 AND key=$2`,
  getIdempotencyKey:      `SELECT * FROM idempotency_keys WHERE scope=$1 AND key=$2`,

  getWebhookEvent: `SELECT * FROM webhook_events WHERE id=$1`,

  markWebhookHandled: `
    UPDATE webhook_events SET handled_at=now() WHERE id=$1 RETURNING *`,

  listUnhandledWebhooks: `
    SELECT * FROM webhook_events
    WHERE handled_at IS NULL
    ORDER BY received_at ASC
    LIMIT $1`,

  insertWebhookEvent: `
    INSERT INTO webhook_events (provider, event_type, provider_event_id, signature_ok, payload)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (provider, provider_event_id) DO NOTHING
    RETURNING *`,

  findWebhookByProviderId: `
    SELECT * FROM webhook_events WHERE provider=$1 AND provider_event_id=$2`,

  createOutboxEvent: `
    INSERT INTO outbox_events (topic, aggregate, aggregate_id, payload)
    VALUES ($1,$2,$3,$4)
    RETURNING *`,

  markOutboxPublished: `
    UPDATE outbox_events SET published_at=now() WHERE id=$1 RETURNING *`,

  listUnpublishedOutboxEvents: `
    SELECT * FROM outbox_events
    WHERE published_at IS NULL
    ORDER BY created_at ASC
    LIMIT $1`,


  // ═══════════════════════════════════════════════════════════════
  // FEEDBACK & ACTIVITY
  // ═══════════════════════════════════════════════════════════════
  createEventFeedback: `
    INSERT INTO event_feedback (event_id, ticket_id, user_id, rating, comments_md)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`,

  listFeedbackForEvent: `
    SELECT ef.*, u.first_name || ' ' || u.last_name AS user_name, u.email AS user_email
    FROM event_feedback ef
    LEFT JOIN users u ON u.id = ef.user_id
    WHERE ef.event_id=$1
    ORDER BY ef.created_at DESC`,

  getFeedbackStatsForEvent: `
    SELECT
      COUNT(*)::int AS total_responses,
      ROUND(AVG(rating), 2) AS avg_rating,
      COUNT(*) FILTER (WHERE rating=5)::int AS five_star,
      COUNT(*) FILTER (WHERE rating=4)::int AS four_star,
      COUNT(*) FILTER (WHERE rating=3)::int AS three_star,
      COUNT(*) FILTER (WHERE rating=2)::int AS two_star,
      COUNT(*) FILTER (WHERE rating=1)::int AS one_star
    FROM event_feedback
    WHERE event_id=$1`,

  logActivity: `
    INSERT INTO activity_log (actor_user_id, action, entity_type, entity_id, meta)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`,

  listActivityForEntity: `
    SELECT * FROM activity_log
    WHERE entity_type=$1 AND entity_id=$2
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4`,

  listActivityForUser: `
    SELECT * FROM activity_log
    WHERE actor_user_id=$1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,


  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS / DASHBOARDS
  // ═══════════════════════════════════════════════════════════════
  salesByDayForEvent: `
    SELECT date_trunc('day', t.issued_at) AS day, COUNT(*)::int AS tickets_sold
    FROM tickets t
    WHERE t.event_id=$1
    GROUP BY 1 ORDER BY 1`,

  revenueByDayForEvent: `
    SELECT date_trunc('day', o.created_at) AS day, SUM(oi.total_cents)::bigint AS revenue_cents
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.event_id=$1 AND o.status IN ('PAID','REFUNDED','PARTIALLY_REFUNDED')
    GROUP BY 1 ORDER BY 1`,

  ticketSalesByType: `
    SELECT
      tt.name AS ticket_type_name,
      tt.kind AS ticket_kind,
      COUNT(t.id)::int AS tickets_sold,
      SUM(oi.total_cents)::bigint AS revenue_cents
    FROM ticket_types tt
    LEFT JOIN tickets t ON t.ticket_type_id=tt.id AND t.status='ACTIVE'
    LEFT JOIN order_items oi ON oi.id = t.order_item_id
    WHERE tt.event_id=$1
    GROUP BY tt.id, tt.name, tt.kind
    ORDER BY tickets_sold DESC`,

  orderStatusBreakdown: `
    SELECT
      status,
      COUNT(*)::int AS order_count,
      SUM(total_cents)::bigint AS total_revenue_cents
    FROM orders
    WHERE event_id=$1
    GROUP BY status
    ORDER BY order_count DESC`,

  attendanceTrend: `
    SELECT date_trunc('hour', ci.created_at) AS hour, COUNT(*)::int AS check_ins
    FROM check_ins ci
    WHERE ci.event_id=$1
    GROUP BY 1
    ORDER BY 1`,

  eventCapacityUtilization: `
    SELECT
      e.capacity,
      COUNT(t.id)::int AS tickets_sold,
      COUNT(ci.id)::int AS attendees_checked_in,
      CASE
        WHEN e.capacity IS NULL THEN NULL
        ELSE ROUND((COUNT(t.id)::numeric / e.capacity::numeric) * 100, 2)
      END AS utilization_pct
    FROM events e
    LEFT JOIN tickets t ON t.event_id=e.id AND t.status='ACTIVE'
    LEFT JOIN check_ins ci ON ci.ticket_id=t.id
    WHERE e.id=$1
    GROUP BY e.id, e.capacity`,

  totalRevenueForEvent: `
    SELECT
      SUM(CASE WHEN o.status='PAID' THEN o.total_cents ELSE 0 END)::bigint AS paid_revenue,
      SUM(CASE WHEN o.status IN ('REFUNDED','PARTIALLY_REFUNDED') THEN o.total_cents ELSE 0 END)::bigint AS refunded_amount,
      SUM(CASE WHEN o.status='PAID' THEN o.subtotal_cents ELSE 0 END)::bigint AS subtotal,
      SUM(CASE WHEN o.status='PAID' THEN o.tax_cents ELSE 0 END)::bigint AS tax_total,
      SUM(CASE WHEN o.status='PAID' THEN o.fees_cents ELSE 0 END)::bigint AS fees_total,
      COUNT(*) FILTER (WHERE o.status='PAID')::int AS paid_orders
    FROM orders o
    WHERE o.event_id=$1`,

  promoCodeEffectiveness: `
    SELECT
      pc.code, pc.percent_off, pc.amount_off_cents,
      COUNT(op.order_id)::int AS times_used,
      SUM(o.discount_cents)::bigint AS total_discount_applied
    FROM promo_codes pc
    LEFT JOIN order_promos op ON op.promo_id=pc.id
    LEFT JOIN orders o ON o.id=op.order_id
    WHERE pc.event_id=$1
    GROUP BY pc.id, pc.code, pc.percent_off, pc.amount_off_cents
    ORDER BY times_used DESC`,

  waitlistStats: `
    SELECT
      COUNT(*) FILTER (WHERE status='PENDING')::int    AS pending,
      COUNT(*) FILTER (WHERE status='NOTIFIED')::int   AS notified,
      COUNT(*) FILTER (WHERE status='CONVERTED')::int  AS converted,
      COUNT(*) FILTER (WHERE status='CANCELLED')::int  AS cancelled,
      COUNT(*)::int                                    AS total
    FROM waitlist_entries
    WHERE event_id=$1`,

  orgDashboardSummary: `
    SELECT
      (SELECT COUNT(*)::int FROM events WHERE org_id=$1)                                  AS total_events,
      (SELECT COUNT(*)::int FROM events WHERE org_id=$1 AND status='PUBLISHED')          AS published_events,
      (SELECT COUNT(*)::int FROM events WHERE org_id=$1 AND start_at > now())            AS upcoming_events,
      (SELECT SUM(total_cents)::bigint FROM orders o JOIN events e ON e.id=o.event_id
         WHERE e.org_id=$1 AND o.status='PAID')                                          AS total_revenue_cents`,

  eventPerformanceSummary: `
    SELECT
      e.title, e.status, e.start_at,
      COUNT(DISTINCT o.id)::int  AS total_orders,
      COUNT(DISTINCT t.id)::int  AS total_tickets_sold,
      COUNT(DISTINCT ci.id)::int AS attendees_checked_in,
      SUM(CASE WHEN o.status='PAID' THEN o.total_cents ELSE 0 END)::bigint AS revenue_cents,
      ROUND(AVG(ef.rating), 2) AS avg_rating
    FROM events e
    LEFT JOIN orders o     ON o.event_id = e.id
    LEFT JOIN tickets t    ON t.event_id = e.id AND t.status='ACTIVE'
    LEFT JOIN check_ins ci ON ci.event_id = e.id
    LEFT JOIN event_feedback ef ON ef.event_id = e.id
    WHERE e.id=$1
    GROUP BY e.id, e.title, e.status, e.start_at`,
};
