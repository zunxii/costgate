-- CostGate shadow database seed
-- 50,000 customers
-- 300,000 orders
-- 900,000 order_items

SELECT setseed(0.42);

INSERT INTO customers (email, country, created_at)
SELECT
    'user' || i || '@example.com',
    (ARRAY['US','IN','UK','DE','BR'])[1 + floor(random() * 5)::int],
    now() - (random() * interval '730 days')
FROM generate_series(1, 50000) AS i;

INSERT INTO orders (customer_id, status, total_cents, created_at)
SELECT
    1 + floor(random() * 50000)::bigint,
    (ARRAY['pending','paid','shipped','refunded'])[1 + floor(random() * 4)::int],
    (500 + floor(random() * 20000))::int,
    now() - (random() * interval '730 days')
FROM generate_series(1, 300000) AS i;

INSERT INTO order_items (order_id, sku, quantity, price_cents)
SELECT
    1 + floor(random() * 300000)::bigint,
    'SKU-' || (1 + floor(random() * 5000))::int,
    1 + floor(random() * 4)::int,
    (200 + floor(random() * 8000))::int
FROM generate_series(1, 900000) AS i;

ANALYZE customers;
ANALYZE orders;
ANALYZE order_items;