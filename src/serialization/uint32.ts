import { MAX_UINT32, UINT32_BYTES } from "../core/constants.js";
import type { IntegerSpec } from "./asserts.js";
import { IntegerCodec } from "./integer.js";

/** UInt32: 4 bytes, range `[0, 2^32 - 1]`. */
export const UINT32: IntegerSpec = {
  name: "UInt32",
  bytes: UINT32_BYTES,
  min: 0,
  max: MAX_UINT32,
};

/** Codec for unsigned 32-bit integers. */
export class UInt32Codec extends IntegerCodec {
  override readonly spec: IntegerSpec = UINT32;

  protected override writeToBuffer(
    buffer: Buffer<ArrayBuffer>,
    value: number,
    offset: number,
  ): void {
    buffer.writeUint32LE(value, offset);
  }

  protected override readFromBuffer(
    buffer: Buffer<ArrayBuffer>,
    offset: number,
  ): number {
    return buffer.readUint32LE(offset);
  }
}

/** Shared singleton codec for UInt32 values. */
export const uint32 = new UInt32Codec();
