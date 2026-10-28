# PSV Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd code/frontend
npm install
```

### 2. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:4200`

## Mapbox Runtime Configuration

The Mapbox access token is read from `src/assets/runtime-config.js` at runtime.
Keep the checked-in value empty; configure a newly issued, URL-restricted token
in the deployed copy of `assets/runtime-config.js`. Do not add the token to
Angular environment files or commit it to source control.

## Project Structure

```
code/frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Core functionality
│   │   │   ├── guards/              # Route guards (auth.guard.ts)
│   │   │   ├── interceptors/        # HTTP interceptors (api.interceptor.ts)
│   │   │   └── services/            # Core services
│   │   │       ├── auth.service.ts  # Authentication service
│   │   │       └── base-api.service.ts  # Base API service
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/               # Authentication
│   │   │   │   └── login/         # Login component
│   │   │   └── dashboard/          # Dashboard
│   │   ├── app.component.ts        # Root component
│   │   └── app.routes.ts           # Routing configuration
│   ├── environments/               # Environment configs
│   │   ├── environment.ts         # Development
│   │   └── environment.prod.ts   # Production
│   ├── index.html                  # HTML entry point
│   ├── main.ts                     # Application bootstrap
│   └── styles.scss                 # Global styles
├── angular.json                    # Angular CLI configuration
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript configuration
```

## Key Features Implemented

### ✅ Core Infrastructure
- Angular 17+ standalone components
- Production API integration (`https://wb.psv.dimts.in/wbsdcpsvapi`)
- HTTP interceptor for API calls
- Environment configuration

### ✅ Authentication
- Login component with Material Design
- Auth service with token management
- Route guard for protected routes
- Logout functionality

### ✅ Dashboard
- Basic dashboard component
- Protected route
- Navigation structure

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm start
   ```

3. **Test Login**
   - Navigate to `http://localhost:4200`
   - Use your PSV credentials to login
   - Should redirect to dashboard on success

4. **Continue Development**
   - Add menu/navigation system
   - Implement dashboard components
   - Migrate master data modules
   - Add error handling
   - Implement loading states

## Troubleshooting

### CORS Issues
If you encounter CORS errors, you may need to:
1. Configure proxy (see `proxy.conf.json` example in API Integration Guide)
2. Or configure CORS on the backend

### Module Not Found
If you see module errors:
```bash
npm install
```

### Angular CLI Not Found
Install Angular CLI globally:
```bash
npm install -g @angular/cli@17
```

## Development Notes

- All API calls go through the HTTP interceptor
- Authentication token is stored in localStorage
- Production API URL is configured in environment files
- Components use Angular Material for UI

## Documentation

- [API Integration Guide](../../documentation/api/API_INTEGRATION.md)
- [Migration Strategy](../../documentation/migration/MIGRATION_STRATEGY.md)
- [Technology Stack](../../documentation/architecture/TECH_STACK.md)
