import type { PasswordHasher } from '../application/ports/password-hasher.js';

const PREFIX = 'hashed:';

/** Deterministic, non-cryptographic hasher for tests only. */
export class FakePasswordHasher implements PasswordHasher {
  hashCalls = 0;

  hash(plainPassword: string): Promise<string> {
    this.hashCalls += 1;
    return Promise.resolve(`${PREFIX}${plainPassword}`);
  }

  verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(passwordHash === `${PREFIX}${plainPassword}`);
  }
}
