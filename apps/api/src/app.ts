import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { JSON_BODY_LIMIT } from './config/constants.js';
import type { AppConfig } from './config/env.js';
import { createHealthRouter } from './shared/http/health.router.js';

export function createApp(config: Pick<AppConfig, 'corsOrigin'>): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use('/api', createHealthRouter());

  return app;
}
