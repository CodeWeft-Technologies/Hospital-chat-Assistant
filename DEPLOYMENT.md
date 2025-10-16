# Hospital Chat Assistant - Deployment Guide

This guide covers various deployment options for the Hospital Chat Assistant application.

## 🚀 Quick Deployment Options

### 1. Heroku Deployment

1. **Prepare your application:**
   ```bash
   # Clone the repository
   git clone <your-repo-url>
   cd Hospital-chat-Assistant-main
   
   # Copy environment template
   cp env.example .env
   ```

2. **Configure environment variables:**
   Edit `.env` file with your production values:
   ```bash
   FLASK_SECRET_KEY=your-super-secret-key-here
   DATABASE_URL=your-postgresql-database-url
   FLASK_ENV=production
   ```

3. **Deploy to Heroku:**
   ```bash
   # Install Heroku CLI and login
   heroku login
   
   # Create Heroku app
   heroku create your-app-name
   
   # Set environment variables
   heroku config:set FLASK_SECRET_KEY=your-secret-key
   heroku config:set DATABASE_URL=your-database-url
   heroku config:set FLASK_ENV=production
   
   # Deploy
   git push heroku main
   ```

### 2. Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   # Copy environment file
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   
   # Start services
   docker-compose up -d
   ```

2. **Build and run manually:**
   ```bash
   # Build the image
   docker build -t hospital-chat-assistant .
   
   # Run the container
   docker run -d \
     --name hospital-chat \
     -p 5000:5000 \
     -e FLASK_SECRET_KEY=your-secret-key \
     -e DATABASE_URL=your-database-url \
     hospital-chat-assistant
   ```

### 3. Traditional Server Deployment

1. **Server requirements:**
   - Ubuntu 20.04+ or CentOS 8+
   - Python 3.11+
   - PostgreSQL 13+
   - Nginx (optional, for reverse proxy)

2. **Installation steps:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Python and dependencies
   sudo apt install python3.11 python3.11-pip python3.11-venv postgresql nginx
   
   # Clone repository
   git clone <your-repo-url>
   cd Hospital-chat-Assistant-main
   
   # Create virtual environment
   python3.11 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Configure environment
   cp env.example .env
   nano .env  # Edit with your settings
   
   # Run the application
   ./run.sh
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FLASK_SECRET_KEY` | Yes | Secret key for Flask sessions | `your-super-secret-key` |
| `DATABASE_URL` | Yes | PostgreSQL database URL | `postgresql://user:pass@host:port/db` |
| `FLASK_ENV` | No | Environment (production/development) | `production` |
| `DEBUG` | No | Debug mode (true/false) | `false` |
| `PORT` | No | Port to run on | `5000` |
| `HOST` | No | Host to bind to | `0.0.0.0` |

### Database Setup

1. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE hospital_chat;
   CREATE USER hospital_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE hospital_chat TO hospital_user;
   ```

2. **Initialize database tables:**
   ```bash
   # Run the application once to create tables
   python app/app.py
   ```

### SSL/HTTPS Configuration

For production deployments, always use HTTPS:

1. **Obtain SSL certificates** (Let's Encrypt recommended)
2. **Configure Nginx** with SSL:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## 📊 Monitoring and Maintenance

### Health Checks

The application includes a health check endpoint:
```bash
curl http://your-domain.com/health
```

### Logging

Logs are written to:
- Console output (for Docker/Heroku)
- `logs/app.log` (for traditional deployments)

### Database Maintenance

1. **Regular backups:**
   ```bash
   pg_dump hospital_chat > backup_$(date +%Y%m%d).sql
   ```

2. **Cleanup old appointments:**
   The application automatically cleans up appointments older than 60 days.

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change default `FLASK_SECRET_KEY`
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup data regularly

### API Security

- Rate limiting is configured in Nginx
- CORS is properly configured
- Security headers are set
- Input validation is implemented

## 🚨 Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check `DATABASE_URL` format
   - Verify database server is running
   - Check firewall settings

2. **Permission errors:**
   - Ensure proper file permissions
   - Check user permissions for upload directories

3. **Memory issues:**
   - Monitor memory usage
   - Adjust Gunicorn worker count
   - Consider upgrading server resources

### Debug Mode

For debugging, set in `.env`:
```bash
FLASK_ENV=development
DEBUG=true
```

## 📈 Performance Optimization

### Production Optimizations

1. **Gunicorn configuration:**
   - Workers: 4 (adjust based on CPU cores)
   - Timeout: 120 seconds
   - Keep-alive: 2 seconds

2. **Database optimization:**
   - Connection pooling enabled
   - Regular VACUUM and ANALYZE
   - Proper indexing

3. **Static file serving:**
   - Use Nginx for static files
   - Enable gzip compression
   - Set proper cache headers

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Update dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Restart services:**
   ```bash
   # For Docker
   docker-compose restart
   
   # For traditional deployment
   sudo systemctl restart hospital-chat
   ```

### Backup Strategy

1. **Database backups:**
   ```bash
   # Daily backup script
   pg_dump hospital_chat | gzip > backups/hospital_chat_$(date +%Y%m%d).sql.gz
   ```

2. **File backups:**
   ```bash
   # Backup uploads and generated files
   tar -czf backups/files_$(date +%Y%m%d).tar.gz app/static/uploads app/data/slips
   ```

## 📞 Support

For deployment issues:
1. Check the logs: `tail -f logs/app.log`
2. Verify environment variables
3. Test database connectivity
4. Check firewall and network settings

For additional support, please refer to the main README.md file.
