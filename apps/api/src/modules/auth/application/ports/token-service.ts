import type { Actor } from '../../../../shared/domain/role.js';

export interface TokenService {
  /** Issues a signed session token carrying only the user id and role. */
  issue(actor: Actor): string;
  /** Returns the actor the token was issued for, or `undefined` when invalid or expired. */
  verify(token: string): Actor | undefined;
}
