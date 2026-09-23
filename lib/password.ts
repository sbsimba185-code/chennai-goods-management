import {
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "crypto";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export function hashPassword(
  password: string
): string {
  const salt = randomBytes(
    SALT_LENGTH
  ).toString("hex");

  const hash = scryptSync(
    password,
    salt,
    KEY_LENGTH
  ).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedHash: string
): boolean {
  try {
    const parts =
      storedHash.split(":");

    if (parts.length !== 2) {
      return false;
    }

    const [salt, originalHash] =
      parts;

    const derivedHash =
      scryptSync(
        password,
        salt,
        KEY_LENGTH
      );

    const originalHashBuffer =
      Buffer.from(
        originalHash,
        "hex"
      );

    if (
      derivedHash.length !==
      originalHashBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      derivedHash,
      originalHashBuffer
    );
  } catch {
    return false;
  }
}
