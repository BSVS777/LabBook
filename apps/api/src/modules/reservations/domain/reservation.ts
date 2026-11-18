import { ForbiddenError } from '../../../shared/domain/domain-error.js';
import type { Actor } from '../../../shared/domain/role.js';
import {
  ReservationAlreadyCancelledError,
  ReservationAlreadyStartedError,
} from './reservation-errors.js';
import type { TimeSlot } from './time-slot.js';

export type ReservationStatus = 'active' | 'cancelled';

export interface ReservationProps {
  readonly id: string;
  readonly labId: string;
  readonly userId: string;
  readonly slot: TimeSlot;
  readonly status: ReservationStatus;
  readonly createdAt: Date;
}

export type NewReservationProps = Omit<ReservationProps, 'status'>;

export class Reservation {
  private constructor(private readonly props: ReservationProps) {}

  static create(props: NewReservationProps): Reservation {
    return new Reservation({ ...props, status: 'active' });
  }

  /** Rebuilds a reservation from already-validated persisted state. */
  static restore(props: ReservationProps): Reservation {
    return new Reservation(props);
  }

  get id(): string {
    return this.props.id;
  }

  get labId(): string {
    return this.props.labId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get slot(): TimeSlot {
    return this.props.slot;
  }

  get status(): ReservationStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  /** An active reservation blocks any slot that intersects its own. */
  blocks(slot: TimeSlot): boolean {
    return this.isActive && this.slot.overlaps(slot);
  }

  /** Only the owner or an admin may cancel, and only an active reservation that has not started. */
  cancel(actor: Actor, now: Date): Reservation {
    if (actor.role !== 'admin' && actor.id !== this.userId) throw new ForbiddenError();
    if (!this.isActive) throw new ReservationAlreadyCancelledError();
    if (now >= this.slot.start) throw new ReservationAlreadyStartedError();
    return new Reservation({ ...this.props, status: 'cancelled' });
  }
}
