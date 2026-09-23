import {
  createHmac,
  timingSafeEqual
} from "crypto";

import { cookies } from "next/headers";

import {
  findUserById,
  safeUser
} from "./auth";

const SESSION_COOKIE =
  "chennai_goods_session";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "CHANGE_THIS_SESSION_SECRET";

type SessionPayload = {
  userId: number;
  expiresAt: number;
};

function getSecret(): string {
  return SESSION_SECRET;
}

function signPayload(
  payload: string
): string {
  return createHmac(
    "sha256",
    getSecret()
  )
    .update(payload)
    .digest("hex");
}

function createToken(
  userId: number
): string {
  const payload: SessionPayload = {
    userId,
    expiresAt:
      Date.now() +
      1000 * 60 * 60 * 24 * 7
  };

  const encoded =
    Buffer.from(
      JSON.stringify(payload)
    ).toString("base64url");

  const signature =
    signPayload(encoded);

  return `${encoded}.${signature}`;
}

function verifyToken(
  token: string
): SessionPayload | null {
  try {
    const parts =
      token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [
      encoded,
      signature
    ] = parts;

    const expectedSignature =
      signPayload(encoded);

    const actualBuffer =
      Buffer.from(
        signature,
        "utf8"
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    if (
      actualBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    if (
      !timingSafeEqual(
        actualBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    const payload =
      JSON.parse(
        Buffer.from(
          encoded,
          "base64url"
        ).toString("utf8")
      ) as SessionPayload;

    if (
      !payload.userId ||
      !payload.expiresAt
    ) {
      return null;
    }

    if (
      payload.expiresAt <
      Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: number
) {
  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    createToken(userId),
    {
      httpOnly: true,
