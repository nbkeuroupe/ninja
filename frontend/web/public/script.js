document.addEventListener('DOMContentLoaded', function() {
    // Configuration for API and WebSocket URLs
    // YOU MUST UPDATE THESE URLS WITH YOUR DEPLOYED BACKEND ADDRESSES
    const CONFIG = {
        API_URL: 'https://your-deployed-backend-url.com/api', // Example: 'https://blackrock-payments.com/api'
        WS_URL: 'wss://your-deployed-backend-url.com/ws'    // Example: 'wss://blackrock-payments.com/ws'
    };

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
        online: false, // Default to offline on page load
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
        if (!CONFIG.WS_URL) {
            console.warn('WebSocket URL is not configured. Real-time messages will not work.');
            appendMessage('WebSocket: URL not configured.', 'error');
            return;
        }

        ws = new WebSocket(CONFIG.WS_URL);

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
        // Only append messages if the log container exists
        if (mtiMessageLog) {
            const p = document.createElement('p');
            p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            p.classList.add(type);
            if (mtiMessageLog.firstChild) {
                mtiMessageLog.insertBefore(p, mtiMessageLog.firstChild);
            } else {
                mtiMessageLog.appendChild(p);
            }
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
            connectWebSocket();
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
        
        fetch(`${CONFIG.API_URL}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || `HTTP error ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            addTransactionToHistory(data);
            terminalStatus.currentTransactionId = data.transaction_id;
            
            successMessageDetails.innerHTML = `
                <p><strong>Transaction ID:</strong> ${data.transaction_id}</p>
                <p><strong>Auth Code:</strong> ${data.approval_code || 'N/A'}</p>
                <p><strong>Amount:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(data.amount)}</p>
                <p><strong>Message:</strong> ${data.response_message || 'Transaction approved'}</p>
            `;
            showPage('success-page');
        })
        .catch(error => {
            console.error('Error processing payment:', error);
            rejectMessageDetails.innerHTML = `
                <p><strong>Error:</strong> ${error.message || 'Payment processing failed. Please try again.'}</p>
            `;
            showPage('reject-page');
        });
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
                ${transaction.status === 'APPROVED' ? '<button class="void-btn">Void</button>' : ''}
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
        const voidBtn = row.querySelector('.void-btn');
        if (voidBtn) {
            voidBtn.addEventListener('click', function() {
                voidTransaction(transaction.transaction_id);
            });
        }
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
    
    // Print receipt
    printBtn.addEventListener('click', function() {
        if (terminalStatus.currentTransactionId) {
            fetch(`${CONFIG.API_URL}/transaction/${terminalStatus.currentTransactionId}`)
                .then(response => response.json())
                .then(transaction => {
                    showReceipt(transaction);
                })
                .catch(error => {
                    console.error('Error fetching transaction:', error);
                });
        }
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
    });
    
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
    
    // Void transaction
    voidBtn.addEventListener('click', function() {
        if (terminalStatus.currentTransactionId) {
            voidTransaction(terminalStatus.currentTransactionId);
        }
    });
    
    function voidTransaction(transactionId) {
        if (confirm('Are you sure you want to void this transaction?')) {
            fetch(`${CONFIG.API_URL}/transaction/${transactionId}/void`, {
                method: 'POST'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayTransactionResult(data);
                updateTransactionInHistory(data);
                if (transactionId === terminalStatus.currentTransactionId) {
                    voidBtn.disabled = true;
                }
            })
            .catch(error => {
                console.error('Error voiding transaction:', error);
                displayError('Failed to void transaction. Please try again.');
            });
        }
    }
    
    // Update transaction in history
    function updateTransactionInHistory(transaction) {
        const row = historyBody.querySelector(`tr[data-transaction-id="${transaction.transaction_id}"]`);
        if (row) {
            const statusCell = row.querySelector('td:nth-child(4)');
            const actionsCell = row.querySelector('td:nth-child(5)');
            statusCell.textContent = transaction.status;
            statusCell.className = transaction.status.toLowerCase();
            const voidBtn = actionsCell.querySelector('.void-btn');
            if (voidBtn) {
                actionsCell.removeChild(voidBtn);
            }
        }
    }
    
    // Initialize terminal (called after login)
    function initializeTerminal() {
        fetch(`${CONFIG.API_URL}/terminal/info`)
            .then(response => response.json())
            .then(data => {
                terminalStatus.merchantId = data.merchant_id;
                terminalStatus.terminalId = data.terminal_id;
                terminalIdEl.textContent = data.terminal_id;
                merchantIdEl.textContent = data.merchant_id;
            })
            .catch(error => {
                console.error('Error fetching terminal info:', error);
                terminalIdEl.textContent = 'DEFAULT_TERMINAL';
                merchantIdEl.textContent = 'DEFAULT_MERCHANT';
            });
        
        fetch(`${CONFIG.API_URL}/transactions`)
            .then(response => response.json())
            .then(data => {
                if (data.transactions && data.transactions.length > 0) {
                    historyBody.innerHTML = '';
                    data.transactions.forEach(transaction => {
                        addTransactionToHistory(transaction);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching transaction history:', error);
            });
            
        fetch(`${CONFIG.API_URL}/protocols`)
            .then(response => response.json())
            .then(data => {
                if (data.protocols && data.protocols.length > 0) {
                    protocolSelect.innerHTML = '';
                    data.protocols.forEach(protocol => {
                        const option = document.createElement('option');
                        option.value = protocol.name;
                        option.textContent = protocol.name;
                        protocolSelect.appendChild(option);
                    });
                    updateAuthCodeRequirements();
                }
            })
            .catch(error => {
                console.error('Error fetching protocols:', error);
            });
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
        const payoutData = {
            method: 'BANK',
            settings: {
                account_name: accountName,
                account_number: accountNumber,
                routing_number: routingNumber,
                bank_name: bankName,
                swift_code: swiftCode || null,
                iban: iban || null
            }
        };
        fetch(`${CONFIG.API_URL}/payout/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payoutData)
        })
        .then(response => {
            if (!response.ok) { throw new Error(`HTTP error ${response.status}`); }
            return response.json();
        })
        .then(data => { alert('Bank payout settings saved successfully'); })
        .catch(error => {
            console.error('Error saving bank payout settings:', error);
            alert('Failed to save bank payout settings. Please try again.');
        });
    });
    
    // Save crypto payout settings
    saveCryptoBtn.addEventListener('click', function() {
        const cryptoCurrency = document.getElementById('crypto-currency').value;
        const walletAddress = document.getElementById('wallet-address').value;
        const network = document.getElementById('network').value;
        if (!cryptoCurrency || !walletAddress) {
            alert('Please fill in all required crypto details');
            return;
        }
        const payoutData = {
            method: 'CRYPTO',
            settings: {
                wallet_address: walletAddress,
                currency: cryptoCurrency,
                network: network || null
            }
        };
        fetch(`${CONFIG.API_URL}/payout/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payoutData)
        })
        .then(response => {
            if (!response.ok) { throw new Error(`HTTP error ${response.status}`); }
            return response.json();
        })
        .then(data => { alert('Crypto payout settings saved successfully'); })
        .catch(error => {
            console.error('Error saving crypto payout settings:', error);
            alert('Failed to save crypto payout settings. Please try again.');
        });
    });
    
    // Check connection status
    function checkConnectionStatus() {
        if (!CONFIG.API_URL) return;
        fetch(`${CONFIG.API_URL}/status`)
            .then(response => {
                if (response.ok) { updateConnectionStatus(true); } else { updateConnectionStatus(false); }
            })
            .catch(() => { updateConnectionStatus(false); });
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
    
    checkConnectionStatus();
    setInterval(checkConnectionStatus, 30000);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === receiptModal) {
            receiptModal.style.display = 'none';
        }
    });
});
