import bcrypt from 'bcryptjs';

import type { PasswordHasher } from '../../application/ports/password-hasher.js';

/** Work factor: 2^12 rounds, a common balance between login latency and brute-force cost. */
export const BCRYPT_COST = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost: number = BCRYPT_COST) {}

  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.cost);
  }

  /** A malformed stored hash never matches instead of surfacing an error. */
  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, passwordHash);
    } catch {
      return false;
    }
  }
}
