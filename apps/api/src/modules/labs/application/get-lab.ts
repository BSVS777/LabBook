import type { Lab } from '../domain/lab.js';
import { LabNotFoundError } from '../domain/lab-errors.js';
import type { LabRepository } from './ports/lab-repository.js';

export interface GetLabInput {
  readonly labId: string;
}

export class GetLab {
  constructor(private readonly labs: LabRepository) {}

  async execute({ labId }: GetLabInput): Promise<Lab> {
    const lab = await this.labs.findById(labId);
    if (!lab) throw new LabNotFoundError();
    return lab;
  }
}
