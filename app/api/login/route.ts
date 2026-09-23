import { NextRequest, NextResponse } from "next/server";

import {
  findUserByUsername
} from "../../../../lib/auth";

import {
  verifyPassword
} from "../../../../lib/password";

import {
  createSession
} from "../../../../lib/session";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const username =
      typeof body.username ===
      "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    if (
      !username ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Username and password are required."
        },
        {
          status: 400
        }
      );
    }

    const user =
      findUserByUsername(
        username
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid username or password."
        },
        {
          status: 401
        }
      );
    }

    const passwordValid =
      verifyPassword(
        password,
        user.password_hash
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid username or password."
        },
        {
          status: 401
        }
      );
    }

    await createSession(
      user.id
    );

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process login."
      },
      {
        status: 500
      }
    );
  }
}
