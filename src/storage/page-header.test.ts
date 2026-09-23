import { describe, expect, it } from "vitest";

import { PageHeader, PageType } from "./page-header.js";

function makeHeader(type?: number): PageHeader {
  const buffer = Buffer.alloc(10);
  if (type !== undefined) buffer.writeUInt8(type, 0);
  return new PageHeader(buffer);
}

describe("PageHeader - pageType", () => {
  it("reads each declared page type from the first byte", () => {
    for (const type of Object.values(PageType)) {
      expect(makeHeader(type).pageType).toBe(type);
    }
  });

  it("rejects an unknown value when reading", () => {
    const header = makeHeader(4);
    expect(() => header.pageType).toThrow(RangeError);
  });

  it("rejects a value outside the byte when reading", () => {
    const header = makeHeader(255);
    expect(() => header.pageType).toThrow(RangeError);
  });

  it("writes a valid page type", () => {
    const buffer = Buffer.alloc(10);
    const header = new PageHeader(buffer);

    header.pageType = PageType.LeafTable;
    expect(header.pageType).toBe(PageType.LeafTable);
  });

  it("rejects writing an unknown page type", () => {
    const header = makeHeader();
    expect(() => {
      header.pageType = 7;
    }).toThrow(RangeError);
  });
});