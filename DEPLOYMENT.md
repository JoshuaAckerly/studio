# Deployment Guide - Studio

## 🚀 Production Deployment

### Hypervisor Production Deployment

Studio uses Hypervisor for production deployment to AWS EC2.

### Quick Deploy to Production

```bash
# SSH to your production server
ssh ubuntu@your-production-server

# Navigate to the project and run deployment
cd /var/www/studio
./deploy-production.sh
```

The production deployment script will:
- Pull latest code from `main` branch
- Install PHP and Node dependencies
- Build frontend assets with SSR
- Run database migrations
- Optimize Laravel caches
- Restart PHP-FPM and SSR server via PM2
- Restart queue workers if configured

## 🧪 Test Server Deployment

For deploying to the polyrepo test server, see the main [TEST_DEPLOYMENT.md](../TEST_DEPLOYMENT.md) guide.

### Quick Deploy to Test Server

```bash
# SSH to your test server
ssh ubuntu@your-test-server

# Navigate to the project and run deployment
cd /var/www/studio
./deploy-test.sh
```

The test deployment script will:
- Pull latest code from `testing` branch
- Install dependencies and build assets
- Run database migrations
- Start SSR server on port 13716
- Restart PHP-FPM and queue workers

## 📝 Manual Deployment Steps

If you need to deploy manually without the scripts:

### Production Deployment

1. **SSH to production server**
   ```bash
   ssh ubuntu@your-production-server
   cd /var/www/studio
   ```

2. **Update code**
   ```bash
   git pull origin main
   ```

3. **Install dependencies**
   ```bash
   composer install --no-dev --optimize-autoloader
   npm ci --production=false
   ```

4. **Build assets**
   ```bash
   npm run build:ssr
   ```

5. **Run migrations and optimize**
   ```bash
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

6. **Set permissions**
   ```bash
   chown -R www-data:www-data storage bootstrap/cache
   chmod -R 775 storage bootstrap/cache
   ```

7. **Restart services**
   ```bash
   sudo systemctl reload php8.3-fpm
   pm2 restart studio-ssr
   ```

### Test Server Deployment

1. **SSH to test server**
   ```bash
   ssh ubuntu@your-test-server
   cd /var/www/studio
   ```

2. **Update code**
   ```bash
   git pull origin testing
   ```

3. **Install dependencies and build**
   ```bash
   composer install --no-dev --optimize-autoloader
   npm ci
   npm run build
   ```

4. **Configure SSR**
   ```bash
   # Ensure .env has SSR settings
   echo "INERTIA_SSR_ENABLED=true" >> .env
   echo "INERTIA_SSR_PORT=13716" >> .env
   ```

5. **Run migrations and optimize**
   ```bash
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

6. **Set permissions**
   ```bash
   sudo chown -R www-data:www-data storage bootstrap/cache
   sudo chmod -R 775 storage bootstrap/cache
   ```

7. **Start SSR and restart services**
   ```bash
   # Kill existing SSR process
   lsof -ti:13716 | xargs kill -9 2>/dev/null || true

   # Start new SSR server
   nohup node bootstrap/ssr/ssr.mjs > storage/logs/ssr.log 2>&1 &

   # Restart PHP-FPM
   sudo systemctl restart php8.3-fpm
   ```

## 🔧 Environment Configuration

### Production Environment Variables

Ensure your production `.env` file includes:

```bash
APP_ENV=production
APP_DEBUG=false
APP_URL=https://studio.graveyardjokes.com

DB_CONNECTION=mysql
# ... database credentials ...

INERTIA_SSR_ENABLED=true
INERTIA_SSR_PORT=13716

# Queue configuration (if used)
QUEUE_CONNECTION=redis
# or QUEUE_CONNECTION=database
```

### Test Environment Variables

For test server deployment:

```bash
APP_ENV=staging
APP_DEBUG=false
APP_URL=https://test-studio.yourdomain.com

# ... similar database and SSR settings ...
```

## 📊 Monitoring & Logs

### Production Logs
- **Laravel logs**: `storage/logs/laravel.log`
- **SSR logs**: Check PM2 logs with `pm2 logs studio-ssr`
- **Web server logs**: `/var/log/nginx/error.log`

### Test Server Logs
- **Laravel logs**: `storage/logs/laravel.log`
- **SSR logs**: `storage/logs/ssr.log`
- **Web server logs**: `/var/log/nginx/error.log`

## 🚨 Troubleshooting

### SSR Not Starting
```bash
# Check if port is in use
lsof -i :13716

# Check SSR logs
tail -f storage/logs/ssr.log

# Restart SSR manually
pm2 restart studio-ssr  # production
# or for test server:
kill $(lsof -ti:13716) && nohup node bootstrap/ssr/ssr.mjs > storage/logs/ssr.log 2>&1 &
```

### Permission Issues
```bash
# Fix storage permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Build Failures
```bash
# Clear npm cache and rebuild
npm cache clean --force
rm -rf node_modules
npm install
npm run build:ssr
```</content>
<parameter name="filePath">/home/joshua/Documents/studio/DEPLOYMENT.md