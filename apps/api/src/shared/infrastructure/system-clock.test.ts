import { describe, expect, it } from 'vitest';

import { SystemClock } from './system-clock.js';

describe('SystemClock', () => {
  it('returns the current instant', () => {
    const before = Date.now();

    const now = new SystemClock().now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });

  it('returns a new Date each time so callers cannot mutate shared state', () => {
    const clock = new SystemClock();

    expect(clock.now()).not.toBe(clock.now());
  });
});
