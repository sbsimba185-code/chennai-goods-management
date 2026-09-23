import { NextResponse } from "next/server";

import {
  getDashboardStats
} from "../../../../lib/shipments";

import {
  requireUser
} from "../../../../lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();

    const stats =
      getDashboardStats();

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login first."
        },
        {
          status: 401
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load dashboard."
      },
      {
        status: 500
      }
    );
  }
}
