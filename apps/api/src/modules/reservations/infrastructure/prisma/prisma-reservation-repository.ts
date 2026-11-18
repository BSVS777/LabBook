import type { Clock } from '../../../../shared/application/clock.js';
import type { PrismaClient } from '../../../../shared/infrastructure/prisma-client.js';
import type { ReservationRepository } from '../../application/ports/reservation-repository.js';
import { ReservationOverlapError } from '../../domain/reservation-errors.js';
import type { Reservation } from '../../domain/reservation.js';
import { toReservation, toReservationRow } from './reservation-mapper.js';

export class PrismaReservationRepository implements ReservationRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
  ) {}

  async save(reservation: Reservation): Promise<void> {
    const row = toReservationRow(reservation, this.cancelledAtOf(reservation));
    await this.prisma.reservation.upsert({ where: { id: row.id }, create: row, update: row });
  }

  /**
   * Check and insert run in one serializable transaction, so two concurrent bookings of
   * overlapping slots cannot both commit: the second one either sees the first or fails to commit.
   */
  async addIfSlotFree(reservation: Reservation): Promise<void> {
    const row = toReservationRow(reservation, null);
    await this.prisma.$transaction(
      async (tx) => {
        const clash = await tx.reservation.findFirst({
          where: {
            labId: row.labId,
            status: 'active',
            startsAt: { lt: row.endsAt },
            endsAt: { gt: row.startsAt },
          },
          select: { id: true },
        });
        if (clash) throw new ReservationOverlapError();
        await tx.reservation.create({ data: row });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findById(id: string): Promise<Reservation | undefined> {
    const row = await this.prisma.reservation.findUnique({ where: { id } });
    return row ? toReservation(row) : undefined;
  }

  async findByUser(userId: string): Promise<readonly Reservation[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { startsAt: 'asc' },
    });
    return rows.map(toReservation);
  }

  async findActiveByLabBetween(
    labId: string,
    from: Date,
    to: Date,
  ): Promise<readonly Reservation[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { labId, status: 'active', startsAt: { lt: to }, endsAt: { gt: from } },
      orderBy: { startsAt: 'asc' },
    });
    return rows.map(toReservation);
  }

  private cancelledAtOf(reservation: Reservation): Date | null {
    return reservation.isActive ? null : this.clock.now();
  }
}
