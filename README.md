# PSV Frontend - Angular 22

Modern frontend application for PSV (Public Service Vehicle) management system.

## Technology Stack

- **Angular**: 22
- **TypeScript**: 6.0+
- **Angular Material**: 22
- **RxJS**: 7.8+

## Development Setup

### Prerequisites

- Node.js 22.22.3+ or 24.15+
- npm 9+ or yarn 1.22+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Development Server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Project Structure

```
src/
├── app/
│   ├── core/              # Core services, guards, interceptors
│   │   ├── guards/        # Route guards
│   │   ├── interceptors/  # HTTP interceptors
│   │   └── services/      # Core services (auth, base API)
│   ├── features/          # Feature modules
│   │   ├── auth/         # Authentication module
│   │   └── dashboard/    # Dashboard module
│   └── app.component.ts   # Root component
├── environments/          # Environment configuration
└── styles.scss           # Global styles
```

## API Configuration

Production API: `https://wb.psv.dimts.in/wbsdcpsvapi`

Configured in:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

## Features Implemented

- ✅ Angular 22 project setup
- ✅ Production API integration
- ✅ HTTP interceptor for API calls
- ✅ Authentication service
- ✅ Login component
- ✅ Dashboard component
- ✅ Route guards
- ✅ Angular Material UI

## Next Steps

1. Implement encryption for login credentials
2. Add menu/navigation system
3. Migrate dashboard components
4. Implement master data modules
5. Add error handling service
6. Implement loading states

## Documentation

See parent directory documentation:
- [API Integration Guide](../../documentation/api/API_INTEGRATION.md)
- [Migration Strategy](../../documentation/migration/MIGRATION_STRATEGY.md)
- [Technology Stack](../../documentation/architecture/TECH_STACK.md)
