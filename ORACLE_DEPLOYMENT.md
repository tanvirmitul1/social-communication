# Oracle Cloud Deployment Guide

## Quick Fix for CORS Issue

### 1. Update Production Environment Variables

On your Oracle server, update the `.env.production` file:

```bash
CORS_ORIGINS=https://social.tanvirmitul.com,http://40.233.122.142
```

### 2. Restart Docker Containers

```bash
# Stop containers
docker compose -f docker-compose.prod.yml down

# Rebuild and start with new configuration
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Verify CORS Headers

Test if CORS headers are working:

```bash
curl -I -X OPTIONS http://40.233.122.142/api/v1/auth/login \
  -H "Origin: https://social.tanvirmitul.com" \
  -H "Access-Control-Request-Method: POST"
```

You should see:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

## Recommended: Setup HTTPS with SSL Certificate

### Why HTTPS is Important

Your frontend uses HTTPS (`https://social.tanvirmitul.com`), but your backend uses HTTP (`http://40.233.122.142`). Modern browsers block mixed content (HTTPS → HTTP requests) for security.

### Option 1: Use Let's Encrypt (Free SSL)

1. Install Certbot on Oracle server:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

2. Get SSL certificate:
```bash
sudo certbot --nginx -d api.social.tanvirmitul.com
```

3. Update nginx to listen on port 443 (HTTPS)

### Option 2: Use Cloudflare (Easiest)

1. Add your domain to Cloudflare
2. Point `api.social.tanvirmitul.com` to `40.233.122.142`
3. Enable "Full" SSL mode in Cloudflare
4. Cloudflare will handle HTTPS automatically

### Option 3: Quick Fix - Update Frontend to Use HTTP

If you control the frontend, temporarily change API URL from:
```
https://social.tanvirmitul.com → http://40.233.122.142
```

**Note:** This is not recommended for production due to security concerns.

## Testing the API

### Test Login Endpoint

```bash
curl -X POST http://40.233.122.142/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://social.tanvirmitul.com" \
  -d '{
    "email": "tanvirimruet@gmail.com",
    "password": "12345678@Aa"
  }'
```

### Test from Browser Console

```javascript
fetch('http://40.233.122.142/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'tanvirimruet@gmail.com',
    password: '12345678@Aa'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

## Troubleshooting

### Issue: Still getting CORS error

1. Check if containers are running:
```bash
docker ps
```

2. Check nginx logs:
```bash
docker compose -f docker-compose.prod.yml logs nginx
```

3. Check app logs:
```bash
docker compose -f docker-compose.prod.yml logs app
```

### Issue: Connection refused

1. Check if port 80 is open:
```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

2. Check Oracle Cloud security rules:
   - Go to Oracle Cloud Console
   - Navigate to Networking → Virtual Cloud Networks
   - Select your VCN → Security Lists
   - Add ingress rule for port 80 and 443

### Issue: Database connection error

1. Check if PostgreSQL is running:
```bash
docker compose -f docker-compose.prod.yml ps postgres
```

2. Check database logs:
```bash
docker compose -f docker-compose.prod.yml logs postgres
```

## Complete Deployment Steps

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Clone Repository

```bash
git clone <your-repo-url>
cd social-communication-backend
```

### 3. Configure Environment

```bash
# Copy production env file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

Update these critical values:
```env
NODE_ENV=production
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@postgres:5432/social_communication"
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-64>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-64>
CORS_ORIGINS=https://social.tanvirmitul.com,http://40.233.122.142
```

### 4. Deploy

```bash
# Build and start containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Run database migrations
docker compose -f docker-compose.prod.yml exec app pnpm prisma:migrate:deploy

# Check status
docker compose -f docker-compose.prod.yml ps
```

### 5. Verify Deployment

```bash
# Check health
curl http://40.233.122.142/health

# Check API docs
curl http://40.233.122.142/api/docs
```

## Monitoring

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f postgres
```

### Check Resource Usage

```bash
docker stats
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

### Backup Database

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres social_communication > backup.sql
```

### Restore Database

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres social_communication < backup.sql
```

## Security Checklist

- [ ] Change default database password
- [ ] Generate strong JWT secrets
- [ ] Enable firewall (ufw)
- [ ] Setup HTTPS/SSL
- [ ] Configure proper CORS origins (not *)
- [ ] Enable rate limiting
- [ ] Setup monitoring and alerts
- [ ] Regular backups
- [ ] Keep Docker images updated

## Support

For issues, check:
1. Application logs: `docker compose logs app`
2. Nginx logs: `docker compose logs nginx`
3. Database logs: `docker compose logs postgres`
4. System logs: `journalctl -u docker`
