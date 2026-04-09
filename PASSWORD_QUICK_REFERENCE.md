# 🔐 Password Management - Quick Reference

## ✅ Scripts Created

1. **`scripts/update-passwords.ts`** - Update all users at once
2. **`scripts/update-password-flexible.ts`** - Update specific users

---

## 🚀 Quick Commands

### Update All Users (Default Passwords)
```bash
pnpm password:update
```
- Admins → `Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|`
- Users → `12345678@Aa`

### Update Specific User
```bash
pnpm password:update:flexible -- --username alice --password "NewPass123!"
```

### Update All Admins
```bash
pnpm password:update:flexible -- --role admin --password "AdminPass123!"
```

### Update All Regular Users
```bash
pnpm password:update:flexible -- --role user --password "UserPass123!"
```

### Update by Email
```bash
pnpm password:update:flexible -- --email admin@socialcomm.com --password "NewPass123!"
```

---

## 📋 Default Credentials (After Running `pnpm password:update`)

### Admin Account
```
Email: admin@socialcomm.com
Password: Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|
```

### Regular User Accounts
```
Email: alice@example.com
Password: 12345678@Aa

Email: bob@example.com
Password: 12345678@Aa

Email: charlie@example.com
Password: 12345678@Aa

Email: diana@example.com
Password: 12345678@Aa

Email: eric@example.com
Password: 12345678@Aa
```

---

## 🎯 Common Workflows

### 1. Fresh Setup
```bash
# Reset database and seed
pnpm prisma:reset

# Update all passwords
pnpm password:update
```

### 2. Forgot Admin Password
```bash
# Reset to master password
pnpm password:update:flexible -- --email admin@socialcomm.com --password "Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|"
```

### 3. Create Test Environment
```bash
# Set all users to same password for testing
pnpm password:update:flexible -- --all --password "Test@123"
```

---

## 🧪 Test Login

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

## ⚠️ Important Notes

### ✅ Safe for Development
- Use these scripts in **development** and **testing** only
- Helps with quick testing and debugging

### 🚨 Never in Production
- Users should set their own passwords
- Implement password reset via email
- Use 2FA for admin accounts
- Rotate passwords regularly

---

## 📚 Full Documentation

See `docs/PASSWORD_MANAGEMENT.md` for complete documentation.

---

## 🎉 Summary

✅ **Scripts Created**: 2 password management scripts  
✅ **Commands Added**: `pnpm password:update` and `pnpm password:update:flexible`  
✅ **Tested**: Both scripts work perfectly  
✅ **Documentation**: Complete guide in `docs/PASSWORD_MANAGEMENT.md`  

**Master Password**: `Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|`  
**Regular Password**: `12345678@Aa`  

🚀 **Ready to use!**
