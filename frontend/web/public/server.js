const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Handle API endpoints
  if (req.url.startsWith('/api/')) {
    if (req.url === '/api/payment' && req.method === 'POST') {
      // Handle payment processing
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const paymentData = JSON.parse(body);
          console.log('Processing payment:', paymentData);
          
          // Simulate processing delay
          setTimeout(() => {
            // Simulate successful response
            const response = {
              transaction_id: 'txn_' + Date.now(),
              status: 'APPROVED',
              approval_code: paymentData.auth_code,
              amount: paymentData.amount,
              currency: paymentData.currency,
              timestamp: new Date().toISOString(),
              response_code: '00',
              response_message: 'Transaction approved'
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          }, 1000);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else if (req.url === '/api/terminal/info') {
      // Handle terminal info request
      const response = {
        merchant_id: 'MERCHANT_001',
        terminal_id: 'TERMINAL_001'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else if (req.url === '/api/protocols') {
      // Handle protocols request
      const response = {
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
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else if (req.url === '/api/status') {
      // Handle status request
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'online' }));
    } else if (req.url.startsWith('/api/transaction/')) {
      // Handle transaction details request
      const transactionId = req.url.split('/')[3];
      const response = {
        transaction_id: transactionId,
        status: 'APPROVED',
        approval_code: '123456',
        amount: 100.00,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        transaction_type: 'SALE'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
    }
  } else {
    // Serve static files
    let filePath = '.' + req.url;
    if (filePath === './') {
      filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error: ' + error.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
});

const PORT = 9000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
