# Hospital Chat Assistant - Multi-Tenant System

A comprehensive, API-based hospital management system with AI-powered chat assistant, multi-tenant support, and embeddable widget functionality.

## 🏥 Features

### Core Functionality
- **AI-Powered Chat Assistant** - Natural language processing for appointment booking and general queries
- **Multi-Language Support** - English, Hindi, and Marathi with seamless translation
- **Appointment Management** - Complete booking, editing, and cancellation system
- **Real-time Chat Interface** - Modern, responsive chat UI with 3D effects

### Multi-Tenant Architecture
- **Hospital-Specific Data** - Each hospital maintains its own departments, doctors, and appointments
- **Admin Dashboard** - Comprehensive management interface for hospital administrators
- **API-Based System** - RESTful APIs for all functionality
- **Scalable Design** - Support for unlimited hospitals

### Widget System
- **Embeddable Widget** - Easy integration into any website
- **Customizable Design** - Hospital branding and color schemes
- **Responsive Design** - Works on all devices and screen sizes
- **Floating Chat Interface** - Non-intrusive chat widget

## 🚀 Quick Start

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd AI\ Chat\ Assistant
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
export JWT_SECRET_KEY="your-secret-key-here"
export FLASK_ENV="development"
```

4. **Run the application**
```bash
python app/app.py
```

5. **Access the system**
- Main Interface: `http://localhost:5000`
- Admin Dashboard: `http://localhost:5000/admin/login`
- API Documentation: `http://localhost:5000/api/v1`

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Widget    │    │  Admin Panel    │    │  Mobile App     │
│   (Embeddable)  │    │  (Management)   │    │  (Future)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Flask API     │
                    │   (Backend)     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (Multi-tenant)│
                    └─────────────────┘
```

### API Structure

```
/api/v1/
├── hospitals/                 # Hospital management
│   ├── GET /                 # List all hospitals
│   ├── GET /{id}             # Get hospital details
│   └── {id}/
│       ├── departments/      # Department management
│       ├── doctors/          # Doctor management
│       ├── appointments/     # Appointment management
│       ├── chat/             # Chat functionality
│       └── widget/config     # Widget configuration
├── auth/                     # Authentication
│   └── login                 # Admin login
└── widget/                   # Widget endpoints
    └── {id}/embed.js         # Widget embed script
```

## 🎨 UI/UX Features

### Modern Design System
- **3D Card Effects** - Depth and visual hierarchy
- **Gradient Backgrounds** - Modern, professional appearance
- **Smooth Animations** - Enhanced user experience
- **Responsive Design** - Mobile-first approach

### Color Scheme
- **Primary Blue**: `#2563eb` - Trust and professionalism
- **Secondary Green**: `#059669` - Health and wellness
- **Accent Purple**: `#7c3aed` - Innovation and technology
- **Neutral Grays**: Professional and clean

### Typography
- **Font Family**: Inter (system font stack)
- **Font Weights**: 400, 500, 600, 700, 800
- **Responsive Sizing**: Scales appropriately across devices

## 🔧 Configuration

### Hospital Setup

1. **Access Admin Dashboard**
   - URL: `/admin/login`
   - Default credentials: `xyz_hospital` / `admin123`

2. **Configure Hospital Information**
   - Hospital name and branding
   - Contact information
   - Color scheme customization

3. **Add Departments and Doctors**
   - Multi-language support
   - Detailed doctor profiles
   - Availability schedules

### Widget Integration

#### Basic Integration
```html
<!-- Add to your website -->
<div id="hospital-chat-widget"></div>
<script>
(function() {
    var script = document.createElement('script');
    script.src = 'http://your-domain.com/widget/your-hospital-id/embed.js';
    script.async = true;
    document.head.appendChild(script);
})();
</script>
```

#### Advanced Configuration
```html
<div id="hospital-chat-widget" 
     data-hospital-id="your-hospital-id"
     data-position="bottom-right"
     data-size="medium"
     data-primary-color="#2563eb"
     data-secondary-color="#059669">
</div>
```

## 📱 Usage Examples

### For Patients
1. **Language Selection** - Choose preferred language
2. **Chat Interface** - Natural conversation with AI assistant
3. **Appointment Booking** - Guided booking process
4. **Appointment Management** - View, edit, or cancel appointments

### For Hospital Admins
1. **Dashboard Overview** - Real-time statistics and analytics
2. **Appointment Management** - View and manage all appointments
3. **Department Management** - Add/edit departments and doctors
4. **Widget Configuration** - Customize embeddable widget
5. **Settings Management** - Hospital information and preferences

