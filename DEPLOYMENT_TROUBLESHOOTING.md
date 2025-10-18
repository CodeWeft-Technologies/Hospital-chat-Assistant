# 🚨 Deployment Troubleshooting Guide

## Common Deployment Issues & Solutions

### 1. **Departments/Doctors Not Loading (500 Error)**

**Problem**: `/meta/departments` and `/meta/doctors` endpoints return 500 errors in production.

**Root Causes**:
- Database connection issues
- Missing JSON fallback files
- Environment variable misconfiguration

**Solutions**:

#### A. Check Environment Variables
```bash
# Verify these are set in your deployment platform:
DATABASE_URL=postgresql://user:pass@host:port/db
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
FLASK_ENV=production
```

#### B. Verify Database Connection
```bash
# Test database connection
curl https://your-app.com/health
```

#### C. Check JSON Fallback Files
Ensure these files exist in your deployment:
- `app/data/departments.json`
- `app/data/doctors.json`
- `app/data/appointments.json`

### 2. **Health Check Failing**

**Problem**: Health check endpoint returns 500 error.

**Solution**: The health check now returns 200 even if database is disconnected, with warnings.

### 3. **Static Files Not Loading**

**Problem**: CSS/JS files return 404.

**Solution**: Ensure static files are properly copied during build:
```dockerfile
COPY . .
RUN mkdir -p app/static/uploads app/data/slips logs
```

### 4. **Database Migration Issues**

**Problem**: Database tables not created.

**Solution**: Run migrations during build:
```bash
python migrate_db.py
python app/migrate_data.py
```

## 🔧 Quick Fixes

### For Render.com:
1. Add environment variables in dashboard
2. Ensure build command includes migrations
3. Check build logs for errors

### For Docker:
1. Verify docker-compose.yml environment variables
2. Check if database container is running
3. Ensure volumes are properly mounted

### For Heroku:
1. Set config vars in Heroku dashboard
2. Run migrations: `heroku run python migrate_db.py`
3. Check logs: `heroku logs --tail`

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-app.com/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00",
  "database": "connected",
  "environment": "production"
}
```

### 2. Departments Endpoint
```bash
curl https://your-app.com/meta/departments
```
Expected response:
```json
[
  {
    "id": "general_medicine",
    "name": {
      "en": "General Medicine",
      "hi": "जनरल मेडिसिन",
      "mr": "सामान्य वैद्यक"
    }
  }
]
```

### 3. Doctors Endpoint
```bash
curl https://your-app.com/meta/doctors?department_id=general_medicine
```

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection working
- [ ] JSON fallback files present
- [ ] Health check passing
- [ ] Static files accessible
- [ ] Database migrations completed
- [ ] SSL/HTTPS configured
- [ ] Error logging enabled

## 📞 Support

If issues persist:
1. Check application logs
2. Verify environment variables
3. Test endpoints individually
4. Check database connectivity
5. Review build/deployment logs
