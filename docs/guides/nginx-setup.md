# Nginx Reverse Proxy Setup

This guide explains the Nginx configuration for the Social Communication platform.

## Overview

Nginx acts as a reverse proxy in front of the Express.js application, providing:

- **Load balancing** for horizontal scaling
- **Rate limiting** to prevent abuse
- **SSL/TLS termination** (production)
- **WebSocket proxying** for Socket.IO
- **Static file serving** with caching
- **Security headers** for enhanced protection
- **Request logging** and monitoring

## Architecture

```
Client → Nginx (Port 80/443) → Express App (Port 3000) → PostgreSQL/Redis
                ↓
         Socket.IO WebSocket Connections
```

## Configuration Files

### Production (`nginx.conf`)

Used with `docker-compose.yml` when running the full stack in Docker.

**Port**: 80 (HTTP), 443 (HTTPS)
**Backend**: `app:3000` (Docker service name)

### Development (`nginx.dev.conf`)

Used with `docker-compose.dev.yml` when running app locally with `pnpm dev`.

**Port**: 8080 (to avoid conflicts with app on port 3000)
**Backend**: `host.docker.internal:3000` (points to host machine)

## Key Features

### 1. WebSocket Support

```nginx
location /socket.io/ {
    proxy_pass http://app_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... long timeouts for persistent connections
}
```

- Upgrades HTTP to WebSocket protocol
- 7-day timeout for long-lived connections
- Preserves client IP and headers

### 2. Rate Limiting

Three rate limit zones:

| Zone | Limit | Burst | Applied To |
|------|-------|-------|------------|
| `auth` | 5 req/min | 10 | `/api/v1/auth`, `/api/v1/login`, `/api/v1/register` |
| `message` | 30 req/min | 50 | `/api/v1/messages` |
| `general` | 100 req/min | 200 | All other `/api/*` endpoints |

**Note**: Development config has no rate limiting for easier testing.

### 3. Security Headers

- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: no-referrer-when-downgrade` - Privacy protection

### 4. Static File Caching

```nginx
location /uploads/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

Upload files are cached for 30 days with immutable flag.

### 5. Health Check Endpoint

```nginx
location /health {
    return 200 "healthy\n";
}
```

Returns `200 OK` for load balancer health checks. Accessible at `http://localhost/health`.

## Usage

### Production Setup

```bash
# Start all services (Postgres, Redis, App, Nginx)
docker-compose up -d

# Access application via Nginx
curl http://localhost/api/v1/health

# View Nginx logs
docker logs social-comm-nginx
# OR
tail -f logs/nginx/access.log
tail -f logs/nginx/error.log
```

**Access Points**:
- Application: http://localhost
- API: http://localhost/api/v1/*
- Swagger Docs: http://localhost/api/docs
- WebSocket: ws://localhost/socket.io

### Development Setup

```bash
# Start infrastructure only (Postgres, Redis, Nginx)
docker-compose -f docker-compose.dev.yml up -d

# Run app locally
pnpm dev

# Access application via Nginx
curl http://localhost:8080/api/v1/health
```

**Access Points**:
- Nginx Proxy: http://localhost:8080
- Direct to App: http://localhost:3000 (bypasses Nginx)
- pgAdmin: http://localhost:5050

**Why port 8080?** In development, the app runs on port 3000, so Nginx uses 8080 to avoid conflicts.

## Configuration Customization

### Adding Custom Headers

Edit the `server` block in `nginx.conf`:

```nginx
add_header X-Custom-Header "value" always;
```

### Adjusting Rate Limits

Modify the `limit_req_zone` directives:

```nginx
# Increase auth limit to 10 requests per minute
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
```

### Adding HTTPS (SSL/TLS)

1. Obtain SSL certificate (Let's Encrypt recommended)
2. Update `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

3. Update Docker Compose to mount certificates:

```yaml
nginx:
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro  # Add this line
```

### Load Balancing Multiple App Instances

If running multiple app containers:

```nginx
upstream app_backend {
    least_conn;  # or ip_hash for sticky sessions
    server app1:3000;
    server app2:3000;
    server app3:3000;
}
```

Update `docker-compose.yml` to run multiple app instances:

```yaml
services:
  app:
    deploy:
      replicas: 3
```

## Troubleshooting

### WebSocket Connection Fails

**Symptom**: Socket.IO client can't connect
**Solution**: Check `Upgrade` and `Connection` headers are set correctly

```bash
# Test WebSocket upgrade
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost/socket.io/
```

### 502 Bad Gateway

**Causes**:
1. App container not running
2. App not listening on port 3000
3. Network issue between Nginx and app

**Debug**:
```bash
# Check app is running
docker ps | grep social-comm-app

# Check app logs
docker logs social-comm-app

# Check Nginx can reach app
docker exec social-comm-nginx ping app
```

### Rate Limit Too Strict

**Symptom**: Getting `429 Too Many Requests`
**Solution**: Adjust rate limits or increase burst size in `nginx.conf`

### Logs Not Appearing

**Check**:
1. `logs/nginx` directory exists and is writable
2. Nginx container has write permissions
3. Volume mount is correct in docker-compose.yml

```bash
# Create logs directory
mkdir -p logs/nginx

# Check permissions
ls -la logs/

# Restart Nginx
docker-compose restart nginx
```

## Performance Tuning

### Worker Connections

```nginx
events {
    worker_connections 1024;  # Increase for high traffic
}
```

### Client Body Size

```nginx
client_max_body_size 10M;  # Adjust based on upload needs
```

### Proxy Buffering

```nginx
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

## Monitoring

### Access Logs

```bash
# Real-time monitoring
tail -f logs/nginx/access.log

# Count requests by endpoint
awk '{print $7}' logs/nginx/access.log | sort | uniq -c | sort -rn

# Count by status code
awk '{print $9}' logs/nginx/access.log | sort | uniq -c
```

### Error Logs

```bash
# View errors
tail -f logs/nginx/error.log

# Count errors by type
grep -oP 'error.*?(?=,)' logs/nginx/error.log | sort | uniq -c
```

### Health Check

```bash
# Via Nginx
curl http://localhost/health

# Direct to app (production)
docker exec social-comm-app curl http://localhost:3000/api/v1/health

# Direct to app (development)
curl http://localhost:3000/api/v1/health
```

## Best Practices

1. **Always use Nginx in production** - Provides security, performance, and reliability
2. **Keep rate limits reasonable** - Protect against abuse without hindering legitimate users
3. **Monitor logs regularly** - Set up log rotation and analysis
4. **Use HTTPS in production** - Encrypt all traffic with SSL/TLS
5. **Test configuration changes** - Use `nginx -t` before restarting
6. **Keep Nginx updated** - Security patches are important
7. **Configure proper timeouts** - Balance between long-lived connections and resource usage

## Integration with CI/CD

The Docker Compose files are already configured for CI/CD:

- GitHub Actions automatically builds and deploys with Nginx
- Digital Ocean deployment includes Nginx container
- SSL certificates can be managed via Let's Encrypt with Certbot

See [CI/CD Setup Guide](../CI_CD_SETUP.md) for full details.

## Related Documentation

- [Deployment Guide](../DEPLOYMENT_GUIDE.md) - Production deployment
- [Architecture](../development/architecture.md) - System architecture
- [Troubleshooting](./troubleshooting.md) - Common issues
- [Quickstart](../getting-started/quickstart.md) - Getting started

## References

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx with Socket.IO](https://socket.io/docs/v4/reverse-proxy/)
- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
