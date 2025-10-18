from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from functools import wraps
from datetime import datetime, timedelta
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import traceback
import json
from werkzeug.security import check_password_hash, generate_password_hash
from .config_db import SessionLocal
from .models import User, Department, Doctor, Appointment, HospitalInfo
from sqlalchemy import exc, cast, String as SQLString, or_, and_
from collections import defaultdict
import re
import config


settings = config.settings
BASE_DIR = config.BASE_DIR

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/admin')
admin_bp.secret_key = settings.SECRET_KEY

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in to access this page.", "danger")
            return redirect(url_for('admin_bp.login'))
        return f(*args, **kwargs)
    return decorated_function

def slugify(s):
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s]+', '_', s).strip('_')
    return s

def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def get_departments_map_en(session):
    depts = session.query(Department).all()
    return {d.id: d.name_en for d in depts}

def get_doctors_map_en(session):
    doctors = session.query(Doctor).all()
    return {d.id: d.name_en for d in doctors}

def get_all_doctors_list(session):
    doctors = session.query(Doctor).all()
    out = []
    for doc in doctors:
        out.append({
            "id": doc.id,
            "department_id": doc.department_id,
            "name": {"en": doc.name_en, "hi": doc.name_hi, "mr": doc.name_mr},
            "education": doc.education,
            "experience": doc.experience,
            "fees": str(doc.fees) if doc.fees is not None else "",
            "available_days": doc.available_days,
            "start_time": doc.start_time,
            "end_time": doc.end_time,
        })
    return out

def english_department_name(session, dep_id):
    if not dep_id:
        return ""
    dept_obj = session.query(Department).filter(Department.id == dep_id).first()
    return dept_obj.name_en if dept_obj else str(dep_id)

def english_doctor_name(session, doc_id):
    if not doc_id:
        return ""
    doctor_obj = session.query(Doctor).filter(Doctor.id == doc_id).first()
    return doctor_obj.name_en if doctor_obj else str(doc_id)

def normalize_time_string(time_str):
    if not time_str:
        return ""
    # Assume time_str is 'HH:MM', no need for further normalization unless specified
    return time_str

def normalize_appointment_for_ui(session, appt: Appointment):
    out = {}
    if not appt:
        return out
    out["id"] = str(appt.id)
    out["date"] = appt.date
    out["time"] = normalize_time_string(appt.time)
    out["patientName"] = appt.name
    out["phoneNumber"] = appt.phone
    out["department_id"] = appt.department_id
    out["doctor_id"] = appt.doctor_id
    out["department"] = english_department_name(session, appt.department_id)
    out["doctorName"] = english_doctor_name(session, appt.doctor_id)
    status_raw = appt.status
    out["Status"] = status_raw[:1].upper() + status_raw[1:].lower() if isinstance(status_raw, str) and status_raw else ""
    out["createdAt"] = appt.created_at.strftime("%Y-%m-%d %H:%M:%S") if appt.created_at else None
    out["updatedAt"] = appt.updated_at.strftime("%Y-%m-%d %H:%M:%S") if appt.updated_at else None
    out["can_edit"] = bool(appt.can_edit)
    out["is_new"] = bool(appt.is_new)
    out["is_updated"] = bool(appt.is_updated)
    out["viewed_by_admin"] = bool(appt.viewed_by_admin)
    return out

# ------------------ Routes (using @admin_bp.route) ------------------ #

@admin_bp.route("/", methods=["GET"])
def index():
    return redirect(url_for("admin_bp.login")) 

@admin_bp.route("/login", methods=["GET", "POST"])
def login():
    session_gen = get_db()
    session_db = next(session_gen)
    
    if request.method == "POST":
        uid = request.form.get("username", "").strip()
        pwd = request.form.get("password", "")
        remember = request.form.get("remember")

        try:
            # 🔥 Change 1: Replace JSON login with DB query (using User.name as username)
            user_obj = session_db.query(User).filter(
                User.id == uid, 
                User.password == pwd
            ).first()

            if user_obj:
                session["user_id"] = user_obj.id # Storing PK ID
                session["hospital_id"] = user_obj.hospital_id
                if remember:
                    session.permanent = True
                else:
                    session.permanent = False
                flash("Login successful!", "success")
                return redirect(url_for("admin_bp.admin_dashboard"))
            
            flash("Invalid credentials", "danger")
        except Exception as e:
            traceback.print_exc()
            flash("An error occurred during login. Please try again.", "danger")
        finally:
           next(session_gen, None)
    
    return render_template("admin/login.html")

@admin_bp.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("admin_bp.login"))

