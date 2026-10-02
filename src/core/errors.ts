/**
 * Base class for every error raised by the database engine, so callers can
 * catch engine failures with a single `catch (error) { if (error instanceof
 * DbError) ... }` without having to know the concrete error type.
 */
export class DbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Thrown when a page type byte does not match one of the declared
 * {@link PageType} variants.
 */
export class InvalidPageTypeError extends DbError {}

/**
 * Thrown when a cell count is not a non-negative integer, does not fit in its
 * UInt16 field, or would make the cell pointer array overlap the cell content
 * area of the page.
 */
export class InvalidCellCountError extends DbError {}

/**
 * Thrown when the cell content start is not a non-negative integer, falls
 * outside the page, or would make the cell pointer array overlap it.
 */
export class InvalidCellContentStartError extends DbError {}

/**
 * Thrown when a cell pointer index is not a non-negative integer smaller than
 * the cell count, i.e. when it does not address a slot of the cell pointer
 * array.
 */
export class CellPointerIndexOutOfRangeError extends DbError {}

/**
 * Thrown when a cell offset falls outside the cell content area of the page
 * `[cellContentStart, PAGE_SIZE)`.
 */
export class InvalidCellOffsetError extends DbError {}
