import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'prisma/config';

import { DEFAULT_DATABASE_URL } from './src/config/constants.js';

const ENV_FILE = resolve(import.meta.dirname, '../../.env');

if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL },
});
