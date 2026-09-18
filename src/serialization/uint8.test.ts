import { describe, expect, it } from "vitest";

import { OutOfRangeError } from "../core/errors.js";
import { uint8 } from "./uint8.js";

describe("uint8 codec", () => {
  it("round-trips a value", () => {
    const buffer = Buffer.alloc(1);
    uint8.serialize(200, buffer, 0);
    expect(uint8.deserialize(buffer, 0)).toBe(200);
  });

  it("writes a single byte", () => {
    const buffer = Buffer.alloc(1);
    uint8.serialize(1, buffer, 0);
    expect([...buffer]).toEqual([1]);
  });

  it("accepts the maximum UInt8 value", () => {
    const buffer = Buffer.alloc(1);
    expect(() => uint8.serialize(2 ** 8 - 1, buffer, 0)).not.toThrow();
  });

  it("rejects a value out of range", () => {
    const buffer = Buffer.alloc(1);
    expect(() => uint8.serialize(2 ** 8, buffer, 0)).toThrow(OutOfRangeError);
  });

  it("rejects a buffer that is too small", () => {
    const buffer = Buffer.alloc(0);
    expect(() => uint8.serialize(1, buffer, 0)).toThrow(RangeError);
    expect(() => uint8.deserialize(buffer, 0)).toThrow(RangeError);
  });
});
