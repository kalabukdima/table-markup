import { computeSetHash } from "./digest";

test("computes set hash correctly", async () => {
    const a = Buffer.from("a");
    const b = Buffer.from("b");
    expect(await computeSetHash([], 3)).toEqual("000000");
    expect(await computeSetHash([a], 3)).toEqual("86f7e4");
    expect(await computeSetHash([a, b], 3)).toEqual("6f20fb");
    expect(await computeSetHash([b, a], 3)).toEqual("6f20fb");
    // Multiple equal values are not expected in the input,
    // so it's okay to have the collision with [a]
    expect(await computeSetHash([a, b, b], 3)).toEqual("86f7e4");
});
