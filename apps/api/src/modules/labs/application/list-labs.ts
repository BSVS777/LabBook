import type { Lab } from '../domain/lab.js';
import type { LabRepository } from './ports/lab-repository.js';

/** Lists the labs that can currently be reserved, ordered by name. */
export class ListLabs {
  constructor(private readonly labs: LabRepository) {}

  async execute(): Promise<readonly Lab[]> {
    const labs = await this.labs.findAll();
    return labs.filter((lab) => lab.isActive).sort((a, b) => a.name.localeCompare(b.name));
  }
}
