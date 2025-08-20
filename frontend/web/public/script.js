// Get references to all the new and updated DOM elements
const loginSection = document.getElementById('login-section');
const mainTerminalView = document.getElementById('main-terminal-view');
const merchantIdInput = document.getElementById('merchant-id-input');
const terminalIdInput = document.getElementById('terminal-id-input');
const loginButton = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');

const statusLight = document.getElementById('status-light');
const statusText = document.getElementById('status-text');
const footerTerminalId = document.getElementById('terminal-id');
const footerMerchantId = document.getElementById('merchant-id');

const processButton = document.getElementById('process-btn');
const clearButton = document.getElementById('clear-btn');
const amountInput = document.getElementById('amount');
const protocolSelect = document.getElementById('protocol');
const authCodeContainer = document.getElementById('auth-code-container');
const authCodeInput = document.getElementById('auth-code');
const transactionResultContent = document.getElementById('result-content');
const printButton = document.getElementById('print-btn');
const voidButton = document.getElementById('void-btn');

const payoutTabs = document.querySelectorAll('.payout-tab');
const payoutContents = document.querySelectorAll('.payout-content');
const saveBankButton = document.getElementById('save-bank-btn');
const saveCryptoButton = document.getElementById('save-crypto-btn');

const historyBody = document.getElementById('history-body');

const receiptModal = document.getElementById('receipt-modal');
const receiptContainer = document.getElementById('receipt-container');
const closeModalButtons = document.querySelectorAll('.close-modal');
const printReceiptButton = document.getElementById('print-receipt-btn');
const closeReceiptButton = document.getElementById('close-receipt-btn');

const mtiStreamSection = document.querySelector('.mti-stream');
const mtiStreamContainer = document.getElementById('mti-stream-container');

let transactionHistory = [];
let currentTransaction = null;
let mtiStreamInterval = null;

// --- Utility Functions ---

/**
 * Utility function to display a message in the transaction result box.
 * @param {string} message The message to display.
 * @param {string} type The type of message ('success', 'error', 'info').
 */
function showTransactionResult(message, type = 'info') {
    transactionResultContent.innerHTML = `<p>${message}</p>`;
    // You can add color coding here if needed
    if (type === 'success') {
        transactionResultContent.style.color = '#10b981'; // Tailwind green-500
    } else if (type === 'error') {
        transactionResultContent.style.color = '#ef4444'; // Tailwind red-500
    } else {
        transactionResultContent.style.color = '#4b5563'; // Tailwind gray-600
    }
}

/**
 * Utility function to update the terminal's status display.
 * @param {string} newStatus The new status ('ONLINE', 'OFFLINE', 'PENDING').
 */
function updateStatus(newStatus) {
    statusLight.classList.remove('online', 'offline', 'pending');
    statusText.textContent = newStatus.toUpperCase();
    statusLight.classList.add(newStatus.toLowerCase());
}

/**
 * Adds a new transaction to the history table and updates the display.
 * @param {object} transaction The transaction object.
 */
