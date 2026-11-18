const BOGOTA_UTC_OFFSET = '-05:00';

/** Builds an instant from a Bogota wall-clock reading, e.g. `bogota('2026-03-02T07:00')`. */
export function bogota(localDateTime: string): Date {
  return new Date(`${localDateTime}:00${BOGOTA_UTC_OFFSET}`);
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}
