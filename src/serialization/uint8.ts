import { MAX_UINT8, UINT8_BYTES } from "../core/constants.js";
import type { IntegerSpec } from "./asserts.js";
import { IntegerCodec } from "./integer.js";

/** UInt8: 1 byte, range `[0, 2^8 - 1]`. */
export const UINT8: IntegerSpec = {
  name: "UInt8",
  bytes: UINT8_BYTES,
  min: 0,
  max: MAX_UINT8,
};

/** Codec for unsigned 8-bit integers. */
export class UInt8Codec extends IntegerCodec {
  override readonly spec: IntegerSpec = UINT8;

  protected override writeToBuffer(
    buffer: Buffer<ArrayBuffer>,
    value: number,
    offset: number,
  ): void {
    buffer.writeUInt8(value, offset);
  }

  protected override readFromBuffer(
    buffer: Buffer<ArrayBuffer>,
    offset: number,
  ): number {
    return buffer.readUInt8(offset);
  }
}

/** Shared singleton codec for UInt8 values. */
export const uint8 = new UInt8Codec();
