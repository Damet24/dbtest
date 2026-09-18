import type { Observer, Subject } from "../core/observer.js";

/**
 * A Page is the unit of transfer exposed to higher layers: a fixed-size block
 * of bytes (`PAGE_SIZE`) identified by its 0-based id.
 *
 * It is a lightweight view over a raw buffer. The BufferPool is the owner of
 * the buffers and of their dirty state; a Page is only the shape in which a
 * cached buffer is handed out. Typed reads and writes are performed with the
 * integer codecs directly over {@link data}.
 *
 * A Page is also a {@link Subject}: after mutating {@link data}, the caller
 * signals the change with {@link markModified}, which notifies every attached
 * observer (typically the BufferPool). The Page keeps no dirty state of its
 * own; it only announces the event.
 */
export class Page implements Subject<Page> {
  /** The 0-based identifier of this page. */
  readonly pageId: number;

  /** The raw bytes backing this page. */
  readonly data: Buffer<ArrayBuffer>;

  /** Observers attached to this page. */
  private observers: Observer<Page>[] = [];

  /**
   * Creates a page over the given backing buffer.
   *
   * @param pageId - The 0-based identifier of the page.
   * @param data - Backing buffer of `PAGE_SIZE` bytes.
   */
  constructor(pageId: number, data: Buffer<ArrayBuffer>) {
    this.pageId = pageId;
    this.data = data;
  }

  /**
   * Attaches an observer. Attaching the same observer twice is a no-op.
   *
   * @param observer - The observer to attach.
   */
  attach(observer: Observer<Page>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  /**
   * Detaches a previously attached observer.
   *
   * @param observer - The observer to detach.
   */
  detach(observer: Observer<Page>): void {
    this.observers = this.observers.filter((item) => item !== observer);
  }

  /** Notifies all attached observers, passing this page as the subject. */
  notify(): void {
    for (const observer of this.observers) {
      observer.update(this);
    }
  }

  /**
   * Signals that the page's bytes have changed. Call it after writing into
   * {@link data}; it notifies the attached observers so they can react (for
   * example, the BufferPool marking the buffer as dirty).
   */
  markModified(): void {
    this.notify();
  }
}
