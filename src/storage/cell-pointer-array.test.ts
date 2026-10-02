import { describe, expect, it } from "vitest";

import {
  CellPointerIndexOutOfRangeError,
  InvalidCellOffsetError,
  MAX_UINT16,
  PAGE_SIZE,
} from "../core/index.js";
import { CellPointerArray } from "./cell-pointer-array.js";

function createArray(
  cellCount: () => number,
  cellContentStart: () => number = () => PAGE_SIZE,
): { data: Buffer<ArrayBuffer>; pointers: CellPointerArray } {
  const data = Buffer.alloc(PAGE_SIZE);
  const pointers = new CellPointerArray(data, cellCount, cellContentStart);
  return { data, pointers };
}

describe("CellPointerArray", () => {
  it("stores and reads back the offsets", () => {
    const { data, pointers } = createArray(() => 3, () => PAGE_SIZE - 16);

    pointers.setPointer(0, PAGE_SIZE - 16);
    pointers.setPointer(2, PAGE_SIZE - 4);

    expect(pointers.getPointer(0)).toBe(PAGE_SIZE - 16);
    expect(pointers.getPointer(1)).toBe(0);
    expect(pointers.getPointer(2)).toBe(PAGE_SIZE - 4);
    expect(data.readUint16BE(5)).toBe(PAGE_SIZE - 16);
  });

  it("rejects indexes outside the array", () => {
    const { pointers } = createArray(() => 2);

    expect(() => pointers.getPointer(2)).toThrowError(
      CellPointerIndexOutOfRangeError,
    );
    expect(() => pointers.getPointer(-1)).toThrowError(
      /index out of range: -1/,
    );
    expect(() => pointers.getPointer(0.5)).toThrowError(
      /must be an integer/,
    );
    expect(() => pointers.setPointer(2, PAGE_SIZE - 1)).toThrowError(
      CellPointerIndexOutOfRangeError,
    );
  });

  it("rejects every index while the cell count is zero", () => {
    const { pointers } = createArray(() => 0);

    expect(() => pointers.getPointer(0)).toThrowError(
      CellPointerIndexOutOfRangeError,
    );
  });

  it("rejects offsets that do not fit in a uint16", () => {
    const { pointers } = createArray(() => 1, () => 0);

    expect(() => pointers.setPointer(0, MAX_UINT16 + 1)).toThrowError(
      InvalidCellOffsetError,
    );
    expect(() => pointers.setPointer(0, -1)).toThrowError(
      /It must be an integer >= 0/,
    );
    expect(() => pointers.setPointer(0, 1.5)).toThrowError(
      /It must be an integer >= 0/,
    );
  });

  it("rejects offsets outside the cell content area", () => {
    const { pointers } = createArray(() => 1, () => PAGE_SIZE - 8);

    expect(() => pointers.setPointer(0, PAGE_SIZE - 9)).toThrowError(
      InvalidCellOffsetError,
    );
    expect(() => pointers.setPointer(0, PAGE_SIZE)).toThrowError(
      /It must be >= 4088 \(cell content start\) and < 4096/,
    );
  });

  it("does not write when the offset is rejected", () => {
    const { pointers } = createArray(() => 1, () => PAGE_SIZE - 8);
    pointers.setPointer(0, PAGE_SIZE - 8);

    expect(() => pointers.setPointer(0, 0)).toThrow();

    expect(pointers.getPointer(0)).toBe(PAGE_SIZE - 8);
  });

  it("reads the cell count lazily", () => {
    let cellCount = 0;
    const { pointers } = createArray(() => cellCount, () => PAGE_SIZE - 8);

    expect(() => pointers.getPointer(0)).toThrow();

    cellCount = 1;
    pointers.setPointer(0, PAGE_SIZE - 8);

    expect(pointers.getPointer(0)).toBe(PAGE_SIZE - 8);
  });

  it("reports where the array ends for a given cell count", () => {
    const { pointers } = createArray(() => 0);

    expect(pointers.pointerArrayEnd(0)).toBe(5);
    expect(pointers.pointerArrayEnd(3)).toBe(11);
  });
});
