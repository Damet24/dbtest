import { describe, expect, it } from "vitest";

import { OutOfRangeError } from "../core/errors.js";
import { byte } from "./byte.js";

describe("byte codec", () => {
  it("round-trips a value", () => {
    const buffer = Buffer.alloc(1);
    byte.serialize(200, buffer, 0);
    expect(byte.deserialize(buffer, 0)).toBe(200);
  });

  it("reserves the first byte without touching the rest of the buffer", () => {
    const buffer = Buffer.alloc(4);
    byte.serialize(3, buffer, 0);
    expect([...buffer]).toEqual([3, 0, 0, 0]);
  });

  it("accepts the values 0 to 4", () => {
    for (let value = 0; value <= 4; value++) {
      const buffer = Buffer.alloc(1);
      byte.serialize(value, buffer, 0);
      expect(byte.deserialize(buffer, 0)).toBe(value);
    }
  });

  it("accepts the maximum byte value", () => {
    const buffer = Buffer.alloc(1);
    expect(() => byte.serialize(2 ** 8 - 1, buffer, 0)).not.toThrow();
  });

  it("rejects a value out of range", () => {
    const buffer = Buffer.alloc(1);
    expect(() => byte.serialize(2 ** 8, buffer, 0)).toThrow(OutOfRangeError);
  });

  it("rejects a buffer that is too small", () => {
    const buffer = Buffer.alloc(0);
    expect(() => byte.serialize(1, buffer, 0)).toThrow(RangeError);
    expect(() => byte.deserialize(buffer, 0)).toThrow(RangeError);
  });
});
