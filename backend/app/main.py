"""
Black Rock Payment Terminal - Main Application Entry Point
"""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.processor import TransactionProcessor
from .utils.receipt import ReceiptGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='server.log'
)
logger = logging.getLogger(__name__)

# Global variables for application state
processor = None
receipt_generator = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events"""
    global processor, receipt_generator
    
    # Startup
    logger.info("Starting Black Rock Payment Terminal backend")
    
    # Initialize components
    merchant_id = os.getenv("MERCHANT_ID", "DEFAULT_MERCHANT")
    terminal_id = os.getenv("TERMINAL_ID", "DEFAULT_TERMINAL")
    server_url = os.getenv("SERVER_URL", "http://localhost:8001")
    
    processor = TransactionProcessor(merchant_id, terminal_id, server_url)
    receipt_generator = ReceiptGenerator()
    
    logger.info("Black Rock Payment Terminal backend initialized")
    yield
    # Shutdown
    logger.info("Shutting down Black Rock Payment Terminal backend")
    processor.shutdown()

# Create FastAPI app with lifespan
app = FastAPI(
    title="Black Rock Payment Terminal API",
    description="Production-ready payment terminal backend API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include API routes
from .api.routes import router as api_router
app.include_router(api_router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Black Rock Payment Terminal API"}