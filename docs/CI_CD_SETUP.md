# CI/CD Setup Guide

## Automated Deployment Configuration

Your CI/CD pipeline now automatically deploys to production when you push to the `main` branch.

## Required GitHub Secrets

Add these secrets in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

### Required Secrets:

- **`SERVER_HOST`**: Your Oracle Cloud server IP (e.g., `40.233.122.142`)
- **`SERVER_USER`**: SSH username (usually `ubuntu`)
- **`SERVER_SSH_KEY`**: Your private SSH key content
- **`SERVER_PORT`**: SSH port (optional, defaults to 22)

## SSH Key Setup

### Generate SSH Key (if you don't have one):

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions.pub ubuntu@your-server-ip

# Test connection
ssh -i ~/.ssh/github_actions ubuntu@your-server-ip
```

### Add Private Key to GitHub:

```bash
# Copy private key content
cat ~/.ssh/github_actions

# Copy the entire output (including -----BEGIN/END----- lines)
# Paste this as SERVER_SSH_KEY secret in GitHub
```

## How It Works

### Pipeline Triggers:

- **Push to `main`**: Runs tests + deploys to production
- **Push to `develop`**: Runs tests only
- **Pull Requests**: Runs tests only

### Deployment Process:

1. ✅ Run tests and linting
2. ✅ Build Docker image
3. 🚀 SSH into your server
4. 📦 Backup database
5. 📥 Pull latest code
6. 🔧 Install dependencies
7. 🗄️ Run migrations
8. 🐳 Rebuild and restart containers
9. 🏥 Health check
10. 🧹 Cleanup old images

## Usage

### Automatic Deployment:

```bash
# Make changes to your code
git add .
git commit -m "feat: add new feature"
git push origin main  # This triggers automatic deployment
```

### Monitor Deployment:

- Go to **GitHub Actions** tab in your repository
- Watch the deployment progress in real-time
- Check logs if deployment fails

## Deployment Status

After pushing to `main`, you can:

1. Check GitHub Actions for deployment status
2. Visit your API: `http://your-server-ip:3000/health`
3. View deployment logs in GitHub Actions

## Rollback (if needed)

If deployment fails, you can rollback:

```bash
# SSH into your server
ssh ubuntu@your-server-ip

# Go to project directory
cd ~/project/social-communication

# Find previous working commit
git log --oneline -5

# Rollback to previous commit
git reset --hard <previous-commit-hash>

# Restart services
docker compose down
docker compose up --build -d
```

## Security Features

- ✅ Only deploys from `main` branch
- ✅ Requires all tests to pass
- ✅ Uses SSH key authentication
- ✅ Automatic database backup before deployment
- ✅ Health checks after deployment
- ✅ Rollback on failure

## Troubleshooting

### Common Issues:

**1. SSH Connection Failed**

- Check `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY` secrets
- Verify SSH key is added to server: `ssh-copy-id ubuntu@server-ip`

**2. Permission Denied**

- Ensure SSH key has correct permissions
- Check if user has Docker permissions: `sudo usermod -aG docker ubuntu`

**3. Health Check Failed**

- Check server firewall: `sudo ufw status`
- Verify Oracle Cloud Security List allows port 3000
- Check container logs: `docker compose logs app`

**4. Database Migration Failed**

- Check database connection
- Verify `.env` file exists on server
- Check PostgreSQL container is running

## Manual Override

If you need to deploy manually:

```bash
# SSH into server
ssh ubuntu@your-server-ip

# Run the same commands as CI/CD
cd ~/project/social-communication
git pull origin main
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
docker compose down
docker compose up --build -d
```

Your CI/CD pipeline is now fully automated! 🎉