# ------------------ Dashboard ------------------ #
@admin_bp.route("/dashboard")
@login_required
def admin_dashboard():
    session_gen = get_db()
    session_db = next(session_gen)
    
    user_id = session.get("user_id")
    
    try:
        # 🔥 Change 1: Get user data from DB
        user_obj = session_db.query(User).filter(User.id == user_id).first()
        
        user_data = user_obj.__dict__ if user_obj else {}
        if "_sa_instance_state" in user_data:
            del user_data["_sa_instance_state"] 
    finally:
        next(session_gen, None)
        
    return render_template("admin/admin_dashboard.html", hospital=user_data)


# admin_routes.py (Full Updated dashboard_counts function)

@admin_bp.route("/dashboard_counts")
@login_required
def dashboard_counts():
    session_gen = get_db()
    session_db = next(session_gen)
    
    hospital_id = session.get("hospital_id")

    try:
        # Get counts and data from DB
        total_departments = session_db.query(Department).count()
        total_doctors = session_db.query(Doctor).count()
        
        appointments = session_db.query(Appointment).all()
        normalized = [normalize_appointment_for_ui(session_db, appt) for appt in appointments]

        # Calculate various appointment metrics
        now = datetime.now()
        today = now.date()
        
        # Upcoming appointments (next 24 hours)
        upcoming = 0
        completed_today = 0
        pending_review = 0
        total_appointments = len(normalized)
        
        for appt_dict in normalized:
            status = appt_dict.get("Status", "Pending").lower()
            
            # Count total appointments by status
            if status == "completed":
                completed_today += 1
            elif status in ["pending"]:
                pending_review += 1
            
            # Calculate upcoming appointments (next 24 hours)
            if status in ["booked", "pending", "confirmed"]:
                try:
                    appt_date = appt_dict.get('date')
                    appt_time = appt_dict.get('time')
                    
                    if appt_date and appt_time:
                        # Handle different time formats
                        if ':' in appt_time and len(appt_time.split(':')) == 2:
                            appt_dt = datetime.strptime(f"{appt_date} {appt_time}", "%Y-%m-%d %H:%M")
                        else:
                            # Fallback for other formats
                            continue
                        
                        # Check if appointment is in next 24 hours
                        if now <= appt_dt <= now + timedelta(hours=24):
                            upcoming += 1
                except Exception as e:
                    # Skip malformed date/time data
                    continue
        
        # Helper for sorting by date/time
        def safe_dt(appt_dict):
            try:
                appt_date = appt_dict.get('date')
                appt_time = appt_dict.get('time')
                if appt_date and appt_time:
                    return datetime.strptime(f"{appt_date} {appt_time}", "%Y-%m-%d %H:%M")
                else:
                    return now
            except Exception:
                return now
        
        recent = sorted(normalized, key=safe_dt, reverse=True)[:10]
        
        return jsonify({
            "departments": total_departments,
            "doctors": total_doctors,
            "upcoming": upcoming,
            "total": total_appointments,
            "completed": completed_today,
            "pending": pending_review,
            "recent": recent
        })
    except Exception as e:
        session_db.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        next(session_gen, None)
@admin_bp.route("/notifications")
@login_required
def notifications():
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        # Fetch new appointments (viewed_by_admin = False) as notifications
        new_appointments = session_db.query(Appointment).filter(
            Appointment.viewed_by_admin == False
        ).order_by(Appointment.created_at.desc()).limit(10).all()
        
        # Normalize data for JSON response
        notifications_data = [normalize_appointment_for_ui(session_db, appt) for appt in new_appointments]

        return jsonify({"notifications": notifications_data, "count": len(new_appointments)})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Error fetching notifications"}), 500
    finally:
        next(session_gen, None)

@admin_bp.route('/api/mark-all-notifications-read', methods=['POST'])
@login_required
def mark_all_notifications_read():
    """Mark all notifications as read"""
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        data = request.get_json()
        appointment_ids = data.get('appointmentIds', [])
        
        if not appointment_ids:
            return jsonify({'success': False, 'message': 'No appointment IDs provided'}), 400
        
        # Mark all specified appointments as viewed
        updated_count = session_db.query(Appointment).filter(
            Appointment.id.in_(appointment_ids)
        ).update({
            Appointment.viewed_by_admin: True,
            Appointment.updated_at: datetime.now()
        }, synchronize_session=False)
        
        session_db.commit()
        
        return jsonify({
            'success': True, 
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })
    except Exception as e:
        session_db.rollback()
        print(f"Error marking notifications as read: {e}")
        return jsonify({'success': False, 'message': 'Error marking notifications as read'}), 500
    finally:
        next(session_gen, None)

