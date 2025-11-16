# Rate Limiting

Comprehensive guide to rate limiting policies and implementation in the Social Communication Platform.

## Overview

Rate limiting is implemented to prevent abuse, ensure fair usage, and maintain service stability. The platform uses a token bucket algorithm with sliding window counters to track requests.

## Rate Limit Policies

### Authentication Endpoints

**Endpoints**: `/auth/register`, `/auth/login`, `/auth/refresh`

- **Limit**: 5 requests per 15 minutes per IP address
- **Purpose**: Prevent brute force attacks and credential stuffing
- **Scope**: Per IP address

### Messaging Endpoints

**Endpoints**: `POST /messages`

- **Limit**: 30 requests per minute per authenticated user
- **Purpose**: Prevent spam and message flooding
- **Scope**: Per authenticated user

### General API Endpoints

**Endpoints**: All other API endpoints

- **Limit**: 100 requests per 15 minutes per IP address
- **Purpose**: Prevent general API abuse
- **Scope**: Per IP address

### WebSocket Connections

**Events**: Connection attempts, message sending

- **Limit**: 50 connections per minute per IP address
- **Limit**: 1000 messages per minute per user
- **Purpose**: Prevent connection flooding and message spam
- **Scope**: Per IP address and per authenticated user

## Rate Limit Headers

