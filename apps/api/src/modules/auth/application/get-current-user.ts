import { UnauthenticatedError } from '../domain/auth-errors.js';
import type { User } from '../domain/user.js';
import type { UserRepository } from './ports/user-repository.js';

export interface GetCurrentUserInput {
  /** Id resolved from a verified session token, or `undefined` when there is no session. */
  readonly userId: string | undefined;
}

export class GetCurrentUser {
  constructor(private readonly users: UserRepository) {}

  async execute({ userId }: GetCurrentUserInput): Promise<User> {
    const user = userId === undefined ? undefined : await this.users.findById(userId);
    if (!user) throw new UnauthenticatedError();
    return user;
  }
}
