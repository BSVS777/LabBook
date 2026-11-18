export const ROLES = ['student', 'admin'] as const;

export type Role = (typeof ROLES)[number];

/** The authenticated user on whose behalf an action is performed. */
export interface Actor {
  readonly id: string;
  readonly role: Role;
}
