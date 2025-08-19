"""
Black Rock Payment Terminal - Database CRUD Operations
"""

from sqlalchemy.orm import Session
from .models import TransactionModel, PayoutSettings
from ..core.transaction import Transaction
from typing import List, Optional

def create_transaction(db: Session, transaction: Transaction) -> TransactionModel:
    """Create a new transaction in the database"""
    db_transaction = TransactionModel(
        transaction_id=transaction.transaction_id,
        timestamp=transaction.timestamp,
        amount=transaction.amount,
        currency=transaction.currency,
        transaction_type=transaction.transaction_type.value,
        payment_method=transaction.payment_method.value,
        protocol=transaction.protocol,
        merchant_id=transaction.merchant_id,
        terminal_id=transaction.terminal_id,
        is_online=transaction.is_online,
        status=transaction.status.value,
        approval_code=transaction.approval_code,
        response_code=transaction.response_code,
        response_message=transaction.response_message,
        mti=transaction.mti,
        trace_number=transaction.trace_number,
        batch_number=transaction.batch_number
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transaction(db: Session, transaction_id: str) -> Optional[TransactionModel]:
    """Get a transaction by ID"""
    return db.query(TransactionModel).filter(TransactionModel.transaction_id == transaction_id).first()

def get_transactions(db: Session, merchant_id: str, limit: int = 50) -> List[TransactionModel]:
    """Get recent transactions for a merchant"""
    return db.query(TransactionModel).filter(TransactionModel.merchant_id == merchant_id).order_by(TransactionModel.timestamp.desc()).limit(limit).all()

def create_payout_settings(db: Session, merchant_id: str, method: str, settings: dict) -> PayoutSettings:
    """Create or update payout settings for a merchant"""
    # Check if settings already exist for this merchant and method
    existing_settings = db.query(PayoutSettings).filter(
        PayoutSettings.merchant_id == merchant_id,
        PayoutSettings.method == method
    ).first()
    
    if existing_settings:
        # Update existing settings
        for key, value in settings.items():
            if hasattr(existing_settings, key):
                setattr(existing_settings, key, value)
        existing_settings.updated_at = settings.get("updated_at", None)
        db_transaction = existing_settings
    else:
        # Create new settings
        db_settings = PayoutSettings(
            merchant_id=merchant_id,
            method=method,
            account_name=settings.get("account_name"),
            account_number=settings.get("account_number"),
            routing_number=settings.get("routing_number"),
            bank_name=settings.get("bank_name"),
            swift_code=settings.get("swift_code"),
            iban=settings.get("iban"),
            wallet_address=settings.get("wallet_address"),
            crypto_currency=settings.get("currency"),
            network=settings.get("network")
        )
        db.add(db_settings)
        db_transaction = db_settings
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_payout_settings(db: Session, merchant_id: str, method: str) -> Optional[PayoutSettings]:
    """Get payout settings for a merchant and method"""
    return db.query(PayoutSettings).filter(
        PayoutSettings.merchant_id == merchant_id,
        PayoutSettings.method == method
    ).first()

def get_all_payout_settings(db: Session, merchant_id: str) -> List[PayoutSettings]:
    """Get all payout settings for a merchant"""
    return db.query(PayoutSettings).filter(PayoutSettings.merchant_id == merchant_id).all()