import type { ReservationRepository } from '../../application/ports/reservation-repository.js';
import type { Reservation } from '../../domain/reservation.js';
import type { TimeSlot } from '../../domain/time-slot.js';

export class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservations = new Map<string, Reservation>();

  save(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id, reservation);
    return Promise.resolve();
  }

  findById(id: string): Promise<Reservation | undefined> {
    return Promise.resolve(this.reservations.get(id));
  }

  findActiveOverlapping(labId: string, slot: TimeSlot): Promise<readonly Reservation[]> {
    return Promise.resolve(
      this.all().filter((reservation) => reservation.labId === labId && reservation.blocks(slot)),
    );
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
