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

## Step-by-Step Deployment Guide

### 1. Prepare Your Project

Ensure your project is ready for deployment:

-   Add the following scripts to your `package.json` (already done):
    ```json
    "scripts": {
      "build": "tsc",
      "start": "node dist/server.js"
    }
    ```
-   Commit and push your changes to GitHub.

### 2. Create a PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click "New" > "PostgreSQL".
3. Choose a name (e.g., `banking-ledger-db`).
4. Select a region (e.g., Oregon).
5. Click "Create Database".
6. Wait for the database to be provisioned.
7. Copy the "Internal Database URL" (it looks like `postgresql://user:password@host:port/dbname`).

### 3. Create a Web Service on Render

1. In the Render Dashboard, click "New" > "Web Service".
2. Connect your GitHub repository (select the `banking-ledger` repo).
3. Configure the service:
    - **Name:** e.g., `banking-ledger-api`
    - **Runtime:** Node
    - **Build Command:** `npm install && npx prisma generate && npm run build`
    - **Start Command:** `npm start`
4. In the "Environment" tab, add the following environment variables:
    - `DATABASE_URL`: Paste the Internal Database URL from step 2.
    - `JWT_SECRET`: Generate a random string (e.g., use `openssl rand -base64 32` or any secure random string).
    - `NODE_ENV`: `production`
    - `BANK_EMAIL`: (Optional, if used in your code; set to a bank account email if needed).
5. Click "Create Web Service".

### 4. Run Database Migrations

After the service is created, you need to apply Prisma migrations:

1. In the Render Dashboard, go to your web service.
2. Open the "Shell" tab.
3. Run: `npx prisma migrate deploy`
    - This applies migrations to the production database.

### 5. Deploy and Test

-   Render will automatically build and deploy your app.
-   Once deployed, copy the service URL (e.g., `https://banking-ledger-api.onrender.com`).
-   Update the "Live Demo" link in your README with this URL.
-   Test the API endpoints using tools like Postman or curl.

### Troubleshooting

-   **Build Failures:** Check the build logs in Render. Ensure all dependencies are in `package.json`.
-   **Database Connection:** Verify `DATABASE_URL` is correct and the database is accessible.
-   **Migrations:** If migrations fail, check your Prisma schema and ensure the database is empty or compatible.
-   **Environment Variables:** Double-check all required env vars are set.

Deploy! Render will handle scaling, SSL, and monitoring for you.

🧪 Testing
To run the automated test suite:

Bash

npm test
📄 License
MIT
