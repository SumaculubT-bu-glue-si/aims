# 🚀 VPS Deployment Guide for AIMS

## 📋 Prerequisites

- VPS with Ubuntu/Debian
- Root or sudo access
- Domain `assetwise.glue-si.com` pointing to your VPS IP
- Your local project ready

## 🧹 Step 1: Clean up VPS

### Option A: SSH into VPS and run cleanup

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Upload and run cleanup script
scp cleanup-vps.sh user@your-vps-ip:/tmp/
ssh user@your-vps-ip "chmod +x /tmp/cleanup-vps.sh && sudo /tmp/cleanup-vps.sh"
```

### Option B: Manual cleanup

```bash
# SSH into VPS
ssh user@your-vps-ip

# Stop any running services
sudo systemctl stop nginx
sudo docker-compose down 2>/dev/null || true

# Remove old project
sudo rm -rf /var/www/aims
sudo rm -rf /opt/aims

# Clean Docker
sudo docker system prune -a -f
```

## 📤 Step 2: Upload your project

### From your local machine:

```bash
# Create a clean project directory
mkdir -p /tmp/aims-clean
cp -r . /tmp/aims-clean/
cd /tmp/aims-clean

# Remove unnecessary files
rm -rf .git
rm -rf node_modules
rm -rf server/vendor
rm -rf client/.next

# Upload to VPS
scp -r . user@your-vps-ip:/opt/aims/
```

## 🔧 Step 3: Set up VPS

### SSH into VPS and run setup:

```bash
ssh user@your-vps-ip
cd /opt/aims

# Make scripts executable
chmod +x *.sh

# Run VPS setup
sudo ./vps-setup.sh

# Set up SSL certificates
sudo ./setup-ssl.sh
```

## 🚀 Step 4: Deploy application

```bash
# Deploy the application
./deploy-vps.sh

# Check status
./monitor.sh
```

## 🔍 Step 5: Verify deployment

```bash
# Check if all services are running
docker-compose -f docker-compose.prod.yml ps

# Test the application
curl -I https://assetwise.glue-si.com

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🛠️ Troubleshooting

### If SSL certificate fails:

```bash
# Check domain DNS
nslookup assetwise.glue-si.com

# Try manual SSL setup
sudo certbot certonly --standalone -d assetwise.glue-si.com
```

### If Docker fails:

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

### If application doesn't start:

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## 📊 Management Commands

```bash
# View all services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Update application
git pull
./deploy-vps.sh
```

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (ports 22, 80, 443)
- [ ] Set up regular backups
- [ ] Monitor logs for security issues
- [ ] Keep system updated

## 📈 Monitoring

```bash
# Check system resources
./monitor.sh

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Check disk space
df -h

# Check memory usage
free -h
```
