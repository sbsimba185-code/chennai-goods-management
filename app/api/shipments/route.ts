import { NextRequest, NextResponse } from "next/server";

import {
  getAllShipments
} from "../../../../lib/shipments";

import {
  requireUser
} from "../../../../lib/session";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    await requireUser();

    const { searchParams } =
      new URL(request.url);

    const deliveryType =
      searchParams.get(
        "deliveryType"
      );

    let shipments =
      getAllShipments();

    if (
      deliveryType === "GODOWN" ||
      deliveryType === "DOOR"
    ) {
      shipments =
        shipments.filter(
          (shipment) =>
            shipment.delivery_type ===
            deliveryType
        );
    }

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
          "Unable to load shipments."
      },
      {
        status: 500
      }
    );
  }
}
