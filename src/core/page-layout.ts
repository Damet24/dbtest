import { PAGE_SIZE } from "./constants.js";

/**
 * Byte layout of the page header:
 *
 * ```text
 * 0        1        3        5                      cellContentStart        PAGE_SIZE
 * +--------+--------+--------+-----------------------+------------------------+
 * |  type  | cellCount (u16) |   cell pointer array   |       cell content      |
 * +--------+--------+--------+-----------------------+------------------------+
 * ```
 */

/** Byte offset of the page type. */
export const PAGE_TYPE_OFFSET = 0;

/** Byte offset of the cell count (UInt16). */
export const CELL_COUNT_OFFSET = 1;

/** Byte offset of the cell content start (UInt16). */
export const CELL_CONTENT_START_OFFSET = 3;

/** Byte offset where the cell pointer array starts. */
export const CELL_POINTER_ARRAY_OFFSET = 5;

/** Size in bytes of a single cell pointer entry (UInt16). */
export const CELL_POINTER_BYTE_SIZE = 2;

/** Lowest value the cell content start can take: the end of the header. */
export const MIN_CELL_CONTENT_START = CELL_POINTER_ARRAY_OFFSET;

/**
 * Maximum number of cells a page can hold, bounded by how many pointers fit
 * before the end of the page. The effective limit is usually lower, because
 * the cell pointer array must also fit before the cell content start.
 */
export const MAX_CELL_COUNT = Math.floor(
  (PAGE_SIZE - CELL_POINTER_ARRAY_OFFSET) / CELL_POINTER_BYTE_SIZE,
);
