import { NextResponse } from "next/server";

import {
  destroySession
} from "../../../../lib/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully."
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to logout."
      },
      {
        status: 500
      }
    );
  }
}
