import db from "./database";
import type {
  ExcelShipment,
  Shipment,
  ShipmentWithUsers,
  DashboardStats,
  SearchFilters,
  StockStatus,
  DeliveryType,
  ActionResult
} from "./types";

/* ============================================================
   HELPERS
   ============================================================ */

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: unknown): string {
  return clean(value).toLowerCase();
}

function generateShipmentId(): string {
  const row = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shipments
      `
    )
    .get() as { count: number };

  return `SHP-${String(row.count + 1).padStart(6, "0")}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   DUPLICATE CHECK
   ============================================================ */

/**
 * A shipment is considered a duplicate ONLY when all
 * nine imported shipment fields match.
 *
 * LR number by itself is NOT unique.
 */
export function findDuplicateShipment(
  shipment: ExcelShipment
): Shipment | null {
  const rows = db
    .prepare(
      `
      SELECT *
      FROM shipments
      WHERE deleted = 0
      `
    )
    .all() as Shipment[];

  const duplicate = rows.find((existing) => {
    return (
      normalize(existing.shipment_date) ===
        normalize(shipment.date) &&
      normalize(existing.lr_number) ===
        normalize(shipment.lr_number) &&
      normalize(existing.src) ===
        normalize(shipment.src) &&
      normalize(existing.consignor) ===
        normalize(shipment.consignor) &&
      normalize(existing.consignee) ===
        normalize(shipment.consignee) &&
      normalize(existing.art) ===
        normalize(shipment.art) &&
      normalize(existing.art_type) ===
        normalize(shipment.art_type) &&
      Number(existing.amount) === Number(shipment.amount) &&
      normalize(existing.delivery_to) ===
        normalize(shipment.delivery_to)
    );
  });

  return duplicate ?? null;
}

/* ============================================================
   ADD SHIPMENT
   ============================================================ */

export function addShipment(
  shipment: ExcelShipment
): ActionResult {
  const duplicate = findDuplicateShipment(shipment);

  if (duplicate) {
    return {
      success: false,
      message:
        `Duplicate shipment found. ` +
        `Shipment ID: ${duplicate.shipment_id}`,
      shipment: duplicate
    };
  }

  const shipmentId = generateShipmentId();

  const result = db
    .prepare(
      `
      INSERT INTO shipments (
        shipment_id,
        shipment_date,
        lr_number,
        src,
        consignor,
        consignee,
        art,
        art_type,
        amount,
        delivery_to,
        delivery_type,
        delivery_status,
        stock_status,
        payment_status
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'GODOWN',
        'PENDING',
        NULL,
        'NOT_REQUIRED'
      )
      `
    )
    .run(
      shipmentId,
      clean(shipment.date),
      clean(shipment.lr_number),
      clean(shipment.src),
      clean(shipment.consignor),
      clean(shipment.consignee),
      clean(shipment.art),
      clean(shipment.art_type),
      Number(shipment.amount) || 0,
      clean(shipment.delivery_to)
    );

  const created = db
    .prepare(
      `
      SELECT *
      FROM shipments
      WHERE id = ?
      `
    )
    .get(result.lastInsertRowid) as Shipment;

  return {
    success: true,
    message: "Shipment added successfully.",
    shipment: created
  };
}

/* ============================================================
   GET SHIPMENT
   ============================================================ */

export function getShipment(
  id: number
): ShipmentWithUsers | null {
  const shipment = db
    .prepare(
      `
      SELECT
        s.*,

        u1.name AS checked_by_name,
        u2.name AS delivered_by_name,
        u3.name AS undelivered_by_name,
        u4.name AS payment_received_by_name

      FROM shipments s

      LEFT JOIN users u1
        ON s.checked_by = u1.id

      LEFT JOIN users u2
        ON s.delivered_by = u2.id

      LEFT JOIN users u3
        ON s.undelivered_by = u3.id

      LEFT JOIN users u4
        ON s.payment_received_by = u4.id

      WHERE s.id = ?
      AND s.deleted = 0

      LIMIT 1
      `
    )
    .get(id) as ShipmentWithUsers | undefined;

  return shipment ?? null;
}

/* ============================================================
   GET ALL SHIPMENTS
   ============================================================ */

export function getAllShipments(): ShipmentWithUsers[] {
  return db
    .prepare(
      `
      SELECT
        s.*,

        u1.name AS checked_by_name,
        u2.name AS delivered_by_name,
        u3.name AS undelivered_by_name,
        u4.name AS payment_received_by_name

      FROM shipments s

      LEFT JOIN users u1
        ON s.checked_by = u1.id

      LEFT JOIN users u2
        ON s.delivered_by = u2.id

      LEFT JOIN users u3
        ON s.undelivered_by = u3.id

      LEFT JOIN users u4
        ON s.payment_received_by = u4.id

      WHERE s.deleted = 0

      ORDER BY s.id DESC
      `
    )
    .all() as ShipmentWithUsers[];
}

/* ============================================================
   SEARCH
   ============================================================ */

export function searchShipments(
  filters: SearchFilters
): ShipmentWithUsers[] {
  const conditions: string[] = [
    "s.deleted = 0"
  ];

  const values: unknown[] = [];

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;

    conditions.push(`
      (
        s.lr_number LIKE ?
        OR s.src LIKE ?
        OR s.consignor LIKE ?
        OR s.consignee LIKE ?
        OR s.art LIKE ?
        OR s.art_type LIKE ?
        OR s.delivery_to LIKE ?
        OR s.shipment_id LIKE ?
        OR CAST(s.amount AS TEXT) LIKE ?
      )
    `);

    for (let i = 0; i < 9; i++) {
      values.push(search);
    }
  }

  if (filters.date) {
    conditions.push("s.shipment_date = ?");
    values.push(filters.date);
  }

  if (filters.lr_number) {
    conditions.push("s.lr_number LIKE ?");
    values.push(`%${filters.lr_number}%`);
  }

  if (filters.src) {
    conditions.push("s.src LIKE ?");
    values.push(`%${filters.src}%`);
  }

  if (filters.consignor) {
    conditions.push("s.consignor LIKE ?");
    values.push(`%${filters.consignor}%`);
  }

  if (filters.consignee) {
    conditions.push("s.consignee LIKE ?");
    values.push(`%${filters.consignee}%`);
  }

  if (filters.art) {
    conditions.push("s.art LIKE ?");
    values.push(`%${filters.art}%`);
  }

  if (filters.art_type) {
    conditions.push("s.art_type LIKE ?");
    values.push(`%${filters.art_type}%`);
  }

  if (filters.delivery_to) {
    conditions.push("s.delivery_to LIKE ?");
    values.push(`%${filters.delivery_to}%`);
  }

  if (filters.delivery_type) {
    conditions.push("s.delivery_type = ?");
    values.push(filters.delivery_type);
  }

  if (filters.delivery_status) {
    conditions.push("s.delivery_status = ?");
    values.push(filters.delivery_status);
  }

  if (filters.stock_status) {
    conditions.push("s.stock_status = ?");
    values.push(filters.stock_status);
  }

  if (filters.payment_status) {
    conditions.push("s.payment_status = ?");
    values.push(filters.payment_status);
  }

  return db
    .prepare(
      `
      SELECT
        s.*,

        u1.name AS checked_by_name,
        u2.name AS delivered_by_name,
        u3.name AS undelivered_by_name,
        u4.name AS payment_received_by_name

      FROM shipments s

      LEFT JOIN users u1
        ON s.checked_by = u1.id

      LEFT JOIN users u2
        ON s.delivered_by = u2.id

      LEFT JOIN users u3
        ON s.undelivered_by = u3.id

      LEFT JOIN users u4
        ON s.payment_received_by = u4.id

      WHERE ${conditions.join(" AND ")}

      ORDER BY s.id DESC
      `
    )
    .all(...values) as ShipmentWithUsers[];
}

