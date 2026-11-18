export const DEFAULT_PORT = 3000;
export const MAX_PORT = 65_535;
export const JSON_BODY_LIMIT = '100kb';

export const HTTP_STATUS = {
  OK: 200,
} as const;

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

/** SQLite file used when `DATABASE_URL` is not provided (relative to `apps/api`). */
export const SQLITE_URL_PREFIX = 'file:';
export const DEFAULT_DATABASE_URL = 'file:./dev.db';
