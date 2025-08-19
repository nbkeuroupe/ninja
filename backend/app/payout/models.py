"""
Black Rock Payment Terminal - Payout Models
"""

from typing import Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel

class PayoutMethod(str, Enum):
    BANK = "BANK"
    CRYPTO = "CRYPTO"

class BankPayoutSettings(BaseModel):
    account_name: str
    account_number: str
    routing_number: str
    bank_name: str
    swift_code: Optional[str] = None
    iban: Optional[str] = None

class CryptoPayoutSettings(BaseModel):
    wallet_address: str
    currency: str  # BTC, ETH, etc.
    network: Optional[str] = None  # For tokens that can use multiple networks

class PayoutRequest(BaseModel):
    method: PayoutMethod
    amount: float
    currency: str
    transaction_id: str

class PayoutResponse(BaseModel):
    status: str
    message: str
    payout_id: Optional[str] = None
    timestamp: str