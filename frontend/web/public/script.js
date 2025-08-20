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
    
    const resultContent = document.getElementById('result-content');
    const historyBody = document.getElementById('history-body');
    
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
    
    // Terminal state
    let terminalStatus = {
        online: true,
        merchantId: '',
        terminalId: '',
        currentTransactionId: null
    };
    
    // Protocol definitions - Fixed protocol definitions
    const PROTOCOLS = {
        "POS Terminal -101.1 (4-digit approval)": { approval_length: 4, is_onledger: true },
        "POS Terminal -101.4 (6-digit approval)": { approval_length: 6, is_onledger: true },
        "POS Terminal -101.6 (Pre-authorization)": { approval_length: 6, is_onledger: true },
        "POS Terminal -101.7 (4-digit approval)": { approval_length: 4, is_onledger: true },
        "POS Terminal -101.8 (PIN-LESS transaction)": { approval_length: 4, is_onledger: false },
        "POS Terminal -201.1 (6-digit approval)": { approval_length: 6, is_onledger: true },
        "POS Terminal -201.3 (6-digit approval)": { approval_length: 6, is_onledger: false },
        "POS Terminal -201.5 (6-digit approval)": { approval_length: 6, is_onledger: false }
    };
    
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
        
        e.target.value = formattedValue.substring(0, 19); // 16 digits + 3 spaces
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
        
        console.log('Selected protocol:', selectedProtocol);
        console.log('Protocol config:', protocolConfig);
        
        if (protocolConfig) {
            // Show auth code field
            authCodeContainer.style.display = 'block';
            authCodeHint.style.display = 'block';
            authCodeHint.textContent = `Required: ${protocolConfig.approval_length} ${protocolConfig.is_onledger ? 'digits' : 'alphanumeric characters'}`;
            
            // Set max length attribute
            authCodeInput.setAttribute('maxlength', protocolConfig.approval_length);
            
            // Set placeholder
            const placeholder = protocolConfig.is_onledger ? 
                `Enter ${protocolConfig.approval_length}-digit code` : 
                `Enter ${protocolConfig.approval_length}-character code`;
            authCodeInput.placeholder = placeholder;
            
            // Clear existing value if it doesn't match new requirements
            const currentValue = authCodeInput.value;
            if (currentValue.length !== protocolConfig.approval_length) {
                authCodeInput.value = '';
            }
        } else {
            // Hide auth code field if no protocol config found
            authCodeContainer.style.display = 'none';
            authCodeHint.style.display = 'none';
        }
    }
    
    // Initialize auth code field
    updateAuthCodeRequirements();
    
    // Auth code input validation - FIXED
    authCodeInput.addEventListener('input', function(e) {
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        if (protocolConfig) {
            let value = e.target.value;
            
            // For onledger protocols (101.x series), restrict to digits only
            if (protocolConfig.is_onledger) {
                value = value.replace(/\D/g, ''); // Remove non-digits
            } else {
                // For offledger protocols, allow alphanumeric
                value = value.replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters
            }
            
            // Limit length
            value = value.substring(0, protocolConfig.approval_length);
            
            e.target.value = value;
            
            // Visual feedback for valid input
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
        console.log('Process button clicked');
        
        // Validate inputs
        if (!validateInputs()) {
            return;
        }
        
        console.log('Validation passed, processing payment...');
        
        // Show processing state
        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';
        
        // Prepare payment data
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
        
        console.log('Payment data:', paymentData);
        
        // Send payment request to API
        fetch('/api/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        })
        .then(response => {
            console.log('API response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Payment response:', data);
            
            // Update UI with transaction result
            displayTransactionResult(data);
            
            // Add to transaction history
            addTransactionToHistory(data);
            
            // Store current transaction ID
            terminalStatus.currentTransactionId = data.transaction_id;
            
            // Enable receipt and void buttons
            printBtn.disabled = false;
            voidBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error processing payment:', error);
            displayError('Payment processing failed. Please try again.');
        })
        .finally(() => {
            // Reset button state
            processBtn.disabled = false;
            processBtn.textContent = 'Process Payment';
        });
    });
    
    // FIXED Validate inputs function
    function validateInputs() {
        console.log('Starting validation...');
        
        // Check amount
        if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
            displayError('Please enter a valid amount');
            console.log('Amount validation failed');
            return false;
        }
        console.log('Amount validation passed');
        
        // Check card number
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            displayError('Please enter a valid card number');
            console.log('Card number validation failed');
            return false;
        }
        console.log('Card number validation passed');
        
        // Check expiry date
        const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryPattern.test(expiryInput.value)) {
            displayError('Please enter a valid expiry date (MM/YY)');
            console.log('Expiry validation failed');
            return false;
        }
        console.log('Expiry validation passed');
        
        // Check CVV
        if (!cvvInput.value || cvvInput.value.length < 3) {
            displayError('Please enter a valid CVV');
            console.log('CVV validation failed');
            return false;
        }
        console.log('CVV validation passed');
        
        // Check cardholder name
        if (!cardholderInput.value || cardholderInput.value.trim().length === 0) {
            displayError('Please enter the cardholder name');
            console.log('Cardholder name validation failed');
            return false;
        }
        console.log('Cardholder name validation passed');
        
        // FIXED: Check auth code if required
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        console.log('Checking auth code for protocol:', selectedProtocol);
        console.log('Protocol config:', protocolConfig);
        console.log('Auth code value:', authCodeInput.value);
        console.log('Auth code length:', authCodeInput.value.length);
        
        if (protocolConfig) {
            const authCode = authCodeInput.value.trim();
            
            // Check length
            if (authCode.length !== protocolConfig.approval_length) {
                displayError(`Please enter a valid ${protocolConfig.approval_length}-character auth code`);
                console.log(`Auth code length validation failed. Expected: ${protocolConfig.approval_length}, Got: ${authCode.length}`);
                return false;
            }
            
            // For onledger protocols, check if auth code is numeric
            if (protocolConfig.is_onledger && !/^\d+$/.test(authCode)) {
                displayError('Auth code must be numeric for this protocol');
                console.log('Auth code numeric validation failed');
                return false;
            }
            
            // For offledger protocols, check if auth code is alphanumeric
            if (!protocolConfig.is_onledger && !/^[a-zA-Z0-9]+$/.test(authCode)) {
                displayError('Auth code must be alphanumeric for this protocol');
                console.log('Auth code alphanumeric validation failed');
                return false;
            }
            
            console.log('Auth code validation passed');
        } else {
            console.log('No protocol config found, skipping auth code validation');
        }
        
        console.log('All validations passed!');
        return true;
    }
    
    // Display transaction result
    function displayTransactionResult(transaction) {
        const statusClass = transaction.status === 'APPROVED' ? 'success' : 
                          transaction.status === 'DECLINED' ? 'danger' : 'warning';
        
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: transaction.currency
        }).format(transaction.amount);
        
        const timestamp = new Date(transaction.timestamp).toLocaleString();
        
        let resultHTML = `
            <div class="transaction-status ${statusClass}">
                <h3>${transaction.status}</h3>
                <p class="transaction-amount">${formattedAmount}</p>
                <p class="transaction-time">${timestamp}</p>
            </div>
            <div class="transaction-details">
                <p><strong>Transaction ID:</strong> ${transaction.transaction_id}</p>
                <p><strong>Auth Code:</strong> ${transaction.approval_code || 'N/A'}</p>
        `;
        
        if (transaction.response_code) {
            resultHTML += `<p><strong>Response Code:</strong> ${transaction.response_code}</p>`;
        }
        
        if (transaction.response_message) {
            resultHTML += `<p><strong>Message:</strong> ${transaction.response_message}</p>`;
        }
        
        resultHTML += '</div>';
        
        resultContent.innerHTML = resultHTML;
    }
    
    // Display error message
    function displayError(message) {
        resultContent.innerHTML = `
            <div class="transaction-status danger">
                <h3>ERROR</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    // Add transaction to history
    function addTransactionToHistory(transaction) {
        // Remove placeholder row if present
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
        
        // Add to top of history
        if (historyBody.firstChild) {
            historyBody.insertBefore(row, historyBody.firstChild);
        } else {
            historyBody.appendChild(row);
        }
        
        // Add event listeners to buttons
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
        
        // Reset auth code field styling
        authCodeInput.style.borderColor = '';
        authCodeInput.style.backgroundColor = '';
        
        // Reset result content
        resultContent.innerHTML = '<p class="placeholder-text">Transaction results will appear here</p>';
        
        // Disable receipt and void buttons
        printBtn.disabled = true;
        voidBtn.disabled = true;
        
        // Clear current transaction ID
        terminalStatus.currentTransactionId = null;
    });
    
    // Print receipt
    printBtn.addEventListener('click', function() {
        if (terminalStatus.currentTransactionId) {
            fetch(`/api/transaction/${terminalStatus.currentTransactionId}`)
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
    
    // Void transaction
    voidBtn.addEventListener('click', function() {
        if (terminalStatus.currentTransactionId) {
            voidTransaction(terminalStatus.currentTransactionId);
        }
    });
    
    function voidTransaction(transactionId) {
        if (confirm('Are you sure you want to void this transaction?')) {
            fetch(`/api/transaction/${transactionId}/void`, {
                method: 'POST'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Update UI with void result
                displayTransactionResult(data);
                
                // Update transaction in history
                updateTransactionInHistory(data);
                
                // Disable void button if current transaction
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
            
            // Remove void button
            const voidBtn = actionsCell.querySelector('.void-btn');
            if (voidBtn) {
                actionsCell.removeChild(voidBtn);
            }
        }
    }
    
    // Initialize terminal
    function initializeTerminal() {
        // Fetch terminal info
        fetch('/api/terminal/info')
            .then(response => response.json())
            .then(data => {
                terminalStatus.merchantId = data.merchant_id;
                terminalStatus.terminalId = data.terminal_id;
                
                terminalIdEl.textContent = data.terminal_id;
                merchantIdEl.textContent = data.merchant_id;
            })
            .catch(error => {
                console.error('Error fetching terminal info:', error);
                
                // Set default values
                terminalIdEl.textContent = 'DEFAULT_TERMINAL';
                merchantIdEl.textContent = 'DEFAULT_MERCHANT';
            });
        
        // Fetch transaction history
        fetch('/api/transactions')
            .then(response => response.json())
            .then(data => {
                if (data.transactions && data.transactions.length > 0) {
                    // Clear placeholder
                    historyBody.innerHTML = '';
                    
                    // Add transactions to history
                    data.transactions.forEach(transaction => {
                        addTransactionToHistory(transaction);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching transaction history:', error);
            });
            
        // Fetch protocols
        fetch('/api/protocols')
            .then(response => response.json())
            .then(data => {
                if (data.protocols && data.protocols.length > 0) {
                    // Update protocol select
                    protocolSelect.innerHTML = '';
                    
                    data.protocols.forEach(protocol => {
                        const option = document.createElement('option');
                        option.value = protocol.name;
                        option.textContent = protocol.name;
                        protocolSelect.appendChild(option);
                    });
                    
                    // Update auth code requirements
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
            // Remove active class from all tabs
            payoutTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all content
            payoutContents.forEach(content => content.classList.remove('active'));
            
            // Show selected content
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
        const swiftCode = document.getElementById('swift-code').value;
        const iban = document.getElementById('iban').value;
        
        // Validate inputs
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
        
        // Send payout settings to API
        fetch('/api/payout/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payoutData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Bank payout settings saved successfully');
        })
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
        
        // Validate inputs
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
        
        // Send payout settings to API
        fetch('/api/payout/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payoutData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Crypto payout settings saved successfully');
        })
        .catch(error => {
            console.error('Error saving crypto payout settings:', error);
            alert('Failed to save crypto payout settings. Please try again.');
        });
    });
    
    // Check connection status
    function checkConnectionStatus() {
        fetch('/api/status')
            .then(response => {
                if (response.ok) {
                    updateConnectionStatus(true);
                } else {
                    updateConnectionStatus(false);
                }
            })
            .catch(() => {
                updateConnectionStatus(false);
            });
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
    
    // Initialize
    initializeTerminal();
    
    // Check connection status periodically
    setInterval(checkConnectionStatus, 30000);
    
    // Initial connection check
    checkConnectionStatus();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === receiptModal) {
            receiptModal.style.display = 'none';
        }
    });
});
