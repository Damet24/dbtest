import { OutOfRangeError } from "../core/errors.js";

/**
 * Descriptor of an integer's on-disk encoding. Grouping the type metadata
 * (name, width and value range) in one place makes it trivial to add new
 * types (UInt16, Int32, ...) while keeping every invariant independent.
 */
export type IntegerSpec = {
  /** Human-readable type name used in error messages. */
  name: string;
  /** Number of bytes the value occupies in a buffer. */
  bytes: number;
  /** Minimum value representable by the type (inclusive). */
  min: number;
  /** Maximum value representable by the type (inclusive). */
  max: number;
};

// ---------------------------------------------------------------------------
// Independent invariants
//
// Each assertion answers a single question and knows nothing about the others:
//   assertBufferAccess()  -> is there enough room in the buffer?
//   assertIntegerNumber() -> is the value a whole number?
//   assertNumberRange()   -> does the value fit the type's range?
// ---------------------------------------------------------------------------

/**
 * Buffer invariant. Verifies that `byteLength` bytes starting at `offset`
 * can be safely read from or written to the buffer. It is agnostic of the
 * value's type.
 *
 * @throws {RangeError} If the offset is negative or the access would exceed
 *                      the buffer length.
 */
export function assertBufferAccess(
  buffer: Buffer<ArrayBuffer>,
  offset: number,
  byteLength: number,
  operation: "read" | "write",
): void {
  if (offset < 0) {
    throw new RangeError(
      `Cannot ${operation} ${byteLength} byte(s) at offset ${offset}: ` +
        `offset cannot be negative`,
    );
  }

  if (offset + byteLength > buffer.length) {
    throw new RangeError(
      `Cannot ${operation} ${byteLength} byte(s) at offset ${offset}: ` +
        `it exceeds the buffer size (${buffer.length} bytes)`,
    );
  }
}

/**
 * Type invariant. Ensures a value is a finite integer (rejects fractional
 * values, `NaN` and `Infinity`). It is agnostic of the buffer and the range.
 *
 * @throws {TypeError} If the value is not an integer.
 */
export function assertIntegerNumber(value: number): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Expected an integer, received: ${value}`);
  }
}

/**
 * Range invariant. Ensures a numeric value falls within the inclusive
 * `[minRange, maxRange]` interval of the given type. It is agnostic of the
 * buffer and of the value's integer/float nature.
 *
 * @throws {OutOfRangeError} If the value is outside the given range.
 */
export function assertNumberRange(
  value: number,
  typeName: string,
  minRange: number,
  maxRange: number,
): void {
  if (value < minRange || value > maxRange) {
    throw new OutOfRangeError(value, typeName, minRange, maxRange);
  }
}
