ALTER TABLE reservations
  MODIFY status ENUM('pending_payment', 'confirmed', 'cancelled', 'completed')
  NOT NULL DEFAULT 'pending_payment',
  ADD COLUMN payment_expires_at DATETIME NULL AFTER ends_at;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  provider VARCHAR(40) NOT NULL DEFAULT 'mock',
  status ENUM('succeeded', 'failed') NOT NULL,
  amount DECIMAL(10, 2) UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  failure_reason VARCHAR(255) NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_payment_user (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(40) NOT NULL UNIQUE,
  reservation_id BIGINT UNSIGNED NOT NULL UNIQUE,
  payment_id BIGINT UNSIGNED NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(220) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  vehicle_name VARCHAR(100) NOT NULL,
  license_plate VARCHAR(40) NOT NULL,
  space_code VARCHAR(40) NOT NULL,
  building_name VARCHAR(160) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  subtotal DECIMAL(10, 2) UNSIGNED NOT NULL,
  tax_rate DECIMAL(5, 4) UNSIGNED NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) UNSIGNED NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  CONSTRAINT fk_invoice_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_invoice_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_invoice_user (user_id, issued_at)
);
