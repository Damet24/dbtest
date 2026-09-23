import type { Observer, Subject } from "../core/observer.js";
import { PageHeader, type PageType } from "./page-header.js";

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
  private readonly data: Buffer<ArrayBuffer>;

  /** Header view over {@link data}. */
  private readonly header: PageHeader;

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
    this.header = new PageHeader(data);
  }

  /**
   * The raw bytes backing this page. It is the public entry point for the
   * storage layer (Pager, BufferPool) and for callers that need to read or
   * write bytes directly with the codecs. Reading it does not mark the page as
   * modified; call {@link markModified} after mutating it.
   */
  get buffer(): Buffer<ArrayBuffer> {
    return this.data;
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

  // metodo de prueba, record no será any.
  async insertRecord(record: any) {
    console.log(record);
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  get pageType() {
    return this.header.pageType;
  }

  set pageType(value: PageType) {
    this.header.pageType = value;
    this.markModified();
  }

  get recordCount(): number {
    return this.header.recordCount;
  }

  set recordCount(value: number) {
    this.header.recordCount = value;
    this.markModified();
  }

  get cellContentStart(): number {
    return this.header.cellContentStart;
  }

  set cellContentStart(value: number) {
    this.header.cellContentStart = value;
    this.markModified();
  }
}
