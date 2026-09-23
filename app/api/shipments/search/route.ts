import { NextRequest, NextResponse } from "next/server";

import {
  searchShipments
} from "../../../../../lib/shipments";

import {
  requireUser
} from "../../../../../lib/session";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    await requireUser();

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")?.trim() ||
      "";

    if (!search) {
      return NextResponse.json({
        success: true,
        shipments: []
      });
    }

    const shipments =
      searchShipments({
        search
      });

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
          "Unable to search shipments."
      },
      {
        status: 500
      }
    );
  }
}
