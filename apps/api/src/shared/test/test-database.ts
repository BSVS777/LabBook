import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { inject } from 'vitest';

import { createPrismaClient, type PrismaClient } from '../infrastructure/prisma-client.js';

export interface TestDatabase {
  readonly prisma: PrismaClient;
  /** Disconnects and deletes the database file. */
  dispose(): Promise<void>;
}

/** An isolated, fully migrated SQLite database for one test file. */
export function createTestDatabase(): TestDatabase {
  const directory = mkdtempSync(join(tmpdir(), 'labs-test-'));
  const databasePath = join(directory, 'test.db');
  copyFileSync(inject('databaseTemplatePath'), databasePath);
  const prisma = createPrismaClient(`file:${databasePath}`);

  return {
    prisma,
    async dispose() {
      await prisma.$disconnect();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
