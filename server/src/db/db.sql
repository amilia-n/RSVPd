BEGIN;

-- ────────────────
-- 1) EXTENSIONS
-- ────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;    -- case-insensitive email


-- ──────────
-- 2) ENUMS  
-- ──────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='event_status') THEN
    CREATE TYPE event_status AS ENUM ('DRAFT','PUBLISHED','CANCELLED','COMPLETED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='visibility') THEN
    CREATE TYPE visibility AS ENUM ('PUBLIC','UNLISTED','PRIVATE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='order_status') THEN
    CREATE TYPE order_status AS ENUM
      ('DRAFT','PENDING','PAID','CANCELLED','EXPIRED','REFUNDED','PENDING_REFUND','FAILED','PARTIALLY_REFUNDED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payment_status') THEN
    CREATE TYPE payment_status AS ENUM
      ('REQUIRES_ACTION','PENDING','SUCCEEDED','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM ('ACTIVE','CANCELLED','REFUNDED','CHECKED_IN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='device_type') THEN
    CREATE TYPE device_type AS ENUM ('IOS','ANDROID','WEB');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM ('EMAIL','PUSH','SMS','IN_APP');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='notification_status') THEN
    CREATE TYPE notification_status AS ENUM ('QUEUED','SENT','FAILED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payment_provider') THEN
    CREATE TYPE payment_provider AS ENUM ('STRIPE');   -- locked to Stripe
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('CARD');       -- locked to Card
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='idempotency_scope') THEN
    CREATE TYPE idempotency_scope AS ENUM ('ORDER','PAYMENT','NOTIFICATION');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='event_type') THEN
    CREATE TYPE event_type AS ENUM
      ('CONFERENCE','MEETUP','WORKSHOP','WEBINAR','LIVE','PERFORMANCE','OTHER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='ticket_kind') THEN
    CREATE TYPE ticket_kind AS ENUM
      ('GENERAL','VIP','EARLY_BIRD','STUDENT','WORKSHOP','ADD_ON',
       'DAY_PASS','MULTI_DAY','COMP','VENDOR','STAFF','DONATION');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='us_state') THEN
    CREATE TYPE us_state AS ENUM (
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
      'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
      'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
      'VA','WA','WV','WI','WY','DC','PR','VI','GU','AS','MP'
    );
  END IF;

END$$;

-- ──────────────────────
-- 3) HELPER FUNCTIONS
-- ──────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION set_event_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple',  coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description_md,'')), 'C') ||
    setweight(to_tsvector('simple',  array_to_string(NEW.tags,' ')), 'B');
  RETURN NEW;
END$$;

-- ────────────────────
-- 4) CORE TABLES
-- ────────────────────

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Users 
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext NOT NULL UNIQUE,
  password_hash text   NOT NULL,
  last_name     text   NOT NULL,
  first_name    text   NOT NULL,
  phone         text,
  is_verified   boolean NOT NULL DEFAULT false,
  magicbell_external_id text UNIQUE,
  stripe_customer_id    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Roles & mapping
CREATE TABLE IF NOT EXISTS roles ( name text PRIMARY KEY );
INSERT INTO roles(name) VALUES ('ADMIN'),('ORGANIZER'),('ATTENDEE'),('VENDOR')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  role_name  text REFERENCES roles(name) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_name)
);

-- Org membership
CREATE TABLE IF NOT EXISTS org_members (
  org_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name text REFERENCES roles(name) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id, role_name)
);

