import { describe, expect, it } from "vitest";

import { OutOfRangeError } from "../core/errors.js";
import { uint16 } from "./uint16.js";

describe("uint16 codec", () => {
  it("round-trips a value", () => {
    const buffer = Buffer.alloc(2);
    uint16.serialize(12345, buffer, 0);
    expect(uint16.deserialize(buffer, 0)).toBe(12345);
  });

  it("writes the value in little-endian order", () => {
    const buffer = Buffer.alloc(2);
    uint16.serialize(1, buffer, 0);
    expect([...buffer]).toEqual([1, 0]);
  });

  it("accepts the maximum UInt16 value", () => {
    const buffer = Buffer.alloc(2);
    expect(() => uint16.serialize(2 ** 16 - 1, buffer, 0)).not.toThrow();
  });

  it("rejects a value out of range", () => {
    const buffer = Buffer.alloc(2);
    expect(() => uint16.serialize(2 ** 16, buffer, 0)).toThrow(OutOfRangeError);
  });

  it("rejects a buffer that is too small", () => {
    const buffer = Buffer.alloc(1);
    expect(() => uint16.serialize(1, buffer, 0)).toThrow(RangeError);
    expect(() => uint16.deserialize(buffer, 0)).toThrow(RangeError);
  });
});
