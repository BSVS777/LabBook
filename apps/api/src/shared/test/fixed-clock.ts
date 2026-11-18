import type { Clock } from '../application/clock.js';

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current);
  }

  advanceTo(instant: Date): void {
    this.current = instant;
  }
}
