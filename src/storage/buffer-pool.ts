import { type PageID } from "../core/index.js";
import type { DiskManager } from "./disk-manager.js";
import { Page } from "./page.js";

/** Caches pages in memory using a simple LRU eviction policy. */
export class BufferPool {
  diskManager: DiskManager;
  pageMap: Map<number, Page>;
  size: number;

  constructor(size: number, diskManager: DiskManager) {
    this.size = size;
    this.diskManager = diskManager;
    this.pageMap = new Map<PageID, Page>();
  }

  async getPage(pageId: PageID): Promise<Page> {
    let page = this.pageMap.get(pageId);

    if (page) {
      this.pageMap.delete(pageId);
    } else {
      if (this.pageMap.size >= this.size) {
        const victimPageId = this.pageMap.keys().next().value!;
        const victimPage = this.pageMap.get(victimPageId)!;

        if (victimPage.isDirty) {
          await this.diskManager.writePage(victimPageId, victimPage.getData());
        }

        this.pageMap.delete(victimPageId);
      }

      const buffer = await this.diskManager.readPage(pageId);
      page = new Page(pageId, buffer);
    }

    this.pageMap.set(pageId, page);
    return page;
  }
}