@admin_bp.route("/api/appointment/mark_viewed/<int:appointment_id>", methods=["POST"])
@login_required
def mark_single_appointment_viewed(appointment_id):
    session_gen = get_db()
    session_db = next(session_gen)
    try:
        appointment = session_db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        appointment.viewed_by_admin = True
        session_db.commit()
        return jsonify({"message": "Appointment marked as viewed"})
    except Exception as e:
        session_db.rollback()
        return jsonify({"error": f"Error: {str(e)}"}), 500
    finally:
        next(session_gen, None)
# ------------------ Departments ------------------ #
@admin_bp.route("/departments", methods=["GET", "POST"])
@login_required
def departments():
    
    session_gen = None
    session_db = None
    departments_list = [] 
    
    try:
       
        session_gen = get_db()
        session_db = next(session_gen)
        
        if request.method == "POST":
            
            name_en = request.form.get("name_en")
            name_hi = request.form.get("name_hi")
            name_mr = request.form.get("name_mr")
            
            if not name_en:
                flash("Department Name (English) is required.", "danger")
                
                return redirect(url_for("admin_bp.departments"))
                
            # Generate a unique ID (slug)
            dept_id = slugify(name_en)
            
            # Check if department already exists
            existing_dept = session_db.query(Department).filter_by(id=dept_id).first()
            if existing_dept:
                flash(f"Department ID '{dept_id}' already exists. Try a more unique name.", "danger")
                return redirect(url_for("admin_bp.departments"))
                
            new_dept = Department(
                id=dept_id,
                name_en=name_en,
                name_hi=name_hi,
                name_mr=name_mr,
            )
            session_db.add(new_dept)
            session_db.commit()
            flash(f"Department '{name_en}' added successfully.", "success")
            
            return redirect(url_for("admin_bp.departments"))
            
       
        departments_list = session_db.query(Department).order_by(Department.name_en).all()
        
    except Exception as e:
        if session_db:
            session_db.rollback()
        flash(f"An unexpected database error occurred: {str(e)}", "danger")
        traceback.print_exc()
        
        return redirect(url_for("admin_bp.admin_dashboard")) 
        
    finally:
       
        if session_gen:
            next(session_gen, None)
            
        return render_template("admin/departments.html", departments=departments_list)
@admin_bp.route("/departments/create", methods=["POST"])
@login_required
def create_department():
    session_gen = get_db()
    session_db = next(session_gen)
    
    name_en = request.form.get("name_en", "").strip()
    name_hi = request.form.get("name_hi", "").strip()
    name_mr = request.form.get("name_mr", "").strip()
    
    if not name_en:
        flash("Department English name is required", "danger")
        return redirect(url_for("admin_bp.departments"))

    try:
        
        duplicate = session_db.query(Department).filter(
            cast(Department.name_en, SQLString).ilike(name_en)
        ).first()

        if duplicate:
            flash(f"Department '{name_en}' already exists.", "warning")
            return redirect(url_for("admin_bp.departments"))

        # Generate a simple slug ID
        dept_id = name_en.lower().replace(" ", "_").replace(".", "") 
        
        new_dept = Department(
            id=dept_id,
            name_en=name_en,
            name_hi=name_hi, 
            name_mr=name_mr,
        )
        session_db.add(new_dept)
        session_db.commit()
        
        flash(f"Department '{name_en}' added successfully.", "success")
    except Exception as e:
        traceback.print_exc()
        session_db.rollback()
        flash("Failed to create department due to DB error.", "danger")
    finally:
        next(session_gen, None)
        
    return redirect(url_for("admin_bp.departments"))


@admin_bp.route("/departments/delete/<dept_id>")
@login_required
def delete_department(dept_id):
    session_gen = get_db()
    session_db = next(session_gen)

    try:
        
        department_to_delete = session_db.query(Department).filter(Department.id == dept_id).first()
        
        if department_to_delete:
            session_db.delete(department_to_delete)
            session_db.commit()
            flash("Department deleted successfully.", "success")
        else:
            flash("Department not found.", "danger")
    except exc.IntegrityError:
        session_db.rollback()
        flash("Cannot delete department. Remove all associated doctors first.", "danger")
    except Exception as e:
        traceback.print_exc()
        session_db.rollback()
        flash("Failed to delete department due to DB error.", "danger")
    finally:
        next(session_gen, None)
        
    return redirect(url_for("admin_bp.departments"))

