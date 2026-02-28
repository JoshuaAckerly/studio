# Studio

A modern web application built with Laravel 12 and React 19, featuring game development tools and asset management with Inertia.js for seamless full-stack development.

## 🚀 Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 with TypeScript
- **Game Engine**: Phaser.js for HTML5 game development
- **Styling**: Tailwind CSS 4.0
- **Build Tool**: Vite 7
- **Database**: MySQL 8.0
- **Storage**: AWS S3 with MinIO local development
- **Testing**: PHPUnit + Jest

## 📋 Prerequisites

- PHP 8.2 or higher
- Node.js 18+ and npm
- Composer
- MySQL 8.0 (or your preferred database)
- MinIO (for local S3-compatible storage testing)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studio
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database setup**
   ```bash
   # Configure your database in .env
   php artisan migrate
   ```

6. **Build assets**
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development Mode

```bash
# Start Laravel server
php artisan serve --port=8003

# Start Vite dev server (in another terminal)
npm run dev

# Start SSR server (in another terminal)
php artisan inertia:start-ssr --port=13716
```

Visit `http://localhost:8003` to access the application.

### Polyrepo Development

If running multiple projects together:

```bash
# From the polyrepo root
./scripts/manage-all-projects.sh start
```

## 🎮 Game Development Features

### Asset Management
- Sprite sheet generation and conversion
- Atlas file processing for Phaser.js
- S3-compatible storage integration
- Local MinIO setup for development

### Build Tools
```bash
# Convert texture packer atlases to Phaser format
npm run convert-atlas -- public/games/noteleks/sprites

# Generate spritesheets
npm run make-spritesheet

# Build for production with SSR
npm run build:ssr
```

## 🧪 Testing

### PHP Tests
```bash
php artisan test
```

### JavaScript Tests
```bash
npm test
```

### Integration Tests with MinIO
See `README_TESTING.md` for detailed MinIO testing setup.

## 📁 Project Structure

```
studio/
├── app/                    # Laravel application code
├── resources/              # Frontend assets and views
│   └── js/                 # React/TypeScript source
├── public/                 # Public assets
│   └── games/             # Game assets and builds
├── database/              # Migrations and seeders
├── scripts/               # Utility scripts
├── tools/                 # Development tools
├── TODO/                  # Project task tracking
└── docs/                  # Additional documentation
```

## 🔧 Development Tools

- **Code Formatting**: Prettier
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **PHP Analysis**: PHPStan
- **Asset Processing**: Custom scripts for game assets

## 📚 Documentation

- [Development Setup](DEVELOPMENT.md) - Complete development environment guide
- [Deployment Guide](DEPLOYMENT.md) - Production and test deployment
- [Testing Guide](README_TESTING.md) - Testing with MinIO integration
- [MinIO Setup](README_MINIO_LOCAL.md) - Local S3-compatible storage
- [Migration Tools](README_MIGRATION.md) - Asset migration utilities
- [Debug Guide](README_DEBUG.md) - Debugging storage integration

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production and test server deployment instructions.

### Quick Deploy
```bash
# Production
./deploy-production.sh

# Test server
./deploy-test.sh
```

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Use the TODO system for tracking work

## 📄 License

This project is licensed under the MIT License.</content>
<parameter name="filePath">/home/joshua/Documents/studio/README.md