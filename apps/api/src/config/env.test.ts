import { describe, expect, it } from 'vitest';

import { DEFAULT_DATABASE_URL, DEFAULT_PORT } from './constants.js';
import { loadConfig } from './env.js';

describe('loadConfig', () => {
  it('applies defaults for optional variables', () => {
    const config = loadConfig({ CORS_ORIGIN: 'http://localhost:5173' });

    expect(config).toEqual({
      nodeEnv: 'development',
      port: DEFAULT_PORT,
      corsOrigin: 'http://localhost:5173',
      databaseUrl: DEFAULT_DATABASE_URL,
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

  it.each(['ftp://localhost:5173', 'localhost:5173', 'not a url'])(
    'rejects %s as a CORS origin',
    (corsOrigin) => {
      expect(() => loadConfig({ CORS_ORIGIN: corsOrigin })).toThrow(/CORS_ORIGIN/);
    },
  );

  it.each([
    'http://localhost:5173/',
    'https://app.example.com/path',
    'https://app.example.com?x=1',
  ])('rejects %s because it is not a bare origin', (corsOrigin) => {
    expect(() => loadConfig({ CORS_ORIGIN: corsOrigin })).toThrow(/CORS_ORIGIN/);
  });

  it('accepts an https origin', () => {
    expect(loadConfig({ CORS_ORIGIN: 'https://app.example.com' }).corsOrigin).toBe(
      'https://app.example.com',
    );
  });

  it('accepts a SQLite database URL', () => {
    const config = loadConfig({
      CORS_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'file:./x.db',
    });

    expect(config.databaseUrl).toBe('file:./x.db');
  });

  it.each(['postgresql://localhost/db', 'file:', './dev.db', ''])(
    'rejects %j as a database URL',
    (databaseUrl) => {
      expect(() =>
        loadConfig({ CORS_ORIGIN: 'http://localhost:5173', DATABASE_URL: databaseUrl }),
      ).toThrow(/DATABASE_URL/);
    },
  );
});
