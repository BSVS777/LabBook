import { z } from 'zod';

import { DEFAULT_PORT, MAX_PORT, NODE_ENVIRONMENTS } from './constants.js';

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
  PORT: z.coerce.number().int().positive().max(MAX_PORT).default(DEFAULT_PORT),
  CORS_ORIGIN: z.url(),
});

export interface AppConfig {
  readonly nodeEnv: (typeof NODE_ENVIRONMENTS)[number];
  readonly port: number;
  readonly corsOrigin: string;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  const { NODE_ENV, PORT, CORS_ORIGIN } = result.data;
  return { nodeEnv: NODE_ENV, port: PORT, corsOrigin: CORS_ORIGIN };
}
