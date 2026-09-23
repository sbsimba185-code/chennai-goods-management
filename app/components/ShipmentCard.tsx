"use client";

import type { ShipmentWithUsers } from "../lib/types";

interface ShipmentCardProps {
  shipment: ShipmentWithUsers;

  onComplete?: (
    shipment: ShipmentWithUsers
  ) => void;

  onChangeType?: (
    shipment: ShipmentWithUsers
  ) => void;

  onUndo?: (
    shipment: ShipmentWithUsers
  ) => void;

  onReceivePayment?: (
    shipment: ShipmentWithUsers
  ) => void;

  showActions?: boolean;
}

export default function ShipmentCard({
  shipment,
  onComplete,
  onChangeType,
  onUndo,
  onReceivePayment,
  showActions = true
}: ShipmentCardProps) {
  const isCompleted =
    shipment.delivery_status === "COMPLETED";

  const isDoor =
    shipment.delivery_type === "DOOR";

  return (
    <article className="shipment-card">
      <div className="shipment-card-header">
        <div>
          <strong>
            {shipment.shipment_id}
          </strong>

          <span
            className={`shipment-type ${
              isDoor
                ? "door"
                : "godown"
            }`}
          >
            {isDoor
              ? "Door Delivery"
              : "Godown Delivery"}
          </span>
        </div>

        <div
          className={`shipment-status ${
            isCompleted
              ? "completed"
              : "pending"
          }`}
        >
          {isCompleted
            ? "Delivered"
            : "Pending"}
        </div>
      </div>

      <div className="shipment-route-card">
        <span>
          {shipment.src}
        </span>

        <strong>→</strong>

        <span>
          {shipment.delivery_to}
        </span>
      </div>

      <div className="shipment-card-grid">
        <div>
          <span>Date</span>
          <strong>
            {shipment.shipment_date}
          </strong>
        </div>

        <div>
          <span>LR Number</span>
          <strong>
            {shipment.lr_number}
          </strong>
        </div>

        <div>
          <span>Consignor</span>
          <strong>
            {shipment.consignor}
          </strong>
        </div>

        <div>
          <span>Consignee</span>
          <strong>
            {shipment.consignee}
          </strong>
        </div>

        <div>
          <span>Art</span>
          <strong>
            {shipment.art}
          </strong>
        </div>

        <div>
          <span>Art Type</span>
          <strong>
            {shipment.art_type}
          </strong>
        </div>

        <div>
          <span>Amount</span>
          <strong>
            ₹{shipment.amount}
          </strong>
        </div>

        <div>
          <span>Delivery To</span>
          <strong>
            {shipment.delivery_to}
          </strong>
        </div>
      </div>

      {!isCompleted && (
        <div className="shipment-stock-section">
          <div
            className={`shipment-stock-status ${
              shipment.stock_status ===
              "IN_STOCK"
                ? "in-stock"
                : shipment.stock_status ===
                  "OUT_OF_STOCK"
                ? "out-stock"
                : "not-checked"
            }`}
          >
            {shipment.stock_status ===
            "IN_STOCK"
              ? "In Stock"
              : shipment.stock_status ===
                "OUT_OF_STOCK"
              ? "Out of Stock"
              : "Stock Not Checked"}
          </div>

          {shipment.checked_by_name && (
            <div>
              Checked by:{" "}
              <strong>
                {shipment.checked_by_name}
              </strong>
            </div>
          )}

          {shipment.checked_date && (
            <div>
              Checked date:{" "}
              <strong>
                {shipment.checked_date}
              </strong>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="shipment-completed-section">
          <div>
            <span>
              Delivered by
            </span>

            <strong>
              {shipment.delivered_by_name ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              Delivery date
            </span>

            <strong>
              {shipment.delivery_date ||
                "-"}
            </strong>
          </div>

          {isDoor && (
            <div>
              <span>
                Driver Name
              </span>

              <strong>
                {shipment.driver_name ||
                  "-"}
              </strong>
            </div>
          )}
        </div>
      )}

      {isCompleted &&
        shipment.undelivered_by_name && (
          <div className="shipment-undo-section">
            <div>
              <span>
                Undelivered by
              </span>

              <strong>
                {
                  shipment.undelivered_by_name
                }
              </strong>
            </div>

            <div>
              <span>
                Undelivery date
              </span>

              <strong>
                {shipment.undelivery_date ||
                  "-"}
              </strong>
            </div>
          </div>
        )}

      {isDoor &&
        isCompleted && (
          <div className="shipment-payment-section">
            <div>
              <span>
                Payment Status
              </span>

              <strong>
                {shipment.payment_status ===
                "RECEIVED"
                  ? "Payment Received"
                  : "Payment Pending"}
              </strong>
            </div>

            {shipment.payment_received_by_name && (
              <div>
                <span>
                  Payment received by
                </span>

                <strong>
                  {
                    shipment.payment_received_by_name
                  }
                </strong>
              </div>
            )}

            {shipment.payment_received_date && (
              <div>
                <span>
                  Payment received date
                </span>

                <strong>
                  {
                    shipment.payment_received_date
                  }
                </strong>
              </div>
            )}
          </div>
        )}

      {showActions && (
        <div className="shipment-card-actions">
          {!isCompleted && onComplete && (
            <button
              type="button"
              className="shipment-complete-button"
              onClick={() =>
                onComplete(shipment)
              }
            >
              Complete Delivery
            </button>
          )}

          {!isCompleted &&
            onChangeType && (
              <button
                type="button"
                className="shipment-change-button"
                onClick={() =>
                  onChangeType(shipment)
                }
              >
                {isDoor
                  ? "Change to Godown Delivery"
                  : "Change to Door Delivery"}
              </button>
            )}

          {isCompleted && onUndo && (
            <button
              type="button"
              className="shipment-undo-button"
              onClick={() =>
                onUndo(shipment)
              }
            >
              Undo Delivery
            </button>
          )}

          {isDoor &&
            isCompleted &&
            shipment.payment_status ===
              "PENDING" &&
            onReceivePayment && (
              <button
                type="button"
                className="shipment-payment-button"
                onClick={() =>
                  onReceivePayment(
                    shipment
                  )
                }
              >
                Receive Payment
              </button>
            )}
        </div>
      )}
    </article>
  );
                }
