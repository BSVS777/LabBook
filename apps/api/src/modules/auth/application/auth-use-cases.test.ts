import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../shared/domain/domain-error.js';
import { SequentialIdGenerator } from '../../../shared/test/sequential-id-generator.js';
import { InMemoryUserRepository } from '../infrastructure/in-memory/in-memory-user-repository.js';
import { FakePasswordHasher } from '../test/fake-password-hasher.js';
import { FakeTokenService } from '../test/fake-token-service.js';
import { AuthenticateUser } from './authenticate-user.js';
import { GetCurrentUser } from './get-current-user.js';
import { RegisterUser } from './register-user.js';

const PASSWORD = 'correct horse battery';

function createAuthScenario() {
  const users = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  return {
    users,
    hasher,
    tokens,
    registerUser: new RegisterUser(users, hasher, new SequentialIdGenerator('user')),
    authenticateUser: new AuthenticateUser(users, hasher, tokens),
    getCurrentUser: new GetCurrentUser(users),
  };
}

describe('RegisterUser', () => {
  it('registers a student with a normalized email and a hashed password', async () => {
    const { registerUser, users } = createAuthScenario();

    const user = await registerUser.execute({
      email: '  Ada.Lovelace@Example.COM ',
      name: ' Ada Lovelace ',
      password: PASSWORD,
    });

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'ada.lovelace@example.com',
      name: 'Ada Lovelace',
      role: 'student',
    });
    expect(user.passwordHash).not.toBe(PASSWORD);
    expect(await users.findById(user.id)).toEqual(user);
  });

  it('keeps an explicitly requested role', async () => {
    const { registerUser } = createAuthScenario();

    const user = await registerUser.execute({
      email: 'admin@example.com',
      name: 'Admin',
      password: PASSWORD,
      role: 'admin',
    });

    expect(user.role).toBe('admin');
  });

  it('rejects an email that is already registered, ignoring case and spaces', async () => {
    const { registerUser } = createAuthScenario();
    await registerUser.execute({ email: 'ada@example.com', name: 'Ada', password: PASSWORD });

    await expect(
      registerUser.execute({ email: ' ADA@example.com', name: 'Other', password: PASSWORD }),
    ).rejects.toMatchObject({ code: ERROR_CODES.EMAIL_ALREADY_REGISTERED });
  });
});

describe('AuthenticateUser', () => {
  async function scenarioWithUser() {
    const scenario = createAuthScenario();
    const user = await scenario.registerUser.execute({
      email: 'ada@example.com',
      name: 'Ada',
      password: PASSWORD,
    });
    return { ...scenario, user };
  }

  it('returns the user and a session token for valid credentials', async () => {
    const { authenticateUser, tokens, user } = await scenarioWithUser();

    const session = await authenticateUser.execute({
      email: 'ada@example.com',
      password: PASSWORD,
    });

    expect(session.user).toEqual(user);
    expect(tokens.verify(session.token)).toBe(user.id);
  });

  it('accepts the email in a different case', async () => {
    const { authenticateUser } = await scenarioWithUser();

    await expect(
      authenticateUser.execute({ email: ' ADA@example.com ', password: PASSWORD }),
    ).resolves.toBeDefined();
  });

  it('rejects a wrong password with INVALID_CREDENTIALS', async () => {
    const { authenticateUser } = await scenarioWithUser();

    await expect(
      authenticateUser.execute({ email: 'ada@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_CREDENTIALS });
  });

  it('rejects an unknown email with the very same error as a wrong password', async () => {
    const { authenticateUser } = await scenarioWithUser();

    const unknownEmail = await authenticateUser
      .execute({ email: 'nobody@example.com', password: PASSWORD })
      .catch((error: unknown) => error);
    const wrongPassword = await authenticateUser
      .execute({ email: 'ada@example.com', password: 'wrong' })
      .catch((error: unknown) => error);

    expect(unknownEmail).toMatchObject({ code: ERROR_CODES.INVALID_CREDENTIALS });
    expect(unknownEmail).toEqual(wrongPassword);
  });

  it('still performs a hash for an unknown email to even out response time', async () => {
    const { authenticateUser, hasher } = await scenarioWithUser();
    const hashCallsBefore = hasher.hashCalls;

    await authenticateUser
      .execute({ email: 'nobody@example.com', password: PASSWORD })
      .catch(() => undefined);

    expect(hasher.hashCalls).toBe(hashCallsBefore + 1);
  });
});

describe('GetCurrentUser', () => {
  it('returns the user of the session', async () => {
    const { registerUser, getCurrentUser } = createAuthScenario();
    const user = await registerUser.execute({
      email: 'ada@example.com',
      name: 'Ada',
      password: PASSWORD,
    });

    expect(await getCurrentUser.execute({ userId: user.id })).toEqual(user);
  });

  it('throws UNAUTHENTICATED without a session', async () => {
    const { getCurrentUser } = createAuthScenario();

    await expect(getCurrentUser.execute({ userId: undefined })).rejects.toMatchObject({
      code: ERROR_CODES.UNAUTHENTICATED,
    });
  });

  it('throws UNAUTHENTICATED when the user no longer exists', async () => {
    const { getCurrentUser } = createAuthScenario();

    await expect(getCurrentUser.execute({ userId: 'ghost' })).rejects.toMatchObject({
      code: ERROR_CODES.UNAUTHENTICATED,
    });
  });
});
