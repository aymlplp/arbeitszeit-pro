// Vercel Serverless entry point.
// Vercel wraps this exported Express app as a single serverless function.
// Unlike server.ts, this does NOT call app.listen() — Vercel handles the HTTP server itself.
import app from '../src/app';

export default app;
