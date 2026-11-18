import type { PrismaClient } from '../../../../shared/infrastructure/prisma-client.js';
import { isUniqueConstraintViolation } from '../../../../shared/infrastructure/prisma-errors.js';
import type { UserRepository } from '../../application/ports/user-repository.js';
import { EmailAlreadyRegisteredError } from '../../domain/auth-errors.js';
import type { User } from '../../domain/user.js';
import { toUser, toUserRow } from './user-mapper.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toUser(row) : undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : undefined;
  }

  /** The unique index on `email` is the source of truth: a lost registration race fails here. */
  async save(user: User): Promise<void> {
    const row = toUserRow(user);
    try {
      await this.prisma.user.upsert({ where: { id: row.id }, create: row, update: row });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) throw new EmailAlreadyRegisteredError();
      throw error;
    }
  }
}
