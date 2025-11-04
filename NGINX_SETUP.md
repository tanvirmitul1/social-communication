# Nginx Integration Summary

This document provides a quick overview of the Nginx reverse proxy integration added to the Social Communication platform.

## What Was Added

### 1. Configuration Files

- **[nginx.conf](nginx.conf)** - Production configuration with rate limiting, security headers, and WebSocket support
- **[nginx.dev.conf](nginx.dev.conf)** - Development configuration that proxies to app running on host machine

### 2. Docker Compose Updates

#### Production ([docker-compose.yml](docker-compose.yml))
- Added Nginx service listening on ports 80/443
- App now uses `expose` instead of `ports` (not directly accessible)
- Nginx acts as reverse proxy to app container

#### Development ([docker-compose.dev.yml](docker-compose.dev.yml))
- Nginx listens on port 8080 (avoids conflict with app on port 3000)
- Proxies to `host.docker.internal:3000` (app running locally)
- Allows testing Nginx features without running app in Docker

### 3. Documentation

- **[docs/guides/nginx-setup.md](docs/guides/nginx-setup.md)** - Comprehensive Nginx setup and configuration guide

### 4. NPM Scripts

Added convenience scripts to [package.json](package.json):
- `pnpm docker:logs:nginx` - View Nginx logs (production)
- `pnpm docker:dev:logs:nginx` - View Nginx logs (development)

## Key Features

### Rate Limiting
- **Auth endpoints**: 5 requests/min (login, register)
- **Message endpoints**: 30 requests/min
- **General API**: 100 requests/min

### Security Headers
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### WebSocket Support
- Full Socket.IO WebSocket proxying
- 7-day connection timeout for persistent connections
- Proper upgrade headers

### Static File Caching
- 30-day cache for uploads
- Immutable cache control headers

### Health Check
- `/health` endpoint returns `200 OK`
- Useful for load balancers and monitoring

## Quick Start

### Production (Full Stack in Docker)

```bash
# Start all services with Nginx
pnpm docker:up

# Access application via Nginx
curl http://localhost/api/v1/health

# View Nginx logs
pnpm docker:logs:nginx
```

**Access**:
- Application: http://localhost
- API: http://localhost/api/v1/*
- Swagger: http://localhost/api/docs

### Development (App on Host, Nginx in Docker)

```bash
# Start infrastructure (Postgres, Redis, Nginx)
pnpm docker:dev:up

# Run app locally
pnpm dev

# Access via Nginx
curl http://localhost:8080/api/v1/health

# View Nginx logs
pnpm docker:dev:logs:nginx
```

**Access**:
- Via Nginx: http://localhost:8080
- Direct to app: http://localhost:3000
- pgAdmin: http://localhost:5050

## Architecture Diagram

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Nginx (Port 80)│
│  Reverse Proxy  │
│  Rate Limiting  │
│  SSL/TLS        │
│  Security       │
└────┬────────────┘
     │
     ▼
┌──────────────────┐
│  Express App     │
│  (Port 3000)     │
│  Socket.IO       │
└─────┬────┬───────┘
      │    │
      ▼    ▼
   ┌────┐ ┌─────┐
   │ PG │ │Redis│
   └────┘ └─────┘
```

## Configuration Highlights

### WebSocket Configuration

```nginx
location /socket.io/ {
    proxy_pass http://app_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # 7-day timeout for persistent connections
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

### Rate Limiting Zones

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=message:10m rate=30r/m;

# Apply to locations
location ~ ^/api/v1/(auth|login|register) {
    limit_req zone=auth burst=10 nodelay;
    proxy_pass http://app_backend;
}
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## Benefits

### Performance
- ✅ Static file caching reduces backend load
- ✅ Connection pooling improves throughput
- ✅ Compression reduces bandwidth usage

### Security
- ✅ Rate limiting prevents abuse
- ✅ Security headers protect against common attacks
- ✅ SSL/TLS termination (when configured)
- ✅ Hides internal architecture

### Scalability
- ✅ Load balancing support for multiple app instances
- ✅ Can serve multiple backend servers
- ✅ Horizontal scaling ready

### Monitoring
- ✅ Centralized access logs
- ✅ Error logging
- ✅ Health check endpoint

## Next Steps

1. **Add SSL/TLS** - Configure HTTPS with Let's Encrypt
2. **Enable Compression** - Add gzip/brotli compression
3. **Set up Monitoring** - Integrate with Prometheus/Grafana
4. **Configure Load Balancing** - Scale to multiple app instances
5. **Add WAF Rules** - Web Application Firewall for enhanced security

## Troubleshooting

### Common Issues

**502 Bad Gateway**
- Check app container is running: `docker ps`
- Check app logs: `docker logs social-comm-app`
- Verify network connectivity: `docker exec social-comm-nginx ping app`

**WebSocket Connection Fails**
- Ensure upgrade headers are set correctly
- Check CORS origins include Nginx URL
- Verify Socket.IO path matches (`/socket.io/`)

**Rate Limit Too Strict**
- Adjust limits in nginx.conf
- Increase burst size for traffic spikes
- Consider whitelisting specific IPs

## Resources

- [Full Nginx Setup Guide](docs/guides/nginx-setup.md)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Socket.IO with Nginx](https://socket.io/docs/v4/reverse-proxy/)

## Support

For issues or questions:
1. Check the [troubleshooting guide](docs/guides/troubleshooting.md)
2. Review Nginx logs: `pnpm docker:logs:nginx`
3. Check application logs: `pnpm docker:logs`
4. Verify configuration: `docker exec social-comm-nginx nginx -t`
