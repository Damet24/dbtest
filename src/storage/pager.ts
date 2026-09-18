import fs from "node:fs/promises";

import { PAGE_SIZE } from "../core/constants.js";
import { Page } from "./page.js";

/**
 * Pager handles low-level disk I/O for reading and writing fixed-size pages
 * to a database file. It acts as the interface between the buffer pool and
 * the physical storage, abstracting all file offset calculations.
 *
 * The Pager is responsible for moving bytes; it delivers and accepts higher
 * level {@link Page} objects (bytes + page id + dirty flag) instead of raw
 * buffers, so callers never deal with offsets or sizes.
 *
 * Each page is identified by a 0-based page ID. The on-disk offset for a
 * page is computed as `pageId * PAGE_SIZE`.
 */
export class Pager {
  /** File handle to the underlying database file, or null if not opened. */
  private file: null | fs.FileHandle;

  /**
   * Creates a new Pager instance for the given file path.
   * The file is not opened until {@link open} is called.
   *
   * @param filename - Path to the database file on disk.
   */
  constructor(private filename: string) {
    this.filename = filename;
    this.file = null;
  }

  /**
   * Opens the database file for reading and writing.
   * Creates the file if it does not already exist.
   *
   * @throws If the file cannot be opened.
   */
  async open() {
    this.file = await fs.open(this.filename, "a+");
  }

  /**
   * Reads a single page from disk.
   *
   * @param pageId - The 0-based identifier of the page to read.
   * @returns A {@link Page} with the data read, or `undefined` if the file
   *          is not open.
   */
  async readPage(pageId: number): Promise<Page | undefined> {
    if (!this.file) return undefined;

    const data = Buffer.alloc(PAGE_SIZE);
    const offset = pageId * PAGE_SIZE;

    await this.file.read(data, 0, PAGE_SIZE, offset);

    return new Page(pageId, data);
  }

  /**
   * Writes a page's data to its location on disk.
   *
   * @param page - The page to write; its id determines the disk offset.
   * @returns `true` if the write succeeded, `false` if the file is not open.
   */
  async writePage(page: Page): Promise<boolean> {
    if (!this.file) return false;

    const offset = page.pageId * PAGE_SIZE;

    await this.file.write(page.data, 0, PAGE_SIZE, offset);

    return true;
  }

  /**
   * Closes the underlying file handle, releasing system resources.
   * Safe to call even if the file was never opened.
   */
  async close() {
    await this.file?.close();
  }
}
