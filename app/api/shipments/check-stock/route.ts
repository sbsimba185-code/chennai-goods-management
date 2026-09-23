import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  checkStock
} from "../../../../../lib/shipments";

import {
  requireUser
} from "../../../../../lib/session";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const user =
      await requireUser();

    const body =
      await request.json();

    const shipmentId =
      Number(body.shipmentId);

    const stockStatus =
      body.stockStatus;

    if (
      !Number.isInteger(
        shipmentId
      ) ||
      shipmentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid shipment ID."
        },
        {
          status: 400
        }
      );
    }

    if (
      stockStatus !== "IN_STOCK" &&
      stockStatus !==
        "OUT_OF_STOCK"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid stock status."
        },
        {
          status: 400
        }
      );
    }

    const shipment =
      checkStock(
        shipmentId,
        stockStatus,
        user.id
      );

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Shipment not found."
        },
        {
          status: 404
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        stockStatus === "IN_STOCK"
          ? "Marked as In Stock."
          : "Marked as Out of Stock.",
      shipment
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
          "Unable to update stock status."
      },
      {
        status: 500
      }
    );
  }
}
