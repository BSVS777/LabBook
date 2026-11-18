import type { IdGenerator } from '../application/id-generator.js';

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'id') {}

  next(): string {
    this.counter += 1;
    return `${this.prefix}-${String(this.counter)}`;
  }
}
