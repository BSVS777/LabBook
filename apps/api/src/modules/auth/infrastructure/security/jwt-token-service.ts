import jwt from 'jsonwebtoken';

import type { Clock } from '../../../../shared/application/clock.js';
import { ROLES, type Actor } from '../../../../shared/domain/role.js';
import { MILLIS_PER_MINUTE, MINUTES_PER_HOUR } from '../../../../shared/domain/time-units.js';
import type { TokenService } from '../../application/ports/token-service.js';

const SECONDS_PER_MINUTE = 60;
const MILLIS_PER_SECOND = MILLIS_PER_MINUTE / SECONDS_PER_MINUTE;
const SESSION_HOURS = 2;

export const JWT_ALGORITHM = 'HS256';
/** How long a session token stays valid after it is issued. */
export const SESSION_TTL_SECONDS = SESSION_HOURS * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;

/** Signs and verifies HS256 session tokens whose only claims are `sub` (user id) and `role`. */
export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly clock: Clock,
  ) {}

  issue({ id, role }: Actor): string {
    return jwt.sign({ role, iat: this.nowInSeconds() }, this.secret, {
      algorithm: JWT_ALGORITHM,
      subject: id,
      expiresIn: SESSION_TTL_SECONDS,
    });
  }

  verify(token: string): Actor | undefined {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: [JWT_ALGORITHM],
        clockTimestamp: this.nowInSeconds(),
      });
      return typeof payload === 'string' ? undefined : toActor(payload);
    } catch {
      return undefined;
    }
  }

  private nowInSeconds(): number {
    return Math.floor(this.clock.now().getTime() / MILLIS_PER_SECOND);
  }
}

function toActor(payload: jwt.JwtPayload): Actor | undefined {
  const { sub, role } = payload;
  const knownRole = ROLES.find((candidate) => candidate === role);
  return typeof sub === 'string' && sub !== '' && knownRole !== undefined
    ? { id: sub, role: knownRole }
    : undefined;
}
