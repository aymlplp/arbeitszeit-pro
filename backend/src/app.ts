import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import dataRoutes from './routes/data.routes';
import stripeRoutes from './routes/stripe.routes';
import employerRoutes from './routes/employer.routes';

import { handleWebhook } from './controllers/stripe.controller';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5001',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ];
    if (
      !origin || 
      allowed.includes(origin) || 
      origin.startsWith('http://localhost:') || 
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Stripe Webhook (Requires raw body parser BEFORE general express.json middleware)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', apiLimiter);

// General Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/employer', employerRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend-dist');
app.use(express.static(frontendPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