## 🔌 API Usage

### Authentication
```javascript
// Login
const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        hospital_id: 'your-hospital-id',
        password: 'your-password'
    })
});
const { token } = await response.json();
```

### Chat API
```javascript
// Send chat message
const response = await fetch('/api/v1/hospitals/your-hospital-id/chat', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        message: 'I want to book an appointment',
        session_id: 'session-123',
        language: 'english'
    })
});
```

### Appointment Management
```javascript
// Create appointment
const response = await fetch('/api/v1/hospitals/your-hospital-id/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'John Doe',
        phone: '1234567890',
        department_id: 1,
        doctor_id: 1,
        date: '2024-01-15',
        time: '10:00'
    })
});
```

## 🛠️ Development

### Project Structure
```
AI Chat Assistant/
├── app/
│   ├── api_routes.py          # API endpoints
│   ├── admin_routes.py        # Admin functionality
│   ├── app.py                 # Main Flask application
│   ├── models.py              # Database models
│   ├── services/              # Business logic
│   │   ├── ai.py             # AI chat processing
│   │   ├── data_service_db.py # Database operations
│   │   └── ...
│   ├── static/               # Static assets
│   │   ├── css/              # Stylesheets
│   │   ├── js/               # JavaScript files
│   │   └── images/           # Images and icons
│   ├── templates/            # HTML templates
│   │   ├── hospital_admin/   # Admin interface
│   │   ├── widget/           # Widget templates
│   │   └── ...
│   └── data/                 # Data files
└── requirements.txt          # Python dependencies
```

### Adding New Features

1. **API Endpoints** - Add to `api_routes.py`
2. **Database Models** - Update `models.py`
3. **Business Logic** - Create services in `services/`
4. **Frontend** - Update templates and static files
5. **Documentation** - Update this README

### Testing

```bash
# Run tests (when implemented)
python -m pytest tests/

# Test API endpoints
curl -X GET http://localhost:5000/api/v1/hospitals
```

## 🔒 Security

### Authentication
- JWT-based authentication for admin access
- Session management for chat interactions
- Secure password handling

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### Privacy
- Patient data encryption
- Secure data transmission
- GDPR compliance ready

## 🚀 Deployment

The application is now **deployment-ready** with comprehensive configuration for production environments.

### Quick Start Deployment

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Configure your environment variables in `.env`:**
   ```bash
   FLASK_SECRET_KEY=your-super-secret-key-here
   DATABASE_URL=postgresql://user:password@host:port/database
   FLASK_ENV=production
   ```

3. **Deploy using your preferred method:**

   **Option A: Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

   **Option B: Heroku**
   ```bash
   heroku create your-app-name
   heroku config:set FLASK_SECRET_KEY=your-secret-key
   heroku config:set DATABASE_URL=your-database-url
   git push heroku main
   ```

   **Option C: Traditional Server**
   ```bash
   ./run.sh  # Linux/Mac
   run.bat   # Windows
   ```

### Production Features

✅ **Security Hardened**
- Environment-based configuration
- Secure session cookies
- Security headers (Talisman)
- Rate limiting
- Input validation

✅ **Production Ready**
- Gunicorn WSGI server
- Connection pooling
- Health check endpoint
- Comprehensive logging
- Error handling

✅ **Scalable Architecture**
- Docker containerization
- Nginx reverse proxy
- Database connection pooling
- Static file optimization

### Detailed Deployment Guide

For comprehensive deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md) which covers:
- Heroku deployment
- Docker deployment
- Traditional server setup
- SSL/HTTPS configuration
- Monitoring and maintenance
- Security best practices

## 📊 Monitoring

### Analytics
- Chat session tracking
- Appointment statistics
- User engagement metrics
- Performance monitoring

### Logging
- Application logs
- Error tracking
- API usage logs
- Security events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- API Documentation: `/api/v1/docs`
- Widget Integration Guide: `/docs/widget`
- Admin User Guide: `/docs/admin`

### Contact
- Email: support@hospital-chat-assistant.com
- Issues: GitHub Issues
- Documentation: Project Wiki

## 🔮 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language AI training
- [ ] Integration with hospital management systems
- [ ] Voice assistant improvements
- [ ] Real-time notifications
- [ ] Advanced reporting
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Multi-tenant database optimization

### Version History
- **v2.0.0** - Multi-tenant architecture, widget system, admin dashboard
- **v1.0.0** - Basic chat assistant and appointment booking

---

**Built with ❤️ for better healthcare communication**