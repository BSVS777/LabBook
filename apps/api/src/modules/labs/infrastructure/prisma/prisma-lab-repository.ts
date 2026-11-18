import type { PrismaClient } from '../../../../shared/infrastructure/prisma-client.js';
import type { LabRepository } from '../../application/ports/lab-repository.js';
import type { Lab } from '../../domain/lab.js';
import { toLab } from './lab-mapper.js';

export class PrismaLabRepository implements LabRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<readonly Lab[]> {
    const rows = await this.prisma.lab.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toLab);
  }

  async findById(id: string): Promise<Lab | undefined> {
    const row = await this.prisma.lab.findUnique({ where: { id } });
    return row ? toLab(row) : undefined;
  }
}
