import { randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { FixedClock } from '../../../../shared/test/fixed-clock.js';
import { JWT_ALGORITHM, JwtTokenService, SESSION_TTL_SECONDS } from './jwt-token-service.js';

const SECRET_BYTES = 32;
const secret = randomBytes(SECRET_BYTES).toString('hex');
const ISSUED_AT = new Date('2026-03-02T15:00:00.000Z');
const ACTOR = { id: 'user-1', role: 'student' } as const;

function createService(now: Date = ISSUED_AT, signingSecret: string = secret) {
  const clock = new FixedClock(now);
  return { clock, service: new JwtTokenService(signingSecret, clock) };
}

describe('JwtTokenService', () => {
  it('round-trips the user id and role', () => {
    const { service } = createService();

    expect(service.verify(service.issue(ACTOR))).toEqual(ACTOR);
    expect(service.verify(service.issue({ id: 'admin-1', role: 'admin' }))).toEqual({
      id: 'admin-1',
      role: 'admin',
    });
  });

  it('carries only subject, role and timing claims, signed with HS256', () => {
    const { service } = createService();

    const token = service.issue(ACTOR);
    const decoded = jwt.decode(token, { complete: true });

    expect(decoded?.header.alg).toBe(JWT_ALGORITHM);
    expect(Object.keys(decoded?.payload as object).sort()).toEqual(['exp', 'iat', 'role', 'sub']);
  });

  it('accepts the token until it expires and rejects it afterwards', () => {
    const { service, clock } = createService();
    const token = service.issue(ACTOR);

    clock.advanceTo(new Date(ISSUED_AT.getTime() + (SESSION_TTL_SECONDS - 1) * 1000));
    expect(service.verify(token)).toEqual(ACTOR);

    clock.advanceTo(new Date(ISSUED_AT.getTime() + SESSION_TTL_SECONDS * 1000));
    expect(service.verify(token)).toBeUndefined();
  });

  it('rejects a token signed with another secret', () => {
    const { service } = createService();
    const { service: other } = createService(ISSUED_AT, randomBytes(SECRET_BYTES).toString('hex'));

    expect(service.verify(other.issue(ACTOR))).toBeUndefined();
  });

  it('rejects a tampered token', () => {
    const { service } = createService();
    const [header, , signature] = service.issue(ACTOR).split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'user-1', role: 'admin' })).toString(
      'base64url',
    );

    expect(service.verify(`${header ?? ''}.${forgedPayload}.${signature ?? ''}`)).toBeUndefined();
  });

  it('rejects an unsigned token using the none algorithm', () => {
    const { service } = createService();
    const unsigned = jwt.sign({ role: 'admin' }, '', { algorithm: 'none', subject: 'user-1' });

    expect(service.verify(unsigned)).toBeUndefined();
  });

  it('rejects a token signed with a different HMAC algorithm', () => {
    const { service } = createService();
    const other = jwt.sign({ role: 'admin' }, secret, { algorithm: 'HS512', subject: 'user-1' });

    expect(service.verify(other)).toBeUndefined();
  });

  it('rejects a validly signed token with an unknown role or no subject', () => {
    const { service } = createService();
    const unknownRole = jwt.sign({ role: 'root' }, secret, { subject: 'user-1' });
    const noSubject = jwt.sign({ role: 'student' }, secret);

    expect(service.verify(unknownRole)).toBeUndefined();
    expect(service.verify(noSubject)).toBeUndefined();
  });

  it.each(['', 'garbage', 'a.b.c'])('rejects the malformed token %j', (token) => {
    const { service } = createService();

    expect(service.verify(token)).toBeUndefined();
  });
});
