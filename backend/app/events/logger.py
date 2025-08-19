"""
Black Rock Payment Terminal - Event Logger
"""

import logging
import datetime
import json
from typing import Dict, Any
from sqlalchemy.orm import Session

from ..database.models import TransactionModel

logger = logging.getLogger(__name__)

class EventLogger:
    """
    Logs transaction events and MTI state changes
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def log_mti_transition(self, transaction_id: str, from_mti: str, to_mti: str, 
                          description: str = None) -> None:
        """
        Log an MTI transition event
        
        Args:
            transaction_id: The transaction ID
            from_mti: The MTI transitioning from
            to_mti: The MTI transitioning to
            description: Optional description of the transition
        """
        event_data = {
            "event_type": "MTI_TRANSITION",
            "transaction_id": transaction_id,
            "from_mti": from_mti,
            "to_mti": to_mti,
            "description": description,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        logger.info(f"MTI Transition: {json.dumps(event_data)}")
        
        # In a real implementation, this would also save to a database events table
        # For now, we're just logging to the application log
    
    def log_transaction_event(self, transaction_id: str, event_type: str, 
                             details: Dict[str, Any]) -> None:
        """
        Log a transaction event
        
        Args:
            transaction_id: The transaction ID
            event_type: The type of event
            details: Event details
        """
        event_data = {
            "event_type": event_type,
            "transaction_id": transaction_id,
            "details": details,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        logger.info(f"Transaction Event: {json.dumps(event_data)}")
        
        # In a real implementation, this would also save to a database events table
        # For now, we're just logging to the application log
    
    def log_payout_event(self, payout_id: str, event_type: str, 
                        details: Dict[str, Any]) -> None:
        """
        Log a payout event
        
        Args:
            payout_id: The payout ID
            event_type: The type of event
            details: Event details
        """
        event_data = {
            "event_type": event_type,
            "payout_id": payout_id,
            "details": details,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        logger.info(f"Payout Event: {json.dumps(event_data)}")
        
        # In a real implementation, this would also save to a database events table
        # For now, we're just logging to the application log