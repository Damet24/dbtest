/**
 * Generic implementation of the Observer pattern.
 *
 * A {@link Subject} owns some state and keeps a list of {@link Observer}s. When
 * its state changes it calls {@link Subject.notify}, which forwards itself to
 * every observer's {@link Observer.update}. This lets producers announce
 * changes without knowing who is interested in them.
 */

/** Receives updates from the subject it is attached to. */
export interface Observer<T> {
  /** Called by the subject every time it changes. */
  update(subject: T): void;
}

/** Manages subscribers and notifies them about changes. */
export interface Subject<T> {
  /** Attaches an observer. Attaching the same observer twice is a no-op. */
  attach(observer: Observer<T>): void;

  /** Detaches a previously attached observer. */
  detach(observer: Observer<T>): void;

  /** Notifies all attached observers about a change. */
  notify(): void;
}
