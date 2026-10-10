/**
 * Vendor columns end users may read (migration 003 grants SELECT on these
 * only). bank_details and documents are server-only, so user-scoped queries
 * must list columns instead of using `*`.
 */
export const PUBLIC_VENDOR_COLUMNS =
  'id, user_id, business_name, description, cuisine, location, address, phone, email, operating_hours, rating, total_orders, is_active, created_at, updated_at';
