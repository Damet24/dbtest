import { describe, expect, it, vi } from "vitest";

import { PAGE_SIZE } from "../core/constants.js";
import type { Observer } from "../core/observer.js";
import { Page } from "./page.js";

describe("Page (Subject)", () => {
  it("notifica a los observers suscritos al llamar a markModified", () => {
    const page = new Page(0, Buffer.alloc(PAGE_SIZE));
    const observer: Observer<Page> = { update: vi.fn() };

    page.attach(observer);
    page.markModified();

    expect(observer.update).toHaveBeenCalledWith(page);
  });

  it("no falla al notificar sin observers", () => {
    const page = new Page(0, Buffer.alloc(PAGE_SIZE));

    expect(() => page.markModified()).not.toThrow();
  });

  it("no adjunta el mismo observer dos veces", () => {
    const page = new Page(0, Buffer.alloc(PAGE_SIZE));
    const observer: Observer<Page> = { update: vi.fn() };

    page.attach(observer);
    page.attach(observer);
    page.markModified();

    expect(observer.update).toHaveBeenCalledTimes(1);
  });

  it("deja de notificar tras detach", () => {
    const page = new Page(0, Buffer.alloc(PAGE_SIZE));
    const observer: Observer<Page> = { update: vi.fn() };

    page.attach(observer);
    page.detach(observer);
    page.markModified();

    expect(observer.update).not.toHaveBeenCalled();
  });
});
