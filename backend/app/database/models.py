"""
Black Rock Payment Terminal - Database Models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from typing import Optional

Base = declarative_base()

class TransactionModel(Base):
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float)
    currency = Column(String)
    transaction_type = Column(String)
    payment_method = Column(String)
    protocol = Column(String)
    merchant_id = Column(String)
    terminal_id = Column(String)
    is_online = Column(Boolean)
    status = Column(String)
    approval_code = Column(String, nullable=True)
    response_code = Column(String, nullable=True)
    response_message = Column(String, nullable=True)
    mti = Column(String, nullable=True)
    trace_number = Column(String, nullable=True)
    batch_number = Column(Integer, nullable=True)

class PayoutSettings(Base):
    __tablename__ = 'payout_settings'
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String, index=True)
    method = Column(String)  # 'BANK' or 'CRYPTO'
    account_name = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    routing_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    swift_code = Column(String, nullable=True)
    iban = Column(String, nullable=True)
    wallet_address = Column(String, nullable=True)
    crypto_currency = Column(String, nullable=True)
    network = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./payment_terminal.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize the database"""
    Base.metadata.create_all(bind=engine)