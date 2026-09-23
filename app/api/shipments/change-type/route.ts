import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  changeDeliveryType
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

    const deliveryType =
      body.deliveryType;

    if (
      !Number.isInteger(shipmentId) ||
      shipmentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid shipment ID."
        },
        { status: 400 }
      );
    }

    if (
      deliveryType !== "GODOWN" &&
      deliveryType !== "DOOR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid delivery type."
        },
        { status: 400 }
      );
    }

    const shipment =
      changeDeliveryType(
        shipmentId,
        deliveryType,
        user.id
      );

    return NextResponse.json({
      success: true,
      message:
        `Changed to ${
          deliveryType === "DOOR"
            ? "Door Delivery"
            : "Godown Delivery"
        }.`,
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
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to change delivery type."
      },
      { status: 500 }
    );
  }
          }
