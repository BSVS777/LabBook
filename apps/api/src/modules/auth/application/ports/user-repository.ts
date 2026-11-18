import type { User } from '../../domain/user.js';

export interface UserRepository {
  /** Expects an already normalized email. */
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  /**
   * Inserts or replaces the user with the same id. The email must stay unique even under
   * concurrent calls, so implementations rely on a uniqueness guarantee of the store.
   * @throws EmailAlreadyRegisteredError when another user already has the email.
   */
  save(user: User): Promise<void>;
}