/* ============================================================
   DAILY STOCK CHECK
   ============================================================ */

/**
 * Returns undelivered shipments that have NOT been checked today.
 *
 * A shipment must be checked again every day.
 */
export function getStocksToCheckToday(): ShipmentWithUsers[] {
  const currentDate = today();

  return db
    .prepare(
      `
      SELECT
        s.*,

        u1.name AS checked_by_name,
        u2.name AS delivered_by_name

      FROM shipments s

      LEFT JOIN users u1
        ON s.checked_by = u1.id

      LEFT JOIN users u2
        ON s.delivered_by = u2.id

      WHERE s.deleted = 0
      AND s.delivery_status = 'PENDING'

      AND (
        s.checked_date IS NULL
        OR DATE(s.checked_date) <> DATE(?)
      )

      ORDER BY s.id DESC
      `
    )
    .all(currentDate) as ShipmentWithUsers[];
}

/* ============================================================
   STOCK CHECK
   ============================================================ */

export function checkStock(
  shipmentId: number,
  userId: number,
  status: StockStatus
): ActionResult {
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    return {
      success: false,
      message: "Shipment not found."
    };
  }

  if (shipment.delivery_status === "COMPLETED") {
    return {
      success: false,
      message: "Completed shipment cannot be stock checked."
    };
  }

  const currentDate = today();

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE shipments

      SET
        stock_status = ?,
        checked_by = ?,
        checked_date = ?,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
      `
    ).run(
      status,
      userId,
      currentDate,
      shipmentId
    );

    db.prepare(
      `
      INSERT INTO stock_check_history (
        shipment_id,
        stock_status,
        checked_by
      )
      VALUES (?, ?, ?)
      `
    ).run(
      shipmentId,
      status,
      userId
    );
  });

  transaction();

  return {
    success: true,
    message: "Stock checked successfully.",
    shipment: getShipment(shipmentId) ?? undefined
  };
}

/* ============================================================
   CHANGE DELIVERY TYPE
   ============================================================ */

export function changeDeliveryType(
  shipmentId: number,
  userId: number,
  newType: DeliveryType
): ActionResult {
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    return {
      success: false,
      message: "Shipment not found."
    };
  }

  if (shipment.delivery_status === "COMPLETED") {
    return {
      success: false,
      message:
        "Completed shipment delivery type cannot be changed."
    };
  }

  if (shipment.delivery_type === newType) {
    return {
      success: false,
      message: "Shipment already has this delivery type."
    };
  }

  const oldType = shipment.delivery_type;

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE shipments

      SET
        delivery_type = ?,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
      `
    ).run(newType, shipmentId);

    db.prepare(
      `
      INSERT INTO delivery_history (
        shipment_id,
        action,
        performed_by,
        old_value,
        new_value,
        notes
      )
      VALUES (
        ?,
        'CHANGE_DELIVERY_TYPE',
        ?,
        ?,
        ?,
        ?
      )
      `
    ).run(
      shipmentId,
      userId,
      oldType,
      newType,
      `Changed from ${oldType} to ${newType}`
    );
  });

  transaction();

  return {
    success: true,
    message:
      `Delivery type changed from ${oldType} to ${newType}.`,
    shipment: getShipment(shipmentId) ?? undefined
  };
}

