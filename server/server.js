import "dotenv/config";  
// import path from 'node:path';
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



const app = express();

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentsRoutes
);

// const dist = path.join(process.cwd(), '..', 'client', 'dist');
app.enable('trust proxy');
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/health', (_req, res) => res.json({ ok: true }));


app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/ticket-types', ticketTypesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/notification', notificationsRoutes);

// app.use(express.static(dist));

// app.get('/:path(*)', (req, res, next) => {
//   if (req.path.startsWith('/api/')) {
//     return next();
//   }
//   res.sendFile(path.join(dist, 'index.html'));
// });

app.use(notFound);
app.use(errorHandler);

const port = Number(config.PORT) || 7777;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});