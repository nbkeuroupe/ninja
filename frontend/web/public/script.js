document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const statusText = document.getElementById('status-text');
    const statusLight = document.getElementById('status-light');
    const terminalIdEl = document.getElementById('terminal-id');
    const merchantIdEl = document.getElementById('merchant-id');
    
    const amountInput = document.getElementById('amount');
    const currencySelect = document.getElementById('currency');
    const cardNumberInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('expiry');
    const cvvInput = document.getElementById('cvv');
    const cardholderInput = document.getElementById('cardholder');
    const postalCodeInput = document.getElementById('postal-code');
    const protocolSelect = document.getElementById('protocol');
    const authCodeInput = document.getElementById('auth-code');
    const authCodeContainer = document.getElementById('auth-code-container');
    const authCodeHint = document.querySelector('.auth-code-hint');
    const transactionTypeSelect = document.getElementById('transaction-type');
    
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printBtn = document.getElementById('print-btn');
    const voidBtn = document.getElementById('void-btn');
    
    const historyBody = document.getElementById('history-body');
    const mtiMessageLog = document.getElementById('mti-message-log');
    
    const receiptModal = document.getElementById('receipt-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const receiptContainer = document.getElementById('receipt-container');
    const printReceiptBtn = document.getElementById('print-receipt-btn');
    const closeReceiptBtn = document.getElementById('close-receipt-btn');
    
    // Payout settings elements
    const payoutTabs = document.querySelectorAll('.payout-tab');
    const payoutContents = document.querySelectorAll('.payout-content');
    const saveBankBtn = document.getElementById('save-bank-btn');
    const saveCryptoBtn = document.getElementById('save-crypto-btn');

    // New page elements and state
    const pages = document.querySelectorAll('.page');
    const loginPage = document.getElementById('login-page');
    const cardDetailsPage = document.getElementById('card-details-page');
    const processingPage = document.getElementById('processing-page');
    const successPage = document.getElementById('success-page');
    const rejectPage = document.getElementById('reject-page');
    const payoutPage = document.getElementById('payout-page');
    const historyPage = document.getElementById('history-page');
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const viewPayoutBtn = document.getElementById('view-payout-btn');
    const nextToCardBtn = document.getElementById('next-to-card-btn');
    const backToCardBtnFromHistory = document.getElementById('back-to-card-from-history-btn');
    const returnHomeSuccessBtn = document.getElementById('return-home-success-btn');
    const returnHomeRejectBtn = document.getElementById('return-home-reject-btn');
    const successMessageDetails = document.getElementById('success-message-details');
    const rejectMessageDetails = document.getElementById('reject-message-details');


    // Terminal state
    let terminalStatus = {
        online: true,
        merchantId: '',
        terminalId: '',
        currentTransactionId: null
    };

    // WebSocket variable
    let ws;

    // Corrected Protocol definitions
    const PROTOCOLS = {
        "POS Terminal -101.1 (4-digit approval)": { approval_length: 4, is_numeric: true },
        "POS Terminal -101.4 (6-digit approval)": { approval_length: 6, is_numeric: true },
        "POS Terminal -101.6 (Pre-authorization)": { approval_length: 6, is_numeric: true },
        "POS Terminal -101.7 (4-digit approval)": { approval_length: 4, is_numeric: true },
        "POS Terminal -101.8 (PIN-LESS transaction)": { approval_length: 4, is_numeric: true },
        "POS Terminal -201.1 (6-digit approval)": { approval_length: 6, is_numeric: true },
        "POS Terminal -201.3 (6-digit approval)": { approval_length: 6, is_numeric: true },
        "POS Terminal -201.5 (6-digit approval)": { approval_length: 6, is_numeric: true }
    };
    
    // Function to handle WebSocket connection
    function connectWebSocket() {
        // Construct the WebSocket URL. You would need to replace this with your actual backend WebSocket URL.
        const wsUrl = `ws://${window.location.host}/ws`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connection opened.');
            const message = `WebSocket: Connection opened with server.`;
            appendMessage(message, 'info');
            updateConnectionStatus(true);
        };

        ws.onmessage = (event) => {
            console.log('Received message:', event.data);
            try {
                const messageData = JSON.parse(event.data);
                if (messageData.type === 'MTI_MESSAGE' && messageData.mti) {
                    const mtiMessage = `MTI Received: ${messageData.mti}`;
                    appendMessage(mtiMessage, 'mti');
                    if (ws.readyState === WebSocket.OPEN) {
                        const ackMessage = { type: 'ACK', mti: messageData.mti };
                        ws.send(JSON.stringify(ackMessage));
                        const ackText = `Acknowledged MTI: ${messageData.mti}`;
                        appendMessage(ackText, 'ack');
                    }
                } else {
                    appendMessage(`Received: ${event.data}`, 'server');
                }
            } catch (e) {
                console.error('Failed to parse message:', e);
                appendMessage(`Received non-JSON message: ${event.data}`, 'error');
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed. Reconnecting...');
            const message = 'WebSocket: Connection closed. Attempting to reconnect...';
            appendMessage(message, 'error');
            updateConnectionStatus(false);
            setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            const message = 'WebSocket: An error occurred.';
            appendMessage(message, 'error');
        };
    }

    // Function to append messages to the MTI log
    function appendMessage(message, type) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        p.classList.add(type);
        if (mtiMessageLog.firstChild) {
            mtiMessageLog.insertBefore(p, mtiMessageLog.firstChild);
        } else {
            mtiMessageLog.appendChild(p);
        }
    }

    // Page navigation functions
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }

    // Login logic
    loginBtn.addEventListener('click', function(event) {
        event.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        if (username === 'admin' && password === 'password123') {
            loginError.textContent = '';
            showPage('payout-page');
            initializeTerminal();
            connectWebSocket(); // Start WebSocket connection after successful login
        } else {
            loginError.textContent = 'Invalid username or password.';
        }
    });

    // Navigation buttons
    nextToCardBtn.addEventListener('click', function() {
        showPage('card-details-page');
    });

    viewHistoryBtn.addEventListener('click', function() {
        showPage('history-page');
    });

    viewPayoutBtn.addEventListener('click', function() {
        showPage('payout-page');
    });

    backToCardBtnFromHistory.addEventListener('click', function() {
        showPage('card-details-page');
    });

    returnHomeSuccessBtn.addEventListener('click', function() {
        showPage('card-details-page');
    });

    returnHomeRejectBtn.addEventListener('click', function() {
        showPage('card-details-page');
    });
    
    // --- Core payment functions ---
    
    // Format inputs
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue.substring(0, 19);
    });
    
    expiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
    
    cvvInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value.substring(0, 3);
    });
    
    // Auth code validation based on protocol
    protocolSelect.addEventListener('change', updateAuthCodeRequirements);
    
    function updateAuthCodeRequirements() {
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        if (protocolConfig) {
            authCodeContainer.style.display = 'block';
            authCodeHint.style.display = 'block';
            authCodeHint.textContent = `Required: ${protocolConfig.approval_length} digits`;
            authCodeInput.setAttribute('maxlength', protocolConfig.approval_length);
            const placeholder = `Enter ${protocolConfig.approval_length}-digit code`;
            authCodeInput.placeholder = placeholder;
            const currentValue = authCodeInput.value;
            if (currentValue.length !== protocolConfig.approval_length) {
                authCodeInput.value = '';
            }
        } else {
            authCodeContainer.style.display = 'none';
            authCodeHint.style.display = 'none';
        }
    }
    
    updateAuthCodeRequirements();
    
    authCodeInput.addEventListener('input', function(e) {
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        if (protocolConfig && protocolConfig.is_numeric) {
            let value = e.target.value.replace(/\D/g, ''); 
            value = value.substring(0, protocolConfig.approval_length);
            e.target.value = value;
            
            if (value.length === protocolConfig.approval_length) {
                e.target.style.borderColor = '#2ecc71';
                e.target.style.backgroundColor = '#f8fff8';
            } else {
                e.target.style.borderColor = '#e74c3c';
                e.target.style.backgroundColor = '#fff8f8';
            }
        }
    });
    
    // Process payment
    processBtn.addEventListener('click', function() {
        if (!validateInputs()) {
            return;
        }

        showPage('processing-page');
        
        const paymentData = {
            amount: parseFloat(amountInput.value),
            currency: currencySelect.value,
            card_number: cardNumberInput.value.replace(/\s/g, ''),
            expiry_date: expiryInput.value,
            cvv: cvvInput.value,
            cardholder_name: cardholderInput.value,
            postal_code: postalCodeInput.value,
            protocol: protocolSelect.value,
            transaction_type: transactionTypeSelect.value,
            auth_code: authCodeInput.value,
            is_online: true
        };
        
        // Simulate an API call
        setTimeout(() => {
            const response = {
                transaction_id: 'txn_' + Date.now(),
                status: Math.random() > 0.5 ? 'APPROVED' : 'DECLINED', // Randomly approve or decline
                approval_code: '123456',
                amount: paymentData.amount,
                currency: paymentData.currency,
                timestamp: new Date().toISOString(),
                response_message: 'Simulated response'
            };

            if (response.status === 'APPROVED') {
                addTransactionToHistory(response);
                terminalStatus.currentTransactionId = response.transaction_id;
                successMessageDetails.innerHTML = `
                    <p><strong>Transaction ID:</strong> ${response.transaction_id}</p>
                    <p><strong>Auth Code:</strong> ${response.approval_code || 'N/A'}</p>
                    <p><strong>Amount:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: response.currency }).format(response.amount)}</p>
                    <p><strong>Message:</strong> ${response.response_message || 'Transaction approved'}</p>
                `;
                showPage('success-page');
            } else {
                rejectMessageDetails.innerHTML = `
                    <p><strong>Error:</strong> Payment processing failed. Please try again.</p>
                `;
                showPage('reject-page');
            }
        }, 2000); // Simulate 2-second processing time
    });
    
    // Validate inputs function
    function validateInputs() {
        if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
            showCustomMessage('Please enter a valid amount');
            return false;
        }
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            showCustomMessage('Please enter a valid card number');
            return false;
        }
        const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryPattern.test(expiryInput.value)) {
            showCustomMessage('Please enter a valid expiry date (MM/YY)');
            return false;
        }
        if (!cvvInput.value || cvvInput.value.length < 3) {
            showCustomMessage('Please enter a valid CVV');
            return false;
        }
        if (!cardholderInput.value || cardholderInput.value.trim().length === 0) {
            showCustomMessage('Please enter the cardholder name');
            return false;
        }
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        if (protocolConfig) {
            const authCode = authCodeInput.value.trim();
            if (authCode.length !== protocolConfig.approval_length) {
                showCustomMessage(`Please enter a valid ${protocolConfig.approval_length}-digit auth code`);
                return false;
            }
            if (protocolConfig.is_numeric && !/^\d+$/.test(authCode)) {
                showCustomMessage('Auth code must be numeric for this protocol');
                return false;
            }
        }
        return true;
    }

    // Function to show a custom message box (replaces alert())
    function showCustomMessage(message) {
        console.log(`Validation Error: ${message}`);
        alert(message);
    }
    
    // Add transaction to history
    function addTransactionToHistory(transaction) {
        const placeholderRow = historyBody.querySelector('.placeholder-row');
        if (placeholderRow) {
            historyBody.removeChild(placeholderRow);
        }
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: transaction.currency
        }).format(transaction.amount);
        const timestamp = new Date(transaction.timestamp).toLocaleString();
        const row = document.createElement('tr');
        row.dataset.transactionId = transaction.transaction_id;
        row.innerHTML = `
            <td>${timestamp}</td>
            <td>${transaction.transaction_type || 'SALE'}</td>
            <td>${formattedAmount}</td>
            <td class="${transaction.status.toLowerCase()}">${transaction.status}</td>
            <td>
                <button class="view-btn">View</button>
            </td>
        `;
        if (historyBody.firstChild) {
            historyBody.insertBefore(row, historyBody.firstChild);
        } else {
            historyBody.appendChild(row);
        }
        const viewBtn = row.querySelector('.view-btn');
        viewBtn.addEventListener('click', function() {
            showReceipt(transaction);
        });
    }
    
    // Clear form
    clearBtn.addEventListener('click', function() {
        amountInput.value = '';
        cardNumberInput.value = '';
        expiryInput.value = '';
        cvvInput.value = '';
        cardholderInput.value = '';
        postalCodeInput.value = '';
        authCodeInput.value = '';
        authCodeInput.style.borderColor = '';
        authCodeInput.style.backgroundColor = '';
    });
    
    // Show receipt modal
    function showReceipt(transaction) {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: transaction.currency
        }).format(transaction.amount);
        const timestamp = new Date(transaction.timestamp).toLocaleString();
        let receiptHTML = `
            BLACK ROCK PAYMENT TERMINAL
            ===========================
            
            MERCHANT ID: ${terminalStatus.merchantId || 'DEFAULT_MERCHANT'}
            TERMINAL ID: ${terminalStatus.terminalId || 'DEFAULT_TERMINAL'}
            
            DATE: ${timestamp}
            
            TRANSACTION TYPE: ${transaction.transaction_type || 'SALE'}
            AMOUNT: ${formattedAmount}
            
            STATUS: ${transaction.status}
            AUTH CODE: ${transaction.approval_code || 'N/A'}
            
            TRANSACTION ID: ${transaction.transaction_id}
            
            ===========================
            
            Thank you for your business!
        `;
        receiptContainer.textContent = receiptHTML;
        receiptModal.style.display = 'block';
    }
    
    // Close receipt modal
    closeModalBtn.addEventListener('click', function() {
        receiptModal.style.display = 'none';
    });
    closeReceiptBtn.addEventListener('click', function() {
        receiptModal.style.display = 'none';
    });
    
    // Print receipt
    printReceiptBtn.addEventListener('click', function() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        body {
                            font-family: 'Courier New', monospace;
                            white-space: pre-wrap;
                            padding: 20px;
                        }
                    </style>
                </head>
                <body>
                    ${receiptContainer.textContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    });
    
    // Initialize terminal (called after login)
    function initializeTerminal() {
        // Simulate an API call to get terminal info
        setTimeout(() => {
            terminalStatus.merchantId = 'MERCHANT_001';
            terminalStatus.terminalId = 'TERMINAL_001';
            terminalIdEl.textContent = 'TERMINAL_001';
            merchantIdEl.textContent = 'MERCHANT_001';
            updateConnectionStatus(true);
        }, 500);
    }
    
    function updateConnectionStatus(isOnline) {
        terminalStatus.online = isOnline;
        if (isOnline) {
            statusText.textContent = 'ONLINE';
            statusLight.className = 'status-light online';
        } else {
            statusText.textContent = 'OFFLINE';
            statusLight.className = 'status-light offline';
        }
    }
    
    // Payout settings tabs
    payoutTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            payoutTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            payoutContents.forEach(content => content.classList.remove('active'));
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}-payout`).classList.add('active');
        });
    });
    
    // Save bank payout settings
    saveBankBtn.addEventListener('click', function() {
        const bankName = document.getElementById('bank-name').value;
        const accountName = document.getElementById('account-name').value;
        const accountNumber = document.getElementById('account-number').value;
        const routingNumber = document.getElementById('routing-number').value;
        if (!bankName || !accountName || !accountNumber || !routingNumber) {
            alert('Please fill in all required bank details');
            return;
        }
        alert('Bank payout settings saved successfully');
    });
    
    // Save crypto payout settings
    saveCryptoBtn.addEventListener('click', function() {
        const cryptoCurrency = document.getElementById('crypto-currency').value;
        const walletAddress = document.getElementById('wallet-address').value;
        if (!cryptoCurrency || !walletAddress) {
            alert('Please fill in all required crypto details');
            return;
        }
        alert('Crypto payout settings saved successfully');
    });
});
