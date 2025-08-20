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
    
    // FIXED: Protocol definitions with exact matching
    const PROTOCOLS = {
        "POS Terminal -101.1 (4-digit approval)": { 
            approval_length: 4, 
            is_onledger: true,
            type: 'numeric'
        },
        "POS Terminal -101.4 (6-digit approval)": { 
            approval_length: 6, 
            is_onledger: true,
            type: 'numeric'
        },
        "POS Terminal -101.6 (Pre-authorization)": { 
            approval_length: 6, 
            is_onledger: true,
            type: 'numeric'
        },
        "POS Terminal -101.7 (4-digit approval)": { 
            approval_length: 4, 
            is_onledger: true,
            type: 'numeric'
        },
        "POS Terminal -101.8 (PIN-LESS transaction)": { 
            approval_length: 4, 
            is_onledger: false,
            type: 'alphanumeric'
        },
        "POS Terminal -201.1 (6-digit approval)": { 
            approval_length: 6, 
            is_onledger: true,
            type: 'numeric'
        },
        "POS Terminal -201.3 (6-digit approval)": { 
            approval_length: 6, 
            is_onledger: false,
            type: 'alphanumeric'
        },
        "POS Terminal -201.5 (6-digit approval)": { 
            approval_length: 6, 
            is_onledger: false,
            type: 'alphanumeric'
        }
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
    
    // FIXED: Auth code validation based on protocol
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
            
            const typeText = protocolConfig.type === 'numeric' ? 'digits' : 'alphanumeric characters';
            authCodeHint.textContent = `Required: ${protocolConfig.approval_length} ${typeText}`;
            
            // Set max length attribute
            authCodeInput.setAttribute('maxlength', protocolConfig.approval_length);
            
            // Set placeholder based on type
            const placeholder = protocolConfig.type === 'numeric' ? 
                `Enter ${protocolConfig.approval_length}-digit code` : 
                `Enter ${protocolConfig.approval_length}-character code`;
            authCodeInput.placeholder = placeholder;
            
            // Clear existing value and reset styling
            authCodeInput.value = '';
            resetAuthCodeStyling();
        } else {
            // Hide auth code field if no protocol config found
            authCodeContainer.style.display = 'none';
            authCodeHint.style.display = 'none';
            authCodeInput.value = '';
        }
    }
    
    // FIXED: Reset auth code styling
    function resetAuthCodeStyling() {
        authCodeInput.style.borderColor = '';
        authCodeInput.style.backgroundColor = '';
        authCodeInput.classList.remove('valid', 'invalid');
    }
    
    // Initialize auth code field
    updateAuthCodeRequirements();
    
    // FIXED: Auth code input validation with proper feedback
    authCodeInput.addEventListener('input', function(e) {
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        if (!protocolConfig) {
            console.log('No protocol config found');
            return;
        }
        
        let value = e.target.value;
        
        // Filter input based on protocol type
        if (protocolConfig.type === 'numeric') {
            value = value.replace(/\D/g, ''); // Remove non-digits
        } else if (protocolConfig.type === 'alphanumeric') {
            value = value.replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters
        }
        
        // Limit length
        value = value.substring(0, protocolConfig.approval_length);
        
        e.target.value = value;
        
        // Visual feedback for valid input
        if (value.length === protocolConfig.approval_length) {
            e.target.style.borderColor = '#2ecc71';
            e.target.style.backgroundColor = '#f8fff8';
            e.target.classList.add('valid');
            e.target.classList.remove('invalid');
            console.log('Auth code valid:', value);
        } else if (value.length > 0) {
            e.target.style.borderColor = '#f39c12';
            e.target.style.backgroundColor = '#fffbf0';
            e.target.classList.remove('valid', 'invalid');
            console.log('Auth code partial:', value);
        } else {
            resetAuthCodeStyling();
        }
    });
    
    // FIXED: Auth code blur validation
    authCodeInput.addEventListener('blur', function(e) {
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        if (protocolConfig && e.target.value.length > 0 && e.target.value.length !== protocolConfig.approval_length) {
            e.target.style.borderColor = '#e74c3c';
            e.target.style.backgroundColor = '#fff8f8';
            e.target.classList.add('invalid');
            e.target.classList.remove('valid');
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
    
    // FIXED: Improved validation with better error messages
    function validateInputs() {
        console.log('Starting validation...');
        
        // Check amount
        const amount = parseFloat(amountInput.value);
        if (!amountInput.value || isNaN(amount) || amount <= 0) {
            displayError('Please enter a valid amount greater than 0');
            amountInput.focus();
            return false;
        }
        
        // Check card number
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
            displayError('Please enter a valid card number (13-19 digits)');
            cardNumberInput.focus();
            return false;
        }
        
        // Check expiry date
        const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryPattern.test(expiryInput.value)) {
            displayError('Please enter a valid expiry date (MM/YY format)');
            expiryInput.focus();
            return false;
        }
        
        // Validate expiry date is not in the past
        const [month, year] = expiryInput.value.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const currentDate = new Date();
        currentDate.setDate(1); // Set to first day of current month
        
        if (expiryDate < currentDate) {
            displayError('Card has expired. Please enter a valid expiry date');
            expiryInput.focus();
            return false;
        }
        
        // Check CVV
        const cvv = cvvInput.value.trim();
        if (!cvv || cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
            displayError('Please enter a valid CVV (3-4 digits)');
            cvvInput.focus();
            return false;
        }
        
        // Check cardholder name
        const cardholderName = cardholderInput.value.trim();
        if (!cardholderName || cardholderName.length < 2) {
            displayError('Please enter the cardholder name (minimum 2 characters)');
            cardholderInput.focus();
            return false;
        }
        
        // FIXED: Improved auth code validation
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        console.log('Validating auth code for protocol:', selectedProtocol);
        console.log('Protocol config:', protocolConfig);
        
        if (!protocolConfig) {
            displayError('Please select a valid protocol');
            protocolSelect.focus();
            return false;
        }
        
        const authCode = authCodeInput.value.trim();
        console.log('Auth code value:', authCode);
        console.log('Expected length:', protocolConfig.approval_length);
        console.log('Expected type:', protocolConfig.type);
        
        // Check auth code length
        if (authCode.length !== protocolConfig.approval_length) {
            displayError(`Auth code must be exactly ${protocolConfig.approval_length} characters for this protocol`);
            authCodeInput.focus();
            return false;
        }
        
        // Check auth code format based on protocol type
        if (protocolConfig.type === 'numeric') {
            if (!/^\d+$/.test(authCode)) {
                displayError(`Auth code must contain only digits for this protocol`);
                authCodeInput.focus();
                return false;
            }
        } else if (protocolConfig.type === 'alphanumeric') {
            if (!/^[a-zA-Z0-9]+$/.test(authCode)) {
                displayError(`Auth code must contain only letters and numbers for this protocol`);
                authCodeInput.focus();
                return false;
            }
        }
        
        console.log('All validations passed!');
        return true;
    }
    
    // FIXED: Better error display with auto-clear
    function displayError(message) {
        resultContent.innerHTML = `
            <div class="transaction-status danger">
                <h3>VALIDATION ERROR</h3>
                <p>${message}</p>
            </div>
        `;
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
            if (resultContent.innerHTML.includes('VALIDATION ERROR')) {
                resultContent.innerHTML = '<p class="placeholder-text">Transaction results will appear here</p>';
            }
        }, 5000);
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
    
    // FIXED: Clear form with proper reset
    clearBtn.addEventListener('click', function() {
        // Clear all form fields
        amountInput.value = '';
        cardNumberInput.value = '';
        expiryInput.value = '';
        cvvInput.value = '';
        cardholderInput.value = '';
        postalCodeInput.value = '';
        authCodeInput.value = '';
        
        // Reset dropdowns to first option
        currencySelect.selectedIndex = 0;
        protocolSelect.selectedIndex = 0;
        transactionTypeSelect.selectedIndex = 0;
        
        // Reset auth code field styling and requirements
        resetAuthCodeStyling();
        updateAuthCodeRequirements();
        
        // Reset result content
        resultContent.innerHTML = '<p class="placeholder-text">Transaction results will appear here</p>';
        
        // Disable receipt and void buttons
        printBtn.disabled = true;
        voidBtn.disabled = true;
        
        // Clear current transaction ID
        terminalStatus.currentTransactionId = null;
        
        // Focus on amount field
        amountInput.focus();
        
        console.log('Form cleared successfully');
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
            
        // Initialize auth code requirements
        updateAuthCodeRequirements();
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
    
    // ADDED: Keyboard shortcuts for better UX
    document.addEventListener('keydown', function(e) {
        // ESC to close modal
        if (e.key === 'Escape' && receiptModal.style.display === 'block') {
            receiptModal.style.display = 'none';
        }
        
        // Ctrl+Enter to process payment (when form is focused)
        if (e.ctrlKey && e.key === 'Enter' && !processBtn.disabled) {
            e.preventDefault();
            processBtn.click();
        }
        
        // F9 to clear form
        if (e.key === 'F9') {
            e.preventDefault();
            clearBtn.click();
        }
    });
    
    // ADDED: Auto-focus management
    amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            cardNumberInput.focus();
        }
    });
    
    cardNumberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.replace(/\s/g, '').length >= 13) {
            expiryInput.focus();
        }
    });
    
    expiryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.length === 5) {
            cvvInput.focus();
        }
    });
    
    cvvInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.length >= 3) {
            cardholderInput.focus();
        }
    });
    
    cardholderInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim().length > 0) {
            authCodeInput.focus();
        }
    });
    
    authCodeInput.addEventListener('keypress', function(e) {
        const selectedProtocol = protocolSelect.value;
        const protocolConfig = PROTOCOLS[selectedProtocol];
        
        if (e.key === 'Enter' && protocolConfig && this.value.length === protocolConfig.approval_length) {
            processBtn.focus();
        }
    });
    
    // ADDED: Real-time validation feedback
    function addValidationFeedback(input, isValid, message = '') {
        const feedback = input.parentNode.querySelector('.validation-feedback') || 
                        document.createElement('div');
        feedback.className = `validation-feedback ${isValid ? 'valid' : 'invalid'}`;
        feedback.textContent = message;
        
        if (!input.parentNode.querySelector('.validation-feedback')) {
            input.parentNode.appendChild(feedback);
        }
        
        input.style.borderColor = isValid ? '#2ecc71' : '#e74c3c';
    }
    
    // Enhanced real-time validation for amount
    amountInput.addEventListener('blur', function() {
        const amount = parseFloat(this.value);
        if (this.value && (!isNaN(amount) && amount > 0)) {
            addValidationFeedback(this, true);
        } else if (this.value) {
            addValidationFeedback(this, false, 'Please enter a valid amount');
        }
    });
    
    // Enhanced real-time validation for card number
    cardNumberInput.addEventListener('blur', function() {
        const cardNumber = this.value.replace(/\s/g, '');
        if (cardNumber.length >= 13 && cardNumber.length <= 19 && /^\d+$/.test(cardNumber)) {
            addValidationFeedback(this, true);
        } else if (cardNumber.length > 0) {
            addValidationFeedback(this, false, 'Card number must be 13-19 digits');
        }
    });
    
    // Enhanced real-time validation for expiry
    expiryInput.addEventListener('blur', function() {
        const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (expiryPattern.test(this.value)) {
            const [month, year] = this.value.split('/');
            const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
            const currentDate = new Date();
            currentDate.setDate(1);
            
            if (expiryDate >= currentDate) {
                addValidationFeedback(this, true);
            } else {
                addValidationFeedback(this, false, 'Card has expired');
            }
        } else if (this.value) {
            addValidationFeedback(this, false, 'Use MM/YY format');
        }
    });
    
    // Focus on amount input when page loads
    window.addEventListener('load', function() {
        setTimeout(() => {
            amountInput.focus();
        }, 100);
    });
    
    console.log('Payment terminal initialized successfully');
});