@admin_bp.route("/api/departments", methods=["GET"])
@login_required
def get_api_departments():
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        # Fetch all department objects
        departments = session_db.query(Department).all()
        
        # Format the data into a list of dictionaries as expected by JavaScript
        # appointments.html expects {id: 'dept_id', name: 'English Name'}
        department_list = [
            {"id": d.id, "name": d.name_en} 
            for d in departments
        ]
        
        return jsonify(department_list)
        
    except Exception as e:
        # Log the error and return a 500 status code
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch departments: " + str(e)}), 500
        
    finally:
        # Ensure the database session is closed
        next(session_gen, None)

@admin_bp.route("/departments/edit/<department_id>", methods=["GET", "POST"])
@login_required
def edit_department(department_id):
    session_gen = get_db()
    db = next(session_gen)
    
    try:
        # Fetch the department object by ID (ID is a string, not int, due to slugify)
        department = db.query(Department).filter(Department.id == department_id).first()
        
        if not department:
            flash("Department not found.", "danger")
            return redirect(url_for("admin_bp.departments"))

        if request.method == "POST":
            try:
                # Update department details from form data
                department.name_en = request.form.get("name_en")
                department.name_hi = request.form.get("name_hi")
                department.name_mr = request.form.get("name_mr")
                department.slug = slugify(department.name_en or department.name_hi or department.name_mr)
                
                db.commit()
                flash(f"Department '{department.name_en}' updated successfully!", "success")
                return redirect(url_for("admin_bp.departments"))

            except Exception as e:
                db.rollback()
                traceback.print_exc()
                flash("An error occurred while updating the department.", "danger")
                # Render edit_department.html to allow retry with the same data
                return render_template("admin/edit_department.html", department=department)
        
        # Render the edit form for GET requests
        return render_template("admin/edit_department.html", department=department)
    
    finally:
        next(get_db(), None)
# ------------------ Doctors ------------------ #
@admin_bp.route("/doctors")
@login_required
def doctors():
    session_gen = get_db()
    session_db = next(session_gen)

    try:
        doctors_list = get_all_doctors_list(session_db)
        departments_list = session_db.query(Department).all()

        
        grouped = defaultdict(list)
        dept_map = {d.id: d.name_en for d in departments_list}
        for doc in doctors_list:
            dept_name = dept_map.get(doc["department_id"], "Unknown")
            grouped[dept_name].append(doc)

    finally:
        next(session_gen, None)

    return render_template(
        "admin/doctors.html", 
        doctors=grouped, 
        departments=departments_list
    )

@admin_bp.route("/doctors/create-form")
@login_required
def create_doctor_form():
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        departments = session_db.query(Department).all()
        return render_template("admin/create_doctor.html", departments=departments)
    finally:
        next(session_gen, None)

@admin_bp.route("/doctors/create", methods=["GET", "POST"])
@login_required
def create_doctor():
    session_gen = get_db()
    session_db = next(session_gen)
    
    data = request.form
    name_en = data.get("name_en", "").strip()
    available_days = request.form.getlist("available_days")

    # Validation
    if not name_en or not data.get("department_id"):
        flash("Doctor Name (English) and Department are required.", "danger")
        return redirect(url_for("admin_bp.doctors"))
    
    if not available_days:
        flash("Please select at least one available day.", "danger")
        return redirect(url_for("admin_bp.doctors"))
    
    if not data.get("start_time") or not data.get("end_time"):
        flash("Start time and End time are required.", "danger")
        return redirect(url_for("admin_bp.doctors"))

    try:
        
        doc_id = 'dr_' + name_en.lower().replace(" ", "_").replace(".", "") 

        
        duplicate = session_db.query(Doctor).filter(Doctor.id == doc_id).first()
        if duplicate:
            flash(f"Doctor with generated ID '{doc_id}' already exists. Please modify the name.", "warning")
            return redirect(url_for("admin_bp.doctors"))

        # Handle photo upload
        photo_filename = None
        if 'photo' in request.files:
            photo_file = request.files['photo']
            if photo_file and photo_file.filename:
                # Create uploads directory if it doesn't exist
                import os
                upload_dir = os.path.join('app', 'static', 'uploads', 'doctors')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Generate unique filename
                file_ext = photo_file.filename.rsplit('.', 1)[1].lower() if '.' in photo_file.filename else 'jpg'
                photo_filename = f"{doc_id}.{file_ext}"
                photo_path = os.path.join(upload_dir, photo_filename)
                
                # Save the file
                photo_file.save(photo_path)

        new_doctor = Doctor(
            id=doc_id,
            department_id=data.get("department_id"),
            name_en=name_en,
            name_hi=data.get("name_hi", ""),
            name_mr=data.get("name_mr", ""),
            education=data.get("education", ""),
            experience=data.get("experience", ""),
            fees=data.get("fees"),
            # available_days expects a list of strings (PostgreSQL ARRAY)
            available_days=available_days, 
            start_time=normalize_time_string(data.get("start_time")),
            end_time=normalize_time_string(data.get("end_time")),
            photo=photo_filename,
        )
        
        session_db.add(new_doctor)
        session_db.commit()
        
        flash(f"Doctor {name_en} added successfully.", "success")
    except Exception as e:
        traceback.print_exc()
        session_db.rollback()
        flash("Failed to create doctor due to DB error.", "danger")
    finally:
        next(session_gen, None)
        
    return redirect(url_for("admin_bp.doctors"))


