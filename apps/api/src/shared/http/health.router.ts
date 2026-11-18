import type { HealthResponse } from '@labs/shared';
import { Router } from 'express';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', (_request, response) => {
    const body: HealthResponse = { status: 'ok' };
    response.json(body);
  });

  return router;
}
