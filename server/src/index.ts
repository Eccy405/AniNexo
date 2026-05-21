// Force Restart: 2026-05-15 13:09 (Port Clear)
import dotenv from 'dotenv';
dotenv.config();

import express, { json, urlencoded } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import animeRoutes from './modules/anime/anime.routes';
import profileRoutes from './modules/profile/profile.routes';
import listRoutes from './modules/list/list.routes';
import feedRoutes from './modules/feed/feed.routes';
import nexoRoutes from './modules/nexo/nexo.routes';
import searchRoutes from './modules/search/search.routes';
import socialRoutes from './modules/social/social.routes';
import messagingRoutes from './modules/messaging/messaging.routes';
import moderationRoutes from './modules/moderation/moderation.routes';
import adminRoutes from './modules/admin/admin.routes';
import premiumRoutes from './modules/premium/premium.routes';
import notificationRoutes from './modules/notification/notification.routes';
import analyticsRoutes from './modules/admin/analytics.routes';
import { errorHandler } from './middleware/error.middleware';
import { maintenanceMiddleware } from './middleware/maintenance.middleware';
import { setupSockets } from './sockets';
import { startJobs } from './jobs';
import { logger } from './lib/logger';
import { socketService } from './lib/socketService';

import { sanitizerMiddleware } from './middleware/sanitizer';
import { securityHeaders } from './middleware/securityHeaders';
import { globalLimiter } from './middleware/rateLimiter';
import session from 'express-session';
import passport from 'passport';
import './config/passport.config';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Inicializar WebSockets
socketService.init(io);
setupSockets(io);

// Middlewares de Seguridad Global
app.use(securityHeaders);
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  credentials: true
}));
app.use(json({ limit: '10mb' })); 
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizerMiddleware);
app.use(morgan('dev'));
app.use(cookieParser());

// Configuración de Sesión para OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard_cat_aninexo',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(globalLimiter);
app.use(maintenanceMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AniNexo Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/list', listRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/nexo', nexoRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

import { startWorkers } from './workers';
startWorkers();
startJobs();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`[server]: Server is running at http://localhost:${PORT}`);
});
