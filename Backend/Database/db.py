import psycopg2
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from psycopg2.extras import RealDictCursor

load_dotenv()

def get_db_connection():
    
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        sslmode="require"
    )
    return conn

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