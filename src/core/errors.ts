/**
 * Error thrown when a numeric value falls outside the range accepted by a
 * serializable type (for example, a UInt32 outside `[0, 2^32 - 1]`).
 */
export class OutOfRangeError extends Error {
  constructor(
    value: number,
    typeName: string,
    minRange: number,
    maxRange: number,
  ) {
    super(
      `The value is out of range of ${typeName}. It must be >= ${minRange} and <= ${maxRange}. Recived: ${value}`,
    );
  }
}
