-- CostGate benchmark: optimized customer order lookup
-- Fix: add an index on orders.customer_id.

CREATE INDEX IF NOT EXISTS idx_orders_customer_id
ON orders(customer_id);

ANALYZE orders;

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    id,
    customer_id,
    status,
    total_cents,
    created_at
FROM orders
WHERE customer_id = 12345;