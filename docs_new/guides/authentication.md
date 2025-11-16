# Authentication Guide

Complete guide to implementing authentication in the Social Communication Platform.

## Authentication Flow

The platform uses a dual-token JWT system for secure authentication:

1. **Access Token**: Short-lived (15 minutes) for API requests
2. **Refresh Token**: Long-lived (7 days) for obtaining new access tokens

### Why Dual Tokens?

- **Security**: Short-lived access tokens minimize risk if compromised
- **User Experience**: Long-lived refresh tokens prevent frequent re-authentication
- **Revocation**: Refresh tokens can be revoked for immediate logout

## Implementation Guide

### 1. User Registration

```javascript
async function registerUser(username, email, password) {
  try {
    const response = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Registration successful
      return { success: true, user: data.data };
    } else {
      // Handle error
      return { success: false, error: data.message };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

### 2. User Login

```javascript
async function loginUser(email, password) {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Store tokens securely
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      return { success: true, user: data.data.user };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

### 3. Token Management

```javascript
class TokenManager {
  static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  static clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  static async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return { success: true, tokens: data.data };
      } else {
        this.clearTokens();
        return { success: false, error: data.message };
      }
    } catch (error) {
      this.clearTokens();
      return { success: false, error: 'Network error' };
    }
  }
}
```

### 4. Authenticated Requests

```javascript
class AuthenticatedAPI {
  static async request(endpoint, options = {}) {
    let accessToken = TokenManager.getAccessToken();
    
    const makeRequest = async (token) => {
      return fetch(`/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    };

    // Make initial request
    let response = await makeRequest(accessToken);
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
      const refreshResult = await TokenManager.refreshToken();
      
      if (refreshResult.success) {
        // Retry request with new token
        accessToken = TokenManager.getAccessToken();
        response = await makeRequest(accessToken);
      } else {
        // Redirect to login
        window.location.href = '/login';
        return;
      }
    }

    return response.json();
  }

  static async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
```

### 5. Logout Implementation

```javascript
async function logout() {
  try {
    const refreshToken = TokenManager.getRefreshToken();
    
    // Call logout endpoint
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TokenManager.getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken
      }),
    });

    // Clear local tokens
    TokenManager.clearTokens();
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    // Still clear tokens even if request fails
    TokenManager.clearTokens();
    window.location.href = '/login';
  }
}

async function logoutAllDevices() {
  try {
    // Call logout-all endpoint
    await fetch('/api/v1/auth/logout-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TokenManager.getAccessToken()}`,
      },
    });

    // Clear local tokens
    TokenManager.clearTokens();
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    // Still clear tokens even if request fails
    TokenManager.clearTokens();
    window.location.href = '/login';
  }
}
```

## WebSocket Authentication

```javascript
import io from 'socket.io-client';

class WebSocketManager {
  constructor() {
    this.socket = null;
  }

  connect() {
    const accessToken = TokenManager.getAccessToken();
    
    this.socket = io('http://localhost:3000', {
      auth: {
        token: accessToken,
      },
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        // Token may be expired, try to refresh
        TokenManager.refreshToken().then(result => {
          if (result.success) {
            // Reconnect with new token
            this.socket.disconnect();
            this.connect();
          } else {
            // Redirect to login
            window.location.href = '/login';
          }
        });
      }
    });
  }
}
```

## Security Best Practices

### 1. Token Storage

❌ **Never store in localStorage** (vulnerable to XSS)

✅ **Recommended approaches**:

```javascript
// Memory storage (session-only)
class TokenStorage {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  getAccessToken() {
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

// Or use httpOnly cookies (set by server)
```

### 2. Token Expiration Handling

```javascript
class TokenExpiryHandler {
  constructor() {
    this.checkInterval = null;
  }

  startExpiryCheck() {
    this.checkInterval = setInterval(() => {
      const accessToken = TokenManager.getAccessToken();
      
      if (accessToken) {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const now = Date.now();
        
        // If token expires in less than 1 minute, refresh it
        if (expiryTime - now < 60000) {
          TokenManager.refreshToken();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  stopExpiryCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
```

### 3. Session Management

```javascript
class SessionManager {
  constructor() {
    this.inactivityTimeout = null;
    this.inactivityLimit = 30 * 60 * 1000; // 30 minutes
  }

  startInactivityTimer() {
    this.resetInactivityTimer();
    
    // Reset timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetInactivityTimer(), true);
    });
  }

  resetInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    this.inactivityTimeout = setTimeout(() => {
      // Prompt user or auto-logout
      if (confirm('Session timeout due to inactivity. Continue session?')) {
        // Refresh token to extend session
        TokenManager.refreshToken();
        this.resetInactivityTimer();
      } else {
        logout();
      }
    }, this.inactivityLimit);
  }
}
```

## Error Handling

### Common Authentication Errors

```javascript
class AuthErrorHandler {
  static handle(error) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Token invalid or expired
        TokenManager.clearTokens();
        window.location.href = '/login';
        break;
        
      case 'FORBIDDEN':
        // Insufficient permissions
        alert('You do not have permission to perform this action');
        break;
        
      case 'VALIDATION_ERROR':
        // Input validation failed
        console.error('Validation errors:', error.details);
        break;
        
      case 'RATE_LIMIT_EXCEEDED':
        // Too many requests
        alert('Too many attempts. Please try again later.');
        break;
        
      default:
        // Generic error
        console.error('Authentication error:', error.message);
        break;
    }
  }
}
```

## Testing Authentication

### Unit Tests

```javascript
// Example with Jest
describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should register user successfully', async () => {
    const result = await registerUser('testuser', 'test@example.com', 'Password123');
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('testuser');
  });

  test('should login user and store tokens', async () => {
    const result = await loginUser('test@example.com', 'Password123');
    expect(result.success).toBe(true);
    expect(TokenManager.getAccessToken()).toBeTruthy();
    expect(TokenManager.getRefreshToken()).toBeTruthy();
  });

  test('should refresh expired token', async () => {
    TokenManager.setTokens('expired-token', 'refresh-token');
    
    const result = await TokenManager.refreshToken();
    expect(result.success).toBe(true);
    expect(TokenManager.getAccessToken()).not.toBe('expired-token');
  });
});
```

This authentication guide provides a comprehensive implementation strategy for integrating the Social Communication Platform's authentication system into your frontend application.