# RSVPd Backend

A comprehensive Node.js backend API for the RSVP Event Management Platform. Built with Express 5, PostgreSQL, JWT authentication, Stripe payments, and MagicBell notifications.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Services](#services)
- [Middleware](#middleware)
- [Routes](#routes)
- [Dependencies](#dependencies)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [Tests](#Tests)

## Overview

The backend provides a RESTful API for managing events, users, organizations, tickets, orders, payments, check-ins, and notifications. It supports multiple user roles (Admin, Organizer, Vendor, Attendee) with role-based access control.

### Key Features

- JWT-based authentication and authorization
- Role-based access control (RBAC)
- PostgreSQL database with comprehensive schema
- Stripe payment integration with webhook support
- MagicBell notification integration
- QR code generation and validation for tickets
- Real-time check-in tracking with row-level locking
- Comprehensive event management
- Organization and membership management
- Analytics and reporting endpoints

## Architecture

The backend follows a layered architecture:

- **Routes**: Define API endpoints and HTTP methods
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data operations
- **Middleware**: Authentication, authorization, error handling
- **Database**: PostgreSQL with connection pooling
- **Utils**: Shared utilities (JWT, password hashing, QR codes)

## Directory Structure

```
src/
├── config/                 # Configuration
│   ├── db.js              # Database connection pool
│   └── env.js            # Environment variable validation
├── constants/             # Application constants
│   └── roles.js          # User role definitions
├── controllers/           # Request handlers
│   ├── auth.controller.js
│   ├── checkins.controller.js
│   ├── events.controller.js
│   ├── notification.controller.js
│   ├── orders.controller.js
│   ├── payments.controller.js
│   ├── tickets.controller.js
│   ├── ticketTypes.controller.js
│   └── user.controller.js
├── db/                    # Database layer
│   ├── db.sql            # Database schema
│   ├── queries.js        # SQL query definitions
│   ├── pool.js           # Connection pool setup
│   ├── init.js           # Database initialization
│   ├── reset.js          # Database reset utility
│   ├── seed.js           # Database seeding
│   └── seed.sql          # Seed data SQL
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── error.js          # Error handling middleware
│   └── notFound.js       # 404 handler
├── routes/                # Route definitions
│   ├── auth.routes.js
│   ├── checkins.routes.js
│   ├── events.routes.js
│   ├── notifications.routes.js
│   ├── orders.routes.js
│   ├── payments.routes.js
│   ├── tickets.routes.js
│   ├── ticketTypes.routes.js
│   └── users.routes.js
├── services/              # Business logic
│   ├── attendee.service.js
│   ├── auth.service.js
│   ├── checkin.service.js
│   ├── event.service.js
│   ├── magicbell.service.js
│   ├── notification.service.js
│   ├── order.service.js
│   ├── payment.service.js
│   ├── stripe.service.js
│   ├── ticket.service.js
│   ├── ticketTypes.service.js
│   └── user.service.js
└── utils/                 # Utility functions
    ├── crypto.js         # Cryptographic utilities
    ├── http.js           # HTTP utilities
    ├── password.js       # Password hashing (Argon2)
    ├── qr.js             # QR code utilities
    └── token.js          # JWT token utilities
```

## Database Schema

The database uses PostgreSQL with the following core tables:

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with authentication |
| `organizations` | Event organizing entities |
| `org_members` | Organization membership and roles |
| `roles` | System role definitions (ADMIN, ORGANIZER, VENDOR, ATTENDEE) |
| `user_roles` | User role assignments |
| `venues` | Event venues with location data |

### Event Tables

| Table | Description |
|-------|-------------|
| `events` | Event definitions with metadata |
| `speakers` | Speaker profiles |
| `sessions` | Event sessions/agenda items |
| `session_speakers` | Session-speaker associations |

### Ticketing Tables

| Table | Description |
|-------|-------------|
| `ticket_types` | Ticket catalog definitions |
| `orders` | Purchase orders |
| `order_items` | Order line items |
| `tickets` | Issued tickets with QR codes |
| `attendees` | Attendee records linked to users |
| `inventory_reservations` | Temporary inventory holds |
| `waitlist_entries` | Waitlist management |

### Payment Tables

| Table | Description |
|-------|-------------|
| `payments` | Payment records (Stripe integration) |
| `promo_codes` | Promotional codes |
| `order_promos` | Order-promo code associations |

### Check-in Tables

| Table | Description |
|-------|-------------|
| `check_ins` | Check-in records with timestamps |

### Notification Tables

| Table | Description |
|-------|-------------|
| `notifications` | Notification records |
| `devices` | Push notification device registrations |
| `user_notification_prefs` | User notification preferences |

### Utility Tables

| Table | Description |
|-------|-------------|
| `idempotency_keys` | Idempotency key tracking |
| `webhook_events` | Webhook event log |
| `outbox_events` | Event sourcing outbox |
| `event_feedback` | Post-event feedback |
| `activity_log` | Audit trail |

### Enums

The database defines several PostgreSQL enums:

- `event_status`: DRAFT, PUBLISHED, CANCELLED, COMPLETED
- `visibility`: PUBLIC, UNLISTED, PRIVATE
- `order_status`: DRAFT, PENDING, PAID, CANCELLED, EXPIRED, REFUNDED, etc.
- `payment_status`: REQUIRES_ACTION, PENDING, SUCCEEDED, FAILED, etc.
- `ticket_status`: ACTIVE, CANCELLED, REFUNDED, CHECKED_IN
- `event_type`: CONFERENCE, MEETUP, WORKSHOP, WEBINAR, LIVE, PERFORMANCE, OTHER
- `ticket_kind`: GENERAL, VIP, EARLY_BIRD, STUDENT, WORKSHOP, ADD_ON, etc.

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/me` | Get current user | Yes |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/me` | Get current user profile | Yes | All |
| GET | `/` | List users | Yes | Admin |
| GET | `/:id` | Get user by ID | Yes | Admin |
| PUT | `/:id` | Update user | Yes | Admin, Self |
| POST | `/:id/verify` | Verify user email | Yes | Admin |
| GET | `/:id/roles` | List user roles | Yes | Admin |
| POST | `/:id/roles` | Grant role to user | Yes | Admin |
| DELETE | `/:id/roles/:role` | Revoke role from user | Yes | Admin |
| POST | `/orgs` | Create organization | Yes | All |
| GET | `/orgs` | List user's organizations | Yes | All |
| GET | `/orgs/slug/:slug` | Get organization by slug | Yes | All |
| GET | `/orgs/:id` | Get organization by ID | Yes | All |
| PUT | `/orgs/:id` | Update organization | Yes | Organizer, Admin |
| GET | `/orgs/:orgId/members` | List org members | Yes | All |
| POST | `/orgs/:orgId/members` | Add/update org member | Yes | Organizer, Admin |
| DELETE | `/orgs/:orgId/members` | Remove org member | Yes | Organizer, Admin |

### Events (`/api/events`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| POST | `/` | Create event | Yes | Organizer, Admin |
| GET | `/:id` | Get event details | No | - |
| PUT | `/:id` | Update event | Yes | Organizer, Admin |
| POST | `/:id/publish` | Publish event | Yes | Organizer, Admin |
| POST | `/:id/cancel` | Cancel event | Yes | Organizer, Admin |
| GET | `/org/:orgId` | List events for organization | Yes | All |
| GET | `/public/search` | Search public events | No | - |
| GET | `/public/upcoming` | List upcoming public events | No | - |
| GET | `/:id/analytics` | Get event analytics | Yes | Organizer, Admin |
| POST | `/speakers` | Create speaker | Yes | Organizer, Admin |
| GET | `/speakers/:id` | Get speaker | Yes | All |
| PUT | `/speakers/:id` | Update speaker | Yes | Organizer, Admin |
| DELETE | `/speakers/:id` | Delete speaker | Yes | Organizer, Admin |
| GET | `/org/:orgId/speakers` | List speakers for org | Yes | All |
| POST | `/sessions` | Create session | Yes | Organizer, Admin |
| GET | `/sessions/:id` | Get session | Yes | All |
| PUT | `/sessions/:id` | Update session | Yes | Organizer, Admin |
| DELETE | `/sessions/:id` | Delete session | Yes | Organizer, Admin |
| GET | `/:eventId/sessions` | List sessions for event | Yes | All |

### Ticket Types (`/api/ticket-types`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| POST | `/` | Create ticket type | Yes | Organizer, Admin |
| GET | `/:id` | Get ticket type | Yes | All |
| PUT | `/:id` | Update ticket type | Yes | Organizer, Admin |
| POST | `/:id/deactivate` | Deactivate ticket type | Yes | Organizer, Admin |
| GET | `/event/:eventId` | List ticket types for event | No | - |
| GET | `/:id/availability` | Get ticket availability | No | - |

### Orders (`/api/orders`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| POST | `/` | Create order | Yes | Attendee, All |
| GET | `/:id` | Get order details | Yes | Owner, Admin |
| PUT | `/:id/status` | Update order status | Yes | Admin |
| PUT | `/:id/totals` | Recalculate order totals | Yes | Admin |
| POST | `/:id/cancel` | Cancel order | Yes | Owner, Admin |
| GET | `/me/list` | List user's orders | Yes | Attendee, All |
| GET | `/event/:eventId` | List orders for event | Yes | Organizer, Admin |
| POST | `/:id/items/check` | Check item availability | Yes | Attendee, All |
| POST | `/:id/items` | Add order item | Yes | Attendee, All |
| PUT | `/:id/items/:itemId` | Update order item | Yes | Attendee, All |
| DELETE | `/:id/items/:itemId` | Remove order item | Yes | Attendee, All |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| POST | `/checkout-session` | Create Stripe checkout session | Yes | Attendee, All |
| POST | `/` | Create payment record | Yes | Admin |
| GET | `/:id` | Get payment details | Yes | Owner, Admin |
| PUT | `/:id/status` | Update payment status | Yes | Admin |
| GET | `/order/:orderId` | List payments for order | Yes | Owner, Admin |
| POST | `/webhook` | Stripe webhook handler | No | - |

### Tickets (`/api/tickets`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/:id` | Get ticket details | Yes | Owner, Admin, Organizer |
| GET | `/:id/qr` | Get ticket QR code | Yes | Owner, Admin, Organizer |
| POST | `/:id/cancel` | Cancel ticket | Yes | Owner, Admin |
| GET | `/order/:orderId` | List tickets for order | Yes | Owner, Admin |
| GET | `/me/list` | List user's tickets | Yes | Attendee, All |
| GET | `/event/:eventId` | List tickets for event | Yes | Organizer, Admin |

### Check-ins (`/api/checkins`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| POST | `/scan` | Scan and check-in ticket | Yes | Vendor, Admin |
| POST | `/check-in` | Simple check-in by token | Yes | Vendor, Admin |
| GET | `/event/:eventId` | List check-ins for event | Yes | Organizer, Admin |
| GET | `/me` | List user's check-ins | Yes | Attendee, All |
| GET | `/event/:eventId/stats` | Get check-in statistics | Yes | Organizer, Admin |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| POST | `/` | Enqueue notification | Yes | Admin |
| GET | `/:id` | Get notification | Yes | Owner, Admin |
| POST | `/:id/sent` | Mark notification as sent | Yes | Admin |
| PUT | `/:id/status` | Update notification status | Yes | Admin |
| GET | `/user/me` | List user's notifications | Yes | Attendee, All |
| GET | `/event/:eventId` | List notifications for event | Yes | Organizer, Admin |
| GET | `/queued/list` | List queued notifications | Yes | Admin |
| POST | `/send` | Send notification immediately | Yes | Admin |
| POST | `/create-and-send` | Create and send notification | Yes | Admin |
| POST | `/devices` | Register notification device | Yes | All |
| GET | `/devices/me` | List user's devices | Yes | All |
| DELETE | `/devices/:id` | Unregister device | Yes | Owner |
| PUT | `/devices/:id/seen` | Update device last seen | Yes | Owner |
| PUT | `/devices/:id/disable` | Disable device | Yes | Owner |
| PUT | `/devices/:id/fail` | Increment device fail count | Yes | Owner |
| GET | `/prefs/me` | Get user notification preferences | Yes | All |
| PUT | `/prefs/me` | Update notification preferences | Yes | All |

## Services

Services contain the business logic and data operations:

### Auth Service (`auth.service.js`)
- User registration with password hashing
- User login and JWT token generation
- Password verification

### User Service (`user.service.js`)
- User CRUD operations
- Role management
- Organization management
- Organization membership

### Event Service (`event.service.js`)
- Event CRUD operations
- Event search and filtering
- Speaker management
- Session management
- Analytics aggregation

### Ticket Types Service (`ticketTypes.service.js`)
- Ticket type CRUD operations
- Availability calculations
- Inventory management

### Order Service (`order.service.js`)
- Order creation and management
- Order item management
- Total calculations
- Order status transitions

### Payment Service (`payment.service.js`)
- Payment record management
- Payment status tracking

### Stripe Service (`stripe.service.js`)
- Stripe checkout session creation
- Webhook event processing
- Payment verification
- Automatic ticket issuance on payment success

### Ticket Service (`ticket.service.js`)
- Ticket issuance
- QR code generation
- Ticket status management

### Attendee Service (`attendee.service.js`)
- Attendee record creation and lookup
- User-attendee association

### Check-in Service (`checkin.service.js`)
- QR code token verification
- Check-in recording with row-level locking
- Check-in statistics

### Notification Service (`notification.service.js`)
- Notification creation and queuing
- MagicBell integration
- Notification status tracking

### MagicBell Service (`magicbell.service.js`)
- MagicBell API integration
- Notification delivery

## Middleware

### Authentication Middleware (`auth.js`)
- JWT token verification
- User authentication check
- Role-based authorization

### Error Middleware (`error.js`)
- Global error handler
- Error response formatting
- Error logging

### Not Found Middleware (`notFound.js`)
- 404 handler for unmatched routes

## Routes

Routes define the API endpoint structure and connect HTTP methods to controllers:

- `auth.routes.js`: Authentication endpoints
- `users.routes.js`: User and organization management
- `events.routes.js`: Event management and search
- `ticketTypes.routes.js`: Ticket type management
- `orders.routes.js`: Order management
- `payments.routes.js`: Payment processing and webhooks
- `tickets.routes.js`: Ticket management
- `checkins.routes.js`: Check-in operations
- `notifications.routes.js`: Notification management

Routes apply middleware for authentication and authorization based on endpoint requirements.

## Dependencies

### Core Dependencies

- **express** (^5.1.0): Web framework
- **pg** (^8.16.3): PostgreSQL client
- **jsonwebtoken** (^9.0.2): JWT token handling
- **argon2** (^0.44.0): Password hashing
- **stripe** (^19.0.0): Stripe payment integration
- **axios** (^1.13.1): HTTP client for external APIs
- **cookie-parser** (^1.4.7): Cookie parsing middleware
- **cors** (^2.8.5): Cross-origin resource sharing
- **morgan** (^1.10.1): HTTP request logging
- **dotenv** (^17.2.3): Environment variable management
- **qrcode** (^1.5.4): QR code generation

### Development Dependencies

- **nodemon** (^3.1.10): Development server with auto-reload

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Stripe account (for payments)
- MagicBell account (for notifications)

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
NODE_ENV=development
PORT=7777
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgres://user:password@localhost:5432/rsvpd

JWT_SECRET=your_secret_key_here
JWT_EXPIRES=7d

STRIPE_SECRET=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CHECKOUT_SUCCESS_URL=http://localhost:5173/checkout/success
CHECKOUT_CANCEL_URL=http://localhost:5173/checkout

APP_BASE_URL=http://localhost:5173
QR_HMAC_SECRET=your_qr_secret_here

MAGICBELL_API_KEY=your_magicbell_api_key
MAGICBELL_API_SECRET=your_magicbell_api_secret

COOKIE_NAME=access
```

4. Initialize the database:
```bash
npm run db:init
```

5. Seed the database (optional):
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:7777`.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `7777` |
| `CORS_ORIGIN` | Allowed CORS origin | No | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | Yes* | - |
| `DB_USER` | Database user | Yes* | - |
| `DB_PASSWORD` | Database password | Yes* | - |
| `DB_HOST` | Database host | Yes* | - |
| `DB_PORT` | Database port | Yes* | - |
| `DB_NAME` | Database name | Yes* | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES` | JWT expiration time | No | `7d` |
| `STRIPE_SECRET` | Stripe secret key | No | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | No | - |
| `CHECKOUT_SUCCESS_URL` | Stripe checkout success URL | No | `http://localhost:5173/success` |
| `CHECKOUT_CANCEL_URL` | Stripe checkout cancel URL | No | `http://localhost:5173/cancel` |
| `APP_BASE_URL` | Application base URL | No | `http://localhost:5173` |
| `QR_HMAC_SECRET` | QR code HMAC secret | No | `dev-qr-secret` |
| `MAGICBELL_API_KEY` | MagicBell API key | No | - |
| `MAGICBELL_API_SECRET` | MagicBell API secret | No | - |
| `COOKIE_NAME` | JWT cookie name | No | `access` |

*Either `DATABASE_URL` or all `DB_*` variables must be provided.

## Database Management

### Initialization

Initialize a new database:
```bash
npm run db:init
```

This creates the database (if it doesn't exist) and runs all migration scripts.

### Reset

Reset the database (WARNING: This deletes all data):
```bash
npm run db:reset
```

### Seeding

Seed the database with sample data:
```bash
npm run db:seed
```

### Node.js Scripts

The database scripts can also be run directly with Node.js:
```bash
npm run db:init:node
npm run db:reset:node
```

### Manual SQL Execution

You can also run SQL scripts manually:
```bash
psql $DATABASE_URL -f src/db/db.sql
psql $DATABASE_URL -f src/db/seed.sql
```

## Security Features

- Password hashing with Argon2
- JWT token-based authentication
- Role-based access control (RBAC)
- SQL injection prevention with parameterized queries
- Row-level locking for check-ins
- HMAC-signed QR codes for tickets
- Stripe webhook signature verification
- CORS configuration

## Tests
Testing is setup using docker, this allows users to test the app with realistic data without requiring any setup other than having docker installed.

### To run the API tests:

**You must have Docker installed**
```
npm run test
```

This will kick off the following process:
1) it will create a database image (wont need user to install postgres or set it up)
2) it will seed the database using rich, realistic data
3) it will install dependencies for the server
4) it will run the server tests
5) finally, after reporting details for the test, it will remove the docker container

