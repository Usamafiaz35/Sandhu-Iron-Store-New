from datetime import datetime, timedelta
from db import get_db_connection

def seed_customers():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Pehle check karo agar data already hai toh mat dalo
    cursor.execute("SELECT COUNT(*) FROM customers")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"Data already exists ({count} customers). Skipping seed data.")
        cursor.close()
        conn.close()
        return
    
    # 5 Customers insert karo
    customers = [
        ("Ramesh Kumar", "9876543210", "123, Main Street, Delhi", "Suresh Gupta"),
        ("Suresh Sharma", "9876543211", "45, Park Avenue, Mumbai", "Amit Patel"),
        ("Amit Singh", "9876543212", "78, Civil Lines, Jaipur", "Ramesh Kumar"),
        ("Vikram Verma", "9876543213", "12, Sadar Bazaar, Lucknow", "Suresh Sharma"),
        ("Rajesh Mehra", "9876543214", "56, Lake Road, Kolkata", "Vikram Verma")
    ]
    
    customer_ids = []
    for customer in customers:
        cursor.execute("""
            INSERT INTO customers (customer_name, phone_number, address, reference_name)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, customer)
        customer_id = cursor.fetchone()[0]
        customer_ids.append(customer_id)
        print(f"✓ Customer added: {customer[0]}")
    
    conn.commit()
    
    # Ledger entries (purchases) for each customer
    today = datetime.now().date()
    
    ledger_entries = [
        # Customer 1 (Ramesh Kumar) - 2 purchases
        (customer_ids[0], "Iron Rods 12mm - 100 pcs", "Building material", 75000.00, 50000.00, today - timedelta(days=30)),
        (customer_ids[0], "Cement 50kg - 200 bags", "For roof casting", 88000.00, 38000.00, today - timedelta(days=15)),
        
        # Customer 2 (Suresh Sharma) - 2 purchases
        (customer_ids[1], "Steel Sheets - 50 pcs", "Factory shed", 120000.00, 80000.00, today - timedelta(days=45)),
        (customer_ids[1], "Iron Angles - 80 pcs", "Fabrication work", 45000.00, 45000.00, today - timedelta(days=10)),
        
        # Customer 3 (Amit Singh) - 1 purchase
        (customer_ids[2], "TMT Bars 16mm - 150 pcs", "House construction", 95000.00, 55000.00, today - timedelta(days=20)),
        
        # Customer 4 (Vikram Verma) - 2 purchases
        (customer_ids[3], "GI Pipes - 60 pcs", "Plumbing work", 68000.00, 68000.00, today - timedelta(days=60)),
        (customer_ids[3], "Iron Rods 8mm - 120 pcs", "Boundary wall", 52000.00, 20000.00, today - timedelta(days=5)),
        
        # Customer 5 (Rajesh Mehra) - 1 purchase
        (customer_ids[4], "MS Channel - 40 pcs", "Industrial shed", 110000.00, 60000.00, today - timedelta(days=25))
    ]
    
    for entry in ledger_entries:
        cursor.execute("""
            INSERT INTO customer_ledger 
            (customer_id, purchase_item, additional_note, total_amount, paid_amount, purchase_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, entry)
        print(f"✓ Ledger entry added for customer: Total ₹{entry[3]:,.2f}, Paid ₹{entry[4]:,.2f}")
    
    conn.commit()
    
    # Show summary
    print("\n" + "="*50)
    print("SEED DATA SUMMARY")
    print("="*50)
    print(f"✅ Total Customers Added: {len(customer_ids)}")
    print(f"✅ Total Ledger Entries: {len(ledger_entries)}")
    
    cursor.execute("SELECT SUM(total_amount) FROM customer_ledger")
    total_sales = cursor.fetchone()[0] or 0
    cursor.execute("SELECT SUM(paid_amount) FROM customer_ledger")
    total_paid = cursor.fetchone()[0] or 0
    
    print(f"💰 Total Sales Value: ₹{total_sales:,.2f}")
    print(f"💵 Total Payments Received: ₹{total_paid:,.2f}")
    print(f"📊 Total Pending Balance: ₹{total_sales - total_paid:,.2f}")
    print("="*50)
    
    cursor.close()
    conn.close()

def delete_all_data():
    """Warning: Ye saara data delete kar dega"""
    confirm = input("⚠️  Saara data delete karna hai? (yes/no): ")
    if confirm.lower() == 'yes':
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM customer_ledger")
        cursor.execute("DELETE FROM customers")
        conn.commit()
        print("✅ All data deleted successfully!")
        cursor.close()
        conn.close()
    else:
        print("❌ Operation cancelled")

if __name__ == "__main__":
    print("="*50)
    print("🌱 SEED DATA SCRIPT")
    print("="*50)
    print("\nOptions:")
    print("1. Add seed data (5 customers with purchases)")
    print("2. Delete all data")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1/2/3): ")
    
    if choice == '1':
        seed_customers()
        print("\n✅ Seed data added successfully! Ab aap API test kar sakte ho.")
        print("👉 Run: uvicorn app:app --reload")
    elif choice == '2':
        delete_all_data()
    else:
        print("👋 Bye!")