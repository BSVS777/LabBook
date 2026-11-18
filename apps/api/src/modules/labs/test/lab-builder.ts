import { Lab, type LabProps } from '../domain/lab.js';

export function aLab(overrides: Partial<LabProps> = {}): Lab {
  return new Lab({
    id: 'lab-1',
    name: 'Chemistry Lab',
    location: 'Building A, room 101',
    capacity: 20,
    isActive: true,
    ...overrides,
  });
}
