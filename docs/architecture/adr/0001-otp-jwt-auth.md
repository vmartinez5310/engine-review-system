# ADR 0001: OTP and JWT Authentication

## Status
Accepted

## Context
Requirement **RNF-01** specifies that the Dashboard requires login via an OTP (One-Time Password) code and JWT (JSON Web Tokens) to maintain persistent sessions without traditional passwords. 

## Decision
1. **Authentication Flow**: Users will enter their registered email. The backend will generate a 6-digit OTP, store its hash in Redis (or DB with a 5-minute TTL), and send it via email.
2. **Session Management**: Upon verifying the OTP, the API will issue:
   - A short-lived **JWT Access Token** (e.g., 15 minutes) passed to the frontend in memory.
   - A long-lived **Refresh Token** (e.g., 7 days) stored in a secure, `HttpOnly` cookie.
3. **Security**: This mitigates password credential stuffing attacks and fulfills the strict "Premium Bank" security model requested.
