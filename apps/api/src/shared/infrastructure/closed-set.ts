/** Narrows a persisted string to one of the allowed values, failing loudly on corrupt data. */
export function parseOneOf<const T extends string>(
  allowed: readonly T[],
  value: string,
  field: string,
): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new Error(`Invalid persisted ${field}: "${value}"`);
  }
  return match;
}
