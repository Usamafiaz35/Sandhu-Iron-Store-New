from Database.db import get_db_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime

# 1. Get all customers
def get_all_customers():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM customers ORDER BY id DESC")
    customers = cursor.fetchall()
    cursor.close()
    conn.close()
    return customers

# 2. Get single customer
def get_single_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
    customer = cursor.fetchone()
    cursor.close()
    conn.close()
    return customer

# 3. Get customer ledger (all transactions of a customer)
def get_customer_ledger(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT * FROM customer_ledger 
        WHERE customer_id = %s 
        ORDER BY purchase_date DESC
    """, (customer_id,))
    ledger = cursor.fetchall()
    cursor.close()
    conn.close()
    return ledger

# 4. Get customer balance (remaining amount)
def get_customer_balance(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT 
            customer_id,
            SUM(total_amount) as total_purchases,
            SUM(paid_amount) as total_paid,
            SUM(total_amount) - SUM(paid_amount) as balance
        FROM customer_ledger 
        WHERE customer_id = %s
        GROUP BY customer_id
    """, (customer_id,))
    balance = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if balance:
        return {
            "customer_id": balance['customer_id'],
            "total_purchases": float(balance['total_purchases']),
            "total_paid": float(balance['total_paid']),
            "balance": float(balance['balance'])
        }
    return {"customer_id": customer_id, "total_purchases": 0, "total_paid": 0, "balance": 0}

# 5. Get dashboard summary
def get_dashboard_summary():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Total customers
    cursor.execute("SELECT COUNT(*) as total FROM customers")
    total_customers = cursor.fetchone()['total']
    
    # Total sales (all purchases)
    cursor.execute("SELECT SUM(total_amount) as total_sales FROM customer_ledger")
    total_sales = cursor.fetchone()['total_sales'] or 0
    
    # Total payments received
    cursor.execute("SELECT SUM(paid_amount) as total_payments FROM customer_ledger")
    total_payments = cursor.fetchone()['total_payments'] or 0
    
    # Total pending balance
    cursor.execute("""
        SELECT SUM(total_amount - paid_amount) as total_pending 
        FROM customer_ledger
    """)
    total_pending = cursor.fetchone()['total_pending'] or 0
    
    # Recent customers (last 5)
    cursor.execute("SELECT * FROM customers ORDER BY created_at DESC LIMIT 5")
    recent_customers = cursor.fetchall()
    
    # Recent transactions (last 5)
    cursor.execute("""
        SELECT cl.*, c.customer_name 
        FROM customer_ledger cl
        JOIN customers c ON cl.customer_id = c.id
        ORDER BY cl.created_at DESC LIMIT 5
    """)
    recent_transactions = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return {
        "total_customers": total_customers,
        "total_sales": float(total_sales),
        "total_payments": float(total_payments),
        "total_pending": float(total_pending),
        "recent_customers": recent_customers,
        "recent_transactions": recent_transactions
    }

# 6. Add new ledger entry
def add_ledger_entry(customer_id, purchase_item, total_amount, purchase_date, additional_note=None, paid_amount=0):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO customer_ledger (customer_id, purchase_item, additional_note, total_amount, paid_amount, purchase_date)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (customer_id, purchase_item, additional_note, total_amount, paid_amount, purchase_date))
    
    ledger_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return ledger_id

# 7. Add new customer
def add_customer(customer_name, phone_number=None, address=None, reference_name=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO customers (customer_name, phone_number, address, reference_name)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """, (customer_name, phone_number, address, reference_name))
    
    customer_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return customer_id

# 8. Update customer record
def update_customer(customer_id, customer_name=None, phone_number=None, address=None, reference_name=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build dynamic update query
    updates = []
    values = []
    
    if customer_name:
        updates.append("customer_name = %s")
        values.append(customer_name)
    if phone_number:
        updates.append("phone_number = %s")
        values.append(phone_number)
    if address:
        updates.append("address = %s")
        values.append(address)
    if reference_name:
        updates.append("reference_name = %s")
        values.append(reference_name)
    
    if not updates:
        return False
    
    values.append(customer_id)
    query = f"UPDATE customers SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(query, values)
    
    conn.commit()
    affected_rows = cursor.rowcount
    cursor.close()
    conn.close()
    return affected_rows > 0

# 9. Update ledger entry (edit transaction)
def update_ledger_entry(ledger_id, purchase_item=None, additional_note=None, total_amount=None, paid_amount=None, purchase_date=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    if purchase_item:
        updates.append("purchase_item = %s")
        values.append(purchase_item)
    if additional_note:
        updates.append("additional_note = %s")
        values.append(additional_note)
    if total_amount:
        updates.append("total_amount = %s")
        values.append(total_amount)
    if paid_amount is not None:
        updates.append("paid_amount = %s")
        values.append(paid_amount)
    if purchase_date:
        updates.append("purchase_date = %s")
        values.append(purchase_date)
    
    if not updates:
        return False
    
    values.append(ledger_id)
    query = f"UPDATE customer_ledger SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(query, values)
    
    conn.commit()
    affected_rows = cursor.rowcount
    cursor.close()
    conn.close()
    return affected_rows > 0

# 10. Delete customer (will also delete ledger due to CASCADE)
def delete_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customers WHERE id = %s", (customer_id,))
    affected_rows = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    return affected_rows > 0

# 11. Delete ledger entry
def delete_ledger_entry(ledger_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customer_ledger WHERE id = %s", (ledger_id,))
    affected_rows = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    return affected_rows > 0

# 12. Search customers by name or phone
def search_customers(search_term):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT * FROM customers 
        WHERE customer_name ILIKE %s OR phone_number ILIKE %s
        ORDER BY customer_name
    """, (f'%{search_term}%', f'%{search_term}%'))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results

# 13. Get all customers with their balance summary
def get_customers_with_balance():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT 
            c.*,
            COALESCE(SUM(cl.total_amount), 0) as total_purchases,
            COALESCE(SUM(cl.paid_amount), 0) as total_paid,
            COALESCE(SUM(cl.total_amount) - SUM(cl.paid_amount), 0) as balance
        FROM customers c
        LEFT JOIN customer_ledger cl ON c.id = cl.customer_id
        GROUP BY c.id
        ORDER BY balance DESC
    """)
    customers = cursor.fetchall()
    cursor.close()
    conn.close()
    return customers