# RSVPd Frontend

A comprehensive React-based frontend application for the RSVP Event Management Platform. Built with React 19, React Router, TanStack Query, and Shadcn UI components.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Dependencies](#dependencies)
- [Setup](#setup)
- [Routing](#routing)
- [CRUD Operations](#crud-operations)
- [API Integration](#api-integration)
- [Components](#components)
- [State Management](#state-management)
- [Environment Variables](#environment-variables)
- [Development](#development)

## Overview

The frontend provides a complete user interface for event management, supporting multiple user roles (Admin, Organizer, Vendor, Attendee). It handles event discovery, ticket purchasing, QR code scanning, check-ins, notifications, and comprehensive analytics.

### Key Features

- Multi-role user dashboards
- Public event browsing and search
- Secure authentication and registration
- Ticket purchasing with Stripe integration
- QR code ticket display and scanning
- Real-time check-in management
- MagicBell in-app notifications
- Event analytics and reporting
- Responsive design with Tailwind CSS

## Architecture

The application follows a feature-based architecture with clear separation of concerns:

- **Features**: Domain-specific functionality organized by feature
- **Components**: Reusable UI components (layout and UI primitives)
- **Lib**: Core utilities (API client, query client, validation)
- **Routes**: Routing configuration and protected route components
- **Constants**: Application-wide constants (API routes, roles, statuses)
- **Config**: Environment configuration

## Directory Structure

```
src/
├── app/                    # Application-level components
│   └── AppErrorBoundary.jsx
├── components/             # Reusable UI components
│   ├── layout/             # Layout components (Navbar, Shell)
│   └── ui/                 # Shadcn UI primitives
│       ├── alert.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── select.jsx
│       ├── separator.jsx
│       ├── spinner.jsx
│       ├── table.jsx
│       └── textarea.jsx
├── config/                 # Configuration
│   └── env.js             # Environment variables
├── constants/              # Application constants
│   ├── apiRoutes.js       # API endpoint definitions
│   ├── eventStatus.js     # Event status constants
│   ├── orderStatus.js     # Order status constants
│   ├── roles.js           # User role constants
│   ├── ticketKinds.js     # Ticket type constants
│   └── visibility.js      # Visibility constants
├── features/               # Feature modules
│   ├── analytics/         # Analytics pages and API
│   ├── auth/              # Authentication (login, register)
│   ├── checkins/          # Check-in scanning and live view
│   ├── dashboards/        # Role-specific dashboards
│   │   ├── admin/
│   │   ├── attendee/
│   │   ├── organizer/
│   │   └── vendor/
│   ├── events/            # Event browsing and detail pages
│   ├── notifications/     # Notification API integration
│   ├── orders/            # Order management and checkout
│   ├── payments/           # Payment API integration
│   ├── tickets/           # Ticket management and display
│   ├── ticketTypes/       # Ticket type API integration
│   └── users/             # User management
├── lib/                    # Core utilities
│   ├── apiClient.js       # Axios instance with interceptors
│   ├── errorHandler.js    # Error handling utilities
│   ├── queryClient.js     # React Query client configuration
│   ├── storage.js          # Local storage utilities
│   ├── utils.js           # General utilities (formatCurrency, etc.)
│   └── validation.js       # Form validation utilities
├── routes/                 # Routing configuration
│   ├── paths.js           # Route path constants
│   ├── ProtectedRoute.jsx # Route protection component
│   └── RoleRedirect.jsx   # Role-based redirection
├── utils/                  # Additional utilities
│   ├── guards.js          # Route guard utilities
│   └── queryKeys.js       # React Query cache keys
├── App.jsx                 # Main app component with routing
├── main.jsx               # Application entry point
└── index.css              # Global styles
```

## Dependencies

### Core Dependencies

- **react** (^19.1.1): React library
- **react-dom** (^19.1.1): React DOM renderer
- **react-router-dom** (^7.9.4): Client-side routing
- **@tanstack/react-query** (^5.90.5): Data fetching and caching
- **axios** (^1.12.2): HTTP client
- **@stripe/stripe-js** (^8.2.0): Stripe payment integration
- **@magicbell/magicbell-react** (^11.5.0): In-app notifications

### UI Dependencies

- **@radix-ui/react-dialog** (^1.1.15): Dialog component
- **@radix-ui/react-label** (^2.1.7): Label component
- **@radix-ui/react-select** (^2.2.6): Select component
- **@radix-ui/react-separator** (^1.1.7): Separator component
- **@radix-ui/react-slot** (^1.2.3): Slot component
- **lucide-react** (^0.546.0): Icon library
- **class-variance-authority** (^0.7.1): Component variants
- **clsx** (^2.1.1): Conditional class names
- **tailwind-merge** (^3.3.1): Tailwind class merging

### Utility Dependencies

- **qr-scanner** (^1.4.2): QR code scanning
- **@tanstack/react-table** (^8.21.3): Table component
- **tailwindcss** (^4.1.14): CSS framework
- **@tailwindcss/vite** (^4.1.14): Vite Tailwind plugin

### Development Dependencies

- **vite** (^7.1.7): Build tool
- **@vitejs/plugin-react** (^5.0.4): Vite React plugin
- **eslint** (^9.36.0): Linter
- **eslint-plugin-react-hooks** (^5.2.0): React Hooks linting
- **eslint-plugin-react-refresh** (^0.4.22): React refresh linting
- **@tanstack/react-query-devtools** (^5.90.2): React Query devtools

## Setup

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see server/README.md)

### Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:7777
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_MAGICBELL_API_KEY=your_magicbell_key_here
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Routing

The application uses React Router v7 with protected routes based on user roles.

### Public Routes

- `/` - Events listing page (home)
- `/login` - User login
- `/register` - User registration
- `/events/:id` - Event detail page (public view)

### Protected Routes

Routes are protected using the `ProtectedRoute` component, which verifies authentication and role permissions.

#### Admin Routes
- `/admin` - Admin dashboard

#### Organizer Routes
- `/organizer` - Organizer dashboard
- `/events/:id/analytics` - Event analytics
- `/checkins/live/:eventId` - Live check-ins view

#### Vendor Routes
- `/vendor` - Vendor dashboard
- `/checkins/scan` - QR code scanning page

#### Attendee Routes
- `/attendee` - Attendee dashboard
- `/checkout` - Checkout page
- `/checkout/success` - Checkout success page
- `/tickets` - User's tickets list
- `/tickets/:id` - Ticket detail page

### Route Configuration

Routes are defined in `src/routes/paths.js` and configured in `src/App.jsx`. The `RoleRedirect` component automatically redirects users to their role-specific dashboard.

## CRUD Operations

The application provides comprehensive CRUD functionality across all major entities.

### Events

- **Create**: Organizers can create events through the organizer dashboard
- **Read**: Public event listing and detail pages
- **Update**: Organizers can edit events from the dashboard
- **Delete**: Organizers can cancel events (soft delete)

### Tickets

- **Create**: Automatic ticket creation after successful payment
- **Read**: Users can view their tickets and ticket details
- **Update**: Limited updates (check-in status)
- **Delete**: Tickets can be cancelled/refunded

### Orders

- **Create**: Attendees create orders through the checkout flow
- **Read**: Users can view their order history
- **Update**: Order status updates (via payment webhooks)
- **Delete**: Orders can be cancelled

### Users

- **Create**: User registration
- **Read**: Profile viewing and user management (admin)
- **Update**: Profile updates
- **Delete**: User deactivation (admin)

### Organizations

- **Create**: Organizers can create organizations
- **Read**: Organization details and membership
- **Update**: Organization settings
- **Delete**: Organization deletion (admin)

### Ticket Types

- **Create**: Organizers create ticket types for events
- **Read**: Public ticket type listing on event pages
- **Update**: Ticket type modifications
- **Delete**: Ticket type deactivation

## API Integration

All API calls are managed through the centralized API client (`lib/apiClient.js`) using Axios with interceptors for authentication and error handling.

### API Client Configuration

The API client is configured with:
- Base URL from environment variables
- Automatic JWT token inclusion in requests
- 401 error handling with automatic redirect (except for public paths)
- Response transformation

### API Modules

Each feature has its own API module that exports functions for API calls:

- `features/auth/auth.api.js` - Authentication endpoints
- `features/users/users.api.js` - User management endpoints
- `features/events/events.api.js` - Event endpoints
- `features/ticketTypes/ticketTypes.api.js` - Ticket type endpoints
- `features/orders/orders.api.js` - Order endpoints
- `features/payments/payments.api.js` - Payment endpoints
- `features/tickets/tickets.api.js` - Ticket endpoints
- `features/checkins/checkins.api.js` - Check-in endpoints
- `features/notifications/notifications.api.js` - Notification endpoints
- `features/analytics/analytics.api.js` - Analytics endpoints

### API Routes

All API routes are defined in `constants/apiRoutes.js` for maintainability and consistency.

### React Query Integration

Data fetching uses TanStack Query (React Query) for:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

Query keys are centrally managed in `utils/queryKeys.js`.

## Components

### Layout Components

- **Shell**: Main layout wrapper with navbar and container
- **Navbar**: Navigation bar with role-based menu items

### UI Components

All UI components use Shadcn UI primitives built on Radix UI:

- **Alert**: Error and info messages
- **Badge**: Status indicators
- **Button**: Primary UI buttons
- **Card**: Container for content sections
- **Dialog**: Modal dialogs
- **Input**: Form inputs
- **Label**: Form labels
- **Select**: Dropdown selects
- **Separator**: Visual dividers
- **Spinner**: Loading indicators
- **Table**: Data tables
- **Textarea**: Multi-line text inputs

### Feature Components

Each feature module contains its own page components and any feature-specific UI components.

## State Management

State management is handled through:

1. **React Query**: Server state (API data, caching)
2. **React State**: Local component state (forms, UI toggles)
3. **Local Storage**: Authentication tokens and user preferences
4. **Context**: None currently (consider adding for global UI state if needed)

## Environment Variables

The following environment variables must be set:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:7777` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - |
| `VITE_MAGICBELL_API_KEY` | MagicBell API key | - |

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint


## Architecture Decisions

### Feature-Based Structure

The codebase is organized by features rather than by file type. This makes it easier to locate related code and understand feature boundaries.

### Centralized API Client

All API calls go through a single Axios instance with interceptors. This ensures consistent error handling and authentication.

### React Query for Server State

React Query handles all server state, providing caching, refetching, and optimistic updates out of the box.

### Protected Routes

Route protection is handled at the route level using the `ProtectedRoute` component, which checks authentication and role permissions.

### Constants Management

All API routes, status values, and role constants are centralized in the `constants/` directory for easy maintenance.

## Troubleshooting

### Common Issues

1. **401 Errors**: Check that the backend is running and JWT_SECRET is configured
2. **CORS Errors**: Verify CORS_ORIGIN is set correctly on the backend
3. **API Connection**: Ensure VITE_API_URL matches the backend server URL
4. **Stripe Integration**: Verify VITE_STRIPE_PUBLISHABLE_KEY is set correctly

### Getting Help

- Check the browser console for errors
- Use React Query Devtools to inspect query states
- Verify environment variables are set correctly
- Check network requests in browser DevTools
