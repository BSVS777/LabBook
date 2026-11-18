import { randomBytes } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { DEFAULT_DATABASE_URL, DEFAULT_PORT, JWT_SECRET_MIN_LENGTH } from './constants.js';
import { loadConfig } from './env.js';

const SECRET_BYTES = 32;
const VALID_ENV = {
  CORS_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: randomBytes(SECRET_BYTES).toString('hex'),
};

function load(overrides: Record<string, string> = {}) {
  return loadConfig({ ...VALID_ENV, ...overrides });
}

describe('loadConfig', () => {
  it('applies defaults for optional variables', () => {
    expect(load()).toEqual({
      nodeEnv: 'development',
      port: DEFAULT_PORT,
      corsOrigin: 'http://localhost:5173',
      databaseUrl: DEFAULT_DATABASE_URL,
      jwtSecret: VALID_ENV.JWT_SECRET,
    });
  });

  it('coerces the port to a number', () => {
    expect(load({ PORT: '4000' }).port).toBe(4000);
  });

  it('fails fast when the CORS origin is missing', () => {
    expect(() => loadConfig({ JWT_SECRET: VALID_ENV.JWT_SECRET })).toThrow(/CORS_ORIGIN/);
  });

  it('fails fast when the port is out of range', () => {
    expect(() => load({ PORT: '70000' })).toThrow(/PORT/);
  });

  it.each(['ftp://localhost:5173', 'localhost:5173', 'not a url'])(
    'rejects %s as a CORS origin',
    (corsOrigin) => {
      expect(() => load({ CORS_ORIGIN: corsOrigin })).toThrow(/CORS_ORIGIN/);
    },
  );

  it.each([
    'http://localhost:5173/',
    'https://app.example.com/path',
    'https://app.example.com?x=1',
  ])('rejects %s because it is not a bare origin', (corsOrigin) => {
    expect(() => load({ CORS_ORIGIN: corsOrigin })).toThrow(/CORS_ORIGIN/);
  });

  it('accepts an https origin', () => {
    expect(load({ CORS_ORIGIN: 'https://app.example.com' }).corsOrigin).toBe(
      'https://app.example.com',
    );
  });

  it('accepts a SQLite database URL', () => {
    expect(load({ DATABASE_URL: 'file:./x.db' }).databaseUrl).toBe('file:./x.db');
  });

  it.each(['postgresql://localhost/db', 'file:', './dev.db', ''])(
    'rejects %j as a database URL',
    (databaseUrl) => {
      expect(() => load({ DATABASE_URL: databaseUrl })).toThrow(/DATABASE_URL/);
    },
  );

  it('fails fast when the JWT secret is missing', () => {
    expect(() => loadConfig({ CORS_ORIGIN: VALID_ENV.CORS_ORIGIN })).toThrow(/JWT_SECRET/);
  });

  it('rejects a JWT secret shorter than the minimum length', () => {
    expect(() => load({ JWT_SECRET: 'x'.repeat(JWT_SECRET_MIN_LENGTH - 1) })).toThrow(/JWT_SECRET/);
  });

  it('accepts a JWT secret of exactly the minimum length', () => {
    const secret = 'x'.repeat(JWT_SECRET_MIN_LENGTH);

    expect(load({ JWT_SECRET: secret }).jwtSecret).toBe(secret);
  });
});
