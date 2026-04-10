# Studio

> A comprehensive portfolio and personal brand website showcasing art, graphic design, illustrations, video work, music, social media, and a personal blog.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://reactjs.org)

## 🎨 Overview

Studio is a modern portfolio platform designed to showcase creative work across multiple mediums. It serves as a centralized hub for an artist, designer, musician, and content creator to present their portfolio and connect with audiences.

**Features**:

- 🎨 **Art & Design Portfolio**: Gallery and showcase for artwork
- 📹 **Video Showcase**: Display video work and demonstrations
- 🎵 **Music Library**: Share music releases and samples
- ✍️ **Blog**: Personal writing and insights
- 📱 **Social Media Integration**: Display social feeds
- 📧 **Contact Management**: Receive inquiries and messages
- 🖼️ **Media Management**: S3/MinIO storage for assets
- ⚡ **Fast & Responsive**: Optimized for all devices

## 🛠 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Laravel 12 | Portfolio management |
| **Frontend** | React 19 | Interactive interface |
| **Language** | TypeScript 5.7 | Type-safe code |
| **Styling** | Tailwind CSS 4 | Responsive design |
| **Database** | MySQL 8.0+ | Portfolio data |
| **Storage** | AWS S3/MinIO | Media assets |
| **Build Tool** | Vite 7 | Development & bundling |
| **Testing** | PHPUnit + Jest | Quality assurance |

## 🚀 Quick Start

### Prerequisites

- PHP 8.2 or higher
- Node.js 18+ and npm
- Composer
- MySQL 8.0 or higher
- AWS S3 account or MinIO (for local development)

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR-USERNAME/studio.git
cd studio

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate

# Configure S3/MinIO storage
# Edit .env with storage credentials

# Start development servers
# Terminal 1: Laravel
php artisan serve --port=8000

# Terminal 2: Vite
npm run dev

# Terminal 3: SSR (optional)
php artisan inertia:start-ssr --port=13716
```

### Development URLs

- **Main App**: http://localhost:8000
- **Vite Dev Server**: http://localhost:8084
- **SSR Server**: http://localhost:13716 (if enabled)

## 📚 Documentation

- [Development Guide](DEVELOPMENT.md) - Setup and portfolio management
- [Deployment Guide](DEPLOYMENT.md) - Production deployment steps
- [Contributing](CONTRIBUTING.md) - How to contribute

## 📁 Portfolio Structure

The application is organized into:

- **Art Gallery**: Digital and traditional artwork
- **Design Portfolio**: Graphic design and branding projects
- **Illustration Portfolio**: Digital illustrations and character design
- **Video Showcase**: Video work and demonstrations
- **Music Library**: Audio tracks and albums
- **Blog**: Articles and insights
- **Social Integration**: Linked social media accounts
- **Contact**: Inquiry and message management

## ✨ Key Features

### Content Management

- Easy portfolio item creation
- Gallery organization and categorization
- Featured content highlighting
- Media upload and management
- Blog post creation with markdown support

### Social Media Integration

- Instagram feed display
- Twitter/X integration
- LinkedIn profile
- YouTube channel showcase

### User Engagement

- Contact form submissions
- Message handling
- Email notifications
- Portfolio inquiry tracking

### Performance

- Optimized image loading
- Lazy loading for galleries
- Server-side rendering for SEO
- Asset optimization and caching

## 🔧 Building & Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
php artisan migrate --force
php artisan cache:clear
php artisan config:clear
```

## 🚀 Deployment

Detailed deployment instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

```bash
# Quick deployment
npm run build
php artisan migrate --force
systemctl restart studio
```

## 🧪 Testing

```bash
# PHP tests
./vendor/bin/phpunit

# JavaScript tests
npm test

# Coverage report
./vendor/bin/phpunit --coverage-html coverage
```

## 📖 Portfolio Management

### Adding Portfolio Items

1. Navigate to admin panel
2. Create new portfolio item
3. Upload media (images, videos, audio)
4. Add description and details
5. Publish

### Managing Gallery

1. Create gallery collection
2. Add items to gallery
3. Set cover image
4. Configure display settings

### Blog Management

1. Write blog post (supports markdown)
2. Add categories and tags
3. Set publication date
4. Preview before publishing

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

Licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🖼️ Customization

The portfolio is highly customizable:

- **Theme Colors**: Modify in `resources/js/config/theme.ts`
- **Custom Pages**: Add new routes and components
- **Social Links**: Update in `.env` configuration
- **Branding**: Customize logo and colors
- **Domain**: Deploy to your custom domain

## 🔗 Resources

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [AWS S3](https://aws.amazon.com/s3/)

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Showcase your creativity with Studio!** 🎨
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