-- Venues
CREATE TABLE IF NOT EXISTS venues (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name         text NOT NULL,
  address1     text NOT NULL,                    
  address2     text,                             
  city         text NOT NULL,                    
  state_code   us_state NOT NULL,                
  postal_code  text NOT NULL,                    
  country_code char(2) NOT NULL DEFAULT 'US',    
  capacity     integer CHECK (capacity IS NULL OR capacity >= 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venues_country_is_us CHECK (country_code = 'US'),
  CONSTRAINT venues_postal_is_us_zip CHECK (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$')
);

-- Events 
CREATE TABLE IF NOT EXISTS events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id       uuid REFERENCES venues(id) ON DELETE SET NULL,
  title          text NOT NULL,
  slug           text NOT NULL,  
  summary        text,
  description_md text,
  status         event_status NOT NULL DEFAULT 'DRAFT',
  visibility     visibility   NOT NULL DEFAULT 'PUBLIC',
  event_type     event_type   NOT NULL DEFAULT 'LIVE',
  capacity       integer CHECK (capacity IS NULL OR capacity >= 0),
  start_at       timestamptz NOT NULL,
  end_at         timestamptz NOT NULL,
  sales_start_at timestamptz,
  sales_end_at   timestamptz,
  is_online      boolean NOT NULL DEFAULT false,
  stream_url     text,
  cover_image_url text,
  tags           text[] NOT NULL DEFAULT '{}',
  search_vector  tsvector,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (start_at < end_at),
  CHECK (sales_start_at IS NULL OR sales_end_at IS NULL OR sales_start_at <= sales_end_at),
  UNIQUE (org_id, slug)
);

-- Speakers
CREATE TABLE IF NOT EXISTS speakers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  title        text,
  company      text,
  bio_md       text,
  headshot_url text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description_md text,
  track          text,
  room           text,
  starts_at      timestamptz NOT NULL,
  ends_at        timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_at < ends_at)
);

CREATE TABLE IF NOT EXISTS session_speakers (
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  speaker_id uuid NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  role       text,
  PRIMARY KEY (session_id, speaker_id)
);

-- Ticket catalog
CREATE TABLE IF NOT EXISTS ticket_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description_md   text,
  kind             ticket_kind NOT NULL DEFAULT 'GENERAL',
  price_cents      integer NOT NULL CHECK (price_cents >= 0),
  currency         char(3) NOT NULL DEFAULT 'USD',
  quantity_total   integer CHECK (quantity_total IS NULL OR quantity_total >= 0),
  per_order_limit  integer CHECK (per_order_limit >= 1),
  per_user_limit   integer CHECK (per_user_limit IS NULL OR per_user_limit > 0), 
  sales_start_at   timestamptz,
  sales_end_at     timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (sales_start_at IS NULL OR sales_end_at IS NULL OR sales_start_at <= sales_end_at),
  CONSTRAINT ticket_types_currency_is_usd CHECK (currency = 'USD')
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  purchaser_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  purchaser_email  citext NOT NULL,
  status           order_status NOT NULL DEFAULT 'DRAFT',
  subtotal_cents   integer NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  discount_cents   integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  fees_cents       integer NOT NULL DEFAULT 0 CHECK (fees_cents >= 0),
  tax_cents        integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents      integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency         char(3) NOT NULL DEFAULT 'USD',
  customer_address_line1   text,
  customer_address_line2   text,
  customer_city            text,
  customer_state_code      us_state,
  customer_postal_code     text,
  customer_country_code    char(2) DEFAULT 'US',
  payment_due_at   timestamptz,
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_currency_is_usd CHECK (currency = 'USD'),
  CONSTRAINT orders_customer_country_is_us CHECK (customer_country_code IS NULL OR customer_country_code = 'US'),
  CONSTRAINT orders_customer_zip_format CHECK (customer_postal_code IS NULL OR customer_postal_code ~ '^[0-9]{5}(-[0-9]{4})?$')
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_id         uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id   uuid NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  quantity         integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  total_cents      integer NOT NULL CHECK (total_cents >= 0),
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (id, order_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider            payment_provider NOT NULL DEFAULT 'STRIPE',
  provider_payment_id text,           
  status              payment_status NOT NULL DEFAULT 'PENDING',
  amount_cents        integer NOT NULL CHECK (amount_cents >= 0),
  currency            char(3) NOT NULL DEFAULT 'USD',
  method              payment_method  NOT NULL DEFAULT 'CARD',
  provider_session_id text,           -- cs_...
  checkout_mode       text,           -- 'payment' | 'setup' | 'subscription'
  checkout_status     text,           -- 'open' | 'complete' | 'expired'
  payment_intent_id   text,           -- pi_...
  latest_charge_id    text,
  receipt_url         text,
  received_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (provider = 'STRIPE'),
  CHECK (method   = 'CARD'),
  CHECK (currency = 'USD')
);

