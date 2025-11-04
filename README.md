# RSVPd

A comprehensive full-stack event management system that enables event organizers to create, manage, and promote events while allowing attendees to discover, register for, and participate in events. The platform handles complex event logistics including ticketing, payments, check-ins, and real-time notifications.

## See the deployed app here:
https://rsvpd.onrender.com/
- Try creating an account as a new user, or
- Log in as a organizer: email: olivia@org1.local password: password123
## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Architecture Overview](#architecture-overview)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## Overview

The RSVP platform is a full-stack application consisting of:

- **Frontend**: React-based SPA with role-specific dashboards
- **Backend**: Node.js/Express REST API with PostgreSQL database
- **Payment Processing**: Stripe integration for ticket purchases
- **Notifications**: MagicBell integration for in-app notifications

The system supports four primary user roles:
- **Admin**: Platform administration and user management
- **Organizer**: Event creation, management, and analytics
- **Vendor**: Check-in operations and event participation
- **Attendee**: Event discovery, ticket purchase, and attendance

## Features

### Core Features

- **Multi-Role User System**: Role-based access control with different dashboards for each user type
- **Event Management**: Create, publish, and manage events with detailed information
- **Ticket Sales**: Multiple ticket types with pricing, availability limits, and sales windows
- **Payment Processing**: Secure payment processing via Stripe checkout
- **QR Code Tickets**: Automatic QR code generation for tickets
- **Check-In System**: QR code scanning for event entry with real-time tracking
- **Real-Time Notifications**: In-app notifications via MagicBell
- **Analytics**: Comprehensive analytics for event organizers
- **Organization Management**: Multi-organization support with membership management
- **Speaker Management**: Speaker profiles and session associations
- **Session Management**: Event agenda with multiple sessions

### Advanced Features

- **Waitlist Management**: Automatic waitlist when events are sold out
- **Promo Codes**: Discount code support
- **Inventory Reservations**: Temporary holds during checkout
- **Search**: Full-text search for public events
- **Audit Trail**: Activity logging for compliance
- **Idempotency**: Safe retry handling for payments and orders

## Technology Stack

### Frontend

- **React 19**: UI library
- **React Router 7**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Axios**: HTTP client
- **Shadcn UI**: Component library (Radix UI + Tailwind CSS)
- **Stripe.js**: Payment processing
- **MagicBell React**: In-app notifications
- **QR Scanner**: QR code scanning library
- **Vite**: Build tool and dev server

### Backend

- **Node.js**: Runtime environment
- **Express 5**: Web framework
- **PostgreSQL**: Database
- **JWT**: Authentication tokens
- **Argon2**: Password hashing
- **Stripe**: Payment processing API
- **MagicBell**: Notification API
- **qrcode**: QR code generation

## Project Structure

```
RSVP/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── app/           # App-level components
│   │   ├── components/    # Reusable UI components
│   │   ├── config/        # Configuration
│   │   ├── constants/     # Application constants
│   │   ├── features/      # Feature modules
│   │   ├── lib/           # Core utilities
│   │   ├── routes/        # Routing configuration
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   ├── package.json
│   └── vite.config.js
├── server/                # Backend API
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── constants/     # Application constants
│   │   ├── controllers/   # Request handlers
│   │   ├── db/            # Database layer
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # Route definitions
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── scripts/           # Database scripts
│   ├── package.json
│   └── server.js
└── README.md              # This file
```

For detailed documentation on each part:
- [Frontend README](client/README.md)
- [Backend README](server/README.md)

## Prerequisites

Before setting up the project locally, ensure you have the following installed:

- **Node.js** 18 or higher
- **npm** 9 or higher (comes with Node.js)
- **PostgreSQL** 14 or higher
- **Git**

Optional but recommended:
- **Stripe Account**: For payment processing
- **MagicBell Account**: For in-app notifications

## Local Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RSVP
```

### 2. Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Set Up PostgreSQL Database

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rsvpd;

# Exit PostgreSQL
\q
```