@admin_bp.route("/doctors/delete/<doc_id>")
@login_required
def delete_doctor(doc_id):
    session_gen = get_db()
    session_db = next(session_gen)

    try:
        doctor_to_delete = session_db.query(Doctor).filter(Doctor.id == doc_id).first()
        
        if doctor_to_delete:
            session_db.delete(doctor_to_delete)
            session_db.commit()
            flash("Doctor deleted successfully.", "success")
        else:
            flash("Doctor not found.", "danger")
    except exc.IntegrityError:
        session_db.rollback()
        flash("Cannot delete doctor. There are active appointments.", "danger")
    except Exception as e:
        traceback.print_exc()
        session_db.rollback()
        flash("Failed to delete doctor due to DB error.", "danger")
    finally:
        next(session_gen, None)
        
    return redirect(url_for("admin_bp.doctors"))
@admin_bp.route("/doctors/edit/<doc_id>", methods=["GET", "POST"])
@login_required
def edit_doctor(doc_id):
    session_gen = get_db()
    session_db = next(session_gen)

    try:
        doctor = session_db.query(Doctor).filter(Doctor.id == doc_id).first()
        departments = session_db.query(Department).all()

        if not doctor:
            flash("Doctor not found.", "danger")
            return redirect(url_for("admin_bp.doctors"))

        if request.method == "POST":
            available_days = request.form.getlist("available_days")
            
            # Validation
            if not available_days:
                flash("Please select at least one available day.", "danger")
                return render_template("admin/edit_doctor.html", doctor=doctor, departments=departments)
            
            if not request.form.get("start_time") or not request.form.get("end_time"):
                flash("Start time and End time are required.", "danger")
                return render_template("admin/edit_doctor.html", doctor=doctor, departments=departments)
            
            doctor.name_en = request.form.get("name_en", "").strip()
            doctor.name_hi = request.form.get("name_hi", "").strip()
            doctor.name_mr = request.form.get("name_mr", "").strip()
            doctor.department_id = request.form.get("department_id")
            doctor.education = request.form.get("education")
            doctor.experience = request.form.get("experience")
            doctor.fees = request.form.get("fees")
            doctor.available_days = available_days
            doctor.start_time = normalize_time_string(request.form.get("start_time"))
            doctor.end_time = normalize_time_string(request.form.get("end_time"))
            
            # Handle photo upload
            if 'photo' in request.files:
                photo_file = request.files['photo']
                if photo_file and photo_file.filename:
                    # Create uploads directory if it doesn't exist
                    import os
                    upload_dir = os.path.join('app', 'static', 'uploads', 'doctors')
                    os.makedirs(upload_dir, exist_ok=True)
                    
                    # Generate unique filename
                    file_ext = photo_file.filename.rsplit('.', 1)[1].lower() if '.' in photo_file.filename else 'jpg'
                    photo_filename = f"{doc_id}.{file_ext}"
                    photo_path = os.path.join(upload_dir, photo_filename)
                    
                    # Save the file
                    photo_file.save(photo_path)
                    doctor.photo = photo_filename

            session_db.commit()
            flash("Doctor updated successfully.", "success")
            return redirect(url_for("admin_bp.doctors"))

    except Exception as e:
        traceback.print_exc()
        session_db.rollback()
        flash("Error updating doctor.", "danger")
    finally:
        next(session_gen, None)

    return render_template("admin/edit_doctor.html", doctor=doctor, departments=departments)

