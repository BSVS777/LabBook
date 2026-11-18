import { healthResponseSchema } from '@labs/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import { HTTP_STATUS } from './config/constants.js';

const ALLOWED_ORIGIN = 'http://localhost:5173';
const app = createApp({ corsOrigin: ALLOWED_ORIGIN });

describe('GET /api/health', () => {
  it('returns the shared health response shape', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(healthResponseSchema.parse(response.body)).toEqual({ status: 'ok' });
  });

  it('only ever grants cross-origin access to the configured origin', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', ALLOWED_ORIGIN);
    const foreignOrigin = 'http://evil.example';
    const denied = await request(app).get('/api/health').set('Origin', foreignOrigin);

    expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(denied.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(denied.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('sets security headers and hides the framework signature', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
