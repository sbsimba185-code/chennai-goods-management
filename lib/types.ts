export type UserRole = "ADMIN" | "USER";

export type DeliveryType = "GODOWN" | "DOOR";

export type DeliveryStatus = "PENDING" | "COMPLETED";

export type StockStatus = "IN_STOCK" | "OUT_OF_STOCK";

export type PaymentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "RECEIVED";

export interface User {
  id: number;
  name: string;
  username: string;
  password_hash: string;
  role: UserRole;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
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
  delivery_status: DeliveryStatus;

  stock_status: StockStatus | null;

  checked_by: number | null;
  checked_date: string | null;

  delivered_by: number | null;
  delivery_date: string | null;
  driver_name: string | null;

  undelivered_by: number | null;
  undelivery_date: string | null;

  payment_status: PaymentStatus;
  payment_received_by: number | null;
  payment_received_date: string | null;

  deleted: number;

  created_at: string;
  updated_at: string;
}

export interface ShipmentWithUsers extends Shipment {
  checked_by_name?: string | null;
  delivered_by_name?: string | null;
  undelivered_by_name?: string | null;
  payment_received_by_name?: string | null;
}

export interface StockCheckHistory {
  id: number;
  shipment_id: number;
  stock_status: StockStatus;
  checked_by: number;
  checked_at: string;
}

export interface DeliveryHistory {
  id: number;
  shipment_id: number;
  action: string;
  performed_by: number;
  action_date: string;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
}

export interface PaymentHistory {
  id: number;
  shipment_id: number;
  amount: number;
  received_by: number;
  received_at: string;
  notes: string | null;
}

export interface ExcelShipment {
  date: string;
  lr_number: string;
  src: string;
  consignor: string;
  consignee: string;
  art: string;
  art_type: string;
  amount: number;
  delivery_to: string;
}

export interface DashboardStats {
  totalDelivery: number;
  totalInStock: number;
  totalOutOfStock: number;
  totalCompletedDelivery: number;
  totalStocksToCheck: number;
  totalPaymentToCollect: number;
}

export interface SearchFilters {
  search?: string;
  date?: string;
  lr_number?: string;
  src?: string;
  consignor?: string;
  consignee?: string;
  art?: string;
  art_type?: string;
  delivery_to?: string;
  delivery_type?: DeliveryType;
  delivery_status?: DeliveryStatus;
  stock_status?: StockStatus;
  payment_status?: PaymentStatus;
}

export interface ActionResult {
  success: boolean;
  message: string;
  shipment?: Shipment;
}

export interface DuplicateShipment {
  existingShipment: Shipment;
  importedShipment: ExcelShipment;
  matchingFields: string[];
}
