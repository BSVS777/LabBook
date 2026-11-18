import type { UserRepository } from '../../application/ports/user-repository.js';
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
    this.users.set(user.id, user);
    return Promise.resolve();
  }
}
