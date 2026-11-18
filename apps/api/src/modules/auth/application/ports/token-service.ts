export interface TokenService {
  /** Issues a signed session token for the user. */
  issue(userId: string): string;
  /** Returns the user id the token was issued for, or `undefined` when invalid or expired. */
  verify(token: string): string | undefined;
}