/* ============================================================
   COMPLETE GODOWN DELIVERY
   ============================================================ */

export function completeGodownDelivery(
  shipmentId: number,
  userId: number
): ActionResult {
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    return {
      success: false,
      message: "Shipment not found."
    };
  }

  if (shipment.delivery_status === "COMPLETED") {
    return {
      success: false,
      message: "Shipment is already completed."
    };
  }

  if (shipment.delivery_type !== "GODOWN") {
    return {
      success: false,
      message:
        "This shipment is not currently a Godown delivery."
    };
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE shipments

      SET
        delivery_status = 'COMPLETED',
        delivered_by = ?,
        delivery_date = ?,
        stock_status = NULL,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
      `
    ).run(
      userId,
      today(),
      shipmentId
    );

    db.prepare(
      `
      INSERT INTO delivery_history (
        shipment_id,
        action,
        performed_by,
        old_value,
        new_value
      )
      VALUES (
        ?,
        'COMPLETE_DELIVERY',
        ?,
        'PENDING',
        'COMPLETED'
      )
      `
    ).run(
      shipmentId,
      userId
    );
  });

  transaction();

  return {
    success: true,
    message: "Godown delivery completed.",
    shipment: getShipment(shipmentId) ?? undefined
  };
}

/* ============================================================
   COMPLETE DOOR DELIVERY
   ============================================================ */

export function completeDoorDelivery(
  shipmentId: number,
  userId: number,
  driverName: string
): ActionResult {
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    return {
      success: false,
      message: "Shipment not found."
    };
  }

  if (shipment.delivery_status === "COMPLETED") {
    return {
      success: false,
      message: "Shipment is already completed."
    };
  }

  if (shipment.delivery_type !== "DOOR") {
    return {
      success: false,
      message:
        "This shipment is not currently a Door delivery."
    };
  }

  if (!driverName.trim()) {
    return {
      success: false,
      message: "Driver name is required."
    };
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE shipments

      SET
        delivery_status = 'COMPLETED',
        delivered_by = ?,
        delivery_date = ?,
        driver_name = ?,
        stock_status = NULL,
        payment_status = 'PENDING',
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
      `
    ).run(
      userId,
      today(),
      driverName.trim(),
      shipmentId
    );

    db.prepare(
      `
      INSERT INTO delivery_history (
        shipment_id,
        action,
        performed_by,
        old_value,
        new_value,
        notes
      )
      VALUES (
        ?,
        'COMPLETE_DOOR_DELIVERY',
        ?,
        'PENDING',
        'COMPLETED',
        ?
      )
      `
    ).run(
      shipmentId,
      userId,
      `Driver: ${driverName.trim()}`
    );
  });

  transaction();

  return {
    success: true,
    message: "Door delivery completed.",
    shipment: getShipment(shipmentId) ?? undefined
  };
}

