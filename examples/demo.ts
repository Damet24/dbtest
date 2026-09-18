import { uint32 } from "../src/serialization/uint32";

const buffer = Buffer.alloc(8);
uint32.serialize(12345, buffer, 4);
console.log(buffer);
console.log(uint32.deserialize(buffer, 4));
