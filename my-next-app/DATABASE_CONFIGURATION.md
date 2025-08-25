# Dynamic Database Configuration Guide

This application uses **automatic environment detection** to handle database configuration, eliminating the need for manual updates between environments.

## 🚀 How It Works

### Local Development (SQLite)
- Automatically uses SQLite (`file:./dev.db`) for fast local development
- No external database setup required
- Perfect for rapid prototyping and testing

### Vercel Deployment (PostgreSQL)  
- Vercel automatically provides PostgreSQL via environment variables
- No manual database URL configuration needed
- Seamless production deployment

### Other Hosting (PostgreSQL)
- Set `DATABASE_URL` environment variable with your PostgreSQL connection string
- Application automatically detects and configures accordingly

## 🎯 Environment Detection System

The application uses `src/lib/database-config.ts` for intelligent environment detection:

```typescript
// Automatically detects database type from URL
const config = getDatabaseConfig()
// Returns: { provider: 'sqlite' | 'postgresql', url: string, isDevelopment: boolean }
```

### Features:
- ✅ **Automatic Provider Detection** - SQLite vs PostgreSQL based on URL format
- ✅ **Environment Awareness** - Development vs Production optimizations  
- ✅ **Connection Pooling** - Optimized per database type
- ✅ **Error Handling** - Database-specific error formatting
- ✅ **Migration Strategy** - `db-push` for dev, `migrate-deploy` for production

## 📋 Environment Variables

### Required Variables
```bash
# Database (automatically detected)
DATABASE_URL="file:./dev.db"                    # Local SQLite
# DATABASE_URL="postgresql://..."              # Production PostgreSQL

# NextAuth
NEXTAUTH_SECRET="your-secret-key"              # Generate: openssl rand -base64 32  
NEXTAUTH_URL="http://localhost:3000"           # Your app URL
```

### Optional Variables  
```bash
NODE_ENV="development"                         # Environment mode
```

## 🔧 Development Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (DATABASE_URL defaults to SQLite)
   ```

3. **Database Setup** 
   ```bash
   npx prisma generate    # Generate Prisma client
   npx prisma db push     # Create/update database schema
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## 🚀 Vercel Deployment

### Automatic PostgreSQL Setup
Vercel automatically:
- Provisions PostgreSQL database
- Sets `DATABASE_URL` environment variable  
- Handles SSL configuration
- Manages connection pooling

### Deployment Steps
1. **Connect Repository** to Vercel
2. **Environment Variables** - Vercel sets `DATABASE_URL` automatically
3. **Deploy** - Vercel handles database migration and client generation

### Manual Environment Variables (if needed)
```bash
# In Vercel Dashboard > Settings > Environment Variables
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

## 📊 Database Compatibility

### Supported Operations
Both SQLite and PostgreSQL support:
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Transactions and constraints
- ✅ Foreign keys and relationships  
- ✅ Indexes and performance optimization
- ✅ JSON data types (with different syntax)

### Automatic Handling
The application automatically handles:
- **Decimal Precision** - Currency calculations consistent across databases
- **Date Formatting** - ISO string format for cross-compatibility  
- **Boolean Values** - Normalized boolean handling
- **Error Messages** - User-friendly error formatting
- **Connection Management** - Optimized per database type

## 🛠 Database Management Commands

### Local Development (SQLite)
```bash
# Update schema
npx prisma db push

# View data  
npx prisma studio

# Reset database
rm prisma/dev.db && npx prisma db push
```

### Production (PostgreSQL)
```bash
# Generate migration
npx prisma migrate dev --name description

# Deploy migration  
npx prisma migrate deploy

# Backup/restore handled by hosting provider
```

## 🔍 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check configuration
npm run validate-env

# Verify database URL format
echo $DATABASE_URL
```

**2. Schema Mismatch**  
```bash
# Reset local database
rm prisma/dev.db
npx prisma generate
npx prisma db push
```

**3. Vercel Deployment Issues**
- Check Vercel environment variables
- Ensure `DATABASE_URL` is set by Vercel
- Verify build logs for migration errors

### Environment Validation
```typescript
import { validateEnvironment, getDatabaseConfig } from '@/lib/database-config'

// Check environment setup
const validation = validateEnvironment()
const dbConfig = getDatabaseConfig()
```

## 📈 Performance Optimizations

### SQLite (Development)
- Single connection (no pooling needed)
- Fast file-based operations
- In-memory caching
- Quick database resets

### PostgreSQL (Production)  
- Connection pooling (max 10 connections)
- Prepared statements
- Index optimization
- SSL connections

## 🔐 Security Considerations

### Local Development
- SQLite file permissions restricted to user
- No network exposure
- Development-only secret keys

### Production
- SSL-encrypted connections (enforced)
- Environment variable security (Vercel manages)
- Connection string protection
- Automated backup management

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Vercel PostgreSQL Guide](https://vercel.com/docs/storage/vercel-postgres)  
- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [Database Configuration Source Code](./src/lib/database-config.ts)

---

**Key Advantage**: This system eliminates manual database URL updates. The application automatically detects and configures the appropriate database for each environment, ensuring seamless development and deployment workflows.