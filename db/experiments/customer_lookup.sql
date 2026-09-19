-- CostGate benchmark: customer order lookup
-- Baseline state: orders.customer_id has NO index.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    id,
    customer_id,
    status,
    total_cents,
    created_at
FROM orders
WHERE LOWER(customer_id::text) = '12345'
   OR status = 'pending';