Or use the connection string format:
```bash
createdb rsvpd
```

### 4. Configure Environment Variables

#### Backend Environment Variables

Create a `.env` file in the `server/` directory:

```env
NODE_ENV=development
PORT=7777
CORS_ORIGIN=http://localhost:5173

# Database - Use either DATABASE_URL or individual DB_* variables
DATABASE_URL=postgres://postgres:password@localhost:5432/rsvpd
# OR
# DB_USER=postgres
# DB_PASSWORD=password
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=rsvpd

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES=7d

# Stripe Configuration (optional for development)
STRIPE_SECRET=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CHECKOUT_SUCCESS_URL=http://localhost:5173/checkout/success
CHECKOUT_CANCEL_URL=http://localhost:5173/checkout

# Application URLs
APP_BASE_URL=http://localhost:5173
QR_HMAC_SECRET=your_qr_hmac_secret_change_in_production

# MagicBell Configuration (optional for development)
MAGICBELL_API_KEY=your_magicbell_api_key
MAGICBELL_API_SECRET=your_magicbell_api_secret

# Cookie Configuration
COOKIE_NAME=access
```

#### Frontend Environment Variables

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:7777
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
VITE_MAGICBELL_API_KEY=your_magicbell_api_key
```

### 5. Initialize Database

Initialize the database schema:

```bash
cd server
npm run db:init
```

This will:
- Create the database if it doesn't exist
- Run all schema migrations
- Set up tables, enums, indexes, and triggers

### 6. Seed Database (Optional)

Populate the database with sample data:

```bash
npm run db:seed
```

This creates:
- Sample users (admin, organizer, attendee, vendor)
- Sample organizations
- Sample events
- Sample ticket types
- Sample tickets and orders

## Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd server
npm run dev
```

The backend API will be available at `http://localhost:7777`.

#### Start the Frontend Development Server

In a new terminal:

```bash
cd client
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

### Production Mode

#### Build the Frontend

```bash
cd client
npm run build
```

This creates an optimized production build in the `dist/` directory.

#### Start the Backend Server

```bash
cd server
npm start
```

Note: In production, you should use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name rsvp-api
```

## Environment Configuration

### Required Environment Variables

#### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/rsvpd` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secret_key` |

#### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:7777` |

### Optional Environment Variables

These are optional but enable additional features:

- **Stripe**: Enable payment processing (`STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`)
- **MagicBell**: Enable in-app notifications (`MAGICBELL_API_KEY`, `MAGICBELL_API_SECRET`)

## Database Setup

### Database Schema

The database schema includes:

- **Core Tables**: users, organizations, roles, venues
- **Event Tables**: events, speakers, sessions
- **Ticketing Tables**: ticket_types, orders, tickets, attendees
- **Payment Tables**: payments, promo_codes
- **Check-in Tables**: check_ins
- **Notification Tables**: notifications, devices
- **Utility Tables**: idempotency_keys, activity_log, etc.

See [Backend README](server/README.md) for complete schema documentation.

### Database Management Commands

```bash
cd server

# Initialize database (create schema)
npm run db:init

# Reset database (WARNING: deletes all data)
npm run db:reset

# Seed database with sample data
npm run db:seed
```

### Database Access

Connect to the database:

```bash
psql $DATABASE_URL
```

Or using connection string:

```bash
psql postgres://postgres:password@localhost:5432/rsvpd
```

## Development Workflow

### Typical Development Flow

1. **Make Changes**: Edit files in either `client/` or `server/`
2. **Auto-Reload**: Both dev servers support hot module replacement
3. **Test Changes**: Verify changes in the browser/API client
4. **Commit**: Use Git to commit changes

### Code Organization

- **Frontend**: Feature-based organization in `client/src/features/`
- **Backend**: Layered architecture (routes → controllers → services → database)

### API Development

