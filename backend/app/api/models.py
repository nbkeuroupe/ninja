"""
Black Rock Payment Terminal - API Models
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from enum import Enum

class PayoutMethod(str, Enum):
    BANK = "BANK"
    CRYPTO = "CRYPTO"

class PaymentRequest(BaseModel):
    amount: float
    currency: str
    card_number: str
    expiry_date: str
    cvv: Optional[str] = None
    cardholder_name: Optional[str] = None
    postal_code: Optional[str] = None
    protocol: str
    transaction_type: str  # SALE, REFUND, etc.
    is_online: bool = True
    auth_code: Optional[str] = None  # Added auth code field

class PayoutSettingsRequest(BaseModel):
    method: PayoutMethod
    settings: Dict[str, Any]

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

class TransactionResponse(BaseModel):
    transaction_id: str
    status: str
    amount: float
    currency: str
    timestamp: str
    approval_code: Optional[str] = None
    response_code: Optional[str] = None
    response_message: Optional[str] = None