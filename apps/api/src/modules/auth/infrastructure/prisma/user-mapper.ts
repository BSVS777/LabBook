import { ROLES } from '../../../../shared/domain/role.js';
import { parseOneOf } from '../../../../shared/infrastructure/closed-set.js';
import type { User } from '../../domain/user.js';

/** The persisted shape of a user, independent of the generated Prisma types. */
export interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly passwordHash: string;
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: parseOneOf(ROLES, row.role, 'user role'),
    passwordHash: row.passwordHash,
  };
}

export function toUserRow(user: User): UserRow {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    passwordHash: user.passwordHash,
  };
}
