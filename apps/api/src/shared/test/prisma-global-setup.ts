import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { TestProject } from 'vitest/node';

const TEMPLATE_FILE_NAME = 'template.db';
const API_ROOT = new URL('../../../', import.meta.url);

declare module 'vitest' {
  export interface ProvidedContext {
    /** Absolute path of a SQLite file with every migration applied. */
    databaseTemplatePath: string;
  }
}

function migrate(databaseUrl: string): void {
  const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: API_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
}

export default function setup(project: TestProject): () => void {
  const directory = mkdtempSync(join(tmpdir(), 'labs-template-'));
  const templatePath = join(directory, TEMPLATE_FILE_NAME);
  migrate(`file:${templatePath}`);
  project.provide('databaseTemplatePath', templatePath);

  return () => {
    rmSync(directory, { recursive: true, force: true });
  };
}
