import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../../shared/domain/domain-error.js';
import { createTestDatabase } from '../../../../shared/test/test-database.js';
import type { User } from '../../domain/user.js';
import { PrismaUserRepository } from './prisma-user-repository.js';

const database = createTestDatabase();
const repository = new PrismaUserRepository(database.prisma);

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'ada@example.com',
    name: 'Ada',
    role: 'student',
    passwordHash: 'hash',
    ...overrides,
  };
}

beforeEach(async () => {
  await database.prisma.user.deleteMany();
});

afterAll(async () => {
  await database.dispose();
});

describe('PrismaUserRepository', () => {
  it('stores a user and finds it by id and by email', async () => {
    const user = aUser();

    await repository.save(user);

    expect(await repository.findById(user.id)).toEqual(user);
    expect(await repository.findByEmail(user.email)).toEqual(user);
  });

  it('returns undefined for an unknown user', async () => {
    expect(await repository.findById('ghost')).toBeUndefined();
    expect(await repository.findByEmail('ghost@example.com')).toBeUndefined();
  });

  it('replaces the user with the same id', async () => {
    await repository.save(aUser());

    await repository.save(aUser({ name: 'Ada Lovelace', role: 'admin' }));

    expect(await repository.findById('user-1')).toMatchObject({
      name: 'Ada Lovelace',
      role: 'admin',
    });
  });

  it('maps a duplicate email to EMAIL_ALREADY_REGISTERED', async () => {
    await repository.save(aUser());

    await expect(repository.save(aUser({ id: 'user-2' }))).rejects.toMatchObject({
      code: ERROR_CODES.EMAIL_ALREADY_REGISTERED,
    });
    expect(await repository.findById('user-2')).toBeUndefined();
  });

  it('lets only one of two simultaneous registrations of the same email succeed', async () => {
    const outcomes = await Promise.allSettled([
      repository.save(aUser({ id: 'user-a' })),
      repository.save(aUser({ id: 'user-b' })),
    ]);

    expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: { code: ERROR_CODES.EMAIL_ALREADY_REGISTERED },
    });
  });

  it('refuses to load a user whose persisted role is not valid', async () => {
    await database.prisma.user.create({ data: { ...aUser(), role: 'superuser' } });

    await expect(repository.findById('user-1')).rejects.toThrow(/user role/);
  });
});
