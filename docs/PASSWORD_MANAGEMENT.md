# Password Management Scripts

## Overview

Two scripts are available for managing user passwords in the database:

1. **`update-passwords.ts`** - Simple script to update all users at once
2. **`update-password-flexible.ts`** - Flexible script with granular control

---

## Quick Start

### Update All Users (Recommended for Development)

```bash
# Update all users with default passwords
pnpm password:update
```

This will:
- Set **admin users** password to: `Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|`
- Set **regular users** password to: `12345678@Aa`

---

## Script 1: Simple Update (update-passwords.ts)

### Usage

```bash
pnpm password:update
```

### What It Does

- Updates **ALL users** in the database
- Admin users get the master password
- Regular users get the standard password
- Shows summary of updated accounts

### Output Example

```
🔐 Starting password update...

📊 Found 6 users to update

✅ Updated ADMIN: admin (admin@socialcomm.com) → Master password
✅ Updated USER: alice (alice@example.com) → Regular password
✅ Updated USER: bob (bob@example.com) → Regular password
✅ Updated USER: charlie (charlie@example.com) → Regular password
✅ Updated USER: diana (diana@example.com) → Regular password
✅ Updated USER: eric (eric@example.com) → Regular password

✅ Password update completed successfully!

📊 Summary:
   - Admin users updated: 1 (password: Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|)
   - Regular users updated: 5 (password: 12345678@Aa)
   - Total users updated: 6

🔑 Login credentials:
   Admin accounts:
     - admin@socialcomm.com / Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|

   Regular accounts:
     - alice@example.com / 12345678@Aa
     - bob@example.com / 12345678@Aa
     - charlie@example.com / 12345678@Aa
     ... and 2 more
```

---

## Script 2: Flexible Update (update-password-flexible.ts)

### Usage Examples

#### 1. Update All Users
```bash
pnpm password:update:flexible -- --all
```

#### 2. Update Specific User by Email
```bash
pnpm password:update:flexible -- --email admin@socialcomm.com --password "NewPassword123!"
```

#### 3. Update Specific User by Username
```bash
pnpm password:update:flexible -- --username alice --password "AliceNewPass123!"
```

#### 4. Update All Admin Users
```bash
pnpm password:update:flexible -- --role admin --password "AdminPass123!"
```

#### 5. Update All Regular Users
```bash
pnpm password:update:flexible -- --role user --password "UserPass123!"
```

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--all` | Update all users | `--all` |
| `--email` | Target user by email | `--email admin@socialcomm.com` |
| `--username` | Target user by username | `--username alice` |
| `--role` | Target users by role (admin/user) | `--role admin` |
| `--password` | Custom password to set | `--password "MyPass123!"` |

### Output Example

```bash
$ pnpm password:update:flexible -- --username alice --password "NewAlicePass123!"

🔐 Password Update Script

📊 Updating user with username: alice

Found 1 user(s) to update

✅ Updated: alice (alice@example.com) [USER]
   Password: NewAlicePass123!

✅ Password update completed successfully!

📊 Summary: 1 user(s) updated
```

---

## Default Passwords

### Master Password (Admins)
```
Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|
```

### Regular Password (Users)
```
12345678@Aa
```

---

## Security Best Practices

### ⚠️ Development Environment

✅ **Safe to use:**
- Use these scripts in **development** and **testing** environments
- Helps with quick testing and debugging
- All developers can use the same credentials

### 🚨 Production Environment

❌ **DO NOT use in production:**
- Never set the same password for all users
- Never use predictable passwords
- Never commit passwords to Git

✅ **Production recommendations:**
1. Users should set their own passwords during registration
2. Implement password reset via email
3. Enforce strong password policies
4. Use 2FA for admin accounts
5. Rotate admin passwords regularly

---

## Common Use Cases

### 1. Fresh Database Setup
```bash
# Reset database and seed with test data
pnpm prisma:reset

# Update all passwords to known values
pnpm password:update
```

### 2. Reset Admin Password (Forgot Password)
```bash
# Reset admin password to master password
pnpm password:update:flexible -- --email admin@socialcomm.com --password "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
```

### 3. Create Test Accounts
```bash
# Set all test users to same password for easy testing
pnpm password:update:flexible -- --role user --password "Test@123"
```

### 4. Update Single User
```bash
# Update specific user's password
pnpm password:update:flexible -- --username alice --password "AliceNewPass123!"
```

---

## Troubleshooting

### Error: "Cannot find module 'argon2'"
```bash
# Install dependencies
pnpm install
```

### Error: "Database connection failed"
```bash
# Make sure database is running
pnpm docker:dev:up

# Check connection
pnpm prisma:studio
```

### Error: "User not found"
```bash
# Check if user exists
pnpm prisma:studio

# Or seed database first
pnpm prisma:seed
```

---

## Script Locations

```
scripts/
├── update-passwords.ts          # Simple update script
└── update-password-flexible.ts  # Flexible update script
```

---

## How It Works

### 1. Password Hashing
```typescript
import argon2 from 'argon2';

// Hash password using Argon2
const hashedPassword = await argon2.hash('12345678@Aa');

// Update user in database
await prisma.user.update({
  where: { id: userId },
  data: { passwordHash: hashedPassword },
});
```

### 2. Role Detection
```typescript
const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
const password = isAdmin ? MASTER_PASSWORD : REGULAR_PASSWORD;
```

### 3. Batch Update
```typescript
for (const user of users) {
  const hashedPassword = await argon2.hash(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedPassword },
  });
}
```

---

## Integration with Seeder

You can also update the seeder to use your preferred passwords:

```typescript
// prisma/seed.ts

// Change these lines:
const adminPassword = await argon2.hash('Admin@123');
const user1Password = await argon2.hash('User@123');

// To:
const adminPassword = await argon2.hash('Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|');
const user1Password = await argon2.hash('12345678@Aa');
```

Then run:
```bash
pnpm prisma:reset  # This will seed with new passwords
```

---

## API Testing

After updating passwords, test login:

```bash
# Test admin login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@socialcomm.com",
    "password": "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
  }'

# Test user login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "12345678@Aa"
  }'
```

---

## Summary

| Task | Command |
|------|---------|
| Update all users | `pnpm password:update` |
| Update specific user | `pnpm password:update:flexible -- --email user@example.com --password "Pass123!"` |
| Update all admins | `pnpm password:update:flexible -- --role admin --password "AdminPass!"` |
| Update all regular users | `pnpm password:update:flexible -- --role user --password "UserPass!"` |
| Reset database + update | `pnpm prisma:reset && pnpm password:update` |

---

## Security Checklist

- [ ] Only use in development/testing environments
- [ ] Never commit passwords to Git
- [ ] Never use in production
- [ ] Use strong, unique passwords in production
- [ ] Implement password reset functionality
- [ ] Enable 2FA for admin accounts
- [ ] Rotate admin passwords regularly
- [ ] Monitor failed login attempts
- [ ] Implement rate limiting on login endpoint

---

## Need Help?

If you encounter issues:
1. Check database connection: `pnpm prisma:studio`
2. Verify users exist: Check Prisma Studio
3. Check logs for errors
4. Ensure dependencies are installed: `pnpm install`