# ------------------ Appointments ------------------ #
# --- Appointments API Route ---
@admin_bp.route("/api/appointment/details/<int:appointment_id>", methods=["GET"])
@login_required
def get_appointment_details(appointment_id):
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        # Query the database for the specific appointment
        appointment = session_db.query(Appointment).filter(Appointment.id == appointment_id).first()
        
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        
        # Mark as viewed if not already
        if not appointment.viewed_by_admin:
            appointment.viewed_by_admin = True
            session_db.commit()
        
        # Normalize the appointment data before sending to the UI
        details = normalize_appointment_for_ui(session_db, appointment)
        
        return jsonify({"details": details})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Error fetching details: {str(e)}"}), 500
    finally:
        next(session_gen, None)

@admin_bp.route("/appointments", methods=["GET", "POST"])
@login_required
def appointments():
    session_gen = get_db()
    session_db = next(session_gen)
    try:
        appointments = session_db.query(Appointment).all()
        appointments_list = [normalize_appointment_for_ui(session_db, appt) for appt in appointments]
        departments = session_db.query(Department).all()
        doctors = session_db.query(Doctor).all()
        return render_template(
            "admin/appointments.html",
            appointments=appointments_list,
            departments=departments,
            doctors=doctors
        )
    except Exception as e:
        traceback.print_exc()
        flash("Failed to load appointments due to an error.", "danger")
        return render_template("admin/appointments.html", appointments=[], departments=[], doctors=[])
    finally:
        next(session_gen, None)

@admin_bp.route("/api/appointments", methods=["GET"])
@login_required
def get_api_appointments():
    session_gen = get_db()
    session_db = next(session_gen)
    try:
        appointments = session_db.query(Appointment).all()
        appointments_list = [normalize_appointment_for_ui(session_db, appt) for appt in appointments]
        return jsonify(appointments_list)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch appointments: " + str(e)}), 500
    finally:
        next(session_gen, None)

# admin_routes.py (Updated Block)

@admin_bp.route("/api/update_appointment_status", methods=["POST"])
@login_required
def update_appointment_status():
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        data = request.get_json()
        appointment_id = data.get("appointmentId")
        new_status = data.get("newStatus")
        
        appointment = session_db.query(Appointment).filter(Appointment.id == appointment_id).first()
        
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        
        # ❌ REMOVED/COMMENTED OUT THE CHECK THAT CAUSED THE 403 ERROR
        # if not appointment.can_edit:
        #     return jsonify({"error": "Appointment cannot be edited"}), 403 
        
        # Proceed with update logic
        appointment.status = new_status
        session_db.commit()
        
        return jsonify({"message": "Status updated successfully", 
                        "appointment": normalize_appointment_for_ui(session_db, appointment)})
    
    except Exception as e:
        session_db.rollback()
        traceback.print_exc()
        return jsonify({"error": f"Error updating status: {str(e)}"}), 500
    finally:
        session_db.close()

