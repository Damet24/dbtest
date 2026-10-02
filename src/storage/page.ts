import {
  CELL_CONTENT_START_OFFSET,
  CELL_COUNT_OFFSET,
  type DbError,
  InvalidCellContentStartError,
  InvalidCellCountError,
  MAX_CELL_COUNT,
  MAX_UINT16,
  MIN_CELL_CONTENT_START,
  PAGE_SIZE,
  PAGE_TYPE_OFFSET,
  type PageID,
} from "../core/index.js";
import { CellPointerArray } from "./cell-pointer-array.js";
import { Cell } from "./cell.js";
import { assertPageType, type PageType } from "./page-type.js";

/**
 * In-memory representation of a single database page.
 *
 * The header keeps the page type, the amount of cells, the offset where the
 * cell content starts, and the cell pointer array. Every setter validates its
 * input and only marks the page as dirty when the write actually happens, so
 * a rejected write never mutates the buffer.
 */
export class Page {
  private _isDirty: boolean;
  private readonly cellPointerArray: CellPointerArray;

  constructor(
    private _id: PageID,
    private data: Buffer<ArrayBuffer>,
  ) {
    this._isDirty = false;
    this.cellPointerArray = new CellPointerArray(
      this.data,
      () => this.cellCount,
      () => this.cellContentStart,
    );
  }

  get isDirty(): boolean {
    return this._isDirty;
  }

  markDirty(): void {
    this._isDirty = true;
  }

  cleanDirty(): void {
    this._isDirty = false;
  }

  getData(): Buffer<ArrayBuffer> {
    return this.data;
  }

  /**
   * Resets the whole page: clears the buffer, sets the page type, and marks
   * the page as dirty so the initialization is persisted.
   *
   * A page read from a zeroed region of the file must be initialized with this
   * method before use, since it sets the cell content start to the end of the
   * page.
   *
   * @param pageType - Type to store in the header.
   */
  reset(pageType: PageType): void {
    assertPageType(pageType);

    this.data.fill(0);
    this.data.writeUint8(pageType, PAGE_TYPE_OFFSET);
    this.data.writeUint16BE(0, CELL_COUNT_OFFSET);
    this.data.writeUint16BE(PAGE_SIZE, CELL_CONTENT_START_OFFSET);
    this._isDirty = true;
  }

  get pageType(): PageType {
    const value = this.data.readUint8(PAGE_TYPE_OFFSET);
    assertPageType(value);
    return value;
  }

  set pageType(value: PageType) {
    assertPageType(value);
    this.data.writeUint8(value, PAGE_TYPE_OFFSET);
    this._isDirty = true;
  }

  get cellCount() {
    return this.data.readUint16BE(CELL_COUNT_OFFSET);
  }

  set cellCount(value: number) {
    this.assertCellCount(value);
    this.data.writeUint16BE(value, CELL_COUNT_OFFSET);
    this._isDirty = true;
  }

  /**
   * Offset of the first byte of the cell content area. Cells are allocated
   * from the end of the page backwards, so this value is the lower bound of
   * every cell offset.
   *
   * A page that has not been initialized yet reads `0`; use {@link reset}
   * before adding cells. Setters validate against this value, so an
   * uninitialized page cannot be corrupted by accident.
   */
  get cellContentStart() {
    return this.data.readUint16BE(CELL_CONTENT_START_OFFSET);
  }

  set cellContentStart(value: number) {
    this.assertCellContentStart(value);
    this.data.writeUint16BE(value, CELL_CONTENT_START_OFFSET);
    this._isDirty = true;
  }

  /**
   * Reads the offset of the cell stored at `index`.
   *
   * @throws {CellPointerIndexOutOfRangeError} If `index` does not address a
   * slot of the cell pointer array.
   */
  getPointer(index: number): number {
    return this.cellPointerArray.getPointer(index);
  }

  /**
   * Stores `offset` as the location of the cell at `index`.
   *
   * @throws {CellPointerIndexOutOfRangeError} If `index` does not address a
   * slot of the cell pointer array.
   * @throws {InvalidCellOffsetError} If `offset` is not a valid cell offset.
   */
  setPointer(index: number, offset: number): void {
    this.cellPointerArray.setPointer(index, offset);
    this._isDirty = true;
  }

  getCell(offset: number) {
    return new Cell(this.data, offset);
  }

  private assertCellCount(value: number): void {
    if (!Number.isInteger(value) || value < 0 || value > MAX_UINT16) {
      throw new InvalidCellCountError(
        `Cell count out of range: ${value}. It must be an integer >= 0 and <= ${MAX_UINT16}.`,
      );
    }

    if (value > MAX_CELL_COUNT) {
      throw new InvalidCellCountError(
        `Cell count out of range: ${value}. The cell pointer array can only hold up to ${MAX_CELL_COUNT} pointers in a ${PAGE_SIZE} bytes page.`,
      );
    }

    this.assertPointerArrayFits(value, this.cellContentStart, InvalidCellCountError);
  }

  private assertCellContentStart(value: number): void {
    if (!Number.isInteger(value) || value < MIN_CELL_CONTENT_START || value > PAGE_SIZE) {
      throw new InvalidCellContentStartError(
        `Cell content start out of range: ${value}. It must be an integer >= ${MIN_CELL_CONTENT_START} (cell pointer array start) and <= ${PAGE_SIZE} (page size).`,
      );
    }

    this.assertPointerArrayFits(this.cellCount, value, InvalidCellContentStartError);
  }

  /**
   * Guarantees the cell pointer array does not overlap the cell content area,
   * which is the invariant that keeps both regions of the page consistent.
   *
   * @param cellCount - Amount of cells the pointer array must hold.
   * @param contentStart - Cell content start to check against.
   * @param ErrorClass - Error to throw when the regions overlap.
   */
  private assertPointerArrayFits(
    cellCount: number,
    contentStart: number,
    ErrorClass: new (message: string) => DbError,
  ): void {
    const pointerArrayEnd = this.cellPointerArray.pointerArrayEnd(cellCount);

    if (pointerArrayEnd > contentStart) {
      throw new ErrorClass(
        `A cell pointer array of ${cellCount} cells ends at ${pointerArrayEnd}, which overlaps the cell content start ${contentStart}. Initialize the page with reset() before adding cells.`,
      );
    }
  }
}
