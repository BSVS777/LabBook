import { describe, expect, it } from 'vitest';

import { DEFAULT_PORT } from './constants.js';
import { loadConfig } from './env.js';

describe('loadConfig', () => {
  it('applies defaults for optional variables', () => {
    const config = loadConfig({ CORS_ORIGIN: 'http://localhost:5173' });

    expect(config).toEqual({
      nodeEnv: 'development',
      port: DEFAULT_PORT,
      corsOrigin: 'http://localhost:5173',
    });
  });

  it('coerces the port to a number', () => {
    const config = loadConfig({ CORS_ORIGIN: 'http://localhost:5173', PORT: '4000' });

    expect(config.port).toBe(4000);
  });

  it('fails fast when the CORS origin is missing', () => {
    expect(() => loadConfig({})).toThrow(/CORS_ORIGIN/);
  });

  it('fails fast when the port is out of range', () => {
    expect(() => loadConfig({ CORS_ORIGIN: 'http://localhost:5173', PORT: '70000' })).toThrow(
      /PORT/,
    );
  });
});
