USE `acai_delivery`;

-- Store settings
REPLACE INTO store_settings (id, delivery_fee_cents, min_order_cents, delivery_radius_km, latitude, longitude, is_open)
VALUES (1, 500, 2000, 5.00, -7.11532, -34.8610, 1); -- TODO: ajuste a lat/lon da loja

-- Horários (0=Dom,1=Seg,...,6=Sáb)
REPLACE INTO store_hours (weekday, open_time, close_time) VALUES
(1,'10:00:00','22:00:00'), -- Seg
(2,'10:00:00','22:00:00'), -- Ter
(3,'10:00:00','22:00:00'), -- Qua
(4,'10:00:00','22:00:00'), -- Qui
(5,'10:00:00','22:00:00'), -- Sex
(6,'14:00:00','23:00:00'), -- Sáb
(0,'14:00:00','22:00:00'); -- Dom

-- Admin user (substitua o hash)
INSERT INTO users (id,name,email,phone,password_hash,role,is_active,created_at,updated_at)
VALUES ('11111111-1111-1111-1111-111111111111','Admin','admin@acai.local','5599999999999','<<BCRYPT_HASH_ADMIN_PASSWORD>>','ADMIN',1,NOW(),NOW())
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Categorias
INSERT INTO categories (id,name,sort_order) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Açaí Tradicional',1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Complementos',2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Produtos (preços em cents)
INSERT INTO products (id,category_id,name,description,price_cents,image_url,is_available,created_at,updated_at) VALUES
('c1111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Açaí 300ml','Copo 300ml',1500,NULL,1,NOW(),NOW()),
('c2222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Açaí 500ml','Copo 500ml',2200,NULL,1,NOW(),NOW()),
('c3333333-3333-3333-3333-333333333333','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Granola','Porção extra',300,NULL,1,NOW(),NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);
