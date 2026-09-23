import { MAX_UINT8, UINT8_BYTES } from "../core/constants.js";
import type { IntegerSpec } from "./asserts.js";
import { UInt8Codec } from "./uint8.js";

/**
 * Byte: 1 byte, range `[0, 2^8 - 1]`. It is the full byte range, with no
 * narrower restriction.
 */
export const BYTE: IntegerSpec = {
  name: "Byte",
  bytes: UINT8_BYTES,
  min: 0,
  max: MAX_UINT8,
};

/**
 * Codec for a raw single byte.
 *
 * It is functionally identical to {@link UInt8Codec} but is named for fields
 * whose meaning is "one byte" rather than "a number", such as a reserved
 * header byte at the start of a page. It exists so call sites can express
 * that intent, and only overrides the spec name so error messages stay clear.
 */
export class ByteCodec extends UInt8Codec {
  override readonly spec: IntegerSpec = BYTE;
}

/** Shared singleton codec for raw bytes. */
export const byte = new ByteCodec();
