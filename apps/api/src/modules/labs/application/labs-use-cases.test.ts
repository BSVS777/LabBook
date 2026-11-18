import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../shared/domain/domain-error.js';
import { InMemoryLabRepository } from '../infrastructure/in-memory/in-memory-lab-repository.js';
import { aLab } from '../test/lab-builder.js';
import { GetLab } from './get-lab.js';
import { ListLabs } from './list-labs.js';

describe('ListLabs', () => {
  it('returns only active labs ordered by name', async () => {
    const repository = new InMemoryLabRepository([
      aLab({ id: 'b', name: 'Physics Lab' }),
      aLab({ id: 'c', name: 'Closed Lab', isActive: false }),
      aLab({ id: 'a', name: 'Biology Lab' }),
    ]);

    const labs = await new ListLabs(repository).execute();

    expect(labs.map((lab) => lab.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list when there are no labs', async () => {
    expect(await new ListLabs(new InMemoryLabRepository()).execute()).toEqual([]);
  });
});

describe('GetLab', () => {
  it('returns the requested lab', async () => {
    const repository = new InMemoryLabRepository([aLab({ id: 'lab-7' })]);

    const lab = await new GetLab(repository).execute({ labId: 'lab-7' });

    expect(lab.id).toBe('lab-7');
  });

  it('throws LAB_NOT_FOUND for an unknown id', async () => {
    const getLab = new GetLab(new InMemoryLabRepository());

    await expect(getLab.execute({ labId: 'missing' })).rejects.toMatchObject({
      code: ERROR_CODES.LAB_NOT_FOUND,
    });
  });

  it('still returns inactive labs', async () => {
    const repository = new InMemoryLabRepository([aLab({ id: 'x', isActive: false })]);

    expect((await new GetLab(repository).execute({ labId: 'x' })).isActive).toBe(false);
  });
});
