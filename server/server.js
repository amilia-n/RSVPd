import "dotenv/config";
import path from 'node:path';
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { config } from "./src/config/env.js";
import notFound from "./src/middleware/notFound.js";
import errorHandler from "./src/middleware/error.js";

import authRoutes from './src/routes/auth.routes.js';
import usersRoutes from './src/routes/users.routes.js';
import eventsRoutes from './src/routes/events.routes.js';
import ticketTypesRoutes from './src/routes/ticketTypes.routes.js';
import ordersRoutes from './src/routes/orders.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';
import ticketsRoutes from './src/routes/tickets.routes.js';
import checkinsRoutes from './src/routes/checkins.routes.js';
import notificationsRoutes from './src/routes/notifications.routes.js';

import * as paymentsController from "./src/controllers/payments.controller.js";


const app = express();
app.enable('trust proxy');

// Client build directory for SPA
const dist = path.join(process.cwd(), '..', 'client', 'dist');
console.log('Looking for client build at:', dist);

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => paymentsController.webhook(req, res, next)
);

// const dist = path.join(process.cwd(), '..', 'client', 'dist');
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Health check endpoint for Render
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/ticket-types', ticketTypesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Serve static files from client build
app.use(express.static(dist));

// SPA catch-all route - serve index.html for all non-API GET requests (production only)
if (config.NODE_ENV === 'production') {
  console.log('SPA mode enabled - serving index.html for non-API routes');
  console.log('Client dist path:', dist);

  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    // Only serve index.html for GET requests
    if (req.method === 'GET') {
      return res.sendFile(path.join(dist, 'index.html'));
    }
    next();
  });
}

app.use(notFound);
app.use(errorHandler);

const port = Number(config.PORT) || 7777;
app.listen(port, () => {
  console.log('='.repeat(60));
  console.log(`Server started successfully`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Port: ${port}`);
  console.log(`Listening on: http://localhost:${port}`);
  console.log(`CORS Origin: ${config.CORS_ORIGIN}`);
  console.log('='.repeat(60));
});