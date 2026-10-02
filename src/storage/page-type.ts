import { InvalidPageTypeError } from "../core/index.js";

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
 * {@link PageType} object. Using the object as the single source of truth keeps
 * the validation correct if a new (even non-contiguous) variant is added later.
 */
const PAGE_TYPE_VALUES: ReadonlySet<number> = new Set(Object.values(PageType));

/** Type guard telling whether a value is one of the declared page types. */
export function isPageType(value: number): value is PageType {
  return PAGE_TYPE_VALUES.has(value);
}

/**
 * Guarantees that a value is one of the declared {@link PageType} variants.
 * A plain range check (`0..3`) would break the moment a new value is added,
 * so membership is checked against the actual {@link PageType} object.
 *
 * @throws {InvalidPageTypeError} If the value is not a known page type.
 */
export function assertPageType(value: number): asserts value is PageType {
  if (!isPageType(value)) {
    throw new InvalidPageTypeError(
      `Unknown page type: ${value}. Expected one of: ${[...PAGE_TYPE_VALUES].join(", ")}.`,
    );
  }
}
