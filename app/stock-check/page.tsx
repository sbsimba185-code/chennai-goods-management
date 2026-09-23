"use client";

import { useEffect, useState } from "react";

type Shipment = {
  id: number;
  shipment_id: string;
  shipment_date: string;
  lr_number: string;
  src: string;
  consignor: string;
  consignee: string;
  art: string;
  art_type: string;
  amount: number;
  delivery_to: string;
  delivery_type: "GODOWN" | "DOOR";
  delivery_status: "PENDING" | "COMPLETED";
  stock_status: "IN_STOCK" | "OUT_OF_STOCK" | null;
  checked_by_name?: string | null;
  checked_date?: string | null;
};

export default function StockCheckPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  async function loadShipments() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/shipments/stock-check"
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load stock check."
        );
        return;
      }

      setShipments(data.shipments || []);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, []);

  async function checkStock(
    shipmentId: number,
    status: "IN_STOCK" | "OUT_OF_STOCK"
  ) {
    setSavingId(shipmentId);
    setError("");

    try {
      const response = await fetch(
        "/api/shipments/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            shipmentId,
            stockStatus: status
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to save stock status."
        );
        return;
      }

      await loadShipments();
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="stock-page">
      <div className="stock-container">
        <div className="stock-header">
          <h1>Daily Stock Check</h1>

          <p>
            Check every undelivered shipment each day.
            Today's unchecked shipments are shown here.
          </p>
        </div>

        {error && (
          <div className="stock-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="stock-message">
            Loading shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div className="stock-message success">
            ✓ All shipments have been checked for today.
          </div>
        ) : (
          <>
            <div className="stock-count">
              {shipments.length} shipment
              {shipments.length !== 1 ? "s" : ""} to
              check today
            </div>

            <div className="stock-list">
              {shipments.map((shipment) => (
                <StockCard
                  key={shipment.id}
                  shipment={shipment}
                  saving={
                    savingId === shipment.id
                  }
                  onCheck={checkStock}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StockCard({
  shipment,
  saving,
  onCheck
}: {
  shipment: Shipment;
  saving: boolean;
  onCheck: (
    shipmentId: number,
    status: "IN_STOCK" | "OUT_OF_STOCK"
  ) => void;
}) {
  return (
    <div className="stock-card">
      <div className="stock-card-top">
        <div>
          <strong>
            LR No: {shipment.lr_number}
          </strong>

          <span className="stock-type">
            {shipment.delivery_type === "DOOR"
              ? "Door Delivery"
              : "Godown Delivery"}
          </span>
        </div>

        <strong>
          ₹{Number(shipment.amount).toFixed(2)}
        </strong>
      </div>

      <div className="stock-details">
        <div>
          <span>Date</span>
          <strong>{shipment.shipment_date}</strong>
        </div>

        <div>
          <span>From</span>
          <strong>{shipment.src}</strong>
        </div>

        <div>
          <span>Delivery To</span>
          <strong>{shipment.delivery_to}</strong>
        </div>

        <div>
          <span>Consignor</span>
          <strong>{shipment.consignor}</strong>
        </div>

        <div>
          <span>Consignee</span>
          <strong>{shipment.consignee}</strong>
        </div>

        <div>
          <span>Art</span>
          <strong>{shipment.art}</strong>
        </div>

        <div>
          <span>Art Type</span>
          <strong>{shipment.art_type}</strong>
        </div>
      </div>

      <div className="stock-actions">
        <button
          className="stock-in-button"
          disabled={saving}
          onClick={() =>
            onCheck(
              shipment.id,
              "IN_STOCK"
            )
          }
        >
          {saving ? "Saving..." : "✓ In Stock"}
        </button>

        <button
          className="stock-out-button"
          disabled={saving}
          onClick={() =>
            onCheck(
              shipment.id,
              "OUT_OF_STOCK"
            )
          }
        >
          {saving ? "Saving..." : "✕ Out of Stock"}
        </button>
      </div>
    </div>
  );
  }
