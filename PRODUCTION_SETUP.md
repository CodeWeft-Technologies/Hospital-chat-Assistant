# 🚀 Production Database Setup Guide

## Current Issue
The application is using SQLite in production instead of PostgreSQL, which causes:
- Limited functionality
- No proper database features
- Potential data loss

## Solution: Configure PostgreSQL for Production

### For Render.com Deployment:

1. **Add Environment Variables in Render Dashboard:**
   ```
   DATABASE_URL=postgresql://postgres:ykxVXJk0Tj0dcLSY@db.mldyhilykclbfogcavre.supabase.co:5432/postgres
   DB_HOST=db.mldyhilykclbfogcavre.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=ykxVXJk0Tj0dcLSY
   FLASK_ENV=production
   ```

2. **Verify Database Connection:**
   - Check if the Supabase database is accessible
   - Ensure the connection string is correct
   - Test the connection from Render

### For Other Platforms:

#### Heroku:
```bash
heroku config:set DATABASE_URL=postgresql://user:pass@host:port/db
heroku config:set FLASK_ENV=production
```

#### Docker:
Update `docker-compose.yml`:
```yaml
environment:
  - DATABASE_URL=postgresql://postgres:password@db:5432/hospital_chat
  - FLASK_ENV=production
```

#### VPS/Server:
Create `.env` file:
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
FLASK_ENV=production
```

## Database Migration Steps

1. **Run Migrations:**
   ```bash
   python migrate_db.py
   python app/migrate_data.py
   ```

2. **Verify Tables Created:**
   - departments
   - doctors  
   - appointments
   - users
   - hospital_info

3. **Test Database Connection:**
   ```bash
   curl https://your-app.com/health
   ```

## Troubleshooting

### If Database Connection Fails:

1. **Check Environment Variables:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test Connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check Logs:**
   - Look for "Connected to Supabase PostgreSQL database"
   - Should NOT see "Using SQLite database for development"

### Common Issues:

1. **Wrong DATABASE_URL format:**
   - Should start with `postgresql://`
   - Include username, password, host, port, database

2. **Network Issues:**
   - Check if database host is accessible
   - Verify firewall settings
   - Check SSL requirements

3. **Authentication Issues:**
   - Verify username/password
   - Check database permissions

## Expected Log Output

**✅ Correct (PostgreSQL):**
```
Connected to Supabase PostgreSQL database
INFO:app:Found 3 departments in Supabase
INFO:app:Found 2 doctors in Supabase
```

**❌ Incorrect (SQLite):**
```
Using SQLite database for development - no Supabase connection
WARNING:app:Using SQLite database - falling back to JSON data
```

## Next Steps

1. Update environment variables in your deployment platform
2. Redeploy the application
3. Verify the health check shows PostgreSQL connection
4. Test the booking flow end-to-end
