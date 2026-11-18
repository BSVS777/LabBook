import type { LabRepository } from '../../application/ports/lab-repository.js';
import type { Lab } from '../../domain/lab.js';

export class InMemoryLabRepository implements LabRepository {
  private readonly labs = new Map<string, Lab>();

  constructor(initialLabs: readonly Lab[] = []) {
    for (const lab of initialLabs) this.labs.set(lab.id, lab);
  }

  findAll(): Promise<readonly Lab[]> {
    return Promise.resolve([...this.labs.values()]);
  }

  findById(id: string): Promise<Lab | undefined> {
    return Promise.resolve(this.labs.get(id));
  }
}
