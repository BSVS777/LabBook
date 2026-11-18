import type { Lab } from '../../domain/lab.js';

export interface LabRepository {
  findAll(): Promise<readonly Lab[]>;
  findById(id: string): Promise<Lab | undefined>;
}
