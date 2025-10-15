"""
Hospital Chat Assistant API Routes
Multi-tenant, API-based architecture for hospital management
"""

from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
import os
from datetime import datetime, timedelta
import json

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

# JWT Secret Key (should be in environment variables in production)
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-here')

def token_required(f):
    """Decorator to require JWT token for API endpoints"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            current_hospital_id = data['hospital_id']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_hospital_id, *args, **kwargs)
    return decorated

def generate_token(hospital_id, user_type='admin'):
    """Generate JWT token for hospital admin"""
    payload = {
        'hospital_id': hospital_id,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

# ===== HOSPITAL MANAGEMENT API =====

@api_bp.route('/hospitals', methods=['GET'])
def get_hospitals():
    """Get all hospitals (public endpoint)"""
    try:
        # In production, this would query a database
        hospitals = [
            {
                'id': 'xyz_hospital',
                'name': 'XYZ Hospital',
                'domain': 'xyz-hospital.com',
                'logo_url': '/static/images/xyz_logo/logo.png',
                'primary_color': '#2563eb',
                'secondary_color': '#059669',
                'contact_info': {
                    'phone': '+91-1234567890',
                    'email': 'info@xyz-hospital.com',
                    'address': '123 Medical Street, Health City'
                },
                'features': ['appointment_booking', 'general_queries', 'appointment_management']
            }
        ]
        return jsonify({'hospitals': hospitals})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/hospitals/<hospital_id>', methods=['GET'])
def get_hospital(hospital_id):
    """Get specific hospital information"""
    try:
        # Load hospital data
        hospital_data = load_hospital_data(hospital_id)
        if not hospital_data:
            return jsonify({'error': 'Hospital not found'}), 404
        
        return jsonify({'hospital': hospital_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== AUTHENTICATION API =====

@api_bp.route('/auth/login', methods=['POST'])
def login():
    """Hospital admin login"""
    try:
        data = request.get_json()
        hospital_id = data.get('hospital_id')
        password = data.get('password')
        
        # In production, verify against database
        if hospital_id == 'xyz_hospital' and password == 'admin123':
            token = generate_token(hospital_id)
            return jsonify({
                'token': token,
                'hospital_id': hospital_id,
                'user_type': 'admin'
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== HOSPITAL DATA MANAGEMENT API =====

@api_bp.route('/hospitals/<hospital_id>/departments', methods=['GET'])
def get_departments(hospital_id):
    """Get departments for a specific hospital"""
    try:
        departments = load_hospital_departments(hospital_id)
        return jsonify({'departments': departments})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/hospitals/<hospital_id>/departments', methods=['POST'])
@token_required
def create_department(current_hospital_id, hospital_id):
    """Create new department (admin only)"""
    if current_hospital_id != hospital_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        # Save department logic here
        return jsonify({'message': 'Department created successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/hospitals/<hospital_id>/doctors', methods=['GET'])
def get_doctors(hospital_id):
    """Get doctors for a specific hospital"""
    try:
        department_id = request.args.get('department_id')
        doctors = load_hospital_doctors(hospital_id, department_id)
        return jsonify({'doctors': doctors})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/hospitals/<hospital_id>/doctors', methods=['POST'])
@token_required
def create_doctor(current_hospital_id, hospital_id):
    """Create new doctor (admin only)"""
    if current_hospital_id != hospital_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        # Save doctor logic here
        return jsonify({'message': 'Doctor created successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== APPOINTMENT API =====

@api_bp.route('/hospitals/<hospital_id>/appointments', methods=['POST'])
def create_appointment(hospital_id):
    """Create new appointment and save to database"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'phone', 'department_id', 'doctor_id', 'date', 'time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Use database service to create appointment
        from services.data_service_db import create_preview, confirm_appointment
        
        # Create preview first
        preview_data = {
            'name': data.get('name'),
            'phone': data.get('phone'),
            'department_id': data.get('department_id'),
            'doctor_id': data.get('doctor_id'),
            'date': data.get('date'),
            'time': data.get('time')
        }
        
        preview = create_preview(preview_data)
        if 'error' in preview:
            return jsonify({'error': preview['error']}), 400
        
        # Confirm the appointment
        appointment = confirm_appointment(preview['id'])
        if 'error' in appointment:
            return jsonify({'error': appointment['error']}), 400
        
        # Convert datetime objects to strings for JSON serialization
        for k, v in appointment.items():
            if hasattr(v, 'isoformat'):
                appointment[k] = v.isoformat()
        
        return jsonify({
            'appointment': appointment,
            'appointment_id': appointment['id']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/hospitals/<hospital_id>/appointments/<appointment_id>', methods=['GET'])
def get_appointment(hospital_id, appointment_id):
    """Get specific appointment with enhanced information"""
    try:
        # Load appointment from database
        appointment = load_appointment(hospital_id, appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Enhance appointment data with department and doctor information
        from services.data_service_db import list_departments, list_doctors
        
        # Get department information
        departments = list_departments()
        department_info = next((d for d in departments if d['id'] == appointment.get('department_id')), None)
        
        # Get doctor information
        doctors = list_doctors()
        doctor_info = next((d for d in doctors if d['id'] == appointment.get('doctor_id')), None)
        
        # Add enhanced information
        appointment['department_name'] = department_info['name'] if department_info else {}
        appointment['doctor_name'] = doctor_info['name'] if doctor_info else {}
        appointment['doctor_fees'] = doctor_info['fees'] if doctor_info else None
        appointment['doctor_experience'] = doctor_info['experience'] if doctor_info else None
        
        return jsonify({
            'appointment': appointment,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/hospitals/<hospital_id>/appointments', methods=['GET'])
def get_appointments(hospital_id):
    """Get appointments by phone number with enhanced information"""
    try:
        phone = request.args.get('phone')
        if not phone:
            return jsonify({'error': 'Phone number required'}), 400
        
        appointments = load_appointments_by_phone(hospital_id, phone)
        
        # Enhance each appointment with department and doctor information
        from services.data_service_db import list_departments, list_doctors
        departments = list_departments()
        doctors = list_doctors()
        
        enhanced_appointments = []
        for appointment in appointments:
            # Get department information
            department_info = next((d for d in departments if d['id'] == appointment.get('department_id')), None)
            
            # Get doctor information
            doctor_info = next((d for d in doctors if d['id'] == appointment.get('doctor_id')), None)
            
            # Add enhanced information
            appointment['department_name'] = department_info['name'] if department_info else {}
            appointment['doctor_name'] = doctor_info['name'] if doctor_info else {}
            appointment['doctor_fees'] = doctor_info['fees'] if doctor_info else None
            appointment['doctor_experience'] = doctor_info['experience'] if doctor_info else None
            
            enhanced_appointments.append(appointment)
        
        return jsonify({
            'appointments': enhanced_appointments,
            'count': len(enhanced_appointments),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== CHAT API =====

@api_bp.route('/hospitals/<hospital_id>/chat', methods=['POST'])
def chat_message(hospital_id):
    """Process chat message"""
    try:
        data = request.get_json()
        message = data.get('message')
        session_id = data.get('session_id')
        language = data.get('language', 'english')
        
        # Process chat message with AI
        response = process_chat_message(hospital_id, message, session_id, language)
        
        return jsonify({
            'response': response['message'],
            'session_id': response['session_id'],
            'suggestions': response.get('suggestions', [])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== WIDGET API =====

@api_bp.route('/hospitals/<hospital_id>/widget/config', methods=['GET'])
def get_widget_config(hospital_id):
    """Get widget configuration for embedding"""
    try:
        hospital_data = load_hospital_data(hospital_id)
        if not hospital_data:
            return jsonify({'error': 'Hospital not found'}), 404
        
        widget_config = {
            'hospital_id': hospital_id,
            'name': hospital_data['name'],
            'logo_url': hospital_data['logo_url'],
            'primary_color': hospital_data['primary_color'],
            'secondary_color': hospital_data['secondary_color'],
            'features': hospital_data['features'],
            'widget_url': f"/widget/{hospital_id}",
            'api_base_url': f"/api/v1/hospitals/{hospital_id}"
        }
        
        return jsonify({'config': widget_config})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== HELPER FUNCTIONS =====

def load_hospital_data(hospital_id):
    """Load hospital data from storage"""
    try:
        # In production, this would query a database
        if hospital_id == 'xyz_hospital':
            with open('app/data/hospital_info.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except:
        return None

def load_hospital_departments(hospital_id):
    """Load departments for a hospital"""
    try:
        with open('app/data/departments.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def load_hospital_doctors(hospital_id, department_id=None):
    """Load doctors for a hospital"""
    try:
        with open('app/data/doctors.json', 'r', encoding='utf-8') as f:
            doctors = json.load(f)
            if department_id:
                doctors = [d for d in doctors if d.get('department_id') == department_id]
            return doctors
    except:
        return []

def load_appointment(hospital_id, appointment_id):
    """Load specific appointment from database"""
    try:
        from services.data_service_db import get_appointment_by_id
        return get_appointment_by_id(appointment_id)
    except Exception as e:
        print(f"Error loading appointment {appointment_id}: {e}")
        return None

def load_appointments_by_phone(hospital_id, phone):
    """Load appointments by phone number from database"""
    try:
        from services.data_service_db import get_appointments_by_phone
        return get_appointments_by_phone(phone)
    except Exception as e:
        print(f"Error loading appointments for phone {phone}: {e}")
        return []

def process_chat_message(hospital_id, message, session_id, language):
    """Process chat message with AI"""
    # This would integrate with your existing AI service
    return {
        'message': 'Thank you for your message. How can I help you today?',
        'session_id': session_id or 'new_session',
        'suggestions': ['Book Appointment', 'Check Appointment', 'General Query']
    }
