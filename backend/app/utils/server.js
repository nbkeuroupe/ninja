const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 9000;

// Enable CORS for all requests
app.use(cors());
// Parse incoming request bodies in a middleware before your handlers
app.use(bodyParser.json());

// In-memory data storage (for demonstration purposes)
let transactions = [];
let payoutSettings = {};

// Serve static files from the 'public' directory (you need to create this)
// All your frontend files (index.html, script.js, styles.css, etc.) should be in this folder
// For your current setup, this would be a directory one level up from your utils folder
const frontendPath = path.join(__dirname, '..', '..', '..', 'frontend');
app.use(express.static(frontendPath));

// API Endpoints
// Process Payment
app.post('/api/payment', (req, res) => {
    console.log('Received payment request:', req.body);
    const { amount, currency, transaction_type, auth_code } = req.body;
    
    // Simulate payment processing
    const transactionId = `txn_${Date.now()}`;
    const status = Math.random() > 0.1 ? 'APPROVED' : 'DECLINED'; // 90% chance of success
    
    const transactionResult = {
        transaction_id: transactionId,
        status: status,
        approval_code: status === 'APPROVED' ? auth_code : 'N/A',
        amount: amount,
        currency: currency,
        timestamp: new Date().toISOString(),
        transaction_type: transaction_type,
        response_code: status === 'APPROVED' ? '00' : '99',
        response_message: status === 'APPROVED' ? 'Transaction approved' : 'Transaction declined'
    };

    transactions.unshift(transactionResult); // Add to the beginning of the list
    res.json(transactionResult);
});

// Get all transactions (simulated history)
app.get('/api/transactions', (req, res) => {
    res.json({ transactions });
});

// Get terminal information
app.get('/api/terminal/info', (req, res) => {
    res.json({
        merchant_id: 'BR_MERCHANT_001',
        terminal_id: 'BR_TERMINAL_001'
    });
});

// Get protocols
app.get('/api/protocols', (req, res) => {
    res.json({
        protocols: [
            { name: "POS Terminal -101.1 (4-digit approval)" },
            { name: "POS Terminal -101.4 (6-digit approval)" },
            { name: "POS Terminal -101.6 (Pre-authorization)" },
            { name: "POS Terminal -101.7 (4-digit approval)" },
            { name: "POS Terminal -101.8 (PIN-LESS transaction)" },
            { name: "POS Terminal -201.1 (6-digit approval)" },
            { name: "POS Terminal -201.3 (6-digit approval)" },
            { name: "POS Terminal -201.5 (6-digit approval)" }
        ]
    });
});

// Save Payout Settings
app.post('/api/payout/settings', (req, res) => {
    console.log('Received payout settings:', req.body);
    payoutSettings = req.body;
    res.json({ message: 'Payout settings saved successfully' });
});

// Get a single transaction by ID
app.get('/api/transaction/:id', (req, res) => {
    const transaction = transactions.find(t => t.transaction_id === req.params.id);
    if (transaction) {
        res.json(transaction);
    } else {
        res.status(404).json({ error: 'Transaction not found' });
    }
});

// Void a transaction
app.post('/api/transaction/:id/void', (req, res) => {
    const transaction = transactions.find(t => t.transaction_id === req.params.id);
    if (transaction && transaction.status === 'APPROVED') {
        transaction.status = 'VOIDED';
        res.json(transaction);
    } else {
        res.status(400).json({ error: 'Transaction cannot be voided' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
