import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  getShipment,
  completeGodownDelivery,
  completeDoorDelivery
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

    const shipment =
      getShipment(
        shipmentId
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

    if (
      shipment.delivery_status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This shipment is already completed."
        },
        {
          status: 400
        }
      );
    }

    if (
      shipment.delivery_type ===
      "DOOR"
    ) {
      const driverName =
        typeof body.driverName ===
        "string"
          ? body.driverName.trim()
          : "";

      if (!driverName) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Driver name is required for door delivery."
          },
          {
            status: 400
          }
        );
      }

      const updatedShipment =
        completeDoorDelivery(
          shipmentId,
          user.id,
          driverName
        );

      return NextResponse.json({
        success: true,
        message:
          "Door delivery completed.",
        shipment:
          updatedShipment
      });
    }

    const updatedShipment =
      completeGodownDelivery(
        shipmentId,
        user.id
      );

    return NextResponse.json({
      success: true,
      message:
        "Godown delivery completed.",
      shipment:
        updatedShipment
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
          error instanceof Error
            ? error.message
            : "Unable to complete delivery."
      },
      {
        status: 500
      }
    );
  }
}
