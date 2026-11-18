import { InvalidCredentialsError } from '../domain/auth-errors.js';
import { normalizeEmail, type User } from '../domain/user.js';
import type { PasswordHasher } from './ports/password-hasher.js';
import type { TokenService } from './ports/token-service.js';
import type { UserRepository } from './ports/user-repository.js';

export interface AuthenticateUserInput {
  readonly email: string;
  readonly password: string;
}

export interface AuthenticatedSession {
  readonly user: User;
  readonly token: string;
}

export class AuthenticateUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticatedSession> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    if (!user) {
      // Spend comparable time as a real check so response timing does not reveal unknown emails.
      await this.hasher.hash(input.password);
      throw new InvalidCredentialsError();
    }
    if (!(await this.hasher.verify(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }
    return { user, token: this.tokens.issue({ id: user.id, role: user.role }) };
  }
}
