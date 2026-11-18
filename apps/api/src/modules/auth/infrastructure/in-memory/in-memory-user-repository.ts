import type { UserRepository } from '../../application/ports/user-repository.js';
import { EmailAlreadyRegisteredError } from '../../domain/auth-errors.js';
import type { User } from '../../domain/user.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve([...this.users.values()].find((user) => user.email === email));
  }

  findById(id: string): Promise<User | undefined> {
    return Promise.resolve(this.users.get(id));
  }

  save(user: User): Promise<void> {
    const emailTaken = [...this.users.values()].some(
      ({ id, email }) => email === user.email && id !== user.id,
    );
    if (emailTaken) return Promise.reject(new EmailAlreadyRegisteredError());
    this.users.set(user.id, user);
    return Promise.resolve();
  }
}
