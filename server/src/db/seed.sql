BEGIN;

-- ─────────────────────────────────────────────
-- 1) ORGANIZATIONS
-- ─────────────────────────────────────────────
INSERT INTO organizations (name, slug) VALUES
  ('Alpha Events Co.',  'org-one'),
  ('Beta Productions',  'org-two'),
  ('Gamma Collective',  'org-three')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2) VENUES
-- ─────────────────────────────────────────────
WITH o AS (SELECT id, slug FROM organizations)
INSERT INTO venues (org_id, name, address1, city, state_code, postal_code, country_code, capacity)
VALUES
  ((SELECT id FROM o WHERE slug='org-one'),   'Hudson Hall',             '123 Riverside Dr',     'New York',     'NY', '10027', 'US',     80),
  ((SELECT id FROM o WHERE slug='org-one'),   'Brooklyn Workshop Loft',  '44 Kingsland Ave',     'Brooklyn',     'NY', '11211', 'US',     20),
  ((SELECT id FROM o WHERE slug='org-two'),   'Downtown Convention Ctr', '500 Market St',        'Philadelphia', 'PA', '19106', 'US',    200),
  ((SELECT id FROM o WHERE slug='org-two'),   'Innovation Hub',          '700 Liberty Ave',      'Pittsburgh',   'PA', '15222', 'US',     60),
  ((SELECT id FROM o WHERE slug='org-three'), 'Mission Theater',         '240 Valencia St',      'San Francisco','CA', '94103', 'US',  90)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 3) SPEAKERS
-- ─────────────────────────────────────────────
WITH o AS (SELECT id, slug FROM organizations)
INSERT INTO speakers (org_id, full_name, title, company, bio_md, headshot_url)
VALUES
  ((SELECT id FROM o WHERE slug='org-one'),   'Jamal Ortega', 'Staff Engineer',      'Astera',   'Distributed systems nerd.',      'https://picsum.photos/seed/jamal/200/200'),
  ((SELECT id FROM o WHERE slug='org-one'),   'Mina Patel',   'Frontend Lead',       'Nimbus',   'Accessibility + DX advocate.',   'https://picsum.photos/seed/mina/200/200'),
  ((SELECT id FROM o WHERE slug='org-two'),   'Eric Sung',    'Principal Scientist', 'Quantica', 'Time series & forecasting.',     'https://picsum.photos/seed/eric/200/200'),
  ((SELECT id FROM o WHERE slug='org-two'),   'Hyejin Park',  'CTO',                 'ArcWorks', 'LLM systems in production.',     'https://picsum.photos/seed/hyejin/200/200'),
  ((SELECT id FROM o WHERE slug='org-three'), 'Sophie Nguyen','Head of Product',     'Kitewave', 'Product strategy & growth.',     'https://picsum.photos/seed/sophie/200/200')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 4) EVENTS (4 upcoming PUBLISHED, 1 past COMPLETED)
-- ─────────────────────────────────────────────
WITH orgs AS (SELECT id, slug FROM organizations),
     v    AS (SELECT id, name FROM venues)
INSERT INTO events (
  org_id, venue_id, title, slug, summary, description_md, status, visibility, event_type,
  capacity, start_at, end_at, sales_start_at, sales_end_at,
  is_online, stream_url, cover_image_url, tags
)
VALUES
  -- org-one
  ((SELECT id FROM orgs WHERE slug='org-one'), (SELECT id FROM v WHERE name='Hudson Hall'),
    'NY Tech Meetup', 'ny-tech-meetup-2025-12',
    'Monthly meetup for engineers and founders.', 'Talks • Demos • Networking',
    'PUBLISHED','PUBLIC','MEETUP', 80,
    TIMESTAMPTZ '2025-12-10 18:00:00-05', TIMESTAMPTZ '2025-12-10 21:00:00-05',
    TIMESTAMPTZ '2025-11-01 09:00:00-04', TIMESTAMPTZ '2025-12-10 17:00:00-05',
    FALSE, NULL, 'https://picsum.photos/seed/nymeetup/800/400', ARRAY['tech','meetup','nyc']),

  ((SELECT id FROM orgs WHERE slug='org-one'), (SELECT id FROM v WHERE name='Brooklyn Workshop Loft'),
    'Holiday JS Workshop', 'holiday-js-workshop-2026-01',
    'Hands-on modern JS + tooling.', 'Bring your laptop; snacks provided.',
    'PUBLISHED','PUBLIC','WORKSHOP', 20,
    TIMESTAMPTZ '2026-01-15 10:00:00-05', TIMESTAMPTZ '2026-01-15 16:00:00-05',
    TIMESTAMPTZ '2025-11-15 09:00:00-05', TIMESTAMPTZ '2026-01-15 09:00:00-05',
    FALSE, NULL, 'https://picsum.photos/seed/holidayjs/800/400', ARRAY['javascript','workshop','hands-on']),

  -- org-two
  ((SELECT id FROM orgs WHERE slug='org-two'), (SELECT id FROM v WHERE name='Downtown Convention Ctr'),
    'Data Science Summit', 'ds-summit-2025-12',
    'Talks, tutorials, and expo.', 'ML • MLOps • Analytics',
    'PUBLISHED','PUBLIC','CONFERENCE', 200,
    TIMESTAMPTZ '2025-12-18 09:00:00-05', TIMESTAMPTZ '2025-12-18 17:00:00-05',
    TIMESTAMPTZ '2025-11-05 09:00:00-05', TIMESTAMPTZ '2025-12-18 08:00:00-05',
    FALSE, NULL, 'https://picsum.photos/seed/dsconf/800/400', ARRAY['data','ai','ml']),

  ((SELECT id FROM orgs WHERE slug='org-two'), (SELECT id FROM v WHERE name='Innovation Hub'),
    'AI Demo Day', 'ai-demo-day-2026-02',
    'Startups demo applied AI products.', 'Judges • Live feedback',
    'PUBLISHED','PUBLIC','LIVE', 60, 
    TIMESTAMPTZ '2026-02-05 14:00:00-05', TIMESTAMPTZ '2026-02-05 18:00:00-05',
    TIMESTAMPTZ '2025-12-01 09:00:00-05', TIMESTAMPTZ '2026-02-05 13:00:00-05',
    FALSE, NULL, 'https://picsum.photos/seed/aidemo/800/400', ARRAY['startups','ai','demo']),

  -- org-three (PAST)
  ((SELECT id FROM orgs WHERE slug='org-three'), (SELECT id FROM v WHERE name='Mission Theater'),
    'Fall Retrospective 2025', 'fall-retro-2025-09',
    'Panel + mixer looking back at the year.', 'Reflection • Trends • Community',
    'COMPLETED','PUBLIC','MEETUP', 90, 
    TIMESTAMPTZ '2025-09-15 18:00:00-07', TIMESTAMPTZ '2025-09-15 21:30:00-07',
    TIMESTAMPTZ '2025-08-01 09:00:00-07', TIMESTAMPTZ '2025-09-15 17:00:00-07',
    FALSE, NULL, 'https://picsum.photos/seed/fallretro/800/400', ARRAY['community','recap'])
