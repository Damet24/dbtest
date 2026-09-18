import { BufferPool } from "./storage/buffer-pool.js";

/**
 * Database is the public facade and composition root of the engine. It
 * wires the storage layers together and exposes a single entry point for
 * opening and closing a database file.
 *
 * Higher-level modules (records, access methods, query execution) should be
 * composed here as they are implemented.
 */
export class Database {
  /** In-memory page cache used by the database. */
  readonly pool: BufferPool;

  /**
   * Creates a database bound to the given file.
   *
   * @param filename - Path to the database file.
   * @param maxPages - Maximum number of pages kept in the buffer pool.
   */
  constructor(filename: string, maxPages: number) {
    this.pool = new BufferPool(maxPages, filename);
  }

  /** Opens the underlying file, creating it if needed. */
  async open() {
    await this.pool.pager.open();
  }

  /** Flushes pending changes and closes the underlying file. */
  async close() {
    await this.pool.flush();
    await this.pool.pager.close();
  }
}
