import { describe, expect, it } from "vitest";

import {
  DbError,
  InvalidCellContentStartError,
  InvalidPageTypeError,
  MAX_CELL_COUNT,
  MAX_UINT16,
  PAGE_SIZE,
  type PageID,
} from "../core/index.js";
import { Page } from "./page.js";
import { PageType } from "./page-type.js";

function createPage(pageId: PageID = 0): Page {
  const page = new Page(pageId, Buffer.alloc(PAGE_SIZE));
  page.reset(PageType.LeafTable);
  page.cleanDirty();
  return page;
}

describe("Page.reset", () => {
  it("initializes the header and leaves the page dirty", () => {
    const page = new Page(0, Buffer.alloc(PAGE_SIZE));

    page.reset(PageType.LeafIndex);

    expect(page.pageType).toBe(PageType.LeafIndex);
    expect(page.cellCount).toBe(0);
    expect(page.cellContentStart).toBe(PAGE_SIZE);
    expect(page.isDirty).toBe(true);
  });

  it("clears the previous content of the page", () => {
    const page = createPage();
    page.cellContentStart = PAGE_SIZE - 10;
    page.getData().write("stale", PAGE_SIZE - 5, "ascii");

    page.reset(PageType.InteriorTable);

    expect(page.getData().subarray(PAGE_SIZE - 5).toString("ascii")).toBe(
      "\0\0\0\0\0",
    );
    expect(page.cellContentStart).toBe(PAGE_SIZE);
  });
});

describe("Page.pageType", () => {
  it("reads and writes the page type", () => {
    const page = createPage();

    page.pageType = PageType.InteriorIndex;

    expect(page.pageType).toBe(PageType.InteriorIndex);
    expect(page.isDirty).toBe(true);
  });

  it("rejects unknown page types", () => {
    const page = createPage();

    expect(() => {
      page.pageType = 42 as PageType;
    }).toThrowError(InvalidPageTypeError);
  });

  it("throws when the stored page type is not a known one", () => {
    const page = createPage();
    page.getData().writeUint8(99, 0);

    expect(() => page.pageType).toThrowError(/Unknown page type: 99/);
  });

  it("does not mutate the page when the value is rejected", () => {
    const page = createPage();

    expect(() => {
      page.pageType = 7 as PageType;
    }).toThrow();
    expect(page.pageType).toBe(PageType.LeafTable);
    expect(page.isDirty).toBe(false);
  });
});

describe("Page.cellCount", () => {
  it("reads and writes the cell count", () => {
    const page = createPage();

    page.cellCount = 3;

    expect(page.cellCount).toBe(3);
    expect(page.isDirty).toBe(true);
  });

  it.each([-1, 1.5, Number.NaN, MAX_UINT16 + 1])(
    "rejects the out of range value %s",
    (value) => {
      const page = createPage();

      expect(() => {
        page.cellCount = value;
      }).toThrowError(/Cell count out of range/);
      expect(page.cellCount).toBe(0);
    },
  );

  it("rejects more cells than the pointer array can hold", () => {
    const page = createPage();

    expect(() => {
      page.cellCount = MAX_CELL_COUNT + 1;
    }).toThrowError(/can only hold up to/);
  });

  it("rejects a cell count that would overlap the cell content area", () => {
    const page = createPage();
    page.cellContentStart = 8;

    expect(() => {
      page.cellCount = 3;
    }).toThrowError(/overlaps the cell content start/);
  });
});

describe("Page.cellContentStart", () => {
  it("reads and writes the cell content start", () => {
    const page = createPage();

    page.cellContentStart = PAGE_SIZE - 16;

    expect(page.cellContentStart).toBe(PAGE_SIZE - 16);
  });

  it.each([-1, 1.5, PAGE_SIZE + 1])(
    "rejects the out of range value %s",
    (value) => {
      const page = createPage();

      expect(() => {
        page.cellContentStart = value;
      }).toThrowError(/Cell content start out of range/);
      expect(page.cellContentStart).toBe(PAGE_SIZE);
    },
  );

  it("rejects a value that would swallow the cell pointer array", () => {
    const page = createPage();
    page.cellCount = 2;

    expect(() => {
      page.cellContentStart = 8;
    }).toThrowError(InvalidCellContentStartError);
  });
});

describe("Page cell pointers", () => {
  it("stores and reads back the cell offsets", () => {
    const page = createPage();
    page.cellCount = 3;
    page.cellContentStart = PAGE_SIZE - 16;

    page.setPointer(0, PAGE_SIZE - 16);
    page.setPointer(2, PAGE_SIZE - 4);

    expect(page.getPointer(0)).toBe(PAGE_SIZE - 16);
    expect(page.getPointer(1)).toBe(0);
    expect(page.getPointer(2)).toBe(PAGE_SIZE - 4);
    expect(page.isDirty).toBe(true);
  });

  it("keeps the cell content start and the pointers in sync", () => {
    const page = createPage();
    page.cellCount = 1;
    page.cellContentStart = PAGE_SIZE - 8;

    page.setPointer(0, PAGE_SIZE - 8);

    expect(page.getPointer(0)).toBe(PAGE_SIZE - 8);
  });

  it.each([-1, 1.5, 1])("rejects the out of range index %s", (index) => {
    const page = createPage();
    page.cellCount = 1;

    expect(() => page.getPointer(index)).toThrowError(
      /Cell pointer index out of range/,
    );
    expect(() => page.setPointer(index, PAGE_SIZE - 1)).toThrowError(
      /Cell pointer index out of range/,
    );
  });

  it.each([PAGE_SIZE, PAGE_SIZE + 1, -1])(
    "rejects the out of range offset %s",
    (offset) => {
      const page = createPage();
      page.cellCount = 1;

      expect(() => page.setPointer(0, offset)).toThrowError(
        /Cell offset out of range/,
      );
    },
  );

  it("rejects an offset before the cell content start", () => {
    const page = createPage();
    page.cellCount = 1;
    page.cellContentStart = PAGE_SIZE - 8;

    expect(() => page.setPointer(0, PAGE_SIZE - 9)).toThrowError(
      /Cell offset out of range/,
    );
  });

  it("does not mutate the page when the pointer is rejected", () => {
    const page = createPage();
    page.cellCount = 1;
    page.cellContentStart = PAGE_SIZE - 4;
    page.setPointer(0, PAGE_SIZE - 4);
    page.cleanDirty();

    expect(() => page.setPointer(0, PAGE_SIZE)).toThrow();

    expect(page.getPointer(0)).toBe(PAGE_SIZE - 4);
    expect(page.isDirty).toBe(false);
  });

  it("requires the page to be initialized before adding cells", () => {
    const page = new Page(0, Buffer.alloc(PAGE_SIZE));

    expect(() => {
      page.cellCount = 1;
    }).toThrowError(/Initialize the page with reset\(\)/);
  });
});

describe("Page errors", () => {
  it("are all instances of DbError", () => {
    const page = createPage();

    try {
      page.setPointer(0, 0);
      expect.unreachable("setPointer should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DbError);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe("CellPointerIndexOutOfRangeError");
    }
  });
});
