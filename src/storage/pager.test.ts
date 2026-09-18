import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { PAGE_SIZE } from "../core/constants.js";
import { Pager } from "./pager.js";
import { Page } from "./page.js";

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "dbtest-pager-"));
  file = path.join(dir, "test.db");
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("Pager", () => {
  it("expone PAGE_SIZE de 4096 bytes", () => {
    expect(PAGE_SIZE).toBe(4096);
  });

  it("devuelve undefined al leer sin haber abierto el fichero", async () => {
    const pager = new Pager(file);

    await expect(pager.readPage(0)).resolves.toBeUndefined();
  });

  it("devuelve false al escribir y undefined al cerrar sin abrir el fichero", async () => {
    const pager = new Pager(file);

    await expect(pager.writePage(new Page(0, Buffer.alloc(PAGE_SIZE)))).resolves.toBe(false);
    await expect(pager.close()).resolves.toBeUndefined();
  });

  it("lee una página de un fichero vacío como una Page de PAGE_SIZE bytes a cero", async () => {
    const pager = new Pager(file);
    await pager.open();

    const page = await pager.readPage(0);

    expect(page).toBeInstanceOf(Page);
    expect(page!.pageId).toBe(0);
    expect(page!.data).toHaveLength(PAGE_SIZE);
    expect(page!.data.every((byte) => byte === 0)).toBe(true);

    await pager.close();
  });

  it("escribe y relee una página", async () => {
    const pager = new Pager(file);
    await pager.open();

    const page = new Page(0, Buffer.alloc(PAGE_SIZE));
    page.data.write("hola mundo", 0, "utf8");
    await expect(pager.writePage(page)).resolves.toBe(true);

    const read = await pager.readPage(0);
    expect(read!.data.subarray(0, 10).toString("utf8")).toBe("hola mundo");

    await pager.close();
  });

  it("persiste los datos entre distintas aperturas", async () => {
    const first = new Pager(file);
    await first.open();
    const page = new Page(0, Buffer.alloc(PAGE_SIZE));
    page.data.writeUInt32LE(123456, 0);
    await first.writePage(page);
    await first.close();

    const second = new Pager(file);
    await second.open();
    const read = await second.readPage(0);
    expect(read!.data.readUInt32LE(0)).toBe(123456);
    await second.close();
  });

  it("lee cada página desde su offset correspondiente", async () => {
    const pager = new Pager(file);
    await pager.open();

    await pager.writePage(new Page(0, Buffer.alloc(PAGE_SIZE, 1)));
    await pager.writePage(new Page(1, Buffer.alloc(PAGE_SIZE, 2)));

    expect((await pager.readPage(0))!.data.readUInt8(0)).toBe(1);
    expect((await pager.readPage(1))!.data.readUInt8(0)).toBe(2);

    await pager.close();
  });
});