/* ============================================================
   UNDO DELIVERY
   ============================================================ */

export function undoDelivery(
  shipmentId: number,
  userId: number
): ActionResult {
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    return {
      success: false,
      message: "Shipment not found."
    };
  }

  if (shipment.delivery_status !== "COMPLETED") {
    return {
      success: false,
      message: "Shipment is not completed."
    };
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE shipments

      SET
        delivery_status = 'PENDING',

        undelivered_by = ?,
        undelivery_date = ?,

        delivered_by = NULL,
        delivery_date = NULL,
        driver_name = NULL,

        payment_status = 'NOT_REQUIRED',
        payment_received_by = NULL,
        payment_received_date = NULL,

        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
      `
    ).run(
      userId,
      today(),
      shipmentId
    );

    db.prepare(
      `
      INSERT INTO delivery_history (
        shipment_id,
        action,
        performed_by,
        old_value,
        new_value
      )
      VALUES (
        ?,
        'UNDO_DELIVERY',
        ?,
        'COMPLETED',
        'PENDING'
      )
      `
    ).run(
      shipmentId,
      userId
    );
  });

  transaction();

  return {
    success: true,
    message: "Delivery has been undone.",
    shipment: getShipment(shipmentId) ?? undefined
  };
}

/* ============================================================
   RECEIVE PAYMENT
   ============================================================ */

export function receivePayment(
  shipmentId: number,
  userId: number
): ActionResult {
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    return {
      success: false,
      message: "Shipment not found."
    };
  }

  if (shipment.delivery_status !== "COMPLETED") {
    return {
      success: false,
      message:
        "Payment can only be received after delivery."
    };
  }

  if (shipment.delivery_type !== "DOOR") {
    return {
      success: false,
      message:
        "Payment collection is only available for Door deliveries."
    };
  }

  if (shipment.payment_status === "RECEIVED") {
    return {
      success: false,
      message: "Payment has already been received."
    };
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE shipments

      SET
        payment_status = 'RECEIVED',
        payment_received_by = ?,
        payment_received_date = ?,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
      `
    ).run(
      userId,
      today(),
      shipmentId
    );

    db.prepare(
      `
      INSERT INTO payment_history (
        shipment_id,
        amount,
        received_by
      )
      VALUES (?, ?, ?)
      `
    ).run(
      shipmentId,
      shipment.amount,
      userId
    );
  });

  transaction();

  return {
    success: true,
    message: "Payment received successfully.",
    shipment: getShipment(shipmentId) ?? undefined
  };
}