-- Attendees  (make email unique at table-level so ON CONFLICT works)
CREATE TABLE IF NOT EXISTS attendees (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  full_name  text NOT NULL,
  email      citext NOT NULL UNIQUE,
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  order_id       uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id  uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  attendee_id    uuid NOT NULL REFERENCES attendees(id) ON DELETE RESTRICT,
  short_code     text UNIQUE,
  qr_token       text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16),'hex'),
  status         ticket_status NOT NULL DEFAULT 'ACTIVE',
  issued_at      timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  cancelled_at   timestamptz
);

-- Check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id          uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_id           uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scanned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  device_label       text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Inventory reservations
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id uuid NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  order_id       uuid,
  quantity       integer NOT NULL CHECK (quantity > 0),
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Waitlist
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id  uuid REFERENCES ticket_types(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  email           citext,
  full_name       text,
  status          text NOT NULL DEFAULT 'PENDING', -- PENDING|NOTIFIED|CONVERTED|CANCELLED
  priority        integer NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_id         uuid REFERENCES events(id) ON DELETE CASCADE,
  code             text NOT NULL,
  percent_off      integer,
  amount_off_cents integer,
  currency         char(3) DEFAULT 'USD',
  max_redemptions  integer,
  per_user_limit   integer,
  starts_at        timestamptz,
  ends_at          timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (percent_off IS NULL OR (percent_off BETWEEN 0 AND 100)),
  CHECK (amount_off_cents IS NULL OR amount_off_cents >= 0)
);

CREATE TABLE IF NOT EXISTS order_promos (
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  promo_id   uuid NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, promo_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_id              uuid REFERENCES events(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  body_md               text,
  channel               notification_channel NOT NULL,
  status                notification_status NOT NULL DEFAULT 'QUEUED',
  target_user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  target_attendee_email citext,
  published_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at          timestamptz,
  sent_at               timestamptz,
  error_message         text,
  magicbell_notification_id text UNIQUE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  device_type   device_type NOT NULL,
  push_token    text NOT NULL,
  web_p256dh    text,
  web_auth      text,
  app_version   text,
  os_version    text,
  locale        text,
  last_seen_at  timestamptz,
  fail_count    integer NOT NULL DEFAULT 0,
  disabled_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_type, push_token)
);

-- User notification prefs
CREATE TABLE IF NOT EXISTS user_notification_prefs (
  user_id          uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_enabled    boolean NOT NULL DEFAULT true,
  push_enabled     boolean NOT NULL DEFAULT true,
  sms_enabled      boolean NOT NULL DEFAULT false,
  in_app_enabled   boolean NOT NULL DEFAULT true,
  quiet_hours_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  locale           text
);

-- Idempotency keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope           idempotency_scope NOT NULL,  -- 'ORDER','PAYMENT','NOTIFICATION'
  key             text NOT NULL,               -- client-supplied key
  request_hash    text,
  response_status integer,
  response_body   jsonb,
  locked_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, key)
);

-- Webhook capture
CREATE TABLE IF NOT EXISTS webhook_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           payment_provider NOT NULL DEFAULT 'STRIPE',
  event_type         text NOT NULL,
  provider_event_id  text NOT NULL,
  signature_ok       boolean NOT NULL DEFAULT false,
  payload            jsonb NOT NULL,
  received_at        timestamptz NOT NULL DEFAULT now(),
  handled_at         timestamptz,
  UNIQUE (provider, provider_event_id)
);

-- Outbox 
CREATE TABLE IF NOT EXISTS outbox_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic         text NOT NULL,
  aggregate     text NOT NULL,
  aggregate_id  uuid,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);

-- Post-Event Surveys
CREATE TABLE IF NOT EXISTS surveys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description_md  text,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  is_published    boolean NOT NULL DEFAULT false,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text   text NOT NULL,
  question_order  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (question_order >= 1 AND question_order <= 5)
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  ticket_id       uuid REFERENCES tickets(id) ON DELETE SET NULL,
  rating          integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_id, question_id, user_id)
);

CREATE TABLE IF NOT EXISTS survey_recipients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  ticket_id       uuid REFERENCES tickets(id) ON DELETE SET NULL,
  notification_id uuid REFERENCES notifications(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'PENDING', -- PENDING, DRAFT, SUBMITTED
  draft_data      jsonb NOT NULL DEFAULT '{}'::jsonb, -- Store partial responses
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_id, user_id)
);