function addTransactionToHistory(transaction) {
    // Remove placeholder row if it exists
    const placeholderRow = document.querySelector('.placeholder-row');
    if (placeholderRow) {
        placeholderRow.remove();
    }
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="py-2 px-4">${transaction.time}</td>
        <td class="py-2 px-4">${transaction.type}</td>
        <td class="py-2 px-4">$${transaction.amount.toFixed(2)}</td>
        <td class="py-2 px-4">
            <span class="status-dot ${transaction.status}"></span>
            ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </td>
        <td class="py-2 px-4">
            <button class="secondary-btn view-receipt-btn text-xs px-2 py-1">View Receipt</button>
            ${transaction.status === 'success' ? `<button class="danger-btn void-transaction-btn text-xs px-2 py-1 ml-2">Void</button>` : ''}
        </td>
    `;
    historyBody.prepend(newRow);
    transactionHistory.unshift(transaction);
}

/**
 * Creates and displays a receipt in the modal.
 * @param {object} transaction The transaction to display on the receipt.
 */
function showReceipt(transaction) {
    const receiptHTML = `
        <h3 class="text-center font-bold text-lg mb-2">Black Rock Payment Receipt</h3>
        <p class="text-center text-sm mb-4">Date: ${transaction.date}</p>
        <p class="text-sm">Merchant ID: ${transaction.merchantId}</p>
        <p class="text-sm">Terminal ID: ${transaction.terminalId}</p>
        <hr class="my-2 border-gray-300">
        <p class="text-sm">Transaction ID: ${transaction.transactionId}</p>
        <p class="text-sm">Cardholder: ${transaction.cardholder}</p>
        <p class="text-sm">Card: **** **** **** ${transaction.last4}</p>
        <p class="text-sm">Protocol: ${transaction.protocol}</p>
        <hr class="my-2 border-gray-300">
        <p class="text-sm">Amount: $${transaction.amount.toFixed(2)}</p>
        <p class="text-sm">Type: ${transaction.type}</p>
        <p class="text-sm font-bold">Status: ${transaction.status.toUpperCase()}</p>
    `;
    receiptContainer.innerHTML = receiptHTML;
    receiptModal.style.display = 'flex';
}

/**
 * Adds a new MTI message to the real-time stream.
 * @param {string} mtiCode The ISO 8583 MTI code.
 * @param {string} description A description of the message.
 */
function addMTI(mtiCode, description) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('mti-message');
    messageElement.innerHTML = `
        <span class="mti-timestamp">[${new Date().toLocaleTimeString()}]</span> 
        <span class="mti-code">${mtiCode}</span>: 
        <span class="mti-description">${description}</span>
    `;
    mtiStreamContainer.prepend(messageElement);
    // Keep the stream from getting too long
    if (mtiStreamContainer.children.length > 20) {
        mtiStreamContainer.lastChild.remove();
    }
}

/**
 * Simulates a real-time stream of MTI messages.
 */
function startMTIStreamSimulation() {
    // Add initial placeholder message
    mtiStreamContainer.innerHTML = '<p class="text-gray-500 italic text-center">Waiting for messages...</p>';
    
    // Simulate periodic messages from the backend
    mtiStreamInterval = setInterval(() => {
        const messages = [
            { code: '0800', desc: 'Network Management Request' },
            { code: '0810', desc: 'Network Management Response' },
            { code: '0420', desc: 'Reversal Request' },
            { code: '0430', desc: 'Reversal Response' },
            { code: '0100', desc: 'Authorization Request' },
            { code: '0110', desc: 'Authorization Response' }
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        addMTI(randomMessage.code, randomMessage.desc);
    }, 5000); // Send a new message every 5 seconds
}

// --- Event Handlers ---

/**
 * Handles the login button click.
 */
loginButton.addEventListener('click', () => {
    const merchantId = merchantIdInput.value.trim();
    const terminalId = terminalIdInput.value.trim();

    if (merchantId && terminalId) {
        // Here you would make a real API call to your backend to validate credentials.
        // For this example, we'll simulate a successful login.
        loginSection.classList.add('hidden');
        mainTerminalView.classList.remove('hidden');
        footerMerchantId.textContent = merchantId;
        footerTerminalId.textContent = terminalId;
        updateStatus('ONLINE');
        loginMessage.textContent = '';
        mtiStreamSection.classList.remove('hidden');
        startMTIStreamSimulation();
    } else {
        loginMessage.textContent = 'Please enter both Merchant ID and Terminal ID.';
    }
});

/**
 * Handles the payment process.
 */
processButton.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    const cardholder = document.getElementById('cardholder').value.trim();
    const cardNumber = document.getElementById('card-number').value.trim();
    const protocol = protocolSelect.value;
    
    // Basic validation
    if (isNaN(amount) || amount <= 0) {
        showTransactionResult('Please enter a valid amount.', 'error');
        return;
    }
    if (!cardholder || !cardNumber) {
        showTransactionResult('Cardholder name and number are required.', 'error');
        return;
    }
    if (!protocol) {
        showTransactionResult('Please select a protocol.', 'error');
        return;
    }
    
    const requiredProtocols = ['101.1', '101.4', '101.7', '201.1'];
    if (requiredProtocols.includes(protocol)) {
        if (!authCodeInput.value.trim()) {
            showTransactionResult('Auth code is required for this protocol.', 'error');
            return;
        }
    }

    showTransactionResult('Processing payment...', 'info');
    updateStatus('PENDING');
    
    processButton.disabled = true;
    clearButton.disabled = true;

    // Simulate sending an MTI 0100 message (Authorization Request)
    addMTI('0100', 'Sending Authorization Request...');

    const API_ENDPOINT = 'https://be-vezt.onrender.com/api/payments';
    
    const paymentPayload = {
        amount: amount,
        currency: 'USD',
        cardholder: cardholder,
        cardNumber: cardNumber,
        protocol: protocol,
        authCode: authCodeInput.value.trim(),
    };

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentPayload),
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            addMTI('0210', 'Authorization Response received (Approved)'); // Simulating MTI 0210
            showTransactionResult(`Payment successful! Transaction ID: ${result.transactionId}`, 'success');
            updateStatus('ONLINE');
            currentTransaction = {
                id: result.transactionId,
                amount: amount,
                type: 'Sale',
                status: 'success',
                time: new Date().toLocaleTimeString(),
                date: new Date().toLocaleDateString(),
                merchantId: footerMerchantId.textContent,
                terminalId: footerTerminalId.textContent,
                cardholder: cardholder,
                last4: cardNumber.slice(-4),
                protocol: protocol,
            };
            addTransactionToHistory(currentTransaction);
            printButton.disabled = false;
            voidButton.disabled = false;
        } else {
            addMTI('0210', 'Authorization Response received (Declined)'); // Simulating MTI 0210
            showTransactionResult(`Payment failed: ${result.message}`, 'error');
            updateStatus('ONLINE');
            currentTransaction = {
                id: result.transactionId || 'N/A',
                amount: amount,
                type: 'Sale',
                status: 'failed',
                time: new Date().toLocaleTimeString(),
                date: new Date().toLocaleDateString(),
                merchantId: footerMerchantId.textContent,
                terminalId: footerTerminalId.textContent,
                cardholder: cardholder,
                last4: cardNumber.slice(-4),
                protocol: protocol,
            };
            addTransactionToHistory(currentTransaction);
            printButton.disabled = true;
            voidButton.disabled = true;
        }
    } catch (error) {
        console.error('Network Error:', error);
        addMTI('0210', 'Authorization Response failed (Timeout)'); // Simulating MTI 0210
        showTransactionResult('A network error occurred. Please try again.', 'error');
        updateStatus('OFFLINE');
    } finally {
        processButton.disabled = false;
        clearButton.disabled = false;
    }
});

/**
 * Handles the clear button click.
 */
clearButton.addEventListener('click', () => {
    amountInput.value = '';
    document.getElementById('card-number').value = '';
    document.getElementById('expiry').value = '';
    document.getElementById('cvv').value = '';
    document.getElementById('cardholder').value = '';
    document.getElementById('protocol').value = '';
    authCodeInput.value = '';
    authCodeContainer.style.display = 'none';
    showTransactionResult('Enter payment details to begin.', 'info');
    printButton.disabled = true;
    voidButton.disabled = true;
});

/**
 * Handles the protocol dropdown change event to show/hide the auth code field.
 */
protocolSelect.addEventListener('change', () => {
    const protocolValue = protocolSelect.value;
    // Protocols that require an auth code
    const requiredProtocols = ['101.1', '101.4', '101.7', '201.1'];
    if (requiredProtocols.includes(protocolValue)) {
        authCodeContainer.style.display = 'block';
        // Set placeholder text based on protocol
        if (protocolValue === '101.1' || protocolValue === '101.7') {
            authCodeInput.placeholder = '4-digit code';
            authCodeInput.setAttribute('maxlength', '4');
        } else {
            authCodeInput.placeholder = '6-digit code';
            authCodeInput.setAttribute('maxlength', '6');
        }
    } else {
        authCodeContainer.style.display = 'none';
        authCodeInput.value = '';
    }
});

/**
 * Handles the payout tabs click event.
 */
payoutTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Deactivate all tabs and hide all content sections
        payoutTabs.forEach(t => t.classList.remove('active-tab'));
        payoutContents.forEach(c => c.classList.add('hidden'));

        // Activate the clicked tab and show the corresponding content
        tab.classList.add('active-tab');
        const contentClass = tab.textContent.toLowerCase().replace(' ', '-') + '-content';
        document.querySelector(`.${contentClass}`).classList.remove('hidden');
    });
});

/**
 * Handles saving bank details and triggers a payout confirmation.
 */
saveBankButton.addEventListener('click', () => {
    const bankDetails = {
        bankName: document.getElementById('bank-name').value,
        accountName: document.getElementById('account-name').value,
        accountNumber: document.getElementById('account-number').value,
        routingNumber: document.getElementById('routing-number').value
    };
    console.log('Saving Bank Details:', bankDetails);
    
    // Simulate a successful save and then trigger payout confirmation
    setTimeout(() => {
        addMTI('0220', 'Payout trigger sent for Bank Transfer');
        setTimeout(() => {
            addMTI('0230', 'Payout Confirmation received for Bank Transfer');
            alert('Bank details saved and payout confirmed successfully!');
        }, 3000);
    }, 1000);
});

/**
 * Handles saving crypto details and triggers a payout confirmation.
 */
saveCryptoButton.addEventListener('click', () => {
    const cryptoDetails = {
        currency: document.getElementById('crypto-currency').value,
        walletAddress: document.getElementById('wallet-address').value
    };
    console.log('Saving Crypto Details:', cryptoDetails);

    // Simulate a successful save and then trigger payout confirmation
    setTimeout(() => {
        addMTI('0220', 'Payout trigger sent for Crypto Transfer');
        setTimeout(() => {
            addMTI('0230', 'Payout Confirmation received for Crypto Transfer');
            alert('Crypto details saved and payout confirmed successfully!');
        }, 3000);
    }, 1000);
});

/**
 * Handles showing the receipt modal.
 */
printButton.addEventListener('click', () => {
    if (currentTransaction) {
        showReceipt(currentTransaction);
    }
});

/**
 * Handles closing the receipt modal.
 */
closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        receiptModal.style.display = 'none';
    });
});

/**
 * Handles the 'Print' button inside the receipt modal (simulated).
 */
printReceiptButton.addEventListener('click', () => {
    window.print();
});

/**
 * Handles the 'Void Transaction' button (simulated).
 */
voidButton.addEventListener('click', () => {
    if (currentTransaction && currentTransaction.status === 'success') {
        // Here, you would make a real API call to your backend to void the transaction
        console.log(`Attempting to void transaction ID: ${currentTransaction.id}`);
        addMTI('0420', 'Reversal Request sent...');
        
        // Simulate a successful void
        setTimeout(() => {
            currentTransaction.status = 'failed';
            currentTransaction.type = 'Void';
            showTransactionResult(`Transaction ${currentTransaction.id} voided successfully.`, 'info');
            updateStatus('ONLINE');
            printButton.disabled = true;
            voidButton.disabled = true;
            addMTI('0430', 'Reversal Response received (Approved)');
            alert(`Transaction ${currentTransaction.id} has been voided.`);
        }, 2000);
    }
});

// Event delegation for dynamically added history table buttons
historyBody.addEventListener('click', (event) => {
    const target = event.target;
    const row = target.closest('tr');
    if (!row) return;

    // A more robust method is to use a data attribute
    const transactionId = row.querySelector('td:nth-child(1)').textContent;

    if (target.classList.contains('view-receipt-btn')) {
        const transaction = transactionHistory.find(t => t.id === transactionId);
        if (transaction) {
            showReceipt(transaction);
        }
    } else if (target.classList.contains('void-transaction-btn')) {
        const transaction = transactionHistory.find(t => t.id === transactionId);
        if (transaction) {
            // Simulate voiding
            transaction.status = 'failed';
            alert(`Transaction ${transaction.id} has been voided.`);
            // Update the UI
            row.querySelector('.status-dot').classList.remove('success');
            row.querySelector('.status-dot').classList.add('failed');
            row.querySelector('td:nth-child(4)').innerHTML = `<span class="status-dot failed"></span>Failed`;
            target.remove(); // Remove the void button
        }
    }
});
