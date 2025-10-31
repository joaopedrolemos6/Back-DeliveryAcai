-- Ensure DB
CREATE DATABASE IF NOT EXISTS `acai_delivery` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `acai_delivery`;

-- Users
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE,
  phone VARCHAR(30) UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('CLIENT','ADMIN') NOT NULL DEFAULT 'CLIENT',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Refresh tokens (rotation + revocation)
CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY,        -- jti
  user_id CHAR(36) NOT NULL,
  hashed_token VARCHAR(200) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_rt_user ON refresh_tokens(user_id);
CREATE INDEX idx_rt_valid ON refresh_tokens(user_id, revoked_at, expires_at);

-- Categories
CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Products
CREATE TABLE products (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  price_cents INT NOT NULL,
  image_url VARCHAR(255) NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX idx_products_category_available ON products(category_id, is_available);

-- Addresses
CREATE TABLE addresses (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  street VARCHAR(160) NOT NULL,
  number VARCHAR(30) NOT NULL,
  complement VARCHAR(120),
  district VARCHAR(120),
  city VARCHAR(120) NOT NULL,
  state VARCHAR(60) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- Orders
CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  address_id CHAR(36) NOT NULL,
  status ENUM('PENDING','CONFIRMED','OUT_FOR_DELIVERY','DELIVERED','CANCELED') NOT NULL DEFAULT 'PENDING',
  payment_method ENUM('CASH','PIX') NOT NULL,
  payment_status ENUM('PENDING','APPROVED','DECLINED') NOT NULL DEFAULT 'PENDING',
  total_cents INT NOT NULL,
  note VARCHAR(300),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT
);
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at);

-- Order items
CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price_cents_at_order INT NOT NULL,
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Store settings + hours + location (raio)
CREATE TABLE store_settings (
  id TINYINT PRIMARY KEY DEFAULT 1,
  delivery_fee_cents INT NOT NULL,
  min_order_cents INT NOT NULL,
  delivery_radius_km DECIMAL(5,2) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  is_open TINYINT(1) NOT NULL DEFAULT 1, -- manual override se desejar fechar
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE store_hours (
  weekday TINYINT NOT NULL, -- 0=Domingo, 1=Segunda, ... 6=Sábado
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  PRIMARY KEY (weekday)
);

-- Audit trail de mudanças de status
CREATE TABLE order_status_audit (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id CHAR(36) NOT NULL,
  old_status ENUM('PENDING','CONFIRMED','OUT_FOR_DELIVERY','DELIVERED','CANCELED') NULL,
  new_status ENUM('PENDING','CONFIRMED','OUT_FOR_DELIVERY','DELIVERED','CANCELED') NOT NULL,
  changed_by CHAR(36) NOT NULL, -- user id (ADMIN/CLIENT)
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
