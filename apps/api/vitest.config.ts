import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Applies the Prisma migrations once to a template database that integration tests copy.
    globalSetup: ['./src/shared/test/prisma-global-setup.ts'],
  },
});
