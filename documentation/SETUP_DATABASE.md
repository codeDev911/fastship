# Database Setup Guide

## Prerequisites

1. PostgreSQL database instance (local or cloud)
2. Node.js 18+ and npm/pnpm

## Step 1: Environment Variables

Create or update `.env.local` file in your project root:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/delivery_platform"

# Optional: Other variables you might need
NODE_ENV=development
```

Replace:
- `username`: Your PostgreSQL user
- `password`: Your PostgreSQL password
- `localhost`: Your database host (localhost for local, or cloud provider URL)
- `delivery_platform`: Your database name

## Step 2: Install Dependencies

```bash
npm install
# or
pnpm install
```

This will install:
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI
- All other project dependencies

## Step 3: Create and Run Migrations

Run the initial Prisma migration to create all tables:

```bash
npm run prisma:migrate
```

This command will:
1. Check your PostgreSQL connection
2. Create all tables and relationships defined in `/prisma/schema.prisma`
3. Generate Prisma client types

## Step 4: (Optional) View Database in Prisma Studio

To visually inspect and manage your database:

```bash
npm run prisma:studio
```

This opens a web interface at http://localhost:5555

## Step 5: Start Development Server

```bash
npm run dev
```

Your application will be available at http://localhost:3000

## Verification

Test the setup by:

1. **Test API endpoint**: Visit http://localhost:3000/api/shipments in your browser
   - Should return `{ data: [], pagination: { total: 0, skip: 0, limit: 50 } }`

2. **Register a user**: Make a POST request to `/api/auth/register`
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "phone": "1234567890",
       "name": "Test User",
       "password": "password123",
       "role": "SELLER"
     }'
   ```

3. **Check Prisma Studio**: Run `npm run prisma:studio` and verify the User was created

## Troubleshooting

### Connection Error: "connect ECONNREFUSED"
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check username and password

### Permission Error: "permission denied for schema public"
- Ensure your PostgreSQL user has CREATE privileges
- Try: `GRANT ALL PRIVILEGES ON DATABASE delivery_platform TO username;`

### "table already exists"
- Tables already created from previous migration
- Use `npx prisma migrate resolve --applied migration_name` to mark migration as applied

### Reset Database (Development Only)

⚠️ **WARNING**: This will delete ALL data!

```bash
npx prisma migrate reset
```

This will:
1. Drop all tables
2. Recreate from migrations
3. Run seed scripts (if configured)

## Environment-Specific Setup

### Local Development
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/delivery_local"
NODE_ENV=development
```

### Production
```env
DATABASE_URL="postgresql://prod_user:secure_password@prod-host:5432/delivery_prod"
NODE_ENV=production
```

Use different database names and users for local vs production.

## Cloud Database Providers

### Vercel Postgres
```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]"
```

### AWS RDS
```env
DATABASE_URL="postgresql://admin:password@mydb.rds.amazonaws.com:5432/delivery_db"
```

### Railway
Copy the connection string directly from Railway dashboard

### Supabase
```env
DATABASE_URL="postgresql://postgres:[password]@[host].supabase.co:5432/postgres"
```

## Backup & Recovery

### Backup Database
```bash
pg_dump -U username -d delivery_platform > backup.sql
```

### Restore Database
```bash
psql -U username -d delivery_platform < backup.sql
```

## Monitor Schema Changes

After updating `/prisma/schema.prisma`:

1. Create migration:
   ```bash
   npm run prisma:migrate
   ```

2. Review the generated SQL migration file

3. Apply to database (automatic in dev mode)

## Useful Commands

```bash
# Generate Prisma client (auto on migrate)
npm run prisma:generate

# View database in Prisma Studio
npm run prisma:studio

# Reset database (DEV ONLY)
npx prisma migrate reset

# Show migration status
npx prisma migrate status

# Create manual migration
npx prisma migrate dev --name add_new_field
```

## Next Steps

Once database is set up:

1. Review `/BACKEND_IMPLEMENTATION.md` for API details
2. Check `/app/api/*` route files for endpoint documentation
3. Test API endpoints using curl or Postman
4. Update components to use new API hooks from `/lib/hooks.ts`

## Support

For Prisma issues, refer to: https://www.prisma.io/docs/
For PostgreSQL issues, refer to: https://www.postgresql.org/docs/
