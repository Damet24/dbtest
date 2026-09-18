import { describe, expect, it } from "vitest";

import { OutOfRangeError } from "../core/errors.js";
import {
  assertBufferAccess,
  assertIntegerNumber,
  assertNumberRange,
} from "./asserts.js";

describe("assertBufferAccess (buffer invariant)", () => {
  it("accepts an access that fits exactly", () => {
    const buffer = Buffer.alloc(4);
    expect(() => assertBufferAccess(buffer, 0, 4, "read")).not.toThrow();
  });

  it("accepts an access that ends before the buffer end", () => {
    const buffer = Buffer.alloc(8);
    expect(() => assertBufferAccess(buffer, 2, 4, "write")).not.toThrow();
  });

  it("rejects a negative offset", () => {
    const buffer = Buffer.alloc(4);
    expect(() => assertBufferAccess(buffer, -1, 4, "read")).toThrow(RangeError);
  });

  it("rejects an access that exceeds the buffer length", () => {
    const buffer = Buffer.alloc(4);
    expect(() => assertBufferAccess(buffer, 1, 4, "write")).toThrow(RangeError);
  });

  it("is generic over the byte width (works for future UInt16)", () => {
    const buffer = Buffer.alloc(4);
    expect(() => assertBufferAccess(buffer, 3, 2, "read")).toThrow(RangeError);
    expect(() => assertBufferAccess(buffer, 2, 2, "read")).not.toThrow();
  });
});

describe("assertIntegerNumber (type invariant)", () => {
  it("accepts whole numbers, including zero and negatives", () => {
    expect(() => assertIntegerNumber(0)).not.toThrow();
    expect(() => assertIntegerNumber(-5)).not.toThrow();
    expect(() => assertIntegerNumber(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it("rejects fractional values", () => {
    expect(() => assertIntegerNumber(1.5)).toThrow(TypeError);
  });

  it("rejects NaN and Infinity", () => {
    expect(() => assertIntegerNumber(NaN)).toThrow(TypeError);
    expect(() => assertIntegerNumber(Infinity)).toThrow(TypeError);
  });
});

describe("assertNumberRange (range invariant)", () => {
  it("accepts the inclusive boundaries", () => {
    expect(() => assertNumberRange(0, "UInt32", 0, 100)).not.toThrow();
    expect(() => assertNumberRange(100, "UInt32", 0, 100)).not.toThrow();
  });

  it("rejects values below the minimum", () => {
    expect(() => assertNumberRange(-1, "UInt32", 0, 100)).toThrow(
      OutOfRangeError,
    );
  });

  it("rejects values above the maximum", () => {
    expect(() => assertNumberRange(101, "UInt32", 0, 100)).toThrow(
      OutOfRangeError,
    );
  });
});
