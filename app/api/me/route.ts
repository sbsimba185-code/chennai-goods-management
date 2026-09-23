import { NextResponse } from "next/server";

import {
  getCurrentUser
} from "../../../../lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          user: null
        },
        {
          status: 401
        }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        user: null
      },
      {
        status: 500
      }
    );
  }
}
