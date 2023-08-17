import { strict as assert } from "assert";
import sha1 from "sha1";

function toHexString(array: Uint8Array): string {
    return [...array]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

export async function computeSetHash(buffers: Buffer[], length: number = 3): Promise<string> {
    const hashes = await Promise.all(buffers.map(
        async x => sha1(x, {asBytes: true}).slice(undefined, length)
    ));
    const result = new Uint8Array(length);
    for (const hash of hashes) {
        assert(result.length == hash.length);
        for (let i = 0; i < result.length; ++i) {
            result[i] ^= hash[i];
        }
    }
    return toHexString(result);
}