@admin_bp.route("/save_appointment", methods=["POST"])
@login_required
def save_appointment():
    session_gen = get_db()
    session_db = next(session_gen)
    try:
        data = request.get_json()
        appt = Appointment(
            name=data["name"],
            phone=data["phone"],
            department_id=data["department_id"],
            doctor_id=data["doctor_id"],
            date=data["date"],
            time=data["time"],
            status=data["status"].lower(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            can_edit=True,
            is_new=True,
            is_updated=False,
            viewed_by_admin=False
        )
        session_db.add(appt)
        session_db.commit()
        return jsonify({"message": "Appointment saved successfully", "appointment": normalize_appointment_for_ui(session_db, appt)}), 200
    except Exception as e:
        traceback.print_exc()
        session_db.rollback()
        return jsonify({"error": "Failed to save appointment: " + str(e)}), 500
    finally:
        next(session_gen, None)
# ------------------ Profile Update (Hospital Info) ------------------ #
@admin_bp.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    session_gen = get_db()
    session_db = next(session_gen)
    profile_data = {}
    try:
        hospital = session_db.query(HospitalInfo).first()
        if hospital:
            profile_data = {
                "name": {"en": hospital.name_en, "hi": hospital.name_hi, "mr": hospital.name_mr},
                "address": {"en": hospital.address_en, "hi": hospital.address_hi, "mr": hospital.address_mr},
                "Phone": hospital.phone,
                "Email": hospital.email,
                "working_hours": hospital.working_hours
            }
        else:
            # Provide default empty structure when no hospital data exists
            profile_data = {
                "name": {"en": "", "hi": "", "mr": ""},
                "address": {"en": "", "hi": "", "mr": ""},
                "Phone": "",
                "Email": "",
                "working_hours": ""
            }
        if request.method == "POST":
            if not hospital:
                hospital = HospitalInfo()
                session_db.add(hospital)
            hospital.name_en = request.form.get("name_en")
            hospital.name_hi = request.form.get("name_hi")
            hospital.name_mr = request.form.get("name_mr")
            hospital.address_en = request.form.get("address_en")
            hospital.address_hi = request.form.get("address_hi")
            hospital.address_mr = request.form.get("address_mr")
            hospital.phone = request.form.get("Phone")
            hospital.email = request.form.get("Email")
            hospital.working_hours = request.form.get("working_hours")
            session_db.commit()
            flash("Profile updated successfully!", "success")
            return redirect(url_for("admin_bp.profile"))
    except Exception as e:
        traceback.print_exc()
        flash("An error occurred while updating the profile. Please check the database connection or logs.", "danger")
        # Render with empty data instead of redirecting to avoid loop
        profile_data = {
            "name": {"en": "", "hi": "", "mr": ""},
            "address": {"en": "", "hi": "", "mr": ""},
            "Phone": "",
            "Email": "",
            "working_hours": ""
        }
    finally:
        next(session_gen, None)
    
    return render_template("admin/profile.html", hospital=profile_data)
# ------------------ API Routes (Used by Frontend JS) ------------------ #
# --- FIX: Add this Doctor API Route to admin_routes.py ---
@admin_bp.route("/api/doctors", methods=["GET"])
@login_required
def get_api_doctors():
    session_db = next(get_db())
    try:
        doctors = session_db.query(Doctor).all()
        # Ensure the response format matches what the JS expects
        doctor_list = [
            {"id": d.id, "name": f"Dr. {d.name_en}", "department_id": d.department_id} 
            for d in doctors
        ]
        return jsonify(doctor_list)
    except Exception as e:
        return jsonify({"error": "Failed to fetch doctors: " + str(e)}), 500
    finally:
        next(get_db(), None)
        
@admin_bp.route("/api/available_dates_for_doctor", methods=["POST"])
def available_dates_for_doctor():
    session_gen = get_db()
    session_db = next(session_gen)
    
    data = request.get_json()
    doctor_name = data.get("doctorName")
    
    try:
       
        doctor_obj = session_db.query(Doctor).filter(
            or_(
                Doctor.name_en.ilike(doctor_name),
                Doctor.name_hi.ilike(doctor_name),
                Doctor.name_mr.ilike(doctor_name)
            )
        ).first()

        available_days = doctor_obj.available_days if doctor_obj else []
        return jsonify(available_days)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        next(session_gen, None)


@admin_bp.route("/api/time_slots_for_doctor", methods=["POST"])
def time_slots_for_doctor():
    session_gen = get_db()
    session_db = next(session_gen)
    
    data = request.get_json()
    doctor_name = data.get("doctorName")
    
    try:
        
        doctor_obj = session_db.query(Doctor).filter(
            or_(
                Doctor.name_en.ilike(doctor_name),
                Doctor.name_hi.ilike(doctor_name),
                Doctor.name_mr.ilike(doctor_name)
            )
        ).first()

        if doctor_obj:
            start_time = normalize_time_string(doctor_obj.start_time)
            end_time = normalize_time_string(doctor_obj.end_time)
            
            return jsonify({
                "start_time": start_time,
                "end_time": end_time
            })
        else:
            return jsonify({"error": "Doctor not found"}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        next(session_gen, None)

@admin_bp.route("/change-password", methods=["GET", "POST"])
@login_required
def change_password():
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        if request.method == "POST":
            username = request.form.get("username")
            current_password = request.form.get("current_password")
            new_password = request.form.get("new_password")
            confirm_password = request.form.get("confirm_password")

            # Validation
            if not all([username, current_password, new_password, confirm_password]):
                flash("All fields are required.", "error")
                return render_template("admin/change_password.html")

            if new_password != confirm_password:
                flash("New passwords do not match.", "error")
                return render_template("admin/change_password.html")

            if len(new_password) < 8:
                flash("Password must be at least 8 characters long.", "error")
                return render_template("admin/change_password.html")

            # Find user by username
            user = session_db.query(User).filter_by(name=username).first()
            if not user:
                flash("User not found. Please provide a valid username.", "error")
                return render_template("admin/change_password.html")

            # Verify current password
            if not check_password_hash(user.password, current_password):
                flash("Current password is incorrect.", "error")
                return render_template("admin/change_password.html")

            # Update password
            user.password = generate_password_hash(new_password)
            session_db.commit()
            flash("Password updated successfully!", "success")
            return redirect(url_for("admin_bp.admin_dashboard"))

        return render_template("admin/change_password.html")
        
    except Exception as e:
        session_db.rollback()
        print(f"Error changing password: {e}")
        flash("An error occurred while changing password. Please try again.", "error")
        return render_template("admin/change_password.html")
    finally:
        next(session_gen, None)
  
@admin_bp.route("/api/hospital_info", methods=["GET"])
def get_hospital_info():
        
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        hospital = session_db.query(HospitalInfo).first()
        if hospital:
            profile_data = {
                "name": {"en": hospital.name_en, "hi": hospital.name_hi, "mr": hospital.name_mr},
                "address": {"en": hospital.address_en, "hi": hospital.address_hi, "mr": hospital.address_mr},
                "Phone": hospital.phone,
                "Email": hospital.email,
                "working_hours": hospital.working_hours
            }
        else:
            profile_data = {}
        return jsonify(profile_data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        next(session_gen, None)

@admin_bp.route("/api/analytics", methods=["GET"])
@login_required
def get_analytics():
    session_gen = get_db()
    session_db = next(session_gen)
    
    try:
        # Get all appointments
        appointments = session_db.query(Appointment).all()
        normalized = [normalize_appointment_for_ui(session_db, appt) for appt in appointments]
        
        # Status distribution with proper formatting
        status_counts = {}
        for appt in normalized:
            status = appt.get("Status", "Pending")
            # Capitalize first letter
            status_key = status.capitalize() if status else "Pending"
            status_counts[status_key] = status_counts.get(status_key, 0) + 1
        
        # Department distribution
        dept_counts = {}
        for appt in normalized:
            dept = appt.get("department", "Unknown")
            if dept and dept != "Unknown":
                dept_counts[dept] = dept_counts.get(dept, 0) + 1
        
        # Daily trend (last 14 days for better visualization)
        from datetime import datetime, timedelta
        trend_data = {}
        for i in range(14):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            trend_data[date] = 0
        
        for appt in normalized:
            try:
                appt_date = appt.get("date", "")
                if appt_date in trend_data:
                    trend_data[appt_date] += 1
            except:
                continue
        
        # Sort trend data by date
        sorted_trend = dict(sorted(trend_data.items()))
        
        # Monthly statistics
        current_month = datetime.now().strftime("%Y-%m")
        monthly_appointments = len([appt for appt in normalized if appt.get("date", "").startswith(current_month)])
        
        # Doctor performance
        doctor_counts = {}
        for appt in normalized:
            doctor = appt.get("doctorName", "Unknown")
            if doctor and doctor != "Unknown":
                doctor_counts[doctor] = doctor_counts.get(doctor, 0) + 1
        
        # Top performing doctors (top 5)
        top_doctors = sorted(doctor_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Recent activity (last 7 days)
        recent_activity = 0
        for appt in normalized:
            try:
                created_at_str = appt.get("createdAt", "")
                if created_at_str:
                    created_at = datetime.strptime(created_at_str, "%Y-%m-%d %H:%M:%S")
                    if (datetime.now() - created_at).days <= 7:
                        recent_activity += 1
            except:
                continue
        
        # Hourly distribution for today
        hourly_data = {}
        for hour in range(24):
            hourly_data[f"{hour:02d}:00"] = 0
        
        for appt in normalized:
            try:
                appt_date = appt.get("date", "")
                appt_time = appt.get("time", "")
                if appt_date == datetime.now().strftime("%Y-%m-%d") and appt_time:
                    hour = int(appt_time.split(':')[0])
                    hourly_data[f"{hour:02d}:00"] += 1
            except:
                continue
        
        # Weekly comparison
        this_week = 0
        last_week = 0
        week_start = datetime.now() - timedelta(days=datetime.now().weekday())
        last_week_start = week_start - timedelta(days=7)
        
        for appt in normalized:
            try:
                created_at_str = appt.get("createdAt", "")
                if created_at_str:
                    created_at = datetime.strptime(created_at_str, "%Y-%m-%d %H:%M:%S")
                    if week_start <= created_at < week_start + timedelta(days=7):
                        this_week += 1
                    elif last_week_start <= created_at < week_start:
                        last_week += 1
            except:
                continue
        
        analytics_data = {
            "status": status_counts,
            "departments": dept_counts,
            "trend": sorted_trend,
            "hourly": hourly_data,
            "monthly_appointments": monthly_appointments,
            "top_doctors": top_doctors,
            "recent_activity": recent_activity,
            "total_appointments": len(normalized),
            "this_week": this_week,
            "last_week": last_week,
            "week_growth": ((this_week - last_week) / last_week * 100) if last_week > 0 else 0
        }
        
        return jsonify(analytics_data)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        next(session_gen, None)