import { describe, expect, it } from 'vitest';

import { BCRYPT_COST, BcryptPasswordHasher } from './bcrypt-password-hasher.js';

const PASSWORD = 'correct horse battery';
/** Cheap work factor keeps the suite fast; the production default is asserted separately. */
const TEST_COST = 4;
const hasher = new BcryptPasswordHasher(TEST_COST);

describe('BcryptPasswordHasher', () => {
  it('never returns the plain password', async () => {
    expect(await hasher.hash(PASSWORD)).not.toContain(PASSWORD);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hasher.hash(PASSWORD);

    expect(await hasher.verify(PASSWORD, hash)).toBe(true);
    expect(await hasher.verify('wrong password', hash)).toBe(false);
  });

  it('salts every hash', async () => {
    const [first, second] = await Promise.all([hasher.hash(PASSWORD), hasher.hash(PASSWORD)]);

    expect(first).not.toBe(second);
  });

  it('uses the documented cost factor by default', async () => {
    const hash = await new BcryptPasswordHasher().hash(PASSWORD);

    expect(hash.startsWith(`$2b$${String(BCRYPT_COST)}$`)).toBe(true);
  });

  it.each(['', 'not-a-bcrypt-hash'])(
    'does not match a malformed stored hash %j',
    async (stored) => {
      expect(await hasher.verify(PASSWORD, stored)).toBe(false);
    },
  );
});
