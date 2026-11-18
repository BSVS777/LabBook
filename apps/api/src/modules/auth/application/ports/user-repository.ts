import type { User } from '../../domain/user.js';

export interface UserRepository {
  /** Expects an already normalized email. */
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  save(user: User): Promise<void>;
}
