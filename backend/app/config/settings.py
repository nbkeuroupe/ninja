"""
Black Rock Payment Terminal - Configuration Settings
"""

# Protocol definitions
PROTOCOLS = {
    "POS Terminal -101.1 (4-digit approval)": {"approval_length": 4, "is_onledger": True},
    "POS Terminal -101.4 (6-digit approval)": {"approval_length": 6, "is_onledger": True},
    "POS Terminal -101.6 (Pre-authorization)": {"approval_length": 6, "is_onledger": True},
    "POS Terminal -101.7 (4-digit approval)": {"approval_length": 4, "is_onledger": True},
    "POS Terminal -101.8 (PIN-LESS transaction)": {"approval_length": 4, "is_onledger": False},  # Example MO transaction
    "POS Terminal -201.1 (6-digit approval)": {"approval_length": 6, "is_onledger": True},
    "POS Terminal -201.3 (6-digit approval)": {"approval_length": 6, "is_onledger": False},  # Example MO transaction
    "POS Terminal -201.5 (6-digit approval)": {"approval_length": 6, "is_onledger": False}   # Example MO transaction
}

# MTI (Message Type Indicator) definitions
MTI_TYPES = {
    "0100": "Authorization Request",
    "0110": "Authorization Response",
    "0200": "Financial Transaction Request",
    "0210": "Financial Transaction Response",
    "0220": "Financial Transaction Advice",
    "0230": "Financial Transaction Advice Response",
    "0500": "Reversal Request",
    "0510": "Reversal Response"
}

# Currency settings
SUPPORTED_CURRENCIES = {
    "USD": {
        "name": "US Dollar",
        "symbol": "$",
        "decimal_places": 2
    },
    "EUR": {
        "name": "Euro",
        "symbol": "€",
        "decimal_places": 2
    }
}

# Terminal settings
TERMINAL_SETTINGS = {
    "merchant_id": "",  # To be set during initialization
    "terminal_id": "",  # To be set during initialization
    "batch_number": 1,
    "receipt_header": "BLACK ROCK PAYMENT TERMINAL",
    "receipt_footer": "Thank you for your business!",
    "default_currency": "USD",
    "offline_transaction_limit": 500.00,  # Maximum amount for offline transactions
    "timeout_seconds": 30,  # Connection timeout in seconds
}

# Hardware settings
HARDWARE_SETTINGS = {
    "card_reader_enabled": True,
    "nfc_enabled": True,
    "dip_enabled": True,
    "mki_enabled": True,
    "receipt_printer_enabled": True,
}

# Network settings
NETWORK_SETTINGS = {
    "server_url": "",  # To be set during initialization
    "backup_server_url": "",  # To be set during initialization
    "heartbeat_interval": 60,  # Seconds between heartbeat messages
    "retry_attempts": 3,
    "retry_delay": 5,  # Seconds between retry attempts
}

# Security settings
SECURITY_SETTINGS = {
    "encryption_enabled": True,
    "pin_encryption_method": "DUKPT",  # Default encryption method
    "tokenization_enabled": False,  # To be enabled later
    "key_rotation_days": 30,  # Days between key rotations
}