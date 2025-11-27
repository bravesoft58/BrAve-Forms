# DigitalOcean Server Setup Log

**Server:** braveforms-pilot
**IP Address:** 159.89.246.229
**Region:** NYC3
**Setup Date:** 2025-11-27
**Setup By:** Development Team

---

## Server Specifications

| Property     | Value                          |
| ------------ | ------------------------------ |
| Droplet Name | ubuntu-s-2vcpu-4gb-amd-nyc3-01 |
| OS           | Ubuntu 24.04 LTS               |
| Kernel       | 6.8.0-71-generic               |
| CPU          | 2 vCPU (AMD)                   |
| RAM          | 3.8 GB                         |
| Disk         | 77 GB SSD                      |
| Region       | NYC3                           |
| Monthly Cost | $24                            |

---

## Software Installed

### Docker Engine 29.0.4

- **Installed:** 2025-11-27 14:28 UTC
- **Method:** Official Docker install script (https://get.docker.com)
- **Components:**
  - Docker Engine (Community) 29.0.4
  - containerd v2.1.5
  - runc 1.3.3
  - Docker Compose plugin (included)
  - Docker Buildx plugin (included)

**Verification:**

```bash
docker --version
# Docker version 29.0.4, build 3247a5a

docker compose version
# Docker Compose version v2.x.x
```

### Nginx 1.24.0

- **Installed:** 2025-11-27 14:29 UTC
- **Method:** apt-get from Ubuntu repositories
- **Status:** Running (systemd service)
- **Config Location:** /etc/nginx/

**Verification:**

```bash
nginx -v
# nginx version: nginx/1.24.0 (Ubuntu)

systemctl status nginx
# Active: active (running)
```

### Certbot 2.9.0

- **Installed:** 2025-11-27 14:30 UTC
- **Method:** apt-get from Ubuntu repositories
- **Auto-renewal:** Enabled (systemd timer)
- **Nginx Plugin:** python3-certbot-nginx installed

**Verification:**

```bash
certbot --version
# certbot 2.9.0

systemctl list-timers | grep certbot
# certbot.timer enabled
```

### Additional Tools

- **Git:** 2.43.0 (pre-installed)
- **htop:** 3.3.0 (monitoring)

---

## Security Configuration

### Firewall (UFW)

- **Status:** Active
- **Default Policy:** deny incoming, allow outgoing

**Allowed Ports:**

| Port | Service       | Protocol |
| ---- | ------------- | -------- |
| 22   | SSH (OpenSSH) | TCP      |
| 80   | HTTP (Nginx)  | TCP      |
| 443  | HTTPS (Nginx) | TCP      |

**Verification:**

```bash
sudo ufw status verbose
# Status: active
# Default: deny (incoming), allow (outgoing)
# 22/tcp (OpenSSH)        ALLOW IN Anywhere
# 80,443/tcp (Nginx Full) ALLOW IN Anywhere
```

### User Accounts

| User   | Purpose                | Groups               | SSH Access      |
| ------ | ---------------------- | -------------------- | --------------- |
| root   | System admin           | root                 | Yes (key-based) |
| deploy | Application deployment | deploy, sudo, docker | Yes (key-based) |

**Deploy User Capabilities:**

- Passwordless sudo access
- Docker commands without sudo
- SSH key authentication (no password)

---

## SSH Access Configuration

### Local SSH Config (Recommended)

Add to `~/.ssh/config`:

```
Host braveforms
    HostName 159.89.246.229
    User deploy
    IdentityFile ~/.ssh/braveforms_do

Host braveforms-root
    HostName 159.89.246.229
    User root
    IdentityFile ~/.ssh/braveforms_do
```

### Connection Commands

```bash
# Connect as deploy user (recommended)
ssh braveforms

# Or without config:
ssh -i ~/.ssh/braveforms_do deploy@159.89.246.229

# Connect as root (if needed)
ssh braveforms-root
```

---

## Directory Structure

```
/home/deploy/
├── .ssh/
│   └── authorized_keys
└── (application will be deployed here)

/etc/nginx/
├── nginx.conf
├── sites-available/
│   └── braveforms (to be created)
└── sites-enabled/
    └── braveforms -> ../sites-available/braveforms
```

---

## Next Steps

1. **Clone Repository:**

   ```bash
   ssh braveforms
   git clone https://github.com/YOUR_ORG/brave-forms.git
   cd brave-forms
   ```

2. **Create Environment File:**

   ```bash
   cp .env.production.example .env.production
   nano .env.production
   # Fill in production values
   ```

3. **Configure Nginx:**

   ```bash
   sudo cp infrastructure/nginx/braveforms.conf /etc/nginx/sites-available/braveforms
   # Edit to replace YOUR_DOMAIN with actual domain or IP
   sudo ln -s /etc/nginx/sites-available/braveforms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Deploy Application:**

   ```bash
   ./scripts/deploy-digitalocean.sh setup
   ```

5. **Configure SSL (if domain available):**
   ```bash
   sudo certbot --nginx -d braveforms.yourdomain.com -d api.braveforms.yourdomain.com
   ```

---

## Monitoring Commands

```bash
# System resources
htop

# Docker containers
docker ps
docker stats

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
docker compose -f docker-compose.prod.yml logs -f

# Disk usage
df -h

# Memory usage
free -h
```

---

## Backup Information

**Database Backups:**

- Location: /home/deploy/backups/
- Retention: 7 days
- Schedule: Daily at 2 AM UTC (after cron setup)

**Backup Command:**

```bash
./scripts/deploy-digitalocean.sh backup
```

---

## Troubleshooting

### Docker Permission Denied

If you see "permission denied" when running docker:

```bash
# Re-login to refresh group membership
exit
ssh braveforms
```

### Nginx Configuration Test

```bash
sudo nginx -t
# Should show: syntax is ok, test is successful
```

### Check Service Status

```bash
sudo systemctl status nginx
sudo systemctl status docker
```

### View Firewall Rules

```bash
sudo ufw status numbered
```

---

## Change Log

| Date       | Change                  | By               |
| ---------- | ----------------------- | ---------------- |
| 2025-11-27 | Initial server setup    | Development Team |
| 2025-11-27 | Docker 29.0.4 installed | Development Team |
| 2025-11-27 | Nginx 1.24.0 installed  | Development Team |
| 2025-11-27 | Certbot 2.9.0 installed | Development Team |
| 2025-11-27 | UFW firewall configured | Development Team |
| 2025-11-27 | Deploy user created     | Development Team |

---

**Last Updated:** 2025-11-27
**Maintained By:** Development Team
