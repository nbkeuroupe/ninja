"""
Black Rock Payment Terminal - Receipt Generation
"""

import logging
import datetime
from typing import Dict, Any, Optional, List

from ..core.transaction import Transaction, TransactionStatus, TransactionType
from ..config.settings import PROTOCOLS, MTI_TYPES, SUPPORTED_CURRENCIES, TERMINAL_SETTINGS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ReceiptGenerator:
    """Generate receipts for transactions"""
    
    def __init__(self, merchant_name: str = None, merchant_address: str = None):
        """
        Initialize the receipt generator
        
        Args:
            merchant_name: The merchant name to display on receipts
            merchant_address: The merchant address to display on receipts
        """
        self.merchant_name = merchant_name or "MERCHANT"
        self.merchant_address = merchant_address or ""
        self.header = TERMINAL_SETTINGS["receipt_header"]
        self.footer = TERMINAL_SETTINGS["receipt_footer"]
    
    def generate_text_receipt(self, transaction: Transaction, 
                             merchant_copy: bool = False) -> str:
        """
        Generate a text receipt for a transaction
        
        Args:
            transaction: The transaction to generate a receipt for
            merchant_copy: Whether this is the merchant copy (vs customer copy)
            
        Returns:
            str: The formatted receipt text
        """
        # Get currency symbol
        currency_info = SUPPORTED_CURRENCIES.get(transaction.currency, {})
        currency_symbol = currency_info.get("symbol", transaction.currency)
        
        # Format amount with proper decimal places
        decimal_places = currency_info.get("decimal_places", 2)
        amount_str = f"{currency_symbol}{transaction.amount:.{decimal_places}f}"
        
        # Format timestamp
        timestamp = transaction.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        
        # Build receipt
        receipt_lines = []
        
        # Header
        receipt_lines.append(self.header.center(40))
        receipt_lines.append("")
        receipt_lines.append(self.merchant_name.center(40))
        
        if self.merchant_address:
            for line in self.merchant_address.split("\\n"):
                receipt_lines.append(line.center(40))
        
        receipt_lines.append("")
        receipt_lines.append("=" * 40)
        
        # Transaction details
        receipt_lines.append(f"DATE: {timestamp}")
        receipt_lines.append(f"TERMINAL ID: {transaction.terminal_id}")
        receipt_lines.append(f"MERCHANT ID: {transaction.merchant_id}")
        receipt_lines.append(f"TRANSACTION ID: {transaction.transaction_id[:8]}...")
        receipt_lines.append(f"TRACE #: {transaction.trace_number}")
        receipt_lines.append(f"BATCH #: {transaction.batch_number}")
        receipt_lines.append("")
        
        # Transaction type and status
        receipt_lines.append(f"TYPE: {transaction.transaction_type.value}")
        receipt_lines.append(f"STATUS: {transaction.status.value}")
        
        if transaction.approval_code:
            receipt_lines.append(f"APPROVAL: {transaction.approval_code}")
        
        receipt_lines.append("")
        
        # Card information (masked)
        if transaction.card_data:
            card_number = transaction.card_data.get("card_number", "")
            if card_number:
                # Mask all but last 4 digits
                masked_number = "X" * (len(card_number) - 4) + card_number[-4:]
                receipt_lines.append(f"CARD: {masked_number}")
            
            expiry = transaction.card_data.get("expiry_date", "")
            if expiry:
                receipt_lines.append(f"EXP: {expiry}")
            
            cardholder = transaction.card_data.get("cardholder_name", "")
            if cardholder:
                receipt_lines.append(f"CARDHOLDER: {cardholder}")
            
            method = transaction.card_data.get("read_method", "")
            if method:
                method_display = {
                    "swipe": "SWIPED",
                    "dip": "CHIP",
                    "nfc": "CONTACTLESS",
                    "manual_entry": "MANUAL ENTRY"
                }.get(method, method.upper())
                receipt_lines.append(f"ENTRY: {method_display}")
        
        receipt_lines.append("")
        
        # Amount
        receipt_lines.append(f"AMOUNT: {amount_str}")
        
        if transaction.transaction_type == TransactionType.REFUND:
            receipt_lines.append("*** REFUND ***")
        
        receipt_lines.append("")
        receipt_lines.append("=" * 40)
        
        # Copy type
        copy_type = "MERCHANT COPY" if merchant_copy else "CUSTOMER COPY"
        receipt_lines.append(copy_type.center(40))
        
        # Footer
        receipt_lines.append("")
        receipt_lines.append(self.footer.center(40))
        
        # For approved transactions, add signature line for customer copy
        if not merchant_copy and transaction.status == TransactionStatus.APPROVED:
            receipt_lines.append("")
            receipt_lines.append("X" + "_" * 38)
            receipt_lines.append("SIGNATURE")
        
        return "\\n".join(receipt_lines)
    
    def generate_html_receipt(self, transaction: Transaction,
                             merchant_copy: bool = False) -> str:
        """
        Generate an HTML receipt for a transaction
        
        Args:
            transaction: The transaction to generate a receipt for
            merchant_copy: Whether this is the merchant copy (vs customer copy)
            
        Returns:
            str: The formatted HTML receipt
        """
        # Get currency symbol
        currency_info = SUPPORTED_CURRENCIES.get(transaction.currency, {})
        currency_symbol = currency_info.get("symbol", transaction.currency)
        
        # Format amount with proper decimal places
        decimal_places = currency_info.get("decimal_places", 2)
        amount_str = f"{currency_symbol}{transaction.amount:.{decimal_places}f}"
        
        # Format timestamp
        timestamp = transaction.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        
        # Build HTML receipt
        html = (
            "<!DOCTYPE html>\\n"
            "<html>\\n"
            "<head>\\n"
            "    <meta charset=\&quot;UTF-8\&quot;>\\n"
            "    <title>Black Rock Payment Receipt</title>\\n"
            "    <style>\\n"
            "        body {\\n"
            "            font-family: 'Courier New', monospace;\\n"
            "            width: 300px;\\n"
            "            margin: 0 auto;\\n"
            "            padding: 10px;\\n"
            "        }\\n"
            "        .receipt {\\n"
            "            border: 1px solid #ccc;\\n"
            "            padding: 10px;\\n"
            "        }\\n"
            "        .header {\\n"
            "            text-align: center;\\n"
            "            font-weight: bold;\\n"
            "            margin-bottom: 10px;\\n"
            "        }\\n"
            "        .merchant-info {\\n"
            "            text-align: center;\\n"
            "            margin-bottom: 10px;\\n"
            "        }\\n"
            "        .divider {\\n"
            "            border-top: 1px solid #000;\\n"
            "            margin: 10px 0;\\n"
            "        }\\n"
            "        .transaction-details {\\n"
            "            margin-bottom: 10px;\\n"
            "        }\\n"
            "        .amount {\\n"
            "            font-size: 1.2em;\\n"
            "            font-weight: bold;\\n"
            "            margin: 10px 0;\\n"
            "        }\\n"
            "        .copy-type {\\n"
            "            text-align: center;\\n"
            "            margin: 10px 0;\\n"
            "        }\\n"
            "        .footer {\\n"
            "            text-align: center;\\n"
            "            margin-top: 10px;\\n"
            "            font-size: 0.9em;\\n"
            "        }\\n"
            "        .signature {\\n"
            "            margin-top: 20px;\\n"
            "            border-top: 1px solid #000;\\n"
            "            padding-top: 5px;\\n"
            "            text-align: center;\\n"
            "        }\\n"
            "        @media print {\\n"
            "            body {\\n"
            "                width: 100%;\\n"
            "            }\\n"
            "            .receipt {\\n"
            "                border: none;\\n"
            "            }\\n"
            "            .print-button {\\n"
            "                display: none;\\n"
            "            }\\n"
            "        }\\n"
            "    </style>\\n"
            "</head>\\n"
            "<body>\\n"
            "    <div class=\&quot;receipt\&quot;>\\n"
            "        <div class=\&quot;header\&quot;>" + self.header + "</div>\\n"
            "        \\n"
            "        <div class=\&quot;merchant-info\&quot;>\\n"
            "            <div>" + self.merchant_name + "</div>\\n"
        )
        
        if self.merchant_address:
            html += "            <div>" + self.merchant_address.replace("\\n", "<br>") + "</div>\\n"
        
        html += (
            "        </div>\\n"
            "        \\n"
            "        <div class=\&quot;divider\&quot;></div>\\n"
            "        \\n"
            "        <div class=\&quot;transaction-details\&quot;>\\n"
            "            <div>DATE: " + timestamp + "</div>\\n"
            "            <div>TERMINAL ID: " + transaction.terminal_id + "</div>\\n"
            "            <div>MERCHANT ID: " + transaction.merchant_id + "</div>\\n"
            "            <div>TRANSACTION ID: " + transaction.transaction_id[:8] + "...</div>\\n"
            "            <div>TRACE #: " + transaction.trace_number + "</div>\\n"
            "            <div>BATCH #: " + str(transaction.batch_number) + "</div>\\n"
            "            <br>\\n"
            "            <div>TYPE: " + transaction.transaction_type.value + "</div>\\n"
            "            <div>STATUS: " + transaction.status.value + "</div>\\n"
        )
        
        if transaction.approval_code:
            html += "            <div>APPROVAL: " + transaction.approval_code + "</div>\\n"
        
        html += (
            "        </div>\\n"
            "        \\n"
        )
        
        # Card information
        if transaction.card_data:
            card_number = transaction.card_data.get("card_number", "")
            if card_number:
                # Mask all but last 4 digits
                masked_number = "X" * (len(card_number) - 4) + card_number[-4:]
                html += "        <div>CARD: " + masked_number + "</div>\\n"
            
            expiry = transaction.card_data.get("expiry_date", "")
            if expiry:
                html += "        <div>EXP: " + expiry + "</div>\\n"
            
            cardholder = transaction.card_data.get("cardholder_name", "")
            if cardholder:
                html += "        <div>CARDHOLDER: " + cardholder + "</div>\\n"
            
            method = transaction.card_data.get("read_method", "")
            if method:
                method_display = {
                    "swipe": "SWIPED",
                    "dip": "CHIP",
                    "nfc": "CONTACTLESS",
                    "manual_entry": "MANUAL ENTRY"
                }.get(method, method.upper())
                html += "        <div>ENTRY: " + method_display + "</div>\\n"
        
        # Amount and footer
        refund_html = ""
        if transaction.transaction_type == TransactionType.REFUND:
            refund_html = "        <div style=\&quot;text-align: center; font-weight: bold;\&quot;>*** REFUND ***</div>\\n"
        
        copy_type = "MERCHANT COPY" if merchant_copy else "CUSTOMER COPY"
        
        html += (
            "        <div class=\&quot;amount\&quot;>AMOUNT: " + amount_str + "</div>\\n"
            "        \\n"
            + refund_html +
            "        <div class=\&quot;divider\&quot;></div>\\n"
            "        \\n"
            "        <div class=\&quot;copy-type\&quot;>" + copy_type + "</div>\\n"
            "        \\n"
            "        <div class=\&quot;footer\&quot;>" + self.footer + "</div>\\n"
        )
        
        # Signature line for customer copy of approved transactions
        if not merchant_copy and transaction.status == TransactionStatus.APPROVED:
            html += "        <div class=\&quot;signature\&quot;>SIGNATURE</div>\\n"
        
        # Close tags
        html += (
            "    </div>\\n"
            "    <div class=\&quot;print-button\&quot; style=\&quot;text-align: center; margin-top: 20px;\&quot;>\\n"
            "        <button onclick=\&quot;window.print()\&quot;>Print Receipt</button>\\n"
            "    </div>\\n"
            "</body>\\n"
            "</html>\\n"
        )
        
        return html
    
    def generate_both_copies(self, transaction: Transaction) -> Dict[str, str]:
        """
        Generate both merchant and customer copies of a receipt
        
        Args:
            transaction: The transaction to generate receipts for
            
        Returns:
            Dict[str, str]: Dictionary with 'merchant' and 'customer' keys containing receipt text
        """
        return {
            "merchant": self.generate_text_receipt(transaction, merchant_copy=True),
            "customer": self.generate_text_receipt(transaction, merchant_copy=False)
        }
    
    def generate_both_html_copies(self, transaction: Transaction) -> Dict[str, str]:
        """
        Generate both merchant and customer copies of an HTML receipt
        
        Args:
            transaction: The transaction to generate receipts for
            
        Returns:
            Dict[str, str]: Dictionary with 'merchant' and 'customer' keys containing HTML receipt
        """
        return {
            "merchant": self.generate_html_receipt(transaction, merchant_copy=True),
            "customer": self.generate_html_receipt(transaction, merchant_copy=False)
        }