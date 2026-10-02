
export class Cell {
  constructor(
    private data: Buffer<ArrayBuffer>,
    private cellOffset: number) { }

  get size() {
    return this.data.readInt16BE(this.cellOffset);
  }
}
