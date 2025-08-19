"""
Black Rock Payment Terminal - API Routes
"""

import logging
import datetime
import uuid
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from ..core.transaction import Transaction, TransactionStatus, TransactionType, PaymentMethod
from ..core.processor import TransactionProcessor
from ..protocols.handler import ProtocolHandler, MTIHandler
from ..utils.receipt import ReceiptGenerator
from ..config.settings import PROTOCOLS, MTI_TYPES, SUPPORTED_CURRENCIES
from .models import PaymentRequest, PayoutSettingsRequest, TransactionResponse, PayoutMethod, BankPayoutSettings, CryptoPayoutSettings

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Get global processor and receipt generator from main app
from ..main import processor, receipt_generator

# Database dependency
def get_db():
    from ..main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/payment", response_model=TransactionResponse)
async def process_payment(request: PaymentRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Process a payment transaction
    """
    logger.info(f"Processing payment: {request.amount} {request.currency}")
    
    # Validate protocol
    if request.protocol not in PROTOCOLS:
        raise HTTPException(status_code=400, detail=f"Invalid protocol: {request.protocol}")
    
    # Validate currency
    if request.currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {request.currency}")
    
    # Validate transaction type
    try:
        transaction_type = TransactionType[request.transaction_type]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid transaction type: {request.transaction_type}")
    
    # Create protocol handler
    protocol_handler = ProtocolHandler(request.protocol)
    
    # Validate auth code if provided
    if request.auth_code:
        if not protocol_handler.validate_approval_code(request.auth_code):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid auth code for protocol {request.protocol}. Expected {protocol_handler.approval_length} digits."
            )
    
    # Create transaction
    transaction = Transaction(
        transaction_id=str(uuid.uuid4()),
        amount=request.amount,
        currency=request.currency,
        card_number=request.card_number,
        expiry_date=request.expiry_date,
        cvv=request.cvv,
        cardholder_name=request.cardholder_name,
        transaction_type=transaction_type,
        payment_method=PaymentMethod.CARD,
        merchant_id=processor.merchant_id,
        terminal_id=processor.terminal_id,
        protocol=request.protocol
    )
    
    # If auth code was provided, set it directly
    if request.auth_code:
        transaction.set_approval_code(request.auth_code)
    
    # Process transaction
    background_tasks.add_task(processor.process_transaction, transaction)
    
    # Return response
    return TransactionResponse(
        transaction_id=transaction.transaction_id,
        status=transaction.status.value,
        amount=transaction.amount,
        currency=transaction.currency,
        timestamp=transaction.timestamp.isoformat(),
        approval_code=transaction.approval_code,
        response_code=transaction.response_code,
        response_message=transaction.response_message
    )

@router.get("/transaction/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    """
    Get transaction details
    """
    transaction = processor.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail=f"Transaction not found: {transaction_id}")
    
    return TransactionResponse(
        transaction_id=transaction.transaction_id,
        status=transaction.status.value,
        amount=transaction.amount,
        currency=transaction.currency,
        timestamp=transaction.timestamp.isoformat(),
        approval_code=transaction.approval_code,
        response_code=transaction.response_code,
        response_message=transaction.response_message
    )

@router.post("/payout/settings")
async def set_payout_settings(request: PayoutSettingsRequest, db: Session = Depends(get_db)):
    """
    Set payout settings for merchant
    """
    logger.info(f"Setting payout settings: {request.method}")
    
    # Validate settings based on method
    if request.method == PayoutMethod.BANK:
        try:
            settings = BankPayoutSettings(**request.settings)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid bank payout settings: {str(e)}")
    elif request.method == PayoutMethod.CRYPTO:
        try:
            settings = CryptoPayoutSettings(**request.settings)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid crypto payout settings: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail=f"Invalid payout method: {request.method}")
    
    # Store settings in database
    # This would be implemented with actual database operations
    # For now, we just log it
    logger.info(f"Payout settings saved: {request.method} - {request.settings}")
    
    return {"status": "success", "message": f"Payout settings updated for {request.method}"}

@router.get("/protocols")
async def get_protocols():
    """
    Get available protocols
    """
    return {
        "protocols": [
            {
                "name": protocol_name,
                "approval_length": config["approval_length"],
                "is_onledger": config["is_onledger"]
            }
            for protocol_name, config in PROTOCOLS.items()
        ]
    }