import "dotenv/config";  
// import path from 'node:path';
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./src/config/env.js";

import notFound from "./src/middleware/notFound.js";
import errorHandler from "./src/middleware/error.js";

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import eventsRoutes from './routes/events.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import qrRoutes from './routes/qr.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import checkinsRoutes from './routes/checkins.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';

import cookieParser from "cookie-parser";

const app = express();
app.use('/webhooks/stripe', webhooksRoutes);
// const dist = path.join(process.cwd(), '..', 'client', 'dist');
app.enable('trust proxy');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/checkins', checkinsRoutes);

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