ON CONFLICT (org_id, slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 5) TICKET TYPES (GA/VIP/STUDENT for each event)
-- ─────────────────────────────────────────────
WITH e AS (SELECT id, slug, sales_start_at, sales_end_at FROM events)
INSERT INTO ticket_types (
  event_id, name, description_md, kind, price_cents, currency, quantity_total,
  per_order_limit, per_user_limit, sales_start_at, sales_end_at, is_active
)
SELECT id, 'General Admission', 'Standard entry', 'GENERAL', 5000, 'USD', 1000, 4, NULL, sales_start_at, sales_end_at, TRUE
FROM e WHERE slug IN ('ny-tech-meetup-2025-12','ds-summit-2025-12','ai-demo-day-2026-02','holiday-js-workshop-2026-01')
ON CONFLICT DO NOTHING;

WITH e AS (SELECT id, slug, sales_start_at, sales_end_at FROM events)
INSERT INTO ticket_types (event_id, name, description_md, kind, price_cents, currency, quantity_total, per_order_limit, per_user_limit, sales_start_at, sales_end_at, is_active)
SELECT id, 'VIP', 'VIP lounge & front row', 'VIP', 15000, 'USD', 200, 2, 2, sales_start_at, sales_end_at, TRUE
FROM e WHERE slug IN ('ny-tech-meetup-2025-12','ds-summit-2025-12','ai-demo-day-2026-02','holiday-js-workshop-2026-01')
ON CONFLICT DO NOTHING;

WITH e AS (SELECT id, slug, sales_start_at, sales_end_at FROM events)
INSERT INTO ticket_types (event_id, name, description_md, kind, price_cents, currency, quantity_total, per_order_limit, per_user_limit, sales_start_at, sales_end_at, is_active)
SELECT id, 'Student', 'Student discount', 'STUDENT', 2500, 'USD', 500, 2, 1, sales_start_at, sales_end_at, TRUE
FROM e WHERE slug IN ('ny-tech-meetup-2025-12','ds-summit-2025-12','ai-demo-day-2026-02','holiday-js-workshop-2026-01')
ON CONFLICT DO NOTHING;

-- Past event ticket types
WITH e AS (SELECT id, slug, sales_start_at, sales_end_at FROM events WHERE slug='fall-retro-2025-09')
INSERT INTO ticket_types (event_id, name, description_md, kind, price_cents, currency, quantity_total, per_order_limit, per_user_limit, sales_start_at, sales_end_at, is_active)
SELECT id, 'General Admission', 'Standard entry', 'GENERAL', 4000, 'USD', 700, 4, NULL, sales_start_at, sales_end_at, TRUE FROM e
ON CONFLICT DO NOTHING;

WITH e AS (SELECT id, slug, sales_start_at, sales_end_at FROM events WHERE slug='fall-retro-2025-09')
INSERT INTO ticket_types (event_id, name, description_md, kind, price_cents, currency, quantity_total, per_order_limit, per_user_limit, sales_start_at, sales_end_at, is_active)
SELECT id, 'VIP', 'VIP lounge & reserved seats', 'VIP', 12000, 'USD', 100, 2, 2, sales_start_at, sales_end_at, TRUE FROM e
ON CONFLICT DO NOTHING;

WITH e AS (SELECT id, slug, sales_start_at, sales_end_at FROM events WHERE slug='fall-retro-2025-09')
INSERT INTO ticket_types (event_id, name, description_md, kind, price_cents, currency, quantity_total, per_order_limit, per_user_limit, sales_start_at, sales_end_at, is_active)
SELECT id, 'Student', 'Student discount', 'STUDENT', 2000, 'USD', 300, 2, 1, sales_start_at, sales_end_at, TRUE FROM e
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 6) PROMO CODES (EARLY BIRD across all events)
-- ─────────────────────────────────────────────
INSERT INTO promo_codes (org_id, event_id, code, percent_off, amount_off_cents, currency, max_redemptions, per_user_limit, starts_at, ends_at, is_active)
SELECT e.org_id, e.id, 'EARLY BIRD', 20, NULL, 'USD', NULL, NULL, e.sales_start_at, e.sales_end_at, TRUE
FROM events e
ON CONFLICT DO NOTHING;

COMMIT;
