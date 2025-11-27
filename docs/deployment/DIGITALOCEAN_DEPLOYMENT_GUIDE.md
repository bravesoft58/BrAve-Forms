# DigitalOcean Deployment Guide - Single Droplet with Docker Compose

**Created:** 2025-11-27
**Target:** Q&D Construction Pilot Testing
**Estimated Cost:** $29/month (Droplet $24 + Spaces $5)
**Architecture:** Single Droplet running all services via Docker Compose

---

## Prerequisites

Before starting:

1. DigitalOcean account (new accounts get $200 credit for 60 days)
2. Domain name pointed to DigitalOcean (optional but recommended)
3. Clerk account with production API keys
4. Local copy of BrAve Forms repository

---

## Step 1: Create DigitalOcean Droplet

### Via DigitalOcean Console

1. Go to [DigitalOcean Cloud Console](https://cloud.digitalocean.com)
2. Click **Create** > **Droplets**
3. Configure:

| Setting        | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Region         | NYC1 or SFO3 (closest to users)                         |
| Image          | Ubuntu 24.04 LTS                                        |
| Size           | Basic - Regular - 4GB RAM / 2 vCPUs / 80GB SSD ($24/mo) |
| Authentication | SSH Key (recommended) or Password                       |
| Hostname       | `braveforms-pilot`                                      |

4. Click **Create Droplet**
5. Note the IP address (e.g., `164.90.xxx.xxx`)

### Via doctl CLI (Alternative)

```bash
# Install doctl
brew install doctl  # macOS
# or: snap install doctl  # Linux

# Authenticate
doctl auth init

# Create droplet
doctl compute droplet create braveforms-pilot \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --image ubuntu-24-04-x64 \
  --ssh-keys YOUR_SSH_KEY_ID
```

---

## Step 2: Create DigitalOcean Spaces (S3-compatible storage)

1. Go to **Spaces Object Storage** in DigitalOcean console
2. Click **Create a Space**
3. Configure:

| Setting | Value                   |
| ------- | ----------------------- |
| Region  | NYC3 or same as droplet |
| CDN     | Enable (free)           |
| Name    | `braveforms-photos`     |
| Access  | Private                 |

4. Create **Spaces Access Keys**:
   - Go to **API** > **Spaces Keys**
   - Click **Generate New Key**
   - Save the Access Key and Secret Key

---

## Step 3: Configure DNS (Optional but Recommended)

If you have a domain, add these DNS records:

| Type | Name           | Value           | TTL |
| ---- | -------------- | --------------- | --- |
| A    | braveforms     | YOUR_DROPLET_IP | 300 |
| A    | api.braveforms | YOUR_DROPLET_IP | 300 |

Or use DigitalOcean's free DNS if domain is registered elsewhere.

---

## Step 4: Initial Server Setup

SSH into your droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

### 4.1 Update System

```bash
apt update && apt upgrade -y
```

### 4.2 Create Deploy User

```bash
# Create user
adduser deploy
usermod -aG sudo deploy

# Add SSH key for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user
su - deploy
```

### 4.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add deploy user to docker group
sudo usermod -aG docker deploy

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Log out and back in for group changes
exit
ssh deploy@YOUR_DROPLET_IP
```

### 4.4 Install Additional Tools

```bash
# Git
sudo apt install git -y

# Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# htop for monitoring
sudo apt install htop -y
```

---

## Step 5: Clone Repository and Configure

### 5.1 Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_ORG/brave-forms.git
cd brave-forms
```

### 5.2 Create Environment File

```bash
# Create production environment file
cp .env.example .env.production

# Edit with your values
nano .env.production
```

**Required environment variables:**

```bash
# Node Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://brave:STRONG_PASSWORD_HERE@postgres:5432/brave_forms?schema=public
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# Redis
REDIS_URL=redis://:STRONG_REDIS_PASSWORD@redis:6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# Clerk Authentication (get from Clerk dashboard)
CLERK_SECRET_KEY=sk_live_YOUR_CLERK_SECRET
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_CLERK_PUBLISHABLE
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_CLERK_PUBLISHABLE

# DigitalOcean Spaces (S3-compatible)
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET_NAME=braveforms-photos
AWS_ACCESS_KEY_ID=YOUR_SPACES_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SPACES_SECRET
AWS_REGION=nyc3

# Application URLs
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.braveforms.yourdomain.com/graphql
CORS_ORIGIN=https://braveforms.yourdomain.com

# Security
JWT_SECRET=GENERATE_A_STRONG_SECRET_HERE
```

**Generate secure passwords:**

```bash
# Generate random passwords
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For REDIS_PASSWORD
openssl rand -base64 64  # For JWT_SECRET
```

---

## Step 6: Deploy with Docker Compose

### 6.1 Use Production Compose File

```bash
# Deploy all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 6.2 Run Database Migrations

```bash
# Run Prisma migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed templates
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

### 6.3 Verify Services

```bash
# Check all containers are running
docker ps

# Test backend API
curl http://localhost:4000/health

# Test frontend
curl http://localhost:3000
```

---

## Step 7: Configure Nginx Reverse Proxy with SSL

### 7.1 Install and Configure Nginx

```bash
sudo apt install nginx -y

# Create site configuration
sudo nano /etc/nginx/sites-available/braveforms
```

**Nginx configuration (paste this):**

```nginx
# Frontend - braveforms.yourdomain.com
server {
    listen 80;
    server_name braveforms.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API - api.braveforms.yourdomain.com
server {
    listen 80;
    server_name api.braveforms.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # GraphQL specific
        client_max_body_size 50M;
    }
}
```

### 7.2 Enable Site and Get SSL Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/braveforms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Get SSL certificate (requires DNS to be configured)
sudo certbot --nginx -d braveforms.yourdomain.com -d api.braveforms.yourdomain.com

# Auto-renewal is set up automatically
```

---

## Step 8: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify
sudo ufw status
```

---

## Step 9: Set Up Automatic Updates and Monitoring

### 9.1 Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 9.2 Set Up Basic Monitoring

```bash
# Create monitoring script
cat << 'EOF' > ~/monitor.sh
#!/bin/bash
echo "=== BrAve Forms Status ==="
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Disk Usage:"
df -h /
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Docker Disk Usage:"
docker system df
EOF

chmod +x ~/monitor.sh
```

### 9.3 Set Up Log Rotation

```bash
# Docker logs are rotated automatically with json-file driver
# Configured in docker-compose.prod.yml
```

---

## Step 10: Backup Strategy

### 10.1 Database Backup Script

```bash
cat << 'EOF' > ~/backup-db.sh
#!/bin/bash
BACKUP_DIR=/home/deploy/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker compose -f ~/brave-forms/docker-compose.prod.yml exec -T postgres \
  pg_dump -U brave brave_forms | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup-db.sh") | crontab -
```

### 10.2 Upload Backups to Spaces (Optional)

```bash
# Install s3cmd
sudo apt install s3cmd -y

# Configure for DigitalOcean Spaces
s3cmd --configure
# Enter your Spaces credentials when prompted
# Set endpoint to: nyc3.digitaloceanspaces.com

# Add to backup script:
# s3cmd put $BACKUP_DIR/db_$DATE.sql.gz s3://braveforms-backups/
```

---

## Deployment Commands Reference

### Start Services

```bash
cd ~/brave-forms
docker compose -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f web
```

### Update Application

```bash
cd ~/brave-forms
git pull origin master
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Restart Services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Check Resource Usage

```bash
docker stats
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check container status
docker inspect braveforms-backend
```

### Database Connection Issues

```bash
# Test database connection
docker compose -f docker-compose.prod.yml exec postgres psql -U brave -d brave_forms -c "SELECT 1"
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Out of Disk Space

```bash
# Clean Docker
docker system prune -a

# Check disk usage
df -h
du -sh /var/lib/docker/*
```

---

## Cost Summary

| Resource             | Monthly Cost |
| -------------------- | ------------ |
| Droplet (4GB/2vCPU)  | $24.00       |
| Spaces (250GB + CDN) | $5.00        |
| **Total**            | **$29.00**   |

With $200 new account credit: **~7 months free**

---

## Security Checklist

- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] UFW firewall enabled
- [ ] SSL certificates installed
- [ ] Strong database passwords
- [ ] Clerk production keys configured
- [ ] CORS properly configured
- [ ] Automatic security updates enabled
- [ ] Regular backups configured

---

## Next Steps After Deployment

1. **Configure Clerk Production**
   - Add production domain to Clerk dashboard
   - Update webhook URLs

2. **Seed Q&D Organization**
   - Create organization in Clerk
   - Seed templates to database

3. **Test Critical Flows**
   - QR code generation
   - Form submission
   - Photo upload to Spaces
   - Inspector portal access

4. **Share with Q&D**
   - Provide URL and login instructions
   - Schedule training session

---

**Last Updated:** 2025-11-27
**Maintained By:** Development Team
