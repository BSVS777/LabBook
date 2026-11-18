import type { TokenService } from '../application/ports/token-service.js';

const PREFIX = 'token-for-';

export class FakeTokenService implements TokenService {
  issue(userId: string): string {
    return `${PREFIX}${userId}`;
  }

  verify(token: string): string | undefined {
    return token.startsWith(PREFIX) ? token.slice(PREFIX.length) : undefined;
  }
}
