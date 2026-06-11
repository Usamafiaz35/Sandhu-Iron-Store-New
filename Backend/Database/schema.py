from pydantic import BaseModel
from typing import Optional


# Request Models (Pydantic)
class CustomerCreate(BaseModel):
    customer_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    reference_name: Optional[str] = None

class CustomerUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    reference_name: Optional[str] = None

class LedgerEntryCreate(BaseModel):
    customer_id: int
    purchase_item: str
    total_amount: float
    purchase_date: str
    additional_note: Optional[str] = None
    paid_amount: Optional[float] = 0

class LedgerEntryUpdate(BaseModel):
    purchase_item: Optional[str] = None
    additional_note: Optional[str] = None
    total_amount: Optional[float] = None
    paid_amount: Optional[float] = None
    purchase_date: Optional[str] = None
