import { MAX_UINT16, UINT16_BYTES } from "../core/constants.js";
import type { IntegerSpec } from "./asserts.js";
import { IntegerCodec } from "./integer.js";

/** UInt16: 2 bytes, range `[0, 2^16 - 1]`. */
export const UINT16: IntegerSpec = {
  name: "UInt16",
  bytes: UINT16_BYTES,
  min: 0,
  max: MAX_UINT16,
};

/** Codec for unsigned 16-bit integers. */
export class UInt16Codec extends IntegerCodec {
  override readonly spec: IntegerSpec = UINT16;

  protected override writeToBuffer(
    buffer: Buffer<ArrayBuffer>,
    value: number,
    offset: number,
  ): void {
    buffer.writeUint16LE(value, offset);
  }

  protected override readFromBuffer(
    buffer: Buffer<ArrayBuffer>,
    offset: number,
  ): number {
    return buffer.readUint16LE(offset);
  }
}

/** Shared singleton codec for UInt16 values. */
export const uint16 = new UInt16Codec();