/* ============================================================
   REPORTS
   ============================================================ */

export function getGodownDeliveries(): ShipmentWithUsers[] {
  return searchShipments({
    delivery_type: "GODOWN",
    delivery_status: "PENDING"
  });
}

export function getDoorDeliveries(): ShipmentWithUsers[] {
  return searchShipments({
    delivery_type: "DOOR",
    delivery_status: "PENDING"
  });
}

export function getInStockShipments(): ShipmentWithUsers[] {
  return searchShipments({
    stock_status: "IN_STOCK",
    delivery_status: "PENDING"
  });
}

export function getOutOfStockShipments(): ShipmentWithUsers[] {
  return searchShipments({
    stock_status: "OUT_OF_STOCK",
    delivery_status: "PENDING"
  });
}

export function getSentToDoorDeliveries(): ShipmentWithUsers[] {
  return searchShipments({
    delivery_type: "DOOR",
    delivery_status: "COMPLETED"
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */

export function getDashboardStats(): DashboardStats {
  const totalDelivery = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shipments
      WHERE deleted = 0
      AND delivery_status = 'PENDING'
      `
    )
    .get() as { count: number };

  const totalInStock = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shipments
      WHERE deleted = 0
      AND delivery_status = 'PENDING'
      AND stock_status = 'IN_STOCK'
      `
    )
    .get() as { count: number };

  const totalOutOfStock = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shipments
      WHERE deleted = 0
      AND delivery_status = 'PENDING'
      AND stock_status = 'OUT_OF_STOCK'
      `
    )
    .get() as { count: number };

  const totalCompletedDelivery = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shipments
      WHERE deleted = 0
      AND delivery_status = 'COMPLETED'
      `
    )
    .get() as { count: number };

  const stocksToCheck = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shipments
      WHERE deleted = 0
      AND delivery_status = 'PENDING'

      AND (
        checked_date IS NULL
        OR DATE(checked_date) <> DATE(?)
      )
      `
    )
    .get(today()) as { count: number };

  const paymentToCollect = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shipments
      WHERE deleted = 0
      AND delivery_type = 'DOOR'
      AND delivery_status = 'COMPLETED'
      AND payment_status = 'PENDING'
      `
    )
    .get() as { count: number };

  return {
    totalDelivery: totalDelivery.count,
    totalInStock: totalInStock.count,
    totalOutOfStock: totalOutOfStock.count,
    totalCompletedDelivery:
      totalCompletedDelivery.count,
    totalStocksToCheck: stocksToCheck.count,
    totalPaymentToCollect: paymentToCollect.count
  };
}

/* ============================================================
   SOFT DELETE
   ============================================================ */

export function deleteShipment(
  shipmentId: number
): ActionResult {
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    return {
      success: false,
      message: "Shipment not found."
    };
  }

  db.prepare(
    `
    UPDATE shipments

    SET
      deleted = 1,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
    `
  ).run(shipmentId);

  return {
    success: true,
    message: "Shipment deleted successfully."
  };
      }
