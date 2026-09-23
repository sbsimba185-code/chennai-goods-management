"use client";

import { useState } from "react";

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
};

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!search.trim()) {
      setResults([]);
      setSearched(false);
      setError("Enter something to search.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setError("");

    try {
      const response = await fetch(
        `/api/shipments/search?search=${encodeURIComponent(
          search.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Search failed.");
        setResults([]);
        return;
      }

      setResults(data.shipments || []);
    } catch {
      setError("Unable to connect to the server.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="search-page">
      <div className="search-container">
        <div className="search-header">
          <h1>Search Shipments</h1>
          <p>
            Search by LR number, date, source, customer,
            consignee, article, amount, delivery location
            or any other shipment detail.
          </p>
        </div>

        <div className="search-box">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search shipment details..."
          />

          <button
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="search-error">
            {error}
          </div>
        )}

        {searched && !loading && !error && (
          <div className="search-result-count">
            {results.length} shipment
            {results.length !== 1 ? "s" : ""} found
          </div>
        )}

        <div className="search-results">
          {results.map((shipment) => (
            <ShipmentResult
              key={shipment.id}
              shipment={shipment}
            />
          ))}

          {searched &&
            !loading &&
            !error &&
            results.length === 0 && (
              <div className="no-results">
                No shipments found.
              </div>
            )}
        </div>
      </div>
    </main>
  );
}

function ShipmentResult({
  shipment
}: {
  shipment: Shipment;
}) {
  return (
    <div className="search-shipment-card">
      <div className="shipment-top">
        <strong>
          LR No: {shipment.lr_number}
        </strong>

        <span
          className={`delivery-badge ${
            shipment.delivery_type === "DOOR"
              ? "door"
              : "godown"
          }`}
        >
          {shipment.delivery_type === "DOOR"
            ? "Door Delivery"
            : "Godown Delivery"}
        </span>
      </div>

      <div className="shipment-grid">
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
          <span>Amount</span>
          <strong>
            ₹{Number(shipment.amount).toFixed(2)}
          </strong>
        </div>

        <div>
          <span>Art</span>
          <strong>{shipment.art}</strong>
        </div>

        <div>
          <span>Art Type</span>
          <strong>{shipment.art_type}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong>
            {shipment.delivery_status === "COMPLETED"
              ? "Completed"
              : "Pending"}
          </strong>
        </div>

        {shipment.delivery_status === "PENDING" &&
          shipment.stock_status && (
            <div>
              <span>Stock</span>
              <strong>
                {shipment.stock_status === "IN_STOCK"
                  ? "In Stock"
                  : "Out of Stock"}
              </strong>
            </div>
          )}
      </div>
    </div>
  );
          }
