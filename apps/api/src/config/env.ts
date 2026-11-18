import { z } from 'zod';

import { DEFAULT_BUSINESS_TIME_ZONE } from '../modules/reservations/domain/reservation-rules.js';
import {
  DEFAULT_DATABASE_URL,
  DEFAULT_PORT,
  JWT_SECRET_MIN_LENGTH,
  MAX_PORT,
  NODE_ENVIRONMENTS,
  SQLITE_URL_PREFIX,
} from './constants.js';

const corsOriginSchema = z
  .url({ protocol: /^https?$/ })
  .refine((value) => URL.canParse(value) && new URL(value).origin === value, {
    message: 'Must be an origin without path, query or trailing slash',
  });

const databaseUrlSchema = z
  .string()
  .startsWith(SQLITE_URL_PREFIX, {
    message: `Must be a SQLite URL starting with "${SQLITE_URL_PREFIX}"`,
  })
  .refine((value) => value.length > SQLITE_URL_PREFIX.length, {
    message: 'Must include the database file path',
  });

/** Accepts only time zones the runtime knows, e.g. `America/Bogota`. */
const timeZoneSchema = z.string().refine(isKnownTimeZone, {
  message: 'Must be a valid IANA time zone such as America/Bogota',
});

function isKnownTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
  PORT: z.coerce.number().int().positive().max(MAX_PORT).default(DEFAULT_PORT),
  CORS_ORIGIN: corsOriginSchema,
  DATABASE_URL: databaseUrlSchema.default(DEFAULT_DATABASE_URL),
  JWT_SECRET: z.string().min(JWT_SECRET_MIN_LENGTH),
  BUSINESS_TIME_ZONE: timeZoneSchema.default(DEFAULT_BUSINESS_TIME_ZONE),
});

export interface AppConfig {
  readonly nodeEnv: (typeof NODE_ENVIRONMENTS)[number];
  readonly port: number;
  readonly corsOrigin: string;
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly businessTimeZone: string;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  const { NODE_ENV, PORT, CORS_ORIGIN, DATABASE_URL, JWT_SECRET, BUSINESS_TIME_ZONE } = result.data;
  return {
    nodeEnv: NODE_ENV,
    port: PORT,
    corsOrigin: CORS_ORIGIN,
    databaseUrl: DATABASE_URL,
    jwtSecret: JWT_SECRET,
    businessTimeZone: BUSINESS_TIME_ZONE,
  };
}
