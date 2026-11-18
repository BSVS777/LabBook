import { Lab } from '../../domain/lab.js';

/** The persisted shape of a lab, independent of the generated Prisma types. */
export interface LabRow {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly capacity: number;
  readonly isActive: boolean;
}

export function toLab(row: LabRow): Lab {
  return new Lab({
    id: row.id,
    name: row.name,
    location: row.location,
    capacity: row.capacity,
    isActive: row.isActive,
  });
}