1. Add route in `server/src/routes/`
2. Add controller in `server/src/controllers/`
3. Add service in `server/src/services/`
4. Add query in `server/src/db/queries.js` if needed
5. Update frontend API module in `client/src/features/*/`

### Frontend Development

1. Create component in appropriate feature directory
2. Add route in `client/src/App.jsx` if needed
3. Update API client if new endpoints are needed
4. Style with Tailwind CSS classes

## Architecture Overview

### Request Flow

```
Frontend (React)
    ↓ HTTP Request
API Client (Axios)
    ↓ Axios Interceptor
Backend Route (Express)
    ↓ Authentication Middleware
Controller
    ↓ Business Logic
Service
    ↓ Database Query
PostgreSQL Database
```

### Authentication Flow

1. User logs in via `/api/auth/login`
2. Backend validates credentials and returns JWT token
3. Frontend stores token in cookie/localStorage
4. Subsequent requests include token in Authorization header
5. Backend middleware validates token on each request

### Payment Flow

1. User creates order and adds ticket items
2. Frontend requests Stripe checkout session
3. Backend creates Stripe checkout session
4. User redirects to Stripe checkout page
5. User completes payment
6. Stripe sends webhook to `/api/payments/webhook`
7. Backend verifies webhook signature
8. Backend processes payment and issues tickets
9. Backend sends notification via MagicBell
10. User redirects to success page

### Check-In Flow

1. Vendor scans QR code on ticket
2. Frontend sends token to `/api/checkins/scan`
3. Backend verifies token signature
4. Backend locks ticket row (prevents duplicate check-ins)
5. Backend creates check-in record
6. Backend updates ticket status to CHECKED_IN

## API Documentation

### Base URL

- Development: `http://localhost:7777`
- Production: Your production API URL

### Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

Or send as a cookie (name configured in `COOKIE_NAME`).

### API Endpoints

The API is organized into resource groups:

- `/api/auth` - Authentication
- `/api/users` - User and organization management
- `/api/events` - Event management
- `/api/ticket-types` - Ticket type management
- `/api/orders` - Order management
- `/api/payments` - Payment processing
- `/api/tickets` - Ticket management
- `/api/checkins` - Check-in operations
- `/api/notifications` - Notification management

See [Backend README](server/README.md) for complete API documentation.

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Error**: `Connection refused` or `database does not exist`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL format: `postgres://user:password@host:port/database`
3. Verify database exists: `psql -l`
4. Check user permissions

#### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
1. Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
2. Ensure backend is running
3. Check browser console for specific CORS error

#### JWT Token Errors

**Error**: `invalid signature` or `token expired`

**Solution**:
1. Clear browser cookies/localStorage
2. Log in again to get new token
3. Verify `JWT_SECRET` is consistent (don't change during development)

#### Stripe Errors

**Error**: Stripe checkout not working

**Solution**:
1. Verify Stripe keys are set correctly
2. Use test keys for development
3. Check Stripe dashboard for webhook logs
4. Verify webhook endpoint is accessible (use ngrok for local testing)

#### MagicBell Errors

**Error**: Notifications not appearing

**Solution**:
1. Verify MagicBell API keys are set
2. Check user's `magicbell_external_id` is set in database
3. Verify MagicBell dashboard for delivery status

### Getting Help

1. **Check Logs**: Both frontend (browser console) and backend (terminal)
2. **Verify Environment Variables**: Ensure all required vars are set
3. **Database State**: Check if database is initialized and seeded
4. **Network Tab**: Inspect API requests in browser DevTools
5. **Backend Logs**: Check server terminal for error messages

### Development Tips

- Use React Query Devtools (bottom of screen in dev mode)
- Enable PostgreSQL logging: Set `log_statement = 'all'` in postgresql.conf
- Use `console.log` for debugging (remove before production)
- Test API endpoints with Postman or curl
- Use browser DevTools Network tab to inspect requests

## Additional Resources

- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [MagicBell Documentation](https://docs.magicbell.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)


