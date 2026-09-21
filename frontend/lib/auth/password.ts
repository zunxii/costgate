import crypto from "crypto";

const KEY_LENGTH = 64;

export async function hashPassword(
    password: string
): Promise<string> {
    const salt = crypto.randomBytes(16);

    const derivedKey = await new Promise<Buffer>(
        (resolve, reject) => {
            crypto.scrypt(
                password,
                salt,
                KEY_LENGTH,
                {
                    N: 16384,
                    r: 8,
                    p: 1,
                },
                (error, key) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(key);
                }
            );
        }
    );

    return [
        "scrypt",
        salt.toString("hex"),
        derivedKey.toString("hex"),
    ].join("$");
}

export async function verifyPassword(
    password: string,
    storedHash: string
): Promise<boolean> {
    const parts = storedHash.split("$");

    if (
        parts.length !== 3 ||
        parts[0] !== "scrypt"
    ) {
        return false;
    }

    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");

    const derivedKey = await new Promise<Buffer>(
        (resolve, reject) => {
            crypto.scrypt(
                password,
                salt,
                expected.length,
                {
                    N: 16384,
                    r: 8,
                    p: 1,
                },
                (error, key) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(key);
                }
            );
        }
    );

    if (derivedKey.length !== expected.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        derivedKey,
        expected
    );
}