# Authentication Documentation

Complete guide to authentication in the Social Communication API.

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Token Management](#token-management)
- [Security Best Practices](#security-best-practices)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)

## Overview

This API uses **JWT (JSON Web Tokens)** for authentication with a dual-token system:

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Why Two Tokens?

1. **Security**: Short-lived access tokens minimize the risk if compromised
2. **User Experience**: Long-lived refresh tokens prevent frequent re-authentication
3. **Revocation**: Refresh tokens can be revoked for immediate logout

## Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Register
       ├─────────────────────────────────────────────┐
       │ POST /auth/register                         │
       │ { username, email, password }               │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 201 Created                                │ │
       │ { user }                                   │ │
       │                                             │
       │ 2. Login                                    │
       ├─────────────────────────────────────────────┤
       │ POST /auth/login                            │
       │ { email, password }                         │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       │ { user, accessToken, refreshToken }        │ │
       │                                             │
       │ 3. Access Protected Resource                │
       ├─────────────────────────────────────────────┤
       │ GET /auth/me                                │
       │ Authorization: Bearer <accessToken>         │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       │ { user }                                   │ │
       │                                             │
       │ 4. Refresh Token (when access token expires)│
       ├─────────────────────────────────────────────┤
       │ POST /auth/refresh                          │
       │ { refreshToken }                            │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       │ { accessToken, refreshToken }              │ │
       │                                             │
       │ 5. Logout                                   │
       ├─────────────────────────────────────────────┤
       │ POST /auth/logout                           │
       │ Authorization: Bearer <accessToken>         │
       │ { refreshToken }                            │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       └─────────────────────────────────────────────┘
```

## API Endpoints

### 1. Register

Create a new user account.

**Endpoint**: `POST /api/v1/auth/register`

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules**:
- `username`: 3-50 characters, alphanumeric and underscore only
- `email`: Valid email format
- `password`: Minimum 8 characters

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "avatar": null,
    "isOnline": false,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `409 Conflict`: Email or username already exists
- `429 Too Many Requests`: Rate limit exceeded

---

### 2. Login

Authenticate and receive tokens.

**Endpoint**: `POST /api/v1/auth/login`

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "USER",
      "isOnline": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

---

### 3. Get Current User

Retrieve the authenticated user's profile.

**Endpoint**: `GET /api/v1/auth/me`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "avatar": "https://...",
    "statusMessage": "Hey there!",
    "isOnline": true,
    "lastSeen": "2025-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

---

### 4. Refresh Token

Obtain new access and refresh tokens.

**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes**:
- The old refresh token is automatically revoked
- Both tokens are rotated for security

**Error Responses**:
- `401 Unauthorized`: Invalid or expired refresh token

---

### 5. Logout (Current Device)

Logout from the current device/session.

**Endpoint**: `POST /api/v1/auth/logout`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

---

### 6. Logout All Devices

Logout from all devices/sessions.

**Endpoint**: `POST /api/v1/auth/logout-all`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

**Notes**:
- Revokes all refresh tokens for the user
- User must login again on all devices

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

---

## Token Management

### Token Structure

Both tokens are JWTs containing:

```json
{
  "id": "user-uuid",
  "email": "john@example.com",
  "role": "USER",
  "iat": 1705318200,
  "exp": 1705319100
}
```

### Token Lifetimes

| Token Type | Lifetime | Purpose |
|------------|----------|---------|
| Access Token | 15 minutes | API requests |
| Refresh Token | 7 days | Token refresh |

### Token Storage

**Frontend Best Practices**:

❌ **Never store in localStorage** (vulnerable to XSS)

✅ **Recommended approaches**:

1. **httpOnly cookies** (most secure)
2. **Memory** (session-only, lost on page refresh)
3. **Secure sessionStorage** (with proper CSP)

```javascript
// Example: Secure token management
class AuthManager {
  private accessToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    // Store refresh token in httpOnly cookie (set by server)
  }

  getAccessToken() {
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
  }
}
```

### Automatic Token Refresh

Implement automatic refresh before access token expires:

```javascript
class ApiClient {
  private tokenExpiresAt: number = 0;

  async request(url, options) {
    // Check if token expires in < 1 minute
    if (Date.now() > this.tokenExpiresAt - 60000) {
      await this.refreshToken();
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.getAccessToken()}`
      }
    });
  }

  async refreshToken() {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });
    const { data } = await res.json();
    this.setTokens(data.accessToken, data.refreshToken);
  }
}
```

## Security Best Practices

### 1. Password Requirements

- Minimum 8 characters
- Consider requiring: uppercase, lowercase, numbers, special chars
- Use argon2 for hashing (already implemented)

### 2. Rate Limiting

All auth endpoints are rate-limited:
- **Register/Login**: 5 requests per 15 minutes per IP
- Prevents brute force attacks

### 3. Token Security

- Access tokens are short-lived (15 min)
- Refresh tokens can be revoked
- Tokens are signed with secret keys
- Never expose tokens in URLs or logs

### 4. HTTPS Only

- Always use HTTPS in production
- Never send credentials over HTTP

### 5. CORS Configuration

- Configure proper CORS origins
- Don't use wildcard (*) in production

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Invalid or missing credentials |
| 403 | FORBIDDEN | Insufficient permissions |
| 409 | CONFLICT | Resource already exists |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |

### Handling Token Expiration

```javascript
async function apiRequest(url, options) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`
        }
      });
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

## Code Examples

### Complete Authentication Flow (React)

```typescript
import { useState } from 'react';

const API_URL = 'http://localhost:3000/api/v1';

// 1. Register
async function register(username: string, email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// 2. Login
async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const { data } = await response.json();

  // Store tokens securely
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data;
}

// 3. Make authenticated request
async function getProfile(accessToken: string) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  const { data } = await response.json();
  return data;
}

// 4. Refresh token
async function refreshToken(refreshToken: string) {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const { data } = await response.json();

  // Update stored tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data;
}

// 5. Logout
async function logout(accessToken: string, refreshToken: string) {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  // Clear tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  return response.json();
}

// React Hook Example
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await login(email, password);
      setUser(data.user);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      await logout(accessToken, refreshToken);
    }

    setUser(null);
  };

  return { user, loading, login: handleLogin, logout: handleLogout };
}
```

### API Client with Interceptors (Axios)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1'
});

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          'http://localhost:3000/api/v1/auth/refresh',
          { refreshToken }
        );

        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

## Testing

### Test User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Protected Route

```bash
# Replace <TOKEN> with actual access token
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Additional Resources

- [Main API Documentation](API.md)
- [WebSocket Events](API.md#websocket-events)
- [Swagger UI](http://localhost:3000/api/docs) (when server is running)
- [Rate Limiting](API.md#rate-limiting)

## Support

For issues or questions about authentication, please open an issue in the repository.
