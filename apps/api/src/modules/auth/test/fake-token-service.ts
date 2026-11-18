import type { Actor } from '../../../shared/domain/role.js';
import type { TokenService } from '../application/ports/token-service.js';

const PREFIX = 'token-for-';
const SEPARATOR = ':';

export class FakeTokenService implements TokenService {
  issue({ id, role }: Actor): string {
    return `${PREFIX}${id}${SEPARATOR}${role}`;
  }

  verify(token: string): Actor | undefined {
    if (!token.startsWith(PREFIX)) return undefined;
    const [id, role] = token.slice(PREFIX.length).split(SEPARATOR);
    return id !== undefined && (role === 'student' || role === 'admin') ? { id, role } : undefined;
  }
}
