import {
  assertBufferAccess,
  assertIntegerNumber,
  assertNumberRange,
  type IntegerSpec,
} from "./asserts.js";

/**
 * Abstract base class for fixed-width integer codecs.
 *
 * Subclasses only declare their type metadata (via {@link spec}) and the raw
 * byte read/write for their width; the three invariants (buffer, type and
 * range) are enforced once, here, for every integer type.
 *
 * Adding a new integer (UInt16, Int32, ...) is therefore reduced to:
 *   1. declaring an {@link IntegerSpec},
 *   2. implementing {@link readFromBuffer} / {@link writeToBuffer}.
 */
export abstract class IntegerCodec {
  /** Metadata describing the encoded type (name, width and value range). */
  abstract readonly spec: IntegerSpec;

  /**
   * Writes the raw value into the buffer. Type-specific (width/signedness).
   *
   * @param buffer - Destination buffer.
   * @param value - The value to encode.
   * @param offset - Byte offset within the buffer.
   */
  protected abstract writeToBuffer(
    buffer: Buffer<ArrayBuffer>,
    value: number,
    offset: number,
  ): void;

  /**
   * Reads the raw value from the buffer. Type-specific (width/signedness).
   *
   * @param buffer - Source buffer.
   * @param offset - Byte offset within the buffer.
   * @returns The decoded value.
   */
  protected abstract readFromBuffer(
    buffer: Buffer<ArrayBuffer>,
    offset: number,
  ): number;

  /**
   * Serializes a value into the buffer after validating the three
   * invariants independently (buffer capacity, integer type, value range).
   *
   * @param value - The integer to encode.
   * @param buffer - Destination buffer.
   * @param offset - Byte offset within the buffer.
   */
  serialize(value: number, buffer: Buffer<ArrayBuffer>, offset: number): void {
    assertBufferAccess(buffer, offset, this.spec.bytes, "write");
    assertIntegerNumber(value);
    assertNumberRange(value, this.spec.name, this.spec.min, this.spec.max);
    this.writeToBuffer(buffer, value, offset);
  }

  /**
   * Deserializes a value from the buffer after validating the buffer
   * capacity invariant.
   *
   * @param buffer - Source buffer.
   * @param offset - Byte offset within the buffer.
   * @returns The decoded integer.
   */
  deserialize(buffer: Buffer<ArrayBuffer>, offset: number): number {
    assertBufferAccess(buffer, offset, this.spec.bytes, "read");
    return this.readFromBuffer(buffer, offset);
  }
}
