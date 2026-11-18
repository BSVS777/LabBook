import { describe, expect, it } from 'vitest';

import {
  loginBodySchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  registerBodySchema,
} from './auth.js';

const validRegistration = {
  email: 'ada@example.com',
  name: 'Ada',
  password: 'a'.repeat(PASSWORD_MIN_LENGTH),
};

describe('registerBodySchema', () => {
  it('accepts a valid registration and trims the text fields', () => {
    const parsed = registerBodySchema.parse({
      ...validRegistration,
      email: ' ada@example.com ',
      name: ' Ada ',
    });

    expect(parsed).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
  });

  it('rejects a malformed email', () => {
    expect(registerBodySchema.safeParse({ ...validRegistration, email: 'nope' }).success).toBe(
      false,
    );
  });

  it('rejects a blank name', () => {
    expect(registerBodySchema.safeParse({ ...validRegistration, name: '   ' }).success).toBe(false);
  });

  it('enforces the password length bounds', () => {
    const tooShort = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    const tooLong = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);

    expect(registerBodySchema.safeParse({ ...validRegistration, password: tooShort }).success).toBe(
      false,
    );
    expect(registerBodySchema.safeParse({ ...validRegistration, password: tooLong }).success).toBe(
      false,
    );
  });
});

describe('loginBodySchema', () => {
  it('accepts an email and a password', () => {
    expect(loginBodySchema.safeParse({ email: 'ada@example.com', password: 'x' }).success).toBe(
      true,
    );
  });

  it('rejects an empty password', () => {
    expect(loginBodySchema.safeParse({ email: 'ada@example.com', password: '' }).success).toBe(
      false,
    );
  });
});
