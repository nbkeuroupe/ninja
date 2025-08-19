package com.blackrock.terminal;

import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class MainActivity extends AppCompatActivity {

    // UI Elements
    private TextInputEditText amountInput;
    private AutoCompleteTextView currencyDropdown;
    private TextInputEditText cardNumberInput;
    private TextInputEditText expiryInput;
    private TextInputEditText cvvInput;
    private TextInputEditText cardholderInput;
    private TextInputEditText postalCodeInput;
    private AutoCompleteTextView protocolDropdown;
    private TextInputLayout authCodeContainer;
    private TextInputEditText authCodeInput;
    private TextView authCodeHint;
    private AutoCompleteTextView transactionTypeDropdown;
    private Button processBtn;
    private Button clearBtn;
    private TextView resultContent;
    private Button printBtn;
    private Button voidBtn;
    private TextView statusText;
    private View statusLight;
    private TextView terminalIdText;
    private TextView merchantIdText;
    private TabLayout payoutTabs;
    private ViewPager2 payoutViewPager;

    // Protocol definitions
    private final Map<String, ProtocolConfig> PROTOCOLS = new HashMap<>();

    // Terminal state
    private boolean isOnline = true;
    private String merchantId = "";
    private String terminalId = "";
    private String currentTransactionId = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize protocol configurations
        initProtocols();

        // Initialize UI elements
        initializeViews();
        setupDropdowns();
        setupListeners();

        // Initialize terminal
        initializeTerminal();
    }

    private void initProtocols() {
        PROTOCOLS.put("POS Terminal -101.1 (4-digit approval)", new ProtocolConfig(4, true));
        PROTOCOLS.put("POS Terminal -101.4 (6-digit approval)", new ProtocolConfig(6, true));
        PROTOCOLS.put("POS Terminal -101.6 (Pre-authorization)", new ProtocolConfig(6, true));
        PROTOCOLS.put("POS Terminal -101.7 (4-digit approval)", new ProtocolConfig(4, true));
        PROTOCOLS.put("POS Terminal -101.8 (PIN-LESS transaction)", new ProtocolConfig(4, false));
        PROTOCOLS.put("POS Terminal -201.1 (6-digit approval)", new ProtocolConfig(6, true));
        PROTOCOLS.put("POS Terminal -201.3 (6-digit approval)", new ProtocolConfig(6, false));
        PROTOCOLS.put("POS Terminal -201.5 (6-digit approval)", new ProtocolConfig(6, false));
    }

    private void initializeViews() {
        amountInput = findViewById(R.id.amountInput);
        currencyDropdown = findViewById(R.id.currencyDropdown);
        cardNumberInput = findViewById(R.id.cardNumberInput);
        expiryInput = findViewById(R.id.expiryInput);
        cvvInput = findViewById(R.id.cvvInput);
        cardholderInput = findViewById(R.id.cardholderInput);
        postalCodeInput = findViewById(R.id.postalCodeInput);
        protocolDropdown = findViewById(R.id.protocolDropdown);
        authCodeContainer = findViewById(R.id.authCodeContainer);
        authCodeInput = findViewById(R.id.authCodeInput);
        authCodeHint = findViewById(R.id.authCodeHint);
        transactionTypeDropdown = findViewById(R.id.transactionTypeDropdown);
        processBtn = findViewById(R.id.processBtn);
        clearBtn = findViewById(R.id.clearBtn);
        resultContent = findViewById(R.id.resultContent);
        printBtn = findViewById(R.id.printBtn);
        voidBtn = findViewById(R.id.voidBtn);
        statusText = findViewById(R.id.statusText);
        statusLight = findViewById(R.id.statusLight);
        terminalIdText = findViewById(R.id.terminalIdText);
        merchantIdText = findViewById(R.id.merchantIdText);
        payoutTabs = findViewById(R.id.payoutTabs);
        payoutViewPager = findViewById(R.id.payoutViewPager);
    }

    private void setupDropdowns() {
        // Currency dropdown
        String[] currencies = {"USD - US Dollar", "EUR - Euro"};
        ArrayAdapter<String> currencyAdapter = new ArrayAdapter<>(
                this, android.R.layout.simple_dropdown_item_1line, currencies);
        currencyDropdown.setAdapter(currencyAdapter);
        currencyDropdown.setText(currencies[0], false);

        // Protocol dropdown
        String[] protocols = PROTOCOLS.keySet().toArray(new String[0]);
        ArrayAdapter<String> protocolAdapter = new ArrayAdapter<>(
                this, android.R.layout.simple_dropdown_item_1line, protocols);
        protocolDropdown.setAdapter(protocolAdapter);
        protocolDropdown.setText(protocols[0], false);

        // Transaction type dropdown
        String[] transactionTypes = {"Sale", "Refund", "Pre-Authorization", "Pre-Auth Completion", "Balance Inquiry"};
        ArrayAdapter<String> transactionTypeAdapter = new ArrayAdapter<>(
                this, android.R.layout.simple_dropdown_item_1line, transactionTypes);
        transactionTypeDropdown.setAdapter(transactionTypeAdapter);
        transactionTypeDropdown.setText(transactionTypes[0], false);
    }

    private void setupListeners() {
        // Protocol selection listener
        protocolDropdown.setOnItemClickListener((parent, view, position, id) -> {
            String selectedProtocol = parent.getItemAtPosition(position).toString();
            updateAuthCodeRequirements(selectedProtocol);
        });

        // Process payment button
        processBtn.setOnClickListener(v -> {
            if (validateInputs()) {
                processPayment();
            }
        });

        // Clear button
        clearBtn.setOnClickListener(v -> clearForm());

        // Print receipt button
        printBtn.setOnClickListener(v -> printReceipt());

        // Void transaction button
        voidBtn.setOnClickListener(v -> voidTransaction());
    }

    private void updateAuthCodeRequirements(String selectedProtocol) {
        ProtocolConfig config = PROTOCOLS.get(selectedProtocol);
        if (config != null) {
            authCodeContainer.setVisibility(View.VISIBLE);
            authCodeHint.setVisibility(View.VISIBLE);
            
            String hintText = "Required: " + config.approvalLength + " " + 
                    (config.isOnledger ? "digits" : "alphanumeric characters");
            authCodeHint.setText(hintText);
            
            // Set input type based on protocol
            if (selectedProtocol.startsWith("POS Terminal -101")) {
                authCodeInput.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
            } else {
                authCodeInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT);
            }
        }
    }

    private boolean validateInputs() {
        // Check amount
        if (amountInput.getText() == null || amountInput.getText().toString().isEmpty()) {
            showError("Please enter a valid amount");
            return false;
        }

        // Check card number
        if (cardNumberInput.getText() == null || cardNumberInput.getText().toString().length() < 13) {
            showError("Please enter a valid card number");
            return false;
        }

        // Check expiry date
        if (expiryInput.getText() == null || !expiryInput.getText().toString().matches("\\d{2}/\\d{2}")) {
            showError("Please enter a valid expiry date (MM/YY)");
            return false;
        }

        // Check CVV
        if (cvvInput.getText() == null || cvvInput.getText().toString().length() < 3) {
            showError("Please enter a valid CVV");
            return false;
        }

        // Check cardholder name
        if (cardholderInput.getText() == null || cardholderInput.getText().toString().isEmpty()) {
            showError("Please enter the cardholder name");
            return false;
        }

        // Check auth code
        String selectedProtocol = protocolDropdown.getText().toString();
        ProtocolConfig config = PROTOCOLS.get(selectedProtocol);
        
        if (config != null) {
            String authCode = authCodeInput.getText() != null ? authCodeInput.getText().toString() : "";
            
            if (authCode.length() != config.approvalLength) {
                showError("Please enter a valid " + config.approvalLength + "-character auth code");
                return false;
            }
            
            // For numeric protocols, check if auth code is numeric
            if (selectedProtocol.startsWith("POS Terminal -101") && !authCode.matches("\\d+")) {
                showError("Auth code must be numeric for this protocol");
                return false;
            }
        }

        return true;
    }

    private void processPayment() {
        // Show processing state
        processBtn.setEnabled(false);
        processBtn.setText("Processing...");
        
        // In a real app, this would make an API call to the backend
        // For now, we'll simulate a successful transaction
        
        // Simulate network delay
        new android.os.Handler().postDelayed(() -> {
            try {
                // Create a mock transaction response
                JSONObject transaction = new JSONObject();
                transaction.put("transaction_id", "TX" + System.currentTimeMillis());
                transaction.put("status", "APPROVED");
                transaction.put("amount", Double.parseDouble(amountInput.getText().toString()));
                transaction.put("currency", currencyDropdown.getText().toString().substring(0, 3));
                transaction.put("timestamp", new java.util.Date().toString());
                transaction.put("approval_code", authCodeInput.getText().toString());
                
                // Display the result
                displayTransactionResult(transaction);
                
                // Store current transaction ID
                currentTransactionId = transaction.getString("transaction_id");
                
                // Enable receipt and void buttons
                printBtn.setEnabled(true);
                voidBtn.setEnabled(true);
                
            } catch (JSONException e) {
                showError("Error processing payment: " + e.getMessage());
            }
            
            // Reset button state
            processBtn.setEnabled(true);
            processBtn.setText("Process Payment");
        }, 2000);
    }

    private void displayTransactionResult(JSONObject transaction) throws JSONException {
        String status = transaction.getString("status");
        double amount = transaction.getDouble("amount");
        String currency = transaction.getString("currency");
        String timestamp = transaction.getString("timestamp");
        String approvalCode = transaction.optString("approval_code", "N/A");
        
        String formattedAmount = String.format("$%.2f %s", amount, currency);
        
        String resultHTML = "<b>" + status + "</b><br>" +
                formattedAmount + "<br>" +
                timestamp + "<br><br>" +
                "Transaction ID: " + transaction.getString("transaction_id") + "<br>" +
                "Auth Code: " + approvalCode;
        
        resultContent.setText(android.text.Html.fromHtml(resultHTML, android.text.Html.FROM_HTML_MODE_COMPACT));
    }

    private void clearForm() {
        amountInput.setText("");
        cardNumberInput.setText("");
        expiryInput.setText("");
        cvvInput.setText("");
        cardholderInput.setText("");
        postalCodeInput.setText("");
        authCodeInput.setText("");
        
        resultContent.setText("Transaction results will appear here");
        
        printBtn.setEnabled(false);
        voidBtn.setEnabled(false);
        
        currentTransactionId = null;
    }

    private void printReceipt() {
        Toast.makeText(this, "Printing receipt...", Toast.LENGTH_SHORT).show();
        // In a real app, this would trigger receipt printing
    }

    private void voidTransaction() {
        if (currentTransactionId != null) {
            Toast.makeText(this, "Voiding transaction " + currentTransactionId, Toast.LENGTH_SHORT).show();
            // In a real app, this would make an API call to void the transaction
            
            // Disable void button
            voidBtn.setEnabled(false);
        }
    }

    private void showError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    private void initializeTerminal() {
        // In a real app, this would fetch terminal info from the backend
        terminalId = "ANDROID_TERMINAL_001";
        merchantId = "MERCHANT_001";
        
        terminalIdText.setText(terminalId);
        merchantIdText.setText(merchantId);
        
        // Initialize auth code requirements
        updateAuthCodeRequirements(protocolDropdown.getText().toString());
    }

    // Protocol configuration class
    private static class ProtocolConfig {
        final int approvalLength;
        final boolean isOnledger;
        
        ProtocolConfig(int approvalLength, boolean isOnledger) {
            this.approvalLength = approvalLength;
            this.isOnledger = isOnledger;
        }
    }
}