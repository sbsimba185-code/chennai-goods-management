-- ============================================================
-- CHENNAI GOODS DELIVERY TRACKER
-- DATABASE SCHEMA
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    username TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'USER'
        CHECK (role IN ('ADMIN', 'USER')),

    active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SHIPMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    shipment_id TEXT NOT NULL UNIQUE,

    shipment_date TEXT NOT NULL,

    lr_number TEXT NOT NULL,

    src TEXT NOT NULL,

    consignor TEXT NOT NULL,

    consignee TEXT NOT NULL,

    art TEXT NOT NULL,

    art_type TEXT NOT NULL,

    amount REAL NOT NULL DEFAULT 0,

    delivery_to TEXT NOT NULL,

    -- GODOWN or DOOR
    delivery_type TEXT NOT NULL DEFAULT 'GODOWN'
        CHECK (delivery_type IN ('GODOWN', 'DOOR')),

    -- PENDING or COMPLETED
    delivery_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (delivery_status IN ('PENDING', 'COMPLETED')),

    -- IN_STOCK or OUT_OF_STOCK
    stock_status TEXT DEFAULT NULL
        CHECK (
            stock_status IS NULL
            OR stock_status IN ('IN_STOCK', 'OUT_OF_STOCK')
        ),

    -- Latest stock check
    checked_by INTEGER DEFAULT NULL,

    checked_date TEXT DEFAULT NULL,

    -- Delivery details
    delivered_by INTEGER DEFAULT NULL,

    delivery_date TEXT DEFAULT NULL,

    driver_name TEXT DEFAULT NULL,

    -- Undo delivery details
    undelivered_by INTEGER DEFAULT NULL,

    undelivery_date TEXT DEFAULT NULL,

    -- Payment
    payment_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED'
        CHECK (
            payment_status IN (
                'NOT_REQUIRED',
                'PENDING',
                'RECEIVED'
            )
        ),

    payment_received_by INTEGER DEFAULT NULL,

    payment_received_date TEXT DEFAULT NULL,

    -- Soft delete
    deleted INTEGER NOT NULL DEFAULT 0
        CHECK (deleted IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (checked_by)
        REFERENCES users(id),

    FOREIGN KEY (delivered_by)
        REFERENCES users(id),

    FOREIGN KEY (undelivered_by)
        REFERENCES users(id),

    FOREIGN KEY (payment_received_by)
        REFERENCES users(id)
);


-- ============================================================
-- STOCK CHECK HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_check_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    shipment_id INTEGER NOT NULL,

    stock_status TEXT NOT NULL
        CHECK (
            stock_status IN (
                'IN_STOCK',
                'OUT_OF_STOCK'
            )
        ),

    checked_by INTEGER NOT NULL,

    checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (shipment_id)
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (checked_by)
        REFERENCES users(id)
);


-- ============================================================
-- DELIVERY HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    shipment_id INTEGER NOT NULL,

    action TEXT NOT NULL,

    performed_by INTEGER NOT NULL,

    action_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    old_value TEXT DEFAULT NULL,

    new_value TEXT DEFAULT NULL,

    notes TEXT DEFAULT NULL,

    FOREIGN KEY (shipment_id)
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (performed_by)
        REFERENCES users(id)
);


-- ============================================================
-- PAYMENT HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    shipment_id INTEGER NOT NULL,

    amount REAL NOT NULL DEFAULT 0,

    received_by INTEGER NOT NULL,

    received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes TEXT DEFAULT NULL,

    FOREIGN KEY (shipment_id)
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (received_by)
        REFERENCES users(id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_shipments_lr_number
ON shipments(lr_number);

CREATE INDEX IF NOT EXISTS idx_shipments_date
ON shipments(shipment_date);

CREATE INDEX IF NOT EXISTS idx_shipments_consignor
ON shipments(consignor);

CREATE INDEX IF NOT EXISTS idx_shipments_consignee
ON shipments(consignee);

CREATE INDEX IF NOT EXISTS idx_shipments_delivery_type
ON shipments(delivery_type);

CREATE INDEX IF NOT EXISTS idx_shipments_delivery_status
ON shipments(delivery_status);

CREATE INDEX IF NOT EXISTS idx_shipments_stock_status
ON shipments(stock_status);

CREATE INDEX IF NOT EXISTS idx_shipments_payment_status
ON shipments(payment_status);

CREATE INDEX IF NOT EXISTS idx_stock_check_shipment
ON stock_check_history(shipment_id);

CREATE INDEX IF NOT EXISTS idx_delivery_history_shipment
ON delivery_history(shipment_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_shipment
ON payment_history(shipment_id);
