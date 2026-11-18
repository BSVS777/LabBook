import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../shared/domain/domain-error.js';
import { aLab } from '../test/lab-builder.js';

describe('Lab', () => {
  it('can be booked while active', () => {
    expect(() => {
      aLab().assertBookable();
    }).not.toThrow();
  });

  it('cannot be booked once inactive', () => {
    expect(() => {
      aLab({ isActive: false }).assertBookable();
    }).toThrow(expect.objectContaining({ code: ERROR_CODES.LAB_INACTIVE }));
  });
});
