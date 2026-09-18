import type { Observer } from "../core/observer.js";
import { Pager } from "./pager.js";
import { Page } from "./page.js";

/**
 * Metadata associated with each cached buffer in the buffer pool.
 */
type BufferInfo = {
  /** The raw page bytes held in memory. */
  buffer: Buffer<ArrayBuffer>;
  /** The 0-based page identifier this buffer corresponds to. */
  pageId: number;
  /** Whether the buffer has been modified since the last disk write. */
  modified: boolean;
};

/**
 * BufferPool manages an in-memory cache of buffers, sitting between the
 * higher-level operators and the Pager (disk I/O layer). It uses a **Least
 * Recently Used (LRU)** eviction policy to decide which buffer to evict when
 * the pool is full.
 *
 * The pool deals with raw buffers only; it does not care about pages. Buffers
 * are stored in a `Map` which preserves insertion order, so the oldest (least
 * recently accessed) entry is always at the front. Accessing a buffer moves it
 * to the back of the order, keeping it "hot".
 *
 * When a consumer asks for a page, the cached buffer is wrapped in a
 * {@link Page} and the pool attaches itself to it as an {@link Observer}, so it
 * learns about changes through {@link update} instead of the caller having to
 * mark buffers dirty. Dirty buffers are flushed to disk on demand via
 * {@link flush} or automatically when they are evicted.
 */
export class BufferPool implements Observer<Page> {
  /** Map of page ID to buffer metadata. Insertion order is used for LRU. */
  buffers: Map<number, BufferInfo>;

  /** The underlying pager responsible for disk reads and writes. */
  pager: Pager;

  /**
   * Creates a new BufferPool backed by the given file.
   *
   * @param maxPages - Maximum number of pages that can be held in memory.
   * @param filename - Path to the database file managed by the Pager.
   */
  constructor(
    private maxPages: number,
    filename: string,
  ) {
    this.buffers = new Map();
    this.pager = new Pager(filename);
  }

  /**
   * Observer callback. Reacts to a page signalling a change by marking its
   * cached buffer as dirty.
   *
   * The buffer identity guard ignores notifications coming from a stale page
   * (one whose buffer is no longer the cached version of that page id).
   *
   * @param page - The page that changed.
   */
  update(page: Page): void {
    const info = this.buffers.get(page.pageId);
    if (info && info.buffer === page.data) {
      info.modified = true;
    }
  }

  /**
   * Retrieves a page by its ID, handing out the cached buffer wrapped in a
   * {@link Page}. If the page is already cached, it is promoted to the
   * most-recently-used position. If it is not cached, it is read from disk;
   * when the pool is at capacity the least recently used buffer is evicted
   * first (and flushed if dirty).
   *
   * The returned page is attached to this pool, so any later
   * `page.markModified()` marks the buffer as dirty automatically.
   *
   * @param pageId - The 0-based identifier of the page to retrieve.
   * @returns The {@link Page}, or `undefined` if it could not be read.
   */
  async getPage(pageId: number): Promise<Page | undefined> {
    const info = this.buffers.get(pageId);
    if (info) {
      this.buffers.delete(pageId);
      this.buffers.set(pageId, info);

      const page = new Page(pageId, info.buffer);
      page.attach(this);
      return page;
    }

    if (this.buffers.size >= this.maxPages) {
      const lruKey = this.buffers.keys().next().value;

      if (lruKey !== undefined) {
        const evicted = this.buffers.get(lruKey);
        this.buffers.delete(lruKey);

        if (evicted?.modified) {
          if (
            !(await this.pager.writePage(
              new Page(evicted.pageId, evicted.buffer),
            ))
          ) {
            throw new Error(
              "Failed to flush a dirty page to disk during eviction",
            );
          }
        }
      }
    }

    const page = await this.pager.readPage(pageId);
    if (!page) return undefined;

    this.buffers.set(pageId, {
      buffer: page.data,
      pageId: pageId,
      modified: false,
    });
    page.attach(this);

    return page;
  }

  /**
   * Flushes all dirty buffers currently in the buffer pool to disk in
   * parallel and resets their modified flags.
   *
   * @returns Resolves when all dirty buffers have been written.
   */
  async flush() {
    const modified: BufferInfo[] = [];
    this.buffers.forEach((info) => {
      if (info.modified) modified.push(info);
    });

    await Promise.all(
      modified.map((info) =>
        this.pager.writePage(new Page(info.pageId, info.buffer)),
      ),
    );

    modified.forEach((info) => {
      info.modified = false;
    });
  }
}