Example run:
```
 ✓ tests/auth.test.js > Authentication API > POST /api/auth/login > should fail with invalid password 35ms
 ✓ tests/auth.test.js > Authentication API > POST /api/auth/login > should fail with non-existent user 3ms
 ✓ tests/auth.test.js > Authentication API > POST /api/auth/login > should fail with missing email 2ms
 ✓ tests/auth.test.js > Authentication API > POST /api/auth/login > should fail with missing password 2ms
 ✓ tests/auth.test.js > Authentication API > POST /api/auth/register > should register a new user successfully 40ms
 ✓ tests/auth.test.js > Authentication API > POST /api/auth/register > should fail to register with duplicate email 38ms
stdout | tests/auth.test.js
Test database connection closed

 ✓ tests/auth.test.js > Authentication API > GET /api/auth/me > should return user profile when authenticated 39ms
 ✓ tests/auth.test.js > Authentication API > GET /api/auth/me > should return 401 when not authenticated 2ms
 ✓ tests/auth.test.js > Authentication API > POST /api/auth/logout > should logout successfully 34ms

 Test Files  1 passed (1)
      Tests  13 passed (13)
   Start at  19:05:06
   Duration  1.08s (transform 371ms, setup 183ms, collect 370ms, tests 381ms, environment 0ms, prepare 3ms)


==================================
✅ All tests passed!
==================================
```


