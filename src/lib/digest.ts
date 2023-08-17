import { strict as assert } from "assert";

function toHexString(array: Uint8Array): string {
    return [...array]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

export async function computeSetHash(buffers: Buffer[], length: number = 3): Promise<string> {
    const hashes = await Promise.all(buffers.map(
        async x => new Uint8Array(await crypto.subtle.digest("SHA-1", x)).slice(undefined, length)
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
