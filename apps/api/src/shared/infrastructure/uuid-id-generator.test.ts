import { describe, expect, it } from 'vitest';

import { UuidIdGenerator } from './uuid-id-generator.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SAMPLE_SIZE = 1000;

describe('UuidIdGenerator', () => {
  it('generates RFC 4122 version 4 UUIDs', () => {
    expect(new UuidIdGenerator().next()).toMatch(UUID_PATTERN);
  });

  it('does not repeat ids', () => {
    const generator = new UuidIdGenerator();

    const ids = new Set(Array.from({ length: SAMPLE_SIZE }, () => generator.next()));

    expect(ids.size).toBe(SAMPLE_SIZE);
  });
});
