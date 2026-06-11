from fastapi import FastAPI, HTTPException
from Database.queries import *
from Database.schema import *

app = FastAPI(title="Sindhu Iron Store API",
             description="Iron Store Management System",
             version="1.0")

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