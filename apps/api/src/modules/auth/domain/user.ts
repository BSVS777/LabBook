import type { Role } from '../../../shared/domain/role.js';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
  readonly passwordHash: string;
}

/** Emails are compared case-insensitively and without surrounding whitespace. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
