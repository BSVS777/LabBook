import type { IdGenerator } from '../../../shared/application/id-generator.js';
import type { Role } from '../../../shared/domain/role.js';
import { EmailAlreadyRegisteredError } from '../domain/auth-errors.js';
import { normalizeEmail, type User } from '../domain/user.js';
import type { PasswordHasher } from './ports/password-hasher.js';
import type { UserRepository } from './ports/user-repository.js';

export interface RegisterUserInput {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly role?: Role;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    if (await this.users.findByEmail(email)) throw new EmailAlreadyRegisteredError();

    const user: User = {
      id: this.ids.next(),
      email,
      name: input.name.trim(),
      role: input.role ?? 'student',
      passwordHash: await this.hasher.hash(input.password),
    };
    await this.users.save(user);
    return user;
  }
}
