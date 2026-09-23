import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { PAGE_SIZE } from "../core/constants.js";
import { BufferPool } from "./buffer-pool.js";
import { Page } from "./page.js";

let dir: string;
let file: string;
let pool: BufferPool | undefined;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "dbtest-pool-"));
  file = path.join(dir, "test.db");
});

afterEach(async () => {
  await pool?.pager.close();
  pool = undefined;
  await fs.rm(dir, { recursive: true, force: true });
});

describe("BufferPool", () => {
  it("devuelve undefined si el pager no está abierto", async () => {
    pool = new BufferPool(2, file);

    await expect(pool.getPage(0)).resolves.toBeUndefined();
  });

  it("carga una página a través del pager", async () => {
    pool = new BufferPool(2, file);
    await pool.pager.open();

    const page = await pool.getPage(0);

    expect(page).toBeInstanceOf(Page);
    expect(page!.buffer).toHaveLength(PAGE_SIZE);
    expect(pool.buffers.size).toBe(1);
  });

  it("devuelve una Page sobre el mismo buffer cacheado", async () => {
    pool = new BufferPool(2, file);
    await pool.pager.open();

    const first = await pool.getPage(0);
    const second = await pool.getPage(0);

    expect(second!.buffer).toBe(first!.buffer);
    expect(pool.buffers.size).toBe(1);
  });

  it("una Page notifica al pool y marca el buffer como modificado", async () => {
    pool = new BufferPool(2, file);
    await pool.pager.open();
    const page = await pool.getPage(0);

    page!.markModified();

    expect(pool.buffers.get(0)!.modified).toBe(true);
  });

  it("ignora la notificación de una Page obsoleta (buffer ya reemplazado)", async () => {
    pool = new BufferPool(1, file);
    await pool.pager.open();

    const stale = await pool.getPage(0);
    await pool.getPage(1); // expulsa la 0
    await pool.getPage(0); // recarga la 0 en un buffer nuevo

    stale!.markModified(); // su buffer ya no es el cacheado

    expect(pool.buffers.get(0)!.modified).toBe(false);
  });

  it("respeta maxPages sin superar el número de páginas en memoria", async () => {
    pool = new BufferPool(2, file);
    await pool.pager.open();

    await pool.getPage(0);
    await pool.getPage(1);
    await pool.getPage(2);

    expect(pool.buffers.size).toBe(2);
  });

  it("expulsa la página usada menos recientemente (LRU), no la primera cargada", async () => {
    pool = new BufferPool(2, file);
    await pool.pager.open();

    await pool.getPage(0);
    await pool.getPage(1);
    await pool.getPage(0); // refresca el uso de la página 0
    await pool.getPage(2); // FIFO expulsaría la 0; LRU debe expulsar la 1

    const pageIds = Array.from(pool.buffers.keys());
    expect(pageIds).toContain(0);
    expect(pageIds).toContain(2);
    expect(pageIds).not.toContain(1);
  });

  it("conserva la página reutilizada y expulsa la usada menos recientemente", async () => {
    pool = new BufferPool(3, file);
    await pool.pager.open();

    await pool.getPage(0);
    await pool.getPage(1);
    await pool.getPage(2);
    await pool.getPage(0); // la página 0 pasa a ser la más reciente; la 1 la menos reciente
    await pool.getPage(3); // LRU debe expulsar la 1 (FIFO expulsaría la 0)

    const pageIds = Array.from(pool.buffers.keys());
    expect(pageIds).toContain(0);
    expect(pageIds).toContain(2);
    expect(pageIds).toContain(3);
    expect(pageIds).not.toContain(1);
  });

  it("no escribe en disco al expulsar una página sin modificar", async () => {
    pool = new BufferPool(1, file);
    await pool.pager.open();
    await pool.getPage(0);

    const spy = vi.spyOn(pool.pager, "writePage");
    await pool.getPage(1);

    expect(spy).not.toHaveBeenCalled();
  });

  it("escribe en disco la página modificada al ser expulsada", async () => {
    pool = new BufferPool(1, file);
    await pool.pager.open();
    const page = await pool.getPage(0);
    page!.buffer.writeUInt32LE(999, 0);
    page!.markModified();

    const spy = vi.spyOn(pool.pager, "writePage");
    await pool.getPage(1);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].pageId).toBe(0);
  });

  it("recarga desde disco una página previamente expulsada", async () => {
    pool = new BufferPool(1, file);
    await pool.pager.open();

    await pool.getPage(0);
    await pool.getPage(1);
    const reloaded = await pool.getPage(0);

    expect(reloaded).toBeInstanceOf(Page);
    expect(pool.buffers.get(0)!.pageId).toBe(0);
  });

  describe("flush", () => {
    it("escribe en disco los buffers modificados y los deja como no modificados", async () => {
      pool = new BufferPool(3, file);
      await pool.pager.open();
      const page0 = await pool.getPage(0);
      const page1 = await pool.getPage(1);
      page0!.markModified();
      page1!.markModified();

      const spy = vi.spyOn(pool.pager, "writePage");
      await pool.flush();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(
        spy.mock.calls.map(([page]) => page.pageId).sort(),
      ).toEqual([0, 1]);
      expect(pool.buffers.get(0)!.modified).toBe(false);
      expect(pool.buffers.get(1)!.modified).toBe(false);
    });

    it("solo escribe los buffers modificados", async () => {
      pool = new BufferPool(3, file);
      await pool.pager.open();
      await pool.getPage(0);
      const page1 = await pool.getPage(1);
      page1!.markModified();

      const spy = vi.spyOn(pool.pager, "writePage");
      await pool.flush();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].pageId).toBe(1);
      expect(pool.buffers.get(0)!.modified).toBe(false);
      expect(pool.buffers.get(1)!.modified).toBe(false);
    });

    it("persiste los datos modificados para poder releerlos desde disco", async () => {
      pool = new BufferPool(3, file);
      await pool.pager.open();
      const page = await pool.getPage(0);
      page!.buffer.writeUInt32LE(4242, 0);
      page!.markModified();

      await pool.flush();

      const persisted = await pool.pager.readPage(0);
      expect(persisted!.buffer.readUInt32LE(0)).toBe(4242);
    });

    it("no vuelve a escribir si no hay buffers modificados", async () => {
      pool = new BufferPool(3, file);
      await pool.pager.open();
      const page = await pool.getPage(0);
      page!.markModified();

      await pool.flush();

      const spy = vi.spyOn(pool.pager, "writePage");
      await pool.flush();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
