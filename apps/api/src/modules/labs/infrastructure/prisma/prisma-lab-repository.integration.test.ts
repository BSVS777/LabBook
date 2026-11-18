import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase } from '../../../../shared/test/test-database.js';
import { Lab } from '../../domain/lab.js';
import { PrismaLabRepository } from './prisma-lab-repository.js';

const database = createTestDatabase();
const repository = new PrismaLabRepository(database.prisma);

beforeEach(async () => {
  await database.prisma.lab.deleteMany();
});

afterAll(async () => {
  await database.dispose();
});

describe('PrismaLabRepository', () => {
  it('finds a lab by id as a domain entity', async () => {
    await database.prisma.lab.create({
      data: { id: 'lab-1', name: 'Chemistry', location: 'Building A', capacity: 20 },
    });

    const lab = await repository.findById('lab-1');

    expect(lab).toBeInstanceOf(Lab);
    expect(lab).toMatchObject({
      id: 'lab-1',
      name: 'Chemistry',
      location: 'Building A',
      capacity: 20,
      isActive: true,
    });
  });

  it('returns undefined for an unknown lab', async () => {
    expect(await repository.findById('ghost')).toBeUndefined();
  });

  it('lists labs ordered by name, including inactive ones', async () => {
    await database.prisma.lab.createMany({
      data: [
        { id: 'lab-b', name: 'Physics', location: 'B', capacity: 10 },
        { id: 'lab-a', name: 'Biology', location: 'A', capacity: 12, isActive: false },
      ],
    });

    const labs = await repository.findAll();

    expect(labs.map(({ name }) => name)).toEqual(['Biology', 'Physics']);
    expect(labs[0]?.isActive).toBe(false);
  });

  it('returns an empty list when there are no labs', async () => {
    expect(await repository.findAll()).toEqual([]);
  });
});
