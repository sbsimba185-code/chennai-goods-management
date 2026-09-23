"use client";

import { useEffect, useState } from "react";

type DeliveryType = "GODOWN" | "DOOR";

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
  delivery_type: DeliveryType;
  delivery_status: "PENDING" | "COMPLETED";
  stock_status: "IN_STOCK" | "OUT_OF_STOCK" | null;
  checked_by_name?: string | null;
  checked_date?: string | null;
  delivered_by_name?: string | null;
  delivery_date?: string | null;
  driver_name?: string | null;
  undelivered_by_name?: string | null;
  undelivery_date?: string | null;
  payment_status?:
    | "NOT_REQUIRED"
    | "PENDING"
    | "RECEIVED";
  payment_received_by_name?: string | null;
  payment_received_date?: string | null;
};

export default function DeliveryPage() {
  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("GODOWN");

  const [shipments, setShipments] = useState<Shipment[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadShipments(type: DeliveryType) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/shipments?deliveryType=${type}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load shipments."
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
    loadShipments(deliveryType);
  }, [deliveryType]);

  async function completeDelivery(
    shipment: Shipment
  ) {
    let driverName: string | undefined;

    if (shipment.delivery_type === "DOOR") {
      const enteredName = window.prompt(
        "Enter Driver Name:"
      );

      if (enteredName === null) {
        return;
      }

      driverName = enteredName.trim();

      if (!driverName) {
        window.alert(
          "Driver name is required."
        );
        return;
      }
    }

    const confirmed = window.confirm(
      `Complete delivery for LR No. ${shipment.lr_number}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        "/api/shipments/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            shipmentId: shipment.id,
            driverName
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to complete delivery."
        );
        return;
      }

      await loadShipments(deliveryType);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    }
  }

  async function changeDeliveryType(
    shipment: Shipment
  ) {
    const newType: DeliveryType =
      shipment.delivery_type === "GODOWN"
        ? "DOOR"
        : "GODOWN";

    const confirmed = window.confirm(
      `Change LR No. ${shipment.lr_number} to ${
        newType === "DOOR"
          ? "Door Delivery"
          : "Godown Delivery"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/shipments/change-type",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            shipmentId: shipment.id,
            deliveryType: newType
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to change delivery type."
        );
        return;
      }

      await loadShipments(deliveryType);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    }
  }

  async function undoDelivery(
    shipment: Shipment
  ) {
    const confirmed = window.confirm(
      `Undo completed delivery for LR No. ${shipment.lr_number}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/shipments/undo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            shipmentId: shipment.id
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to undo delivery."
        );
        return;
      }

      await loadShipments(deliveryType);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    }
  }

  async function receivePayment(
    shipment: Shipment
  ) {
    const confirmed = window.confirm(
      `Receive payment of ₹${Number(
        shipment.amount
      ).toFixed(2)} for LR No. ${
        shipment.lr_number
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response =
