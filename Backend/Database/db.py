import psycopg2
from psycopg2.pool import ThreadedConnectionPool
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from psycopg2.extras import RealDictCursor

load_dotenv()

# Global connection pool initialized lazily
_db_pool = None

def get_connection_pool():
    global _db_pool
    if _db_pool is None:
        _db_pool = ThreadedConnectionPool(
            minconn=2,
            maxconn=20,
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            sslmode="require"
        )
    return _db_pool

class PooledConnectionWrapper:
    def __init__(self, conn, pool):
        self._conn = conn
        self._pool = pool
        
    def __getattr__(self, name):
        return getattr(self._conn, name)
        
    def __enter__(self):
        return self._conn.__enter__()
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._conn.__exit__(exc_type, exc_val, exc_tb)
        
    def close(self):
        if self._conn:
            self._pool.putconn(self._conn)
            self._conn = None

def get_db_connection():
    pool = get_connection_pool()
    conn = pool.getconn()
    return PooledConnectionWrapper(conn, pool)

def create_tables():
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create customers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20),
            address TEXT,
            reference_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create customer_ledger table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_ledger (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            purchase_item TEXT NOT NULL,
            additional_note TEXT,
            total_amount DECIMAL(12,2) NOT NULL,
            paid_amount DECIMAL(12,2) DEFAULT 0,
            purchase_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        )
    """)
    
    # Create indexes for performance
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer_id 
        ON customer_ledger(customer_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_customer_ledger_purchase_date
        ON customer_ledger(purchase_date)
    """)
    
    # Insert default user if not exists
    cursor.execute("SELECT id FROM users WHERE username = 'shoaibhabib'")
    user_exists = cursor.fetchone()
    
    if not user_exists:
        hashed_password = generate_password_hash('shoaibhabib1122')
        cursor.execute("""
            INSERT INTO users (username, password_hash)
            VALUES (%s, %s)
        """, ('shoaibhabib', hashed_password))
        print("Default user created")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("All tables created successfully!")

# Run only when you want to create tables
if __name__ == "__main__":
    create_tables()