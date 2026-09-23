import { uint16 } from "../serialization/uint16.js";
import { uint8 } from "../serialization/uint8.js";

/** Kind of database page. Stored as the first byte of a page buffer. */
export const PageType = {
  InteriorIndex: 0,
  InteriorTable: 1,
  LeafIndex: 2,
  LeafTable: 3,
} as const;

/** Numeric values a page type can take. */
export type PageType = (typeof PageType)[keyof typeof PageType];

/**
 * All runtime values a page type byte can hold, derived from the real
 * {@link PageType} object. Using the object as the single source of truth
 * keeps the validation robust if a new (even non-contiguous) variant is
 * added later.
 */
const PAGE_TYPE_VALUES: ReadonlySet<number> = new Set(Object.values(PageType));

/**
 * Guarantees that a value is one of the declared {@link PageType} variants.
 * A plain range check (`0..3`) would break the moment a new value is added,
 * so membership is checked against the actual {@link PageType} object.
 *
 * @throws {RangeError} If the value is not a known page type.
 */
function assertValidPageType(value: number): asserts value is PageType {
  if (!PAGE_TYPE_VALUES.has(value)) {
    throw new RangeError(`Unknown page type: ${value}`);
  }
}

/**
 * Reads the fixed-size header at the start of a page buffer.
 *
 * The header stores the page's type in the first byte. Its byte offsets are
 * kept here in one place so the rest of the engine can reference them
 * directly from a {@link PageHeader} instance.
 */
export class PageHeader {
  /** Offset of the page type byte. */
  static readonly PAGE_TYPE_OFFSET = 0;

  /** Offset of the record count byte. */
  static readonly RECORD_COUNT_OFFSET = 1;

  /** Offset where the cell counter starts. */
  static readonly CELL_COUNTER_START_OFFSET = 3;

  /**
   * Creates a header view over a page buffer.
   *
   * @param buffer - The raw page buffer whose first bytes form the header.
   */
  constructor(private buffer: Buffer<ArrayBuffer>) {}

  /**
   * Reads the page type stored in the header, validating it against the
   * declared {@link PageType} variants.
   *
   * @returns The {@link PageType} stored in the first byte.
   * @throws {RangeError} If the stored value is not a known page type.
   */
  get pageType(): PageType {
    const value = uint8.deserialize(this.buffer, PageHeader.PAGE_TYPE_OFFSET);
    assertValidPageType(value);
    return value;
  }

  set pageType(value: PageType) {
    assertValidPageType(value);
    uint8.serialize(value, this.buffer, PageHeader.PAGE_TYPE_OFFSET);
  }

  get recordCount() {
    return uint16.deserialize(this.buffer, PageHeader.RECORD_COUNT_OFFSET);
  }

  set recordCount(value: number) {
    uint16.serialize(value, this.buffer, PageHeader.RECORD_COUNT_OFFSET);
  }

  get cellContentStart() {
    return uint16.deserialize(this.buffer, PageHeader.CELL_COUNTER_START_OFFSET);
  }

  set cellContentStart(value: number) {
    uint16.serialize(value, this.buffer, PageHeader.CELL_COUNTER_START_OFFSET);
  }
}
