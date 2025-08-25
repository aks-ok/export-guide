# ExportGuide - Export Guide System

[![CI/CD Pipeline](https://github.com/your-org/export-guide/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/export-guide/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)

A comprehensive export research and lead generation system designed to help businesses identify, evaluate, and pursue international export opportunities while ensuring compliance with export regulations.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/export-guide.git
cd export-guide

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## ✨ Features

### 🔍 Export Compliance
- **Denied Party Screening**: Real-time screening against restricted party lists
- **Export Control Classification**: ECCN and product classification
- **License Requirements**: Automated license requirement determination
- **Compliance Reporting**: Comprehensive audit trails and reporting

### 📊 Market Research
- **Market Opportunity Discovery**: AI-powered identification of export opportunities
- **Trade Data Analysis**: Historical and current trade flow analysis
- **Tariff Calculator**: Real-time tariff and duty calculations
- **Market Intelligence**: Competitive landscape and growth trend analysis

### 🎯 Lead Generation
- **Intelligent Lead Scoring**: ML-based lead qualification and scoring
- **Contact Management**: Comprehensive contact database and communication tracking
- **Lead Nurturing**: Automated follow-up and workflow management
- **CRM Integration**: Seamless integration capabilities

### 📈 Analytics & Reporting
- **Performance Dashboard**: Real-time export performance metrics
- **Custom Reports**: Configurable reporting and data export
- **Market Intelligence**: Actionable insights and recommendations

## 🏗️ Architecture

- **Frontend**: React 18 with TypeScript, Material-UI
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **State Management**: React Query for server state
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Docker, Vercel, AWS support

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- API keys for external services (optional for development)

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start development server
npm test           # Run unit tests
npm run build      # Build for production
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking

# Comprehensive testing
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:comprehensive # All tests with coverage
```

### Environment Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase**
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up database**
   ```bash
   # Run migrations in order
   npm run db:migrate
   ```

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # Business logic and API services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

## 🚀 Deployment

### Quick Deploy Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Docker
```bash
# Build and run
docker build -t exportright .
docker run -p 80:80 exportright
```

#### AWS S3 + CloudFront
```bash
# Build and deploy
npm run build
aws s3 sync build/ s3://your-bucket --delete
```

For detailed deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📚 Documentation

- [📖 User Guide](docs/USER_GUIDE.md) - Complete user documentation
- [🔧 API Documentation](docs/API.md) - API reference and examples
- [🚀 Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions
- [📝 Changelog](docs/CHANGELOG.md) - Version history and updates

## 🧪 Testing

### Test Coverage

- **Unit Tests**: Component and service-level testing
- **Integration Tests**: Cross-component workflow testing
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Large dataset and performance validation
- **Security Tests**: Data protection and vulnerability testing

```bash
# Run all tests with coverage
npm run test:comprehensive

# Run specific test suites
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:security
```

## 🔒 Security

- Row Level Security (RLS) enforced at database level
- Input validation and sanitization
- HTTPS enforcement and security headers
- Regular security audits and dependency updates
- Compliance with export control regulations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Use semantic commit messages
- Update documentation for API changes
- Ensure accessibility compliance (WCAG 2.1 AA)

## 📊 Performance

- **Page Load**: < 2 seconds initial load
- **Database**: Optimized queries with proper indexing
- **Caching**: Intelligent caching for API responses
- **Mobile**: Responsive design for all screen sizes
- **Accessibility**: WCAG 2.1 AA compliant

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: [Create a GitHub issue](https://github.com/your-org/export-guide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/export-guide/discussions)

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Database and auth powered by [Supabase](https://supabase.com/)
- UI components from [Material-UI](https://mui.com/)
- Testing with [Jest](https://jestjs.io/) and [Playwright](https://playwright.dev/)

---

**ExportRight** - Empowering international trade through intelligent compliance and market research.