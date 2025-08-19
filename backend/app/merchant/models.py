"""
Black Rock Payment Terminal - Merchant Models
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from datetime import datetime

class SettlementInfo(BaseModel):
    """Merchant settlement information"""
    merchant_id: str
    total_transactions: int
    total_amount: float
    currency: str
    pending_settlement: float
    last_settlement_date: Optional[str] = None
    next_settlement_date: Optional[str] = None
    bank_account: Optional[str] = None
    crypto_wallet: Optional[str] = None

class SettlementHistoryItem(BaseModel):
    """Individual settlement history item"""
    settlement_id: str
    amount: float
    currency: str
    method: str  # 'BANK' or 'CRYPTO'
    status: str  # 'PENDING', 'COMPLETED', 'FAILED'
    initiated_date: str
    completed_date: Optional[str] = None
    reference_number: Optional[str] = None

class SettlementHistoryResponse(BaseModel):
    """Settlement history response"""
    merchant_id: str
    history: List[SettlementHistoryItem]