-- Audit log 
CREATE TABLE IF NOT EXISTS activity_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ────────────
-- 5) TRIGGERS 
-- ────────────
CREATE TRIGGER organizations_u BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_u          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER venues_u         BEFORE UPDATE ON venues         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER events_u         BEFORE UPDATE ON events         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER speakers_u       BEFORE UPDATE ON speakers       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sessions_u       BEFORE UPDATE ON sessions       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ticket_types_u   BEFORE UPDATE ON ticket_types   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER orders_u         BEFORE UPDATE ON orders         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payments_u       BEFORE UPDATE ON payments       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER attendees_u      BEFORE UPDATE ON attendees      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tickets_u        BEFORE UPDATE ON tickets        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER devices_u        BEFORE UPDATE ON devices        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER notifications_u  BEFORE UPDATE ON notifications  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER waitlist_entries_u BEFORE UPDATE ON waitlist_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER promo_codes_u    BEFORE UPDATE ON promo_codes    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER events_search_vector BEFORE INSERT OR UPDATE OF title, summary, description_md, tags ON events FOR EACH ROW EXECUTE FUNCTION set_event_search_vector();
CREATE TRIGGER surveys_u BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER survey_recipients_u BEFORE UPDATE ON survey_recipients FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────
-- 6) INDEXES 
-- ───────────

-- Venues
CREATE INDEX IF NOT EXISTS venues_city_state_idx ON venues (lower(city), state_code);
CREATE INDEX IF NOT EXISTS venues_zip_idx        ON venues (postal_code);
CREATE INDEX IF NOT EXISTS venues_org_idx        ON venues (org_id);

-- Events
CREATE INDEX IF NOT EXISTS events_search_gin ON events USING gin (search_vector);
CREATE INDEX IF NOT EXISTS events_tags_gin   ON events USING gin (tags);
CREATE INDEX IF NOT EXISTS events_time_idx      ON events(start_at, end_at);
CREATE INDEX IF NOT EXISTS events_venue_idx     ON events(venue_id);
CREATE INDEX IF NOT EXISTS events_org_time_idx  ON events(org_id, start_at DESC);

-- Sessions
CREATE INDEX IF NOT EXISTS sessions_event_time_idx ON sessions(event_id, starts_at);

-- Ticket types
CREATE INDEX IF NOT EXISTS ticket_types_event_idx ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS ticket_types_kind_idx  ON ticket_types(kind);
CREATE UNIQUE INDEX IF NOT EXISTS ticket_types_unique_name_per_event_ci
  ON ticket_types (event_id, lower(name));

-- Orders
CREATE INDEX IF NOT EXISTS orders_event_status_idx     ON orders(event_id, status);
CREATE INDEX IF NOT EXISTS orders_purchaser_email_idx  ON orders(purchaser_email);
CREATE INDEX IF NOT EXISTS orders_purchaser_user_idx   ON orders(purchaser_user_id);
CREATE INDEX IF NOT EXISTS orders_customer_zip_idx     ON orders(customer_postal_code);
CREATE INDEX IF NOT EXISTS orders_expires_idx          ON orders(expires_at);

-- Order items
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

