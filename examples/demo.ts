import { BufferPool, DiskManager, PageType } from "../src/index";

const dm = await DiskManager.create("test.db");
const bp = new BufferPool(20, dm);

const p = await bp.getPage(0);

p.pageType = PageType.InteriorTable;
console.log(p.cellCount)
p.cellCount = 1;
console.log(p.cellCount)
console.log(p)
