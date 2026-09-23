"use client";

import { useState } from "react";

type ReportType =
  | "GODOWN"
  | "DOOR"
  | "IN_STOCK"
  | "OUT_OF_STOCK"
  | "SENT_TO_DOOR";

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
  delivered_by_name?: string | null;
  delivery_date?: string | null;
  driver_name?: string | null;
  payment_status?:
    | "NOT_REQUIRED"
    | "PENDING"
    | "RECEIVED";
  payment_received_by_name?: string | null;
  payment_received_date?: string | null;
};

const reportOptions = [
  {
    id: "GODOWN" as ReportType,
    title: "Godown Delivery",
    description:
      "View shipments currently assigned for godown delivery."
  },
  {
    id: "DOOR" as ReportType,
    title: "Door Delivery",
    description:
      "View shipments currently assigned for door delivery."
  },
  {
    id: "IN_STOCK" as ReportType,
    title: "In Stock",
    description:
      "View undelivered shipments marked as in stock."
  },
  {
    id: "OUT_OF_STOCK" as ReportType,
    title: "Out of Stock",
    description:
      "View undelivered shipments marked as out of stock."
  },
  {
    id: "SENT_TO_DOOR" as ReportType,
    title: "Sent to Door Delivery",
    description:
      "View completed door deliveries and payment status."
  }
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] =
    useState<ReportType | null>(null);

  const [shipments, setShipments] = useState<Shipment[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openReport(type: ReportType) {
    setSelectedReport(type);
    setLoading(true);
    setError("");
    setShipments([]);

    try {
      const response = await fetch(
        `/api/reports?type=${type}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load report."
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

  function reportTitle() {
    return (
      reportOptions.find(
        (report) => report.id === selectedReport
      )?.title || "Report"
    );
  }

  return (
    <main className="reports-page">
      <div className="reports-container">
        <div className="reports-header">
          <h1>Reports</h1>
          <p>
            Select a report to view shipment details.
          </p>
        </div>

        <div className="report-options">
          {reportOptions.map((report) => (
            <button
              key={report.id}
              className={`report-option ${
                selectedReport === report.id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                openReport(report.id)
              }
            >
              <strong>{report.title}</strong>
              <span>
                {report.description}
              </span>
            </button>
          ))}
        </div>

        {selectedReport && (
          <section className="report-results">
            <div className="report-results-header">
              <div>
                <h2>{reportTitle()}</h2>

                {!loading && !error && (
                  <p>
                    {shipments.length} shipment
                    {shipments.length !== 1
                      ? "s"
                      : ""}
                  </p>
                )}
              </div>

              <button
                className="report-back-button"
                onClick={() =>
                  setSelectedReport(null)
                }
              >
                Back
              </button>
            </div>

            {error && (
              <div className="report-error">
                {error}
              </div>
            )}

            {loading ? (
              <div className="report-message">
                Loading report...
              </div>
            ) : !error &&
              shipments.length === 0 ? (
              <div className="report-message">
                No shipments found in this report.
              </div>
            ) : (
              <div className="report-list">
                {shipments.map((shipment) => (
                  <ReportCard
                    key={shipment.id}
                    shipment={shipment}
                    sentToDoor={
                      selectedReport ===
                      "SENT_TO_DOOR"
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function ReportCard({
  shipment,
  sentToDoor
}: {
  shipment: Shipment;
  sentToDoor: boolean;
}) {
  return (
    <div className="report-card">
      <div className="report-card-top">
        <div>
          <strong>
            LR No: {shipment.lr_number}
          </strong>

          <span className="report-shipment-id">
            ID: {shipment.shipment_id}
          </span>
        </div>

        <strong>
          ₹{Number(shipment.amount).toFixed(2)}
        </strong>
      </div>

      <div className="report-grid">
        <div>
          <span>Date</span>
          <strong>
            {shipment.shipment_date}
          </strong>
        </div>

        <div>
          <span>From</span>
          <strong>{shipment.src}</strong>
        </div>

        <div>
          <span>Delivery To</span>
          <strong>
            {shipment.delivery_to}
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
          <strong>{shipment.art}</strong>
        </div>

        <div>
          <span>Art Type</span>
          <strong>
            {shipment.art_type}
          </strong>
        </div>

        <div>
          <span>Delivery Status</span>
          <strong>
            {shipment.delivery_status ===
            "COMPLETED"
              ? "Completed"
              : "Pending"}
          </strong>
        </div>

        {!sentToDoor &&
          shipment.delivery_status ===
            "PENDING" &&
          shipment.stock_status && (
            <div>
              <span>Stock Status</span>
              <strong>
                {shipment.stock_status ===
                "IN_STOCK"
                  ? "In Stock"
                  : "Out of Stock"}
              </strong>
            </div>
          )}

        {shipment.delivery_status ===
          "COMPLETED" && (
          <>
            <div>
              <span>Delivered By</span>
              <strong>
                {shipment.delivered_by_name ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>Delivery Date</span>
              <strong>
                {shipment.delivery_date ||
                  "-"}
              </strong>
            </div>

            {shipment.driver_name && (
              <div>
                <span>Driver Name</span>
                <strong>
                  {shipment.driver_name}
                </strong>
              </div>
            )}
          </>
        )}

        {sentToDoor && (
          <>
            <div>
              <span>Payment Status</span>
              <strong>
                {shipment.payment_status ===
                "RECEIVED"
                  ? "Received"
                  : "Payment Pending"}
              </strong>
            </div>

            {shipment.payment_received_by_name && (
              <div>
                <span>Payment Received By</span>
                <strong>
                  {
                    shipment.payment_received_by_name
                  }
                </strong>
              </div>
            )}

            {shipment.payment_received_date && (
              <div>
                <span>Payment Date</span>
                <strong>
                  {
                    shipment.payment_received_date
                  }
                </strong>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
              }
