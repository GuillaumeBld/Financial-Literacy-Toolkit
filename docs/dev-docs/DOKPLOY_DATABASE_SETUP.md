# Dokploy Database Configuration

## Correct DATABASE_URL Format

For the Financial Literacy Assessment project in Dokploy, use this connection string:

```
DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy
```

## Configuration Steps

1. **Go to Project Environment:**
   - Navigate to: Projects > financial-literacy-assessment > production
   - Click on "Project Environment" or environment variables section

2. **Set DATABASE_URL:**
   - Add or update the `DATABASE_URL` variable
   - Use the connection string above
   - **Important:** Use the service name `finlit-postgres-db-g6ifwu`, not the full container ID

3. **Reference in Service:**
   - In your service environment variables, reference it as:
   ```
   DATABASE_URL=${{project.DATABASE_URL}}
   ```

4. **Restart Service:**
   - After updating, restart the application service for changes to take effect

## Connection String Components

- **User:** `finlit_user` (not `postgres`)
- **Password:** `FinLit2025SecurePassword`
- **Host:** `finlit-postgres-db-g6ifwu` (Docker service name on dokploy-network)
- **Port:** `5432`
- **Database:** `financial_literacy`

## Verification

After setting up, verify the connection works:

1. Check application logs for database connection errors
2. Test instructor login: `test.instructor@university.edu` / `TestInstructor123!`
3. Test course validation: Course Code `Financial Literacy`

## Troubleshooting

### Connection Refused
- Verify the database container is running
- Check that both containers are on the same Docker network (`dokploy-network`)
- Ensure the service name matches exactly

### Authentication Failed
- Verify username is `finlit_user` (not `postgres`)
- Verify password is `FinLit2025SecurePassword`
- Check database user exists: `SELECT current_user;`

### Database Not Found
- Verify database name is `financial_literacy`
- Check database exists: `SELECT current_database();`