All HTTP responses include rate limit information in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
X-RateLimit-Policy: general
```

### Header Descriptions

- **X-RateLimit-Limit**: Maximum number of requests allowed in the current window
- **X-RateLimit-Remaining**: Number of requests remaining in the current window
- **X-RateLimit-Reset**: Unix timestamp when the rate limit window resets
- **X-RateLimit-Policy**: Name of the rate limit policy applied

## Rate Limit Response

When a rate limit is exceeded, the API returns a 429 (Too Many Requests) status code:

```json
{
  "success": false,
  "message": "Too many requests, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## Implementation Details

### Token Bucket Algorithm

The platform uses a token bucket algorithm for rate limiting:

1. Each endpoint has a token bucket with a maximum capacity
2. Tokens are added to the bucket at a fixed rate
3. Each request consumes one token
4. If no tokens are available, the request is rejected

### Sliding Window Counters

For more precise rate limiting, sliding window counters are used:

1. Time is divided into fixed windows (e.g., 1 minute)
2. Request counts are tracked per window
3. The current rate is calculated using a sliding window of previous time periods
4. This provides smoother rate limiting than fixed windows

### Storage

Rate limit data is stored in Redis for fast access and distributed coordination:

```redis
# Key structure: rate_limit:{policy}:{identifier}:{window}
rate_limit:auth:192.168.1.1:1640000000
rate_limit:messaging:user123:1640000000
```

## Client-Side Rate Limiting

### Checking Rate Limit Status

```javascript
class RateLimitChecker {
  static checkHeaders(response) {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    return {
      limit: parseInt(limit),
      remaining: parseInt(remaining),
      reset: new Date(parseInt(reset) * 1000)
    };
  }
  
  static getTimeUntilReset(resetTime) {
    const now = new Date();
    return Math.max(0, resetTime - now);
  }
}
```

### Implementing Client-Side Backoff

```javascript
class RateLimitHandler {
  static async makeRequest(url, options) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const rateLimitInfo = RateLimitChecker.checkHeaders(response);
        const waitTime = RateLimitChecker.getTimeUntilReset(rateLimitInfo.reset);
        
        // Wait until rate limit resets
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Retry the request
        return this.makeRequest(url, options);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}
```

### Proactive Rate Limiting

```javascript
class ProactiveRateLimiter {
  constructor() {
    this.requestCounts = new Map();
    this.lastReset = new Map();
  }
  
  shouldLimit(policy, limit, windowMs) {
    const now = Date.now();
    const key = `${policy}-${this.getIdentifier()}`;
    
    // Reset counter if window has passed
    if (!this.lastReset.has(key) || now - this.lastReset.get(key) > windowMs) {
      this.requestCounts.set(key, 0);
      this.lastReset.set(key, now);
    }
    
    const currentCount = this.requestCounts.get(key) || 0;
    
    if (currentCount >= limit) {
      return true;
    }
    
    // Increment counter
    this.requestCounts.set(key, currentCount + 1);
    return false;
  }
  
  getIdentifier() {
    // Use IP address or user ID based on policy
    return localStorage.getItem('userId') || this.getIPAddress();
  }
  
  getIPAddress() {
    // Implementation depends on how IP is determined
    return '127.0.0.1'; // Placeholder
  }
}
```

## WebSocket Rate Limiting

### Connection Rate Limiting

```javascript
// Server-side implementation
const connectionRateLimiter = {
  limits: new Map(),
  
  checkConnectionLimit(ip) {
    const now = Date.now();
    const window = Math.floor(now / (15 * 60 * 1000)); // 15-minute windows
    const key = `${ip}:${window}`;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, 0);
    }
    
    const count = this.limits.get(key);
    
    if (count >= 50) { // 50 connections per 15 minutes
      return false; // Reject connection
    }
    
    this.limits.set(key, count + 1);
    return true; // Allow connection
  }
};
```

### Message Rate Limiting

```javascript
// Server-side implementation
const messageRateLimiter = {
  limits: new Map(),
  
  checkMessageLimit(userId) {
    const now = Date.now();
    const window = Math.floor(now / (60 * 1000)); // 1-minute windows
    const key = `${userId}:${window}`;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, 0);
    }
    
    const count = this.limits.get(key);
    
    if (count >= 1000) { // 1000 messages per minute
      return false; // Reject message
    }
    
    this.limits.set(key, count + 1);
    return true; // Allow message
  }
};
```

## Configuration

### Environment Variables

```env
# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100          # Maximum requests per window
RATE_LIMIT_AUTH_MAX_REQUESTS=5       # Auth endpoint limit
RATE_LIMIT_MESSAGE_MAX_REQUESTS=30   # Messaging endpoint limit
RATE_LIMIT_WEBSOCKET_CONNECTIONS=50  # WebSocket connection limit
RATE_LIMIT_WEBSOCKET_MESSAGES=1000   # WebSocket message limit
```

### Custom Rate Limit Policies

```javascript
// Define custom rate limit policies
const rateLimitPolicies = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later.'
  },
  
  messaging: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many messages, please try again later.'
  },
  
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later.'
  }
};
```

## Monitoring and Metrics

### Rate Limit Metrics

The platform tracks rate limit metrics for monitoring:

```javascript
// Metrics collection
const rateLimitMetrics = {
  totalRequests: 0,
  rateLimitedRequests: 0,
  blockedIPs: new Set(),
  activeRateLimits: new Map()
};
```

### Dashboard Integration

```javascript
// Example metrics endpoint
app.get('/api/v1/metrics/rate-limit', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRequests: rateLimitMetrics.totalRequests,
      rateLimitedRequests: rateLimitMetrics.rateLimitedRequests,
      rateLimitedPercentage: (
        rateLimitMetrics.rateLimitedRequests / 
        Math.max(1, rateLimitMetrics.totalRequests) * 100
      ).toFixed(2),
      blockedIPs: Array.from(rateLimitMetrics.blockedIPs).length,
      activeRateLimits: Array.from(rateLimitMetrics.activeRateLimits.entries())
    }
  });
});
```

## Best Practices

### 1. Client-Side Implementation

```javascript
// Implement exponential backoff
class ExponentialBackoff {
  constructor() {
    this.attempts = 0;
    this.maxAttempts = 5;
  }
  
  async execute(operation) {
    try {
      return await operation();
    } catch (error) {
      if (error.status === 429 && this.attempts < this.maxAttempts) {
        this.attempts++;
        const delay = Math.pow(2, this.attempts) * 1000; // Exponential delay
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.execute(operation);
      }
      throw error;
    }
  }
}
```

### 2. User Experience Considerations

```javascript
// Show user-friendly rate limit messages
class UserRateLimitHandler {
  static showRateLimitMessage(resetTime) {
    const minutes = Math.ceil((resetTime - Date.now()) / 60000);
    
    // Show notification to user
    showNotification(
      `Rate limit exceeded. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      'warning'
    );
    
    // Disable relevant UI elements
    this.disableRateLimitedElements();
    
    // Re-enable after reset time
    setTimeout(() => {
      this.enableRateLimitedElements();
    }, resetTime - Date.now());
  }
  
  static disableRateLimitedElements() {
    // Disable send message button, etc.
    document.getElementById('send-button').disabled = true;
  }
  
  static enableRateLimitedElements() {
    // Re-enable UI elements
    document.getElementById('send-button').disabled = false;
  }
}
```

### 3. Logging and Alerting

```javascript
// Log rate limit events
const rateLimitLogger = {
  logRateLimitExceeded(req, policy, limitInfo) {
    console.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.userId,
      policy: policy,
      endpoint: req.path,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Send to monitoring system
    monitoring.sendEvent('rate_limit_exceeded', {
      ip: req.ip,
      policy: policy,
      endpoint: req.path
    });
  }
};
```

This rate limiting documentation provides developers with comprehensive information about the platform's rate limiting policies, implementation details, and best practices for handling rate limits in client applications.