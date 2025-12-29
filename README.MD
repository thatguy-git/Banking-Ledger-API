Banking Ledger API
A robust, double-entry banking system API built with Node.js, TypeScript, and Prisma. This system handles multi-currency transfers, real-time exchange rates, and ensures financial integrity using ACID transactions.

Live Demo: [Add your Render URL here]

FEATURES
Double-Entry Ledger: Every transaction records balanced debit and credit entries.

Idempotency: Prevents accidental double-charges using unique keys (Strict Mode).

Multi-Currency: Auto-converts funds (e.g., USD → EUR) using live market rates.

Transaction Limits: Enforces a maximum amount limit per single transaction to prevent large unauthorized withdrawals.

Secure Auth: JWT-based stateless authentication.

Audit History: Full paginated transaction history for users.

TECH STACK
Runtime: Node.js

Language: TypeScript

Database: PostgreSQL

ORM: Prisma

Deployment: Render.com

Getting Started

1. Clone the repository
   Bash

git clone https://github.com/yourusername/banking-ledger.git
cd banking-ledger 2. Install dependencies
Bash

    npm install

3. Configure Environment
   Create a .env file in the root directory with template from the .env.example file:

4. Database Migration
   Bash

# Create tables

npx prisma migrate dev --name init

5. Run Locally
   Bash

# Development mode

npm run dev

📚 API Documentation

The Banking Ledger API provides endpoints for user authentication, account management, and fund transfers. All requests should be made to the base URL of your deployed instance (e.g., `https://your-app.onrender.com`).

## Authentication

Most endpoints require authentication via JWT token. Include the token in the `Authorization` header as `Bearer <token>`.

### Register User

Creates a new user account with an associated wallet in the specified currency.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
    "name": "string",
    "email": "string",
    "currency": "string (e.g., USD, EUR)",
    "password": "string",
    "pin": "string (4-digit PIN)",
    "question": "string (security question)",
    "answer": "string (answer to security question)"
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "data": {
        "id": "string",
        "email": "string",
        "name": "string"
    }
}
```

**Error Responses:**

-   409 Conflict: Email already in use
-   400 Bad Request: Invalid input

### Login

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
    "email": "string",
    "password": "string"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "token": "string (JWT token)",
        "user": {
            "name": "string",
            "email": "string",
            "accountNumber": "string",
            "balance": "string",
            "currency": "string"
        }
    }
}
```

**Error Responses:**

-   401 Unauthorized: Invalid credentials
-   400 Bad Request: Missing email or password

## Account Operations

All account endpoints require authentication.

### Get Account Details

Retrieves the authenticated user's account information.

**Endpoint:** `GET /api/accounts`

**Headers:**

-   `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
    "id": "string",
    "name": "string",
    "email": "string",
    "currency": "string",
    "balance": "string (bigint as string)",
    "allowOverdraft": "boolean"
}
```

**Error Responses:**

-   404 Not Found: Account not found
-   500 Internal Server Error

### Get Account Balance

Retrieves the current balance of the authenticated user.

**Endpoint:** `GET /api/accounts/balance`

**Headers:**

-   `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "balance": "string",
        "currency": "string"
    }
}
```

**Error Responses:**

-   404 Not Found: Account not found

### Get Transaction History

Retrieves the paginated transaction history for the authenticated user.

**Endpoint:** `GET /api/accounts/history?page=1&limit=20`

**Headers:**

-   `Authorization: Bearer <token>`

**Query Parameters:**

-   `page` (optional, default: 1): Page number
-   `limit` (optional, default: 20): Number of transactions per page

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "string",
      "type": "DEBIT" | "CREDIT",
      "amount": "number",
      "currency": "string",
      "counterparty": "string (name of other party)",
      "description": "string",
      "date": "string (ISO date)",
      "status": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

**Error Responses:**

-   500 Internal Server Error

## Transfer Operations

All transfer endpoints require authentication.

### Transfer Funds

Transfers funds from the authenticated user's account to another account. Supports multi-currency with automatic conversion.

**Endpoint:** `POST /api/transfer`

**Headers:**

-   `Authorization: Bearer <token>`
-   `Idempotency-Key: <unique-uuid>` (required for preventing duplicate transactions)

**Request Body:**

```json
{
    "toAccountNumber": "string",
    "amount": "number (will be converted to bigint)",
    "description": "string (optional)",
    "reference": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "reference": "string",
    "currency": "string",
    "exchangeRate": "number",
    "targetCurrency": "string",
    "description": "string",
    "status": "POSTED",
    "fromAccountId": "string",
    "toAccountId": "string",
    "createdAt": "string",
    "entries": [...]
  }
}
```

**Error Responses:**

-   400 Bad Request: Missing fields, invalid amount, insufficient funds, etc.
-   404 Not Found: Recipient not found

### Deposit Funds

Deposits funds into the authenticated user's account from the central treasury.

**Endpoint:** `POST /api/transfer/deposit`

**Headers:**

-   `Authorization: Bearer <token>`

**Request Body:**

```json
{
    "amount": "number (will be converted to bigint)"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "reference": "string",
    "currency": "string",
    "exchangeRate": "number",
    "targetCurrency": "string",
    "description": "string",
    "status": "POSTED",
    "fromAccountId": "string",
    "toAccountId": "string",
    "createdAt": "string",
    "entries": [...]
  }
}
```

**Error Responses:**

-   400 Bad Request: Invalid amount, transfer limit exceeded
-   404 Not Found: Account not found
-   500 Internal Server Error

DEPLOYMENT
This project is configured for easy deployment on Render.com.

Create a PostgreSQL Database on Render

Copy the Internal Database URL provided by Render.

Create a Web Service on Render

Connect your GitHub repository.

Runtime: Node

Build Command: npm install && npx prisma generate && npm run build

Start Command: npm start (or node dist/index.js)

Environment Variables (in Render Settings) Add the following variables in the "Environment" tab:

DATABASE_URL:

JWT_SECRET: (Any random long string)

NODE_ENV: production

Deploy! Render will build your app, apply migrations (if configured in build script), and start the server.

🧪 Testing
To run the automated test suite:

Bash

npm test
📄 License
MIT
