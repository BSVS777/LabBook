import type { ReservationRepository } from '../../application/ports/reservation-repository.js';
import type { Reservation } from '../../domain/reservation.js';
import { assertNoOverlap } from '../../domain/overlap-rule.js';

export class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservations = new Map<string, Reservation>();

  save(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id, reservation);
    return Promise.resolve();
  }

  findById(id: string): Promise<Reservation | undefined> {
    return Promise.resolve(this.reservations.get(id));
  }

  /**
   * The promise executor runs synchronously, so no other call can interleave between the check
   * and the write; a thrown overlap error rejects the promise.
   */
  addIfSlotFree(reservation: Reservation): Promise<void> {
    return new Promise((resolve) => {
      const sameLab = this.all().filter(({ labId }) => labId === reservation.labId);
      assertNoOverlap(reservation.slot, sameLab);
      this.reservations.set(reservation.id, reservation);
      resolve();
    });
  }

  findByUser(userId: string): Promise<readonly Reservation[]> {
    return Promise.resolve(this.all().filter((reservation) => reservation.userId === userId));
  }

  findActiveByLabBetween(labId: string, from: Date, to: Date): Promise<readonly Reservation[]> {
    return Promise.resolve(
      this.all().filter(
        (reservation) =>
          reservation.labId === labId &&
          reservation.isActive &&
          reservation.slot.start < to &&
          from < reservation.slot.end,
      ),
    );
  }

  private all(): Reservation[] {
    return [...this.reservations.values()];
  }
}
