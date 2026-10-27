import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline assets and vite dev
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Normalize origin by trimming whitespace and removing trailing slashes
export const normalizeOrigin = (origin: string): string => {
  return origin.trim().replace(/\/+$/, '');
};

// Default allowed origins: production Vercel frontend and local development
const DEFAULT_ALLOWED_ORIGINS = [
  'https://mise-meal-planner-pi.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Dynamically construct allowed origins from defaults, CLIENT_URL, and FRONTEND_URL
export const getAllowedOrigins = (): Set<string> => {
  const origins = new Set<string>(DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin));

  const envOrigins = [
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
  ];

  for (const raw of envOrigins) {
    const cleaned = normalizeOrigin(raw);
    if (cleaned) {
      origins.add(cleaned);
    }
  }

  return origins;
};

// Strict CORS origin validator:
// Permits explicitly allowed production origins (defaults, CLIENT_URL, FRONTEND_URL)
// and strictly validated localhost / 127.0.0.1 origins in non-production.
// Arbitrary *.vercel.app origins and attacker domains are strictly disallowed.
export const isOriginAllowed = (origin: string): boolean => {
  const normalized = normalizeOrigin(origin);
  const allowed = getAllowedOrigins();

  if (allowed.has(normalized)) {
    return true;
  }
  // Allow local development on localhost or 127.0.0.1 on any port in non-production
  if (process.env.NODE_ENV !== 'production') {
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized);
  }
  return false;
};

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin header (native mobile clients, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Health Check
app.get('/api/health', (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'ok' : 'degraded';
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status,
    service: 'mise-backend-api',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter); // Alias for convenience

// Global Error Handler
app.use(errorHandler);

// Connect to MongoDB and start server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Auto-seed default recipes if catalogue is empty
    try {
      const { Recipe } = await import('./models/Recipe.js');
      const count = await Recipe.countDocuments();
      if (count === 0) {
        console.log('[Mise API] Empty recipe catalogue detected. Auto-seeding default recipes...');
        const { SEED_RECIPES } = await import('./seeds/recipeData.js');
        for (const recipe of SEED_RECIPES) {
          await Recipe.findOneAndUpdate(
            { slug: recipe.slug },
            { $set: recipe },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
        const seededCount = await Recipe.countDocuments();
        console.log(`[Mise API] Successfully seeded ${seededCount} default recipes.`);
      }
    } catch (seedErr) {
      console.warn('[Mise API] Warning: Recipe auto-seed failed:', seedErr);
    }

    const server = app.listen(PORT, () => {
      console.log(`[Mise API] Server running on http://localhost:${PORT}`);
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`[Mise API] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('[Mise API] MongoDB connection and server closed.');
        } catch (e) {
          console.error('[Mise API] Error during shutdown:', e);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  });
}

export default app;
