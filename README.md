# AIMS - Asset Inventory Management System

A full-stack application built with Laravel (Backend) and Next.js (Frontend), containerized with Docker.

## 🏗️ Architecture

- **Backend**: Laravel with GraphQL API
- **Frontend**: Next.js with TypeScript
- **Database**: MySQL 8.0
- **Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Development

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Deploy to production
./deploy-vps.sh

# Monitor
./monitor.sh
```

## 📁 Project Structure

```
aims/
├── client/                 # Next.js frontend
│   ├── src/
│   ├── Dockerfile
│   └── Dockerfile.prod
├── server/                 # Laravel backend
│   ├── app/
│   ├── Dockerfile
│   └── start.sh
├── database/              # Database initialization
│   └── init/
├── nginx/                 # Nginx configuration
│   ├── nginx.conf
│   └── nginx.prod.conf
├── docker-compose.yml     # Development setup
├── docker-compose.prod.yml # Production setup
└── deploy-vps.sh         # VPS deployment script
```

## 🔧 Services

- **database**: MySQL 8.0 with health checks
- **backend**: Laravel API server
- **frontend**: Next.js application
- **nginx**: Reverse proxy
- **gws-sync**: User synchronization (runs once)
- **queue-worker**: Background job processing

## 🌐 Access Points

- **Frontend**: http://localhost (dev) / https://assetwise.glue-si.com (prod)
- **Backend API**: http://localhost/api (dev) / https://assetwise.glue-si.com/api (prod)
- **Database**: localhost:3306

## 📊 Management Commands

```bash
# Development
docker-compose up -d
docker-compose logs -f
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down

# Manual commands
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan queue:work
docker-compose exec backend php artisan gws:sync-users bu.glue-si.com --all
```

## 🔒 Security Features

- SSL/TLS encryption
- Firewall configuration
- Secure file permissions
- Environment variable protection
- Database security

## 📈 Monitoring

```bash
# Check system status
./monitor.sh

# View service logs
docker-compose logs -f [service-name]

# Check resource usage
docker stats
```

## 🚀 Deployment

### VPS Deployment

1. Upload project to `/opt/aims/`
2. Run `./vps-setup.sh`
3. Run `./setup-ssl.sh`
4. Run `./deploy-vps.sh`

### Environment Variables

- Copy `.env.example` to `.env`
- Configure database credentials
- Set domain and SSL settings

## 🛠️ Development

### Adding new features

1. Make changes in `client/` or `server/`
2. Test with `docker-compose up -d`
3. Commit changes to version control
4. Deploy to production

### Database changes

1. Create migration: `docker-compose exec backend php artisan make:migration`
2. Run migration: `docker-compose exec backend php artisan migrate`
3. Update database schema

## 📝 Notes

- All services are containerized
- Development and production use different configurations
- SSL certificates auto-renew
- Queue workers process background jobs
- GWS sync runs once at startup
