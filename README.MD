Banking Ledger API
A robust, double-entry banking system API built with Node.js, TypeScript, and Prisma. This system handles multi-currency transfers, real-time exchange rates, and ensures financial integrity using ACID transactions.

🚀 Live Demo: [Add your Render URL here]

✨ Features
Double-Entry Ledger: Every transaction records balanced debit and credit entries.

🛡️ Idempotency: Prevents accidental double-charges using unique keys (Strict Mode).

💱 Multi-Currency: Auto-converts funds (e.g., USD → EUR) using live market rates.

🛑 Daily Limits: Enforces a 24-hour rolling withdrawal limit for security.

🔒 Secure Auth: JWT-based stateless authentication.

📜 Audit History: Full paginated transaction history for users.

🛠️ Tech Stack
Runtime: Node.js

Language: TypeScript

Database: PostgreSQL

ORM: Prisma

Deployment: Render.com

🚀 Getting Started

1. Clone the repository
   Bash

git clone https://github.com/yourusername/banking-ledger.git
cd banking-ledger 2. Install dependencies
Bash

npm install 3. Configure Environment
Create a .env file in the root directory:

Code snippet

# Database Connection (PostgreSQL)

DATABASE_URL="postgresql://user:password@localhost:5432/banking_db"

# JWT Secret for signing tokens

JWT_SECRET="super_secret_secure_key"

# Port

PORT=3000 4. Database Migration
Bash

# Create tables

npx prisma migrate dev --name init 5. Run Locally
Bash

# Development mode

npm run dev
📚 API Documentation
🔐 Authentication
Register User
Creates a new user and a wallet in their chosen currency.

POST /api/auth/register

Body:

JSON

{
"email": "jane@example.com",
"password": "securePass123",
"name": "Jane Doe",
"currency": "USD"
}
Login
Returns a JWT token. Copy this token for subsequent requests.

POST /api/auth/login

Body:

JSON

{ "email": "jane@example.com", "password": "securePass123" }
💸 Banking Operations
Header Required: Authorization: Bearer <your_jwt_token>

1. Get Balance
   View account details and current balance.

GET /api/account

2. Transfer Funds (Idempotent)
   Send money to another user.

POST /api/transfer

Headers:

Authorization: Bearer <token>

Idempotency-Key: <unique-uuid> (Required)

Body:

JSON

{
"toAccountNumber": "1234567890",
"amount": 100,
"description": "Consulting Fee"
}
Note: The Idempotency-Key header ensures that if you retry a request due to network failure, the transaction is not processed twice. You must generate a unique UUID for every new transfer.

3. Transaction History
   See past transactions (sent and received).

GET /api/transactions?page=1&limit=10

🌍 Deployment on Render
This project is configured for easy deployment on Render.com.

Create a PostgreSQL Database on Render

Copy the Internal Database URL provided by Render.

Create a Web Service on Render

Connect your GitHub repository.

Runtime: Node

Build Command: npm install && npx prisma generate && npm run build

Start Command: npm start (or node dist/index.js)

Environment Variables (in Render Settings) Add the following variables in the "Environment" tab:

DATABASE_URL: (Paste your Render DB URL here)

JWT_SECRET: (Any random long string)

NODE_ENV: production

Deploy! Render will build your app, apply migrations (if configured in build script), and start the server.

🧪 Testing
To run the automated test suite:

Bash

npm test
📄 License
MIT
