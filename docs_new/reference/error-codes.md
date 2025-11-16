# Error Codes Reference

Complete reference of all error codes and their meanings in the Social Communication Platform.

## Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "field_name",
      "message": "Specific error message"
    }
  ]
}
```

## HTTP Status Codes

| Status Code | Description           | Typical Use Cases                     |
|-------------|-----------------------|---------------------------------------|
| 200         | OK                    | Successful GET, PUT, PATCH requests   |
| 201         | Created               | Successful POST requests              |
| 400         | Bad Request           | Validation errors, malformed requests |
| 401         | Unauthorized          | Missing or invalid authentication     |
| 403         | Forbidden             | Insufficient permissions              |
| 404         | Not Found             | Resource not found                    |
| 409         | Conflict              | Resource already exists               |
| 422         | Unprocessable Entity  | Validation failed                     |
| 429         | Too Many Requests     | Rate limiting exceeded                |
| 500         | Internal Server Error | Server-side errors                    |
| 503         | Service Unavailable   | Service temporarily unavailable       |

## Authentication Errors

### UNAUTHORIZED (401)

**Description**: Missing, invalid, or expired authentication credentials

**Common Causes**:
- Missing Authorization header
- Invalid JWT token
- Expired access token
- Revoked refresh token

**Resolution**:
- Ensure Authorization header is present
- Refresh access token using refresh token
- Re-authenticate if refresh token is expired/revoked

### FORBIDDEN (403)

**Description**: Authenticated user lacks permission to access the resource

**Common Causes**:
- Insufficient user role (USER vs ADMIN)
- Attempting to modify another user's resource
- Accessing restricted endpoints

**Resolution**:
- Verify user has required permissions
- Check if user is authorized to perform the action
- Contact administrator for permission escalation

### VALIDATION_ERROR (422)

**Description**: Request data failed validation

**Common Causes**:
- Missing required fields
- Invalid field formats
- Field constraints violated
- Password complexity requirements not met

**Example Response**:
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### RATE_LIMIT_EXCEEDED (429)

**Description**: Too many requests from the same IP or user

**Common Causes**:
- Exceeded authentication attempts (5/15min)
- Exceeded messaging rate (30/min)
- Exceeded general API rate (100/15min)

**Resolution**:
- Wait for rate limit window to reset
- Check rate limit headers in response
- Implement client-side rate limiting

## User Management Errors

### USER_NOT_FOUND (404)

**Description**: Requested user does not exist

**Common Causes**:
- Invalid user ID in request
- User has been deleted
- User never existed

**Resolution**:
- Verify user ID is correct
- Check if user has been deleted
- Handle gracefully in UI

### USERNAME_EXISTS (409)

**Description**: Attempted to create user with existing username

**Common Causes**:
- Duplicate username during registration
- Username change to existing username

**Resolution**:
- Choose a different username
- Implement username availability check

### EMAIL_EXISTS (409)

**Description**: Attempted to create user with existing email

**Common Causes**:
- Duplicate email during registration
- Email change to existing email

**Resolution**:
- Use a different email address
- Implement email availability check

### INVALID_CREDENTIALS (401)

**Description**: Provided email/password combination is incorrect

**Common Causes**:
- Wrong password
- Email not found
- Account disabled

**Resolution**:
- Verify email and password
- Implement password reset flow
- Check account status

## Messaging Errors

### MESSAGE_NOT_FOUND (404)

**Description**: Requested message does not exist

**Common Causes**:
- Invalid message ID
- Message deleted
- Message never existed

**Resolution**:
- Verify message ID
- Handle deleted messages gracefully

### CANNOT_MODIFY_MESSAGE (403)

**Description**: User attempting to modify another user's message

**Common Causes**:
- Editing someone else's message
- Deleting someone else's message
- Insufficient permissions

**Resolution**:
- Only allow users to modify their own messages
- Implement proper permission checks

### MESSAGE_TOO_LONG (422)

**Description**: Message content exceeds maximum length

**Common Causes**:
- Content longer than 5000 characters

**Resolution**:
- Truncate message content
- Implement client-side length validation

## Group Management Errors

### GROUP_NOT_FOUND (404)

**Description**: Requested group does not exist

**Common Causes**:
- Invalid group ID
- Group deleted
- Group never existed

**Resolution**:
- Verify group ID
- Handle deleted groups gracefully

### NOT_GROUP_MEMBER (403)

**Description**: User is not a member of the requested group

**Common Causes**:
- Attempting to send message to group not joined
- Attempting to view group details without membership
- Removed from group

**Resolution**:
- Check group membership before operations
- Implement join group flow

### INSUFFICIENT_GROUP_PERMISSIONS (403)

**Description**: User lacks required permissions for group operation

**Common Causes**:
- Non-admin attempting to add members
- Non-owner attempting to delete group
- Non-member attempting group operations

**Resolution**:
- Verify user role in group
- Implement proper permission checks

### ALREADY_GROUP_MEMBER (409)

**Description**: User is already a member of the group

**Common Causes**:
- Attempting to join group already joined
- Duplicate membership requests

**Resolution**:
- Check membership status before joining
- Handle gracefully in UI

## Call Errors

### CALL_NOT_FOUND (404)

**Description**: Requested call does not exist

**Common Causes**:
- Invalid call ID
- Call ended/expired
- Call never existed

**Resolution**:
- Verify call ID
- Handle ended calls gracefully

### CALL_NOT_JOINABLE (400)

**Description**: Call is not in a state that allows joining

**Common Causes**:
- Call already ended
- Call was rejected
- Call was canceled

**Resolution**:
- Check call status before joining
- Implement proper call state handling

### CANNOT_END_CALL (403)

**Description**: User lacks permission to end the call

**Common Causes**:
- Non-initiator attempting to end call
- Participant trying to end group call

**Resolution**:
- Only allow call initiator to end call
- Implement proper call control permissions

## WebSocket Errors

### WEBSOCKET_UNAUTHORIZED (401)

**Description**: WebSocket connection authentication failed

**Common Causes**:
- Missing auth token
- Invalid auth token
- Expired auth token

**Resolution**:
- Provide valid auth token during connection
- Refresh token before connecting
- Handle reconnection with new token

### WEBSOCKET_FORBIDDEN (403)

**Description**: Authenticated user lacks permission for WebSocket operations

**Common Causes**:
- Attempting to join room without permission
- Sending messages to unauthorized rooms
- Insufficient user role

**Resolution**:
- Verify room membership
- Check user permissions
- Implement proper access controls

## Database Errors

### DATABASE_CONNECTION_FAILED (500)

**Description**: Unable to connect to database

**Common Causes**:
- Database server down
- Network issues
- Incorrect database credentials

**Resolution**:
- Check database server status
- Verify network connectivity
- Confirm database credentials

### DATABASE_QUERY_FAILED (500)

**Description**: Database query execution failed

**Common Causes**:
- Invalid query syntax
- Constraint violations
- Deadlock conditions

**Resolution**:
- Check query syntax
- Verify data constraints
- Implement retry logic for transient errors

## Redis Errors

### REDIS_CONNECTION_FAILED (500)

**Description**: Unable to connect to Redis server

**Common Causes**:
- Redis server down
- Network issues
- Incorrect Redis credentials

**Resolution**:
- Check Redis server status
- Verify network connectivity
- Confirm Redis configuration

### REDIS_OPERATION_FAILED (500)

**Description**: Redis operation failed

**Common Causes**:
- Memory limits exceeded
- Invalid key format
- Redis cluster issues

**Resolution**:
- Monitor Redis memory usage
- Validate key formats
- Check cluster health

## File Upload Errors

### FILE_TOO_LARGE (413)

**Description**: Uploaded file exceeds size limits

**Common Causes**:
- File larger than maximum allowed size
- Multiple files exceeding total limit

**Resolution**:
- Compress files before upload
- Implement client-side size validation
- Show clear size limits to users

### UNSUPPORTED_FILE_TYPE (415)

**Description**: Uploaded file type is not supported

**Common Causes**:
- Invalid file extension
- Unsupported MIME type
- Corrupted file

**Resolution**:
- Validate file types client-side
- Show supported file types to users
- Implement proper MIME type checking

### UPLOAD_FAILED (500)

**Description**: File upload process failed

**Common Causes**:
- Storage service unavailable
- Insufficient disk space
- Network interruption

**Resolution**:
- Check storage service status
- Monitor disk space
- Implement retry logic

## Third-party Service Errors

### JITSI_CONNECTION_FAILED (500)

**Description**: Unable to connect to Jitsi service

**Common Causes**:
- Jitsi server down
- Network issues
- Invalid configuration

**Resolution**:
- Check Jitsi service status
- Verify network connectivity
- Confirm Jitsi configuration

### JITSI_TOKEN_INVALID (401)

**Description**: Jitsi JWT token is invalid or expired

**Common Causes**:
- Expired token
- Invalid token signature
- Missing required claims

**Resolution**:
- Generate new Jitsi token
- Verify token signing process
- Check required claims

## Client Implementation Guide

### Error Handling Patterns

```javascript
// Generic error handler
async function handleAPIError(response) {
  if (!response.ok) {
    const error = await response.json();
    
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        window.location.href = '/login';
        break;
        
      case 'VALIDATION_ERROR':
        // Display validation errors
        displayValidationErrors(error.details);
        break;
        
      case 'RATE_LIMIT_EXCEEDED':
        // Show rate limit message
        showRateLimitMessage(response.headers);
        break;
        
      default:
        // Show generic error
        showErrorMessage(error.message);
    }
    
    throw new Error(error.message);
  }
  
  return response.json();
}

// Usage
fetch('/api/v1/users')
  .then(handleAPIError)
  .then(data => {
    // Handle success
  })
  .catch(error => {
    // Error already handled
  });
```

### Rate Limit Handling

```javascript
// Check rate limit headers
function checkRateLimit(response) {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (remaining === '0') {
    const resetTime = new Date(reset * 1000);
    const waitTime = resetTime - new Date();
    
    // Show user when they can try again
    showRateLimitMessage(waitTime);
  }
}
```

This error codes reference provides developers with comprehensive information about all possible error conditions in the Social Communication Platform and how to handle them properly.