def get_customer_orders(conn, customer_id):
    query = """
    SELECT id, customer_id, status, total_cents, created_at
    FROM orders
    WHERE customer_id = '12345';
    """

    with conn.cursor() as cur:
        cur.execute(query)
        return cur.fetchall()
