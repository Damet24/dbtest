/** Default page size in bytes (4 KB). All pages are fixed to this size. */
export const PAGE_SIZE = 4096;

/** Number of bytes used to encode a UInt8 value. */
export const UINT8_BYTES = 8 / 8;

/** Maximum value representable by an unsigned 8-bit integer. */
export const MAX_UINT8 = Math.pow(2, 8) - 1;

/** Number of bytes used to encode a UInt32 value. */
export const UINT32_BYTES = 32 / 8;

/** Maximum value representable by an unsigned 32-bit integer. */
export const MAX_UINT32 = Math.pow(2, 32) - 1;

/** Number of bytes used to encode a UInt16 value. */
export const UINT16_BYTES = 16 / 8;

/** Maximum value representable by an unsigned 16-bit integer. */
export const MAX_UINT16 = Math.pow(2, 16) - 1;