-- Payments
CREATE INDEX IF NOT EXISTS payments_order_idx   ON payments(order_id);
CREATE INDEX IF NOT EXISTS payments_status_idx  ON payments(status);
CREATE INDEX IF NOT EXISTS payments_session_idx ON payments(provider_session_id);
CREATE INDEX IF NOT EXISTS payments_intent_idx  ON payments(payment_intent_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_ref_uniq
  ON payments(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- Attendees
CREATE INDEX IF NOT EXISTS attendees_email_idx ON attendees(email);
-- dropped functional unique index in favor of table-level UNIQUE (see migration below)

-- Tickets
CREATE INDEX IF NOT EXISTS tickets_event_idx    ON tickets(event_id);
CREATE INDEX IF NOT EXISTS tickets_attendee_idx ON tickets(attendee_id);
CREATE INDEX IF NOT EXISTS tickets_type_idx     ON tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS tickets_order_idx    ON tickets(order_id);

-- Check-ins
CREATE UNIQUE INDEX IF NOT EXISTS checkins_one_per_ticket_idx ON check_ins(ticket_id);
CREATE INDEX IF NOT EXISTS checkins_scanned_by_idx ON check_ins(scanned_by_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS checkins_event_idx ON check_ins(event_id, created_at DESC);

-- Inventory reservations
CREATE INDEX IF NOT EXISTS inv_res_by_ttype_idx ON inventory_reservations(ticket_type_id);
CREATE INDEX IF NOT EXISTS inv_res_expires_idx  ON inventory_reservations(expires_at);
CREATE INDEX IF NOT EXISTS inv_res_active_idx ON inventory_reservations(ticket_type_id, expires_at);
CREATE INDEX IF NOT EXISTS inv_res_by_order_idx ON inventory_reservations(order_id);

-- Waitlist
CREATE INDEX IF NOT EXISTS waitlist_event_ticket_idx
  ON waitlist_entries(event_id, ticket_type_id, status, priority DESC, created_at ASC);

-- Promo codes
CREATE UNIQUE INDEX IF NOT EXISTS promo_code_unique_per_event
  ON promo_codes (event_id, lower(code));
CREATE INDEX IF NOT EXISTS order_promos_order_idx ON order_promos(order_id);
CREATE INDEX IF NOT EXISTS order_promos_promo_idx ON order_promos(promo_id);

-- Notifications
CREATE INDEX IF NOT EXISTS notifications_queue_idx
  ON notifications (status, scheduled_at) WHERE status = 'QUEUED';

-- Outbox
CREATE INDEX IF NOT EXISTS outbox_topic_created_idx ON outbox_events(topic, created_at DESC);

-- Post-event surveys
CREATE INDEX IF NOT EXISTS surveys_event_idx ON surveys(event_id);
CREATE INDEX IF NOT EXISTS survey_questions_survey_idx ON survey_questions(survey_id, question_order);
CREATE INDEX IF NOT EXISTS survey_responses_survey_idx ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS survey_responses_user_idx ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS survey_recipients_survey_user_idx ON survey_recipients(survey_id, user_id);
CREATE INDEX IF NOT EXISTS survey_recipients_status_idx ON survey_recipients(status);

-- Webhook events
CREATE INDEX IF NOT EXISTS webhook_events_unhandled_idx
  ON webhook_events(provider, handled_at) WHERE handled_at IS NULL;

-- Activity log
CREATE INDEX IF NOT EXISTS activity_entity_idx
  ON activity_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS activity_actor_idx
  ON activity_log (actor_user_id, created_at DESC);

-- ─────────────────────
-- 7) CROSS CONSTRAINTS 
-- ─────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_types_id_event_unique'
  ) THEN
    ALTER TABLE ticket_types
      ADD CONSTRAINT ticket_types_id_event_unique UNIQUE (id, event_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_id_event_unique'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_id_event_unique UNIQUE (id, event_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_ticket_type_matches_event'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_ticket_type_matches_event
      FOREIGN KEY (ticket_type_id, event_id)
      REFERENCES ticket_types (id, event_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_ticket_type_matches_event'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_ticket_type_matches_event
      FOREIGN KEY (ticket_type_id, event_id)
      REFERENCES ticket_types (id, event_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_matches_event'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_order_matches_event
      FOREIGN KEY (order_id, event_id)
      REFERENCES orders (id, event_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_order_item_belongs_to_order'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_order_item_belongs_to_order
      FOREIGN KEY (order_item_id, order_id)
      REFERENCES order_items (id, order_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ────────────────────────────────
-- 8) COMPATIBILITY MIGRATIONS
--    (run safely even if already set)
-- ────────────────────────────────
-- Ensure attendees.email is UNIQUE (table-level) and drop the old functional unique index.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid = 'attendees'::regclass
    AND    conname  = 'attendees_email_unique'
  ) THEN
    ALTER TABLE attendees
      ADD CONSTRAINT attendees_email_unique UNIQUE (email);
  END IF;
  -- old functional unique index (if present)
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = ANY (current_schemas(true))
      AND indexname = 'attendees_email_unique_ci'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS attendees_email_unique_ci';
  END IF;
END$$;

COMMIT;
