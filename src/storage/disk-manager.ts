import type { PathLike } from "node:fs";
import fs from "node:fs/promises";

import { PAGE_SIZE, type PageID } from "../core/index.js";

/** Owns the database file and performs raw page reads/writes. */
export class DiskManager {
  private fileHandle: fs.FileHandle;

  private constructor(
    public dbFilePath: PathLike,
    fileHandle: fs.FileHandle,
  ) {
    this.fileHandle = fileHandle;
  }

  static async create(dbFilePath: PathLike): Promise<DiskManager> {
    const fileHandle = await fs.open(dbFilePath, "r+");
    return new DiskManager(dbFilePath, fileHandle);
  }

  async readPage(pageId: PageID): Promise<Buffer<ArrayBuffer>> {
    const buffer = Buffer.alloc(PAGE_SIZE);
    const offset = pageId * PAGE_SIZE;

    await this.fileHandle.read(buffer, 0, PAGE_SIZE, offset);
    return buffer;
  }

  async writePage(pageId: PageID, buffer: Buffer<ArrayBuffer>): Promise<void> {
    const offset = pageId * PAGE_SIZE;
    await this.fileHandle.write(buffer, 0, PAGE_SIZE, offset);
  }

  async close(): Promise<void> {
    await this.fileHandle.close();
  }
}
