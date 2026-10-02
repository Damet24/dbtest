import {
  CELL_POINTER_ARRAY_OFFSET,
  CELL_POINTER_BYTE_SIZE,
  CellPointerIndexOutOfRangeError,
  InvalidCellOffsetError,
  MAX_UINT16,
  PAGE_SIZE,
} from "../core/index.js";

/**
 * View over the cell pointer array of a page.
 *
 * The array is not stored as a JS array: every entry is a UInt16 inside the
 * page buffer, right after the header. The class receives accessors to the
 * header fields it needs to validate an access, so it never duplicates header
 * state.
 */
export class CellPointerArray {
  constructor(
    private readonly data: Buffer<ArrayBuffer>,
    private readonly getCellCount: () => number,
    private readonly getCellContentStart: () => number,
  ) {}

  /**
   * Reads the offset of the cell stored at `index`.
   *
   * @throws {CellPointerIndexOutOfRangeError} If `index` does not address a
   * slot of the array.
   */
  getPointer(index: number): number {
    this.assertIndex(index);
    return this.data.readUint16BE(this.pointerOffset(index));
  }

  /**
   * Stores `offset` as the location of the cell at `index`.
   *
   * @throws {CellPointerIndexOutOfRangeError} If `index` does not address a
   * slot of the array.
   * @throws {InvalidCellOffsetError} If `offset` is not a valid cell offset.
   */
  setPointer(index: number, offset: number): void {
    this.assertIndex(index);
    this.assertOffset(offset);
    this.data.writeUint16BE(offset, this.pointerOffset(index));
  }

  /**
   * Byte offset where the array would end if it held `cellCount` entries.
   * Used by the page to guarantee the array does not overlap the cell content
   * area when the header changes.
   */
  pointerArrayEnd(cellCount: number): number {
    return this.pointerOffset(cellCount);
  }

  /** Byte offset of the entry for `index` inside the page buffer. */
  private pointerOffset(index: number): number {
    return CELL_POINTER_ARRAY_OFFSET + CELL_POINTER_BYTE_SIZE * index;
  }

  private assertIndex(index: number): void {
    const cellCount = this.getCellCount();

    if (!Number.isInteger(index) || index < 0 || index >= cellCount) {
      throw new CellPointerIndexOutOfRangeError(
        `Cell pointer index out of range: ${index}. It must be an integer >= 0 and < ${cellCount} (cell count).`,
      );
    }
  }

  private assertOffset(offset: number): void {
    if (!Number.isInteger(offset) || offset < 0 || offset > MAX_UINT16) {
      throw new InvalidCellOffsetError(
        `Cell offset out of range: ${offset}. It must be an integer >= 0 and <= ${MAX_UINT16} (uint16).`,
      );
    }

    const contentStart = this.getCellContentStart();

    if (offset < contentStart || offset >= PAGE_SIZE) {
      throw new InvalidCellOffsetError(
        `Cell offset out of range: ${offset}. It must be >= ${contentStart} (cell content start) and < ${PAGE_SIZE} (page size).`,
      );
    }
  }
}
