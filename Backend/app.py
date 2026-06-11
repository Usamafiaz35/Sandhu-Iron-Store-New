import os
from dotenv import load_dotenv
import jwt

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from Database.queries import *
from Database.schema import *

from datetime import datetime, timedelta
from werkzeug.security import check_password_hash
from Database.db import get_db_connection
from psycopg2.extras import RealDictCursor


app = FastAPI(title="Sindhu Iron Store API",
             description="Iron Store Management System",
             version="1.0")

# Security
security = HTTPBearer()

# Load environment variables
load_dotenv()

# ==================== JWT CONFIGURATION ====================

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS"))

# Check if values exist
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not found in .env file")
if not ALGORITHM:
    raise ValueError("ALGORITHM not found in .env file")

# ==================== LOGIN ENDPOINTS ====================

@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute(
            "SELECT id, username, password_hash FROM users WHERE username = %s",
            (request.username,)
        )
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], request.password):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Use expiry from .env
        token_data = {
            "user_id": user['id'],
            "username": user['username'],
            "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
        }
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        return LoginResponse(
            success=True,
            token=token,
            user={
                "id": user['id'],
                "username": user['username']
            },
            message="Login successful"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/logout")
def logout():
    """User logout endpoint"""
    return {
        "success": True,
        "message": "Logout successful"
    }

@app.get("/verify-token")
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify if token is valid"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "success": True,
            "valid": True,
            "user": payload
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== CUSTOMERS ENDPOINTS ====================

@app.get("/customers")
def get_all_customers_endpoint():
    """Get all customers"""
    customers = get_all_customers()
    return {"success": True, "data": customers}

@app.get("/customers/{customer_id}")
def get_single_customer_endpoint(customer_id: int):
    """Get single customer by ID"""
    customer = get_single_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "data": customer}

@app.post("/customers")
def add_customer_endpoint(customer: CustomerCreate):
    """Add new customer"""
    customer_id = add_customer(
        customer_name=customer.customer_name,
        phone_number=customer.phone_number,
        address=customer.address,
        reference_name=customer.reference_name
    )
    return {"success": True, "message": "Customer added successfully", "customer_id": customer_id}

@app.put("/customers/{customer_id}")
def update_customer_endpoint(customer_id: int, customer: CustomerUpdate):
    """Update customer record"""
    updated = update_customer(
        customer_id=customer_id,
        customer_name=customer.customer_name,
        phone_number=customer.phone_number,
        address=customer.address,
        reference_name=customer.reference_name
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Customer not found or no changes made")
    return {"success": True, "message": "Customer updated successfully"}

@app.delete("/customers/{customer_id}")
def delete_customer_endpoint(customer_id: int):
    """Delete customer and all their ledger entries"""
    deleted = delete_customer(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "message": "Customer deleted successfully"}

@app.get("/customers/search/{search_term}")
def search_customers_endpoint(search_term: str):
    """Search customers by name or phone"""
    results = search_customers(search_term)
    return {"success": True, "data": results}

@app.get("/customers-with-balance")
def get_customers_with_balance_endpoint():
    """Get all customers with their balance summary"""
    customers = get_customers_with_balance()
    return {"success": True, "data": customers}

# ==================== LEDGER ENDPOINTS ====================

@app.get("/ledger/{customer_id}")
def get_customer_ledger_endpoint(customer_id: int):
    """Get all ledger entries for a customer"""
    # First check if customer exists
    customer = get_single_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    ledger = get_customer_ledger(customer_id)
    return {"success": True, "data": ledger}

@app.get("/ledger/balance/{customer_id}")
def get_customer_balance_endpoint(customer_id: int):
    """Get customer balance summary"""
    balance = get_customer_balance(customer_id)
    return {"success": True, "data": balance}

@app.post("/ledger")
def add_ledger_entry_endpoint(entry: LedgerEntryCreate):
    """Add new ledger entry for a customer"""
    # Check if customer exists
    customer = get_single_customer(entry.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    ledger_id = add_ledger_entry(
        customer_id=entry.customer_id,
        purchase_item=entry.purchase_item,
        total_amount=entry.total_amount,
        purchase_date=entry.purchase_date,
        additional_note=entry.additional_note,
        paid_amount=entry.paid_amount
    )
    return {"success": True, "message": "Ledger entry added successfully", "ledger_id": ledger_id}

@app.put("/ledger/{ledger_id}")
def update_ledger_entry_endpoint(ledger_id: int, entry: LedgerEntryUpdate):
    """Update ledger entry"""
    updated = update_ledger_entry(
        ledger_id=ledger_id,
        purchase_item=entry.purchase_item,
        additional_note=entry.additional_note,
        total_amount=entry.total_amount,
        paid_amount=entry.paid_amount,
        purchase_date=entry.purchase_date
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Ledger entry not found or no changes made")
    return {"success": True, "message": "Ledger entry updated successfully"}

@app.delete("/ledger/{ledger_id}")
def delete_ledger_entry_endpoint(ledger_id: int):
    """Delete ledger entry"""
    deleted = delete_ledger_entry(ledger_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    return {"success": True, "message": "Ledger entry deleted successfully"}

# ==================== DASHBOARD ENDPOINTS ====================

@app.get("/dashboard")
def get_dashboard_summary_endpoint():
    """Get complete dashboard summary"""
    summary = get_dashboard_summary()
    return {"success": True, "data": summary}

# ==================== HEALTH CHECK ====================

@app.get("/")
def root():
    return {
        "success": True, 
        "message": "Sindhu Iron Store API is running",
        "endpoints": {
            "customers": "/customers",
            "dashboard": "/dashboard",
            "ledger": "/ledger/{customer_id}"
        }
    }

@app.get("/health")
def health_check():
    return {"success": True, "status": "healthy"}