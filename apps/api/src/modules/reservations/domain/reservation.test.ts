import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../shared/domain/domain-error.js';
import type { Actor } from '../../../shared/domain/role.js';
import { aReservation, aSlot, DEFAULT_USER_ID } from '../test/reservation-builder.js';
import { addMinutes } from '../test/time.js';
import { Reservation } from './reservation.js';

const OWNER: Actor = { id: DEFAULT_USER_ID, role: 'student' };
const OTHER_STUDENT: Actor = { id: 'user-2', role: 'student' };
const ADMIN: Actor = { id: 'admin-1', role: 'admin' };
const BEFORE_START = addMinutes(aSlot().start, -120);

describe('Reservation', () => {
  it('is created active', () => {
    const reservation = Reservation.create({
      id: 'r-1',
      labId: 'lab-1',
      userId: DEFAULT_USER_ID,
      slot: aSlot(),
      createdAt: BEFORE_START,
    });

    expect(reservation.status).toBe('active');
    expect(reservation.isActive).toBe(true);
  });

  describe('cancel', () => {
    it('lets the owner cancel without mutating the original', () => {
      const reservation = aReservation();

      const cancelled = reservation.cancel(OWNER, BEFORE_START);

      expect(cancelled.status).toBe('cancelled');
      expect(reservation.status).toBe('active');
    });

    it('lets an admin cancel any reservation', () => {
      expect(aReservation().cancel(ADMIN, BEFORE_START).status).toBe('cancelled');
    });

    it('rejects a student who does not own the reservation', () => {
      expect(() => aReservation().cancel(OTHER_STUDENT, BEFORE_START)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.FORBIDDEN }),
      );
    });

    it('rejects cancelling twice', () => {
      const cancelled = aReservation({ status: 'cancelled' });

      expect(() => cancelled.cancel(OWNER, BEFORE_START)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.RESERVATION_ALREADY_CANCELLED }),
      );
    });

    it('rejects cancelling once the slot has started', () => {
      expect(() => aReservation().cancel(OWNER, aSlot().start)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.RESERVATION_ALREADY_STARTED }),
      );
    });

    it('allows cancelling one minute before the start', () => {
      expect(aReservation().cancel(OWNER, addMinutes(aSlot().start, -1)).status).toBe('cancelled');
    });

    it('reports a forbidden attempt before revealing the reservation state', () => {
      const cancelled = aReservation({ status: 'cancelled' });

      expect(() => cancelled.cancel(OTHER_STUDENT, BEFORE_START)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.FORBIDDEN }),
      );
    });
  });
});
