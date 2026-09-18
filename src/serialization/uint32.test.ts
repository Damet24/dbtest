import { describe, expect, it } from "vitest";

import { OutOfRangeError } from "../core/errors.js";
import { uint32 } from "./uint32.js";

describe("uint32 codec", () => {
  it("round-trips a value", () => {
    const buffer = Buffer.alloc(4);
    uint32.serialize(12345, buffer, 0);
    expect(uint32.deserialize(buffer, 0)).toBe(12345);
  });

  it("writes the value in little-endian order", () => {
    const buffer = Buffer.alloc(4);
    uint32.serialize(1, buffer, 0);
    expect([...buffer]).toEqual([1, 0, 0, 0]);
  });

  it("accepts the maximum UInt32 value", () => {
    const buffer = Buffer.alloc(4);
    expect(() => uint32.serialize(2 ** 32 - 1, buffer, 0)).not.toThrow();
  });

  it("rejects a value out of range", () => {
    const buffer = Buffer.alloc(4);
    expect(() => uint32.serialize(2 ** 32, buffer, 0)).toThrow(OutOfRangeError);
  });

  it("rejects a non-integer value", () => {
    const buffer = Buffer.alloc(4);
    expect(() => uint32.serialize(1.5, buffer, 0)).toThrow(TypeError);
  });

  it("rejects a buffer that is too small", () => {
    const buffer = Buffer.alloc(2);
    expect(() => uint32.serialize(1, buffer, 0)).toThrow(RangeError);
    expect(() => uint32.deserialize(buffer, 0)).toThrow(RangeError);
  });

  it("rejects a negative offset", () => {
    const buffer = Buffer.alloc(4);
    expect(() => uint32.serialize(1, buffer, -1)).toThrow(RangeError);
  });
});
