# Admin Panel

Django-like admin panel powered by [AdminJS](https://adminjs.co/), available at `/admin`.

---

## Access

```
URL:      http://localhost:3000/admin    (dev)
         https://yourdomain.com/admin   (production)
Login:    Email + password of any user with role = ADMIN
```

---

## First-time Setup

The admin panel requires at least one ADMIN user. Since you can't log in without one, create the first admin directly in the database:

```bash
# Open Prisma Studio
pnpm prisma:studio
# Go to User table → find your user → set role = ADMIN → Save
```

Or via SQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## What You Can Do

| Resource | View | Create | Edit | Delete | Custom Actions |
|---|---|---|---|---|---|
| Users | ✅ | ✅ | ✅ | ✅ | Suspend / Activate |
| Posts | ✅ | ✅ | ✅ | ✅ | Flag / Remove / Restore |
| Comments | ✅ | ✅ | ✅ | ✅ | — |
| Messages | ✅ | — | — | ✅ | — |
| Groups | ✅ | ✅ | ✅ | ✅ | — |
| Group Members | ✅ | ✅ | ✅ | ✅ | — |
| Friend Requests | ✅ | — | — | ✅ | — |
| Follows | ✅ | — | — | ✅ | — |
| Blocked Users | ✅ | — | — | ✅ | — |
| Calls | ✅ | — | — | — | — |
| Call Participants | ✅ | — | — | — | — |
| Notifications | ✅ | ✅ | ✅ | ✅ | — |
| Reports | ✅ | — | ✅ | ✅ | Resolve / Dismiss |
| Activity Log | ✅ | — | — | — | — |
| Devices | ✅ | — | — | ✅ | — |
| Refresh Tokens | ✅ | — | — | ✅ | — |

**Hidden fields:** `passwordHash` and `twoFactorSecret` are never shown anywhere in the panel.

---

## Session

- Sessions use an in-memory store (no Redis needed for admin)
- Session cookie expires after **8 hours**
- Cookie is `httpOnly`, not `secure` (set `secure: true` in production if serving over HTTPS via a proxy with `trust proxy` configured)

---

## Production Security Recommendations

The admin panel has no built-in IP restriction. For production:

**Option 1 — Nginx IP allowlist** (simplest)

```nginx
location /admin {
    allow YOUR.OFFICE.IP.ADDRESS;
    deny all;
    proxy_pass http://localhost:3000;
    # ... rest of proxy config
}
```

**Option 2 — HTTP Basic Auth layer** (extra protection)

```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

```nginx
location /admin {
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:3000;
}
```

**Option 3 — Disable in production** (if not needed)

Remove the `buildAdminRouter()` call from `application/app.ts`.

---

## Environment Variable

```env
ADMIN_COOKIE_SECRET=change-this-to-a-long-random-string
```

Generate a strong value with:

```bash
openssl rand -base64 64
```
