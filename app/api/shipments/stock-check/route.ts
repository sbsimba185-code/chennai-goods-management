import { NextResponse } from "next/server";

import {
  getStocksToCheckToday
} from "../../../../../lib/shipments";

import {
  requireUser
} from "../../../../../lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();

    const shipments =
      getStocksToCheckToday();

    return NextResponse.json({
      success: true,
      shipments
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
          "Unable to load stock checks."
      },
      {
        status: 500
      }
    );
  }
}
