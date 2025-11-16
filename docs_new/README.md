# Social Communication Platform - Documentation

Welcome to the comprehensive documentation for the Social Communication Platform. This documentation provides everything needed to understand, develop, and deploy the platform.

## 📁 Documentation Structure

```
docs_new/
├── README.md                    # This file
├── API_COMPLETE.md              # Complete API documentation for frontend implementation
├── getting-started/             # Quick start and installation guides
│   ├── quickstart.md            # 5-minute quick start guide
│   ├── installation.md          # Detailed installation instructions
│   └── configuration.md         # Environment configuration guide
├── api/                         # API documentation
│   ├── endpoints.md             # Detailed REST API endpoints
│   ├── websocket.md             # WebSocket events and usage
│   └── examples.md              # API usage examples
├── architecture/                # System architecture and design
│   ├── overview.md              # High-level architecture overview
│   ├── components.md            # Component breakdown
│   └── data-models.md           # Database schema and models
├── development/                 # Development guides
│   ├── setup.md                 # Development environment setup
│   ├── testing.md               # Testing guidelines
│   └── contributing.md          # Contribution guidelines
├── guides/                      # User guides and tutorials
│   ├── authentication.md        # Authentication guide
│   ├── messaging.md             # Messaging features guide
│   ├── groups.md                # Group management guide
│   ├── calls.md                 # Audio/video calling guide
│   └── deployment.md            # Deployment guide
└── reference/                   # Reference materials
    ├── error-codes.md           # Error codes and handling
    ├── rate-limiting.md         # Rate limiting policies
    └── security.md              # Security best practices
```

## 🚀 Quick Start

To get started quickly with the Social Communication Platform:

1. **Installation**: Follow the [Installation Guide](getting-started/installation.md)
2. **Quick Start**: Check the [Quick Start Guide](getting-started/quickstart.md)
3. **API Integration**: Use the [Complete API Documentation](API_COMPLETE.md) to build your frontend
4. **Architecture**: Understand the system design with the [Architecture Overview](architecture/overview.md)

## 📚 Key Documentation

### For Frontend Developers
- [Complete API Documentation](API_COMPLETE.md) - Everything needed to build a frontend
- [API Examples](api/examples.md) - Practical usage examples
- [Authentication Guide](guides/authentication.md) - Implementation details

### For Backend Developers
- [Architecture Overview](architecture/overview.md) - System design principles
- [Data Models](architecture/data-models.md) - Database schema
- [Development Setup](development/setup.md) - Environment configuration

### For DevOps Engineers
- [Deployment Guide](guides/deployment.md) - Production deployment
- [Configuration Guide](getting-started/configuration.md) - Environment variables
- [Security Best Practices](reference/security.md) - Security guidelines

## 🛠️ Technologies Used

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for WebSocket communication
- **Authentication**: JWT with access/refresh token system
- **Caching**: Redis
- **Calling**: Jitsi Meet integration
- **Documentation**: Swagger/OpenAPI, Markdown
- **Testing**: Vitest
- **Deployment**: Docker, Docker Compose

## 📞 Support

For issues, questions, or feature requests:
1. Check the relevant documentation sections
2. Review the [Error Codes Reference](reference/error-codes.md)
3. Open an issue in the repository

## 🤝 Contributing

We welcome contributions to improve the documentation:
1. Follow the structure outlined above
2. Update the [Development Guide](development/contributing.md)
3. Submit a pull request with your changes