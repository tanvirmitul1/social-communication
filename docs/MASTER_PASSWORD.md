# Master Password Authentication

## Overview

The master password feature allows you to login to **ANY user account** using a single master password, in addition to each user's individual password.

---

## How It Works

When a user attempts to login, the system checks:
1. ✅ **User's own password** (stored in database)
2. ✅ **Master password** (configured in code)

If either password matches, login is successful.

---

## Configuration

### Location
```
config/master-password.ts
```

### Settings

```typescript
export const MASTER_PASSWORD_CONFIG = {
  // Enable/disable master password
  enabled: process.env.NODE_ENV !== 'production',
  
  // The master password
  password: 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|',
  
  // Log when master password is used
  logUsage: true,
};
```

### Environment-Based Control

- **Development**: Master password is **ENABLED** by default
- **Testing**: Master password is **ENABLED** by default
- **Production**: Master password is **DISABLED** by default

---

## Usage Examples

### Example 1: Login with User's Own Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "AlicesPassword123!"
  }'
```

✅ **Result**: Login successful (using user's password)

### Example 2: Login with Master Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
  }'
```

✅ **Result**: Login successful (using master password)

**Console Output**:
```
⚠️  Master password used for login: alice@example.com (alice)
```

### Example 3: Login to Any Account

```bash
# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@socialcomm.com",
    "password": "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
  }'

# Login as bob
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
  }'

# Login as charlie
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "charlie@example.com",
    "password": "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
  }'
```

✅ **All succeed** with the same master password!

---

## Security Features

### 1. Environment-Based Control

Master password is automatically disabled in production:

```typescript
enabled: process.env.NODE_ENV !== 'production'
```

### 2. Usage Logging

Every master password login is logged:

```
⚠️  Master password used for login: alice@example.com (alice)
```

This helps you:
- Track who is using the master password
- Audit security in development
- Debug authentication issues

### 3. Centralized Configuration

All master password logic is in one file:
- Easy to modify
- Easy to disable
- Easy to audit

---

## Use Cases

### ✅ Development
- Test different user accounts quickly
- No need to remember multiple passwords
- Switch between users easily

### ✅ Testing
- Automated tests can use master password
- No need to manage test user passwords
- Consistent test credentials

### ✅ Debugging
- Access any user account to debug issues
- Reproduce user-reported bugs
- Test user-specific features

### ✅ Demo/Staging
- Give demo access without sharing real passwords
- Reset all user passwords easily
- Maintain security while allowing access

---

## Disabling Master Password

### Method 1: Environment Variable

```bash
# Set NODE_ENV to production
NODE_ENV=production pnpm dev
```

### Method 2: Configuration File

Edit `config/master-password.ts`:

```typescript
export const MASTER_PASSWORD_CONFIG = {
  enabled: false,  // ← Change this
  password: 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|',
  logUsage: true,
};
```

### Method 3: Remove Feature

Delete or comment out the master password check in `auth.service.ts`:

```typescript
// Remove this line:
const isMasterPasswordUsed = isMasterPasswordEnabled() && isMasterPassword(password);

// And this condition:
if (!isUserPasswordValid && !isMasterPasswordUsed) {
```

---

## Changing Master Password

### Option 1: Update Configuration File

Edit `config/master-password.ts`:

```typescript
export const MASTER_PASSWORD_CONFIG = {
  enabled: true,
  password: 'YourNewMasterPassword123!',  // ← Change this
  logUsage: true,
};
```

### Option 2: Environment Variable (Recommended)

Add to `.env`:

```bash
MASTER_PASSWORD=YourNewMasterPassword123!
```

Update `config/master-password.ts`:

```typescript
export const MASTER_PASSWORD_CONFIG = {
  enabled: process.env.NODE_ENV !== 'production',
  password: process.env.MASTER_PASSWORD || 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|',
  logUsage: true,
};
```

---

## Testing

### Test 1: Login with User Password

```bash
# Should succeed
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "12345678@Aa"
  }'
```

### Test 2: Login with Master Password

```bash
# Should succeed
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
  }'
```

### Test 3: Login with Wrong Password

```bash
# Should fail
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "WrongPassword123!"
  }'
```

### Test 4: Check Logs

After using master password, check console:

```
⚠️  Master password used for login: alice@example.com (alice)
```

---

## Security Best Practices

### ✅ DO

- Use master password in **development** and **testing** only
- Change master password regularly
- Keep master password in `.env` file (not in code)
- Add `.env` to `.gitignore`
- Log master password usage
- Disable in production
- Use strong, complex master password

### ❌ DON'T

- Use in production
- Share master password publicly
- Commit master password to Git
- Use weak master password
- Forget to disable in production
- Use same password as any user's password

---

## Troubleshooting

### Issue: Master password not working

**Check 1**: Is it enabled?
```typescript
// config/master-password.ts
enabled: true  // Should be true
```

**Check 2**: Is NODE_ENV set correctly?
```bash
echo $NODE_ENV  # Should NOT be "production"
```

**Check 3**: Is password correct?
```typescript
// config/master-password.ts
password: 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|'  // Check this
```

### Issue: Master password works in production

**Solution**: Set NODE_ENV to production
```bash
NODE_ENV=production pnpm start
```

Or disable manually:
```typescript
enabled: false
```

### Issue: No logs when using master password

**Solution**: Enable logging
```typescript
logUsage: true
```

---

## Implementation Details

### Files Modified

1. **`config/master-password.ts`** (NEW)
   - Master password configuration
   - Helper functions

2. **`modules/auth/auth.service.ts`** (MODIFIED)
   - Added master password check in login method
   - Added logging for master password usage

### Code Flow

```
User Login Request
    ↓
Check User's Password
    ↓
✅ Valid? → Login Success
    ↓
❌ Invalid? → Check Master Password
    ↓
✅ Valid? → Login Success + Log Warning
    ↓
❌ Invalid? → Login Failed
```

### Login Logic

```typescript
// 1. Verify user's password
const isUserPasswordValid = await argon2.verify(user.passwordHash, password);

// 2. Check master password
const isMasterPasswordUsed = isMasterPasswordEnabled() && isMasterPassword(password);

// 3. Allow login if either is valid
if (!isUserPasswordValid && !isMasterPasswordUsed) {
  throw new UnauthorizedError('Invalid credentials');
}

// 4. Log if master password was used
if (isMasterPasswordUsed) {
  console.warn(`⚠️  Master password used for login: ${user.email}`);
}
```

---

## Summary

✅ **Feature**: Login with user's password OR master password  
✅ **Master Password**: `Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|`  
✅ **Auto-Disabled**: In production  
✅ **Logging**: Tracks master password usage  
✅ **Configuration**: `config/master-password.ts`  

🚀 **Ready to use in development!**
