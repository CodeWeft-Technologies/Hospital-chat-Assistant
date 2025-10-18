import os
import logging
import traceback
import random
import tempfile
import pathlib
from datetime import datetime, timedelta
from flask import Flask, json, render_template, request, jsonify, send_file
from flask_cors import CORS
from flask_talisman import Talisman
from config import settings, BASE_DIR
from services import data_service_db as ds
from services.slips import generate_pdf_for_appointment
from services.ai import get_general_query_answer
from services.google_stt import google_stt
from services.google_tts import google_tts
from services.google_translate import google_translate
from config_db import SessionLocal
from sqlalchemy import text
from models import Appointment
from admin_routes import admin_bp
from api_routes import api_bp

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="static", template_folder="templates")

# Security configuration
CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "*").split(","))

# Configure Flask security settings
app.config.update(
    SECRET_KEY=settings.SECRET_KEY,
    SESSION_COOKIE_SECURE=settings.SESSION_COOKIE_SECURE,
    SESSION_COOKIE_HTTPONLY=settings.SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE=settings.SESSION_COOKIE_SAMESITE,
    MAX_CONTENT_LENGTH=settings.MAX_CONTENT_LENGTH,
    UPLOAD_FOLDER=settings.UPLOAD_FOLDER
)

# Configure Content Security Policy to allow Google Fonts
csp = {
    'default-src': "'self'",
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        'https://cdnjs.cloudflare.com',
        'https://code.jquery.com',
        'https://code.jquery.com'
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://cdnjs.cloudflare.com',
        'https://code.jquery.com',
        'https://fonts.googleapis.com'
    ],
    'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com'
    ],
    'img-src': [
        "'self'",
        'data:',
        'https:'
    ],
    'connect-src': [
        "'self'"
    ]
}

# Apply Content Security Policy
Talisman(app, content_security_policy=csp)

# Register blueprints
app.register_blueprint(admin_bp)
app.register_blueprint(api_bp)

# Security headers (only in production)
if settings.FLASK_ENV == "production":
    # Additional security headers can be added here
    pass
hospital_data = ds.get_hospital_info()
if not hospital_data:
    hospital_data = {
        "name": "XYZ Hospital",
         "address": "Warje, pune, Maharashtra, India",
         "Phone": "+91-8967780000"
    }

# 🔥 Auto-cleanup helper
def cleanup_old_appointments():
    try:
        cutoff = datetime.now() - timedelta(days=60)
        session = SessionLocal()
        old = session.query(Appointment).filter(
            Appointment.status == "visited",
            Appointment.date < cutoff.date()
        ).all()
        for appt in old:
            session.delete(appt)
        session.commit()
        session.close()
    except Exception as e:
        traceback.print_exc()


@app.route("/api/voice", methods=["POST"])
def api_voice():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file uploaded"}), 400

        lang = request.form.get("lang", "en-IN")
        audio_file = request.files["audio"]

        # Save user audio temporarily
        tmp_in = pathlib.Path(BASE_DIR) / "data" / "temp_user.wav"
        audio_file.save(tmp_in)

        # --- Step 1: Speech to Text ---
        transcript = google_stt(str(tmp_in), language=lang)

        # --- Step 2: Translate to English (for bot logic) ---
        if lang.startswith("hi"):
            user_text_en = google_translate.translate(transcript, target_lang="en")
        elif lang.startswith("mr"):
            user_text_en = google_translate.translate(transcript, target_lang="en")
        else:
            user_text_en = transcript

        # --- Step 3: Bot logic (placeholder: simple echo / can plug booking flow) ---
        bot_reply_en = f"You said: {user_text_en}"

        # --- Step 4: Translate reply back to user lang ---
        if lang.startswith("hi"):
            bot_reply_local = google_translate.translate(bot_reply_en, target_lang="hi")
        elif lang.startswith("mr"):
            bot_reply_local = google_translate.translate(bot_reply_en, target_lang="mr")
        else:
            bot_reply_local = bot_reply_en

        # --- Step 5: TTS for reply ---
        tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        voice_map = {
            "en-IN": "en-IN-Wavenet-D",
            "hi-IN": "hi-IN-Wavenet-A",
            "mr-IN": "mr-IN-Wavenet-A"
        }
        voice = voice_map.get(lang, "en-IN-Wavenet-D")
        google_tts(bot_reply_local, str(tmp_out.name), lang=lang, voice=voice)

        return send_file(
            tmp_out.name,
            as_attachment=False,
            mimetype="audio/mpeg",
            download_name="reply.mp3"
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# --- Page Routes ---
@app.route("/")
def index():
    # Get hospital_id from query parameter or default to xyz
    hospital_id = request.args.get('hospital_id', 'xyz')
    return render_template("language.html", hospital_id=hospital_id)  # Landing / language selection

@app.route("/language")
def language():
    return render_template("language.html")

@app.route("/responsive-demo")
def responsive_demo():
    return render_template("responsive-demo.html")

@app.route("/modern-chat")
def modern_chat():
    return render_template("modern-chat.html")

@app.route("/premium-chat")
def premium_chat():
    return render_template("premium-chat.html")

@app.route("/unified-chat")
def unified_chat():
    return render_template("unified-chat.html")

@app.route("/assistant")
def assistant():
    return render_template("assistant.html")

@app.route("/chat")
def chat():
    # Get hospital_id from query parameter or default to xyz
    hospital_id = request.args.get('hospital_id', 'xyz')
    return render_template("chat.html", hospital_id=hospital_id)

@app.route("/voice")
def voice():
    return render_template("voice.html")

@app.route("/booking")
def booking():
    hospital_id = request.args.get('hospital_id', 'xyz')
    return render_template("chat_booking.html", hospital_id=hospital_id)

@app.route("/myappointments")
def myappointments():
    hospital_id = request.args.get('hospital_id', 'xyz')
    return render_template("chat_my_appointments.html", hospital_id=hospital_id)

@app.route("/general")
def general():
    hospital_id = request.args.get('hospital_id', 'xyz')
    return render_template("chat_general_query.html", hospital_id=hospital_id)

# ===== HOSPITAL ADMIN ROUTES =====
@app.route("/admin/login")
def admin_login():
    return render_template("hospital_admin/login.html")

@app.route("/admin/dashboard")
def admin_dashboard():
    hospital_id = request.args.get('hospital_id', 'xyz_hospital')
    # In production, verify admin token and load hospital data
    hospital_data = {
        'id': hospital_id,
        'name': 'XYZ Hospital',
        'logo_url': '/static/images/xyz_logo/logo.png',
        'primary_color': '#2563eb',
        'secondary_color': '#059669',
        'contact_info': {
            'phone': '+91-1234567890',
            'email': 'info@xyz-hospital.com',
            'address': '123 Medical Street, Health City'
        }
    }
    return render_template("hospital_admin/dashboard.html", hospital=hospital_data)

# ===== WIDGET ROUTES =====
@app.route("/widget/<hospital_id>")
def widget_page(hospital_id):
    # Load hospital data
    hospital_data = {
        'id': hospital_id,
        'name': 'XYZ Hospital',
        'logo_url': '/static/images/xyz_logo/logo.png',
        'primary_color': '#2563eb',
        'secondary_color': '#059669'
    }
    return render_template("widget/embed.html", hospital=hospital_data)

@app.route("/widget/<hospital_id>/embed.js")
def widget_embed_js(hospital_id):
    # Return the widget embed JavaScript
    return send_file("static/js/widget-embed.js", mimetype="application/javascript")


@app.route("/meta/departments")
def meta_depts():
    try:
        # Check if we're using the correct database
        from config_db import DATABASE_URL
        if not DATABASE_URL.startswith("postgresql"):
            logger.warning("Using SQLite database - falling back to JSON data")
            # Fallback to JSON data service for development
            from services import data_service_json as json_ds
            departments = json_ds.list_departments()
            logger.info(f"Found {len(departments)} departments in JSON fallback")
            return jsonify(departments)
        
        hospital_id = request.args.get('hospital_id', 'xyz')
        departments = ds.list_departments(hospital_id=hospital_id)
        logger.info(f"Found {len(departments)} departments in Supabase for hospital {hospital_id}")
        return jsonify(departments)
    except Exception as e:
        logger.error(f"Error fetching departments: {e}")
        # Try JSON fallback even if database fails
        try:
            from services import data_service_json as json_ds
            departments = json_ds.list_departments()
            logger.info(f"Fallback successful: Found {len(departments)} departments in JSON")
            return jsonify(departments)
        except Exception as fallback_error:
            logger.error(f"JSON fallback also failed: {fallback_error}")
            # Return empty array instead of error to prevent frontend crashes
            logger.warning("Returning empty departments array due to all fallbacks failing")
            return jsonify([])

@app.route("/meta/doctors")
def meta_doctors():
    dept = request.args.get("department_id")
    try:
        # Check if we're using the correct database
        from config_db import DATABASE_URL
        if not DATABASE_URL.startswith("postgresql"):
            logger.warning("Using SQLite database - falling back to JSON data for doctors")
            # Fallback to JSON data service for development
            from services import data_service_json as json_ds
            doctors = json_ds.list_doctors(dept)
            logger.info(f"Found {len(doctors)} doctors in JSON fallback")
            return jsonify(doctors)
        
        hospital_id = request.args.get('hospital_id', 'xyz')
        doctors = ds.list_doctors(dept, hospital_id=hospital_id)
        logger.info(f"Found {len(doctors)} doctors in Supabase for hospital {hospital_id}")
        return jsonify(doctors)
    except Exception as e:
        logger.error(f"Error fetching doctors: {e}")
        # Try JSON fallback even if database fails
        try:
            from services import data_service_json as json_ds
            doctors = json_ds.list_doctors(dept)
            logger.info(f"Fallback successful: Found {len(doctors)} doctors in JSON")
            return jsonify(doctors)
        except Exception as fallback_error:
            logger.error(f"JSON fallback also failed: {fallback_error}")
            # Return empty array instead of error to prevent frontend crashes
            logger.warning("Returning empty doctors array due to all fallbacks failing")
            return jsonify([])

@app.route("/meta/doctor_days")
def meta_doctor_days():
    doc_id = request.args.get("doctor_id")
    if not doc_id:
        return jsonify([]), 400
    
    try:
        # Check if we're using the correct database
        from config_db import DATABASE_URL
        if not DATABASE_URL.startswith("postgresql"):
            # Fallback to JSON data service for development
            from services import data_service_json as json_ds
            doctors = json_ds.list_doctors(None)
        else:
            doctors = ds.list_doctors(None)
            
        for doc in doctors:
            if str(doc["id"]) == str(doc_id):
                return jsonify(doc.get("available_days", []))
        return jsonify([]), 404
    except Exception as e:
        logger.error(f"Error fetching doctor days: {e}")
        return jsonify([]), 500

@app.route("/meta/slots")
def meta_slots():
    try:
        doctor_id = request.args.get("doctor_id")
        date_str = request.args.get("date")

        if not doctor_id or not date_str:
            return jsonify({"slots": []}), 400

        # Check if we're using the correct database
        from config_db import DATABASE_URL
        if not DATABASE_URL.startswith("postgresql"):
            # Fallback to JSON data service for development
            from services import data_service_json as json_ds
            slots_data = json_ds.list_slots(doctor_id, date_str)
            logger.info(f"Found {len(slots_data.get('slots', []))} slots in JSON fallback")
        else:
            # Use DB-based service
            slots_data = ds.list_slots(doctor_id, date_str)
            logger.info(f"Found {len(slots_data.get('slots', []))} slots in database")

        return jsonify(slots_data), 200
    except Exception as e:
        logger.error(f"Error fetching slots: {e}")
        # Try JSON fallback even if database fails
        try:
            from services import data_service_json as json_ds
            slots_data = json_ds.list_slots(doctor_id, date_str)
            logger.info(f"Fallback successful: Found {len(slots_data.get('slots', []))} slots in JSON")
            return jsonify(slots_data), 200
        except Exception as fallback_error:
            logger.error(f"JSON fallback also failed: {fallback_error}")
            # Return empty slots instead of error to prevent frontend crashes
            logger.warning("Returning empty slots array due to all fallbacks failing")
            return jsonify({"slots": []}), 200


@app.route("/appointments/confirm", methods=["POST"])
def confirm():
    try:
        data = request.get_json() or {}
        data["doctor"] = str(data.get("doctor") or "")
        data["department"] = str(data.get("department") or "")

        if not data:
            return jsonify({"detail": "No data received"}), 400

        lang = data.get("language", "en")

        # Auto-fill doctor name if missing
        if not data["doctor"] and data.get("doctor_id"):
            doc_info = next((d for d in ds.list_doctors(None) if str(d["id"]) == str(data["doctor_id"])), None)
            if doc_info:
                data["doctor"] = doc_info["name"]["en"]
            else:
                return jsonify({"detail": "Invalid doctor_id"}), 400

        # Auto-fill department name if missing
        if not data["department"] and data.get("department_id"):
            dept_info = next((dep for dep in ds.list_departments() if str(dep["id"]) == str(data["department_id"])), None)
            if dept_info:
                data["department"] = dept_info["name"]["en"]
            else:
                return jsonify({"detail": "Invalid department_id"}), 400

        phone = data.get("phone", "")
        prefix = phone[:4] if len(phone) >= 4 else "0000"
        random_suffix = f"{random.randint(0, 99):02d}"
        data["custom_code"] = f"{prefix}{random_suffix}"

        appt = ds.create_preview(data)
        if not appt:
            return jsonify({"detail": "Preview creation failed"}), 400

        appt = ds.confirm_appointment(appt["id"])
        if not appt or "error" in appt:
            return jsonify({"detail": appt.get("error", "Preview creation failed")}), 400

        appt["department"] = data["department"]
        appt["doctor"] = data["doctor"]
        appt["custom_code"] = data["custom_code"]

        slip = generate_pdf_for_appointment(appt, lang=lang)
        return jsonify({"appointment_id": appt["id"], "custom_code": data["custom_code"], "slip_path": slip}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500


@app.route("/appointments/<int:appointment_id>", methods=["PATCH"])
def patch(appointment_id):
    try:
        patch_data = request.get_json() or {}
        patch_data["doctor"] = str(patch_data.get("doctor") or "")
        patch_data["department"] = str(patch_data.get("department") or "")

        if not patch_data:
            return jsonify({"detail": "No data received for update"}), 400

        lang = patch_data.get("language", "en")

        # ✅ Fetch appointment first
        appt = ds.get_appointment_by_id(appointment_id)   # make sure ds has this
        if not appt:
            return jsonify({"detail": "not found"}), 404

        # ✅ Check restriction (must be > 6 hours before scheduled time)
        try:
            appt_datetime = datetime.strptime(f"{appt['date']} {appt['time']}", "%Y-%m-%d %H:%M")
            if appt_datetime - datetime.now() < timedelta(hours=6):
                return jsonify({"detail": "Editing not allowed within 6 hours of appointment"}), 400
        except Exception:
            pass  # fallback: skip restriction if parsing fails

        # Auto-fill missing doctor name
        if not patch_data["doctor"] and patch_data.get("doctor_id"):
            doc_info = next((d for d in ds.list_doctors(None) if str(d["id"]) == str(patch_data["doctor_id"])), None)
            if doc_info:
                patch_data["doctor"] = doc_info["name"]["en"]

        # Auto-fill missing department name
        if not patch_data["department"] and patch_data.get("department_id"):
            dept_info = next((dep for dep in ds.list_departments() if str(dep["id"]) == str(patch_data["department_id"])), None)
            if dept_info:
                patch_data["department"] = dept_info["name"]["en"]

        # ✅ Update appointment
        appt = ds.update_appointment(appointment_id, patch_data)
        if not appt:
            return jsonify({"detail": "not found or cannot update"}), 400

        slip = generate_pdf_for_appointment(appt, lang=lang)
        return jsonify({"appointment": appt, "slip_path": slip}), 200

    except ValueError as e:
        return jsonify({"detail": str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500

@app.route("/appointments/find", methods=["POST"])
def find():
    try:
        cleanup_old_appointments()   # 🔥 auto-remove expired ones
        data = request.get_json()
        if not data or not data.get("key"):
            return jsonify({"detail": "key is required"}), 400
        
        key = data.get("key")
        appt = ds.find_by_key(key)
        if not appt:
            return jsonify({"detail": "not found"}), 404
        
        # Ensure all values are JSON serializable
        for k, v in appt.items():
            if hasattr(v, 'isoformat'):
                appt[k] = v.isoformat()
        
        return jsonify(appt)
    except Exception as e:
        print(f"Error in find endpoint: {e}")
        traceback.print_exc()
        return jsonify({"detail": "Internal server error"}), 500


@app.route("/appointments/<int:appointment_id>/cancel", methods=["POST"])
def cancel(appointment_id):
    try:
        body = request.get_json(silent=True)
        if not body or not body.get("confirm"):
            return jsonify({"status": "cancel aborted"}), 400

        ok = ds.delete_appointment(appointment_id)   # hard delete
        if not ok:
            return jsonify({"detail": "not found"}), 404

        return jsonify({"status": "cancelled"}), 200

    except Exception as e:
        # Always return JSON, never HTML
        return jsonify({"error": str(e)}), 500



@app.route("/appointments/<int:appointment_id>/slip", methods=["GET"])
def download_slip(appointment_id):
    slipfile_custom = pathlib.Path(BASE_DIR) / "data" / "slips" / f"XYZ_{appointment_id}.pdf"
    if slipfile_custom.exists():
        return send_file(str(slipfile_custom), as_attachment=True, download_name=slipfile_custom.name)
    return jsonify({"detail": "slip not found"}), 404


@app.route("/appointments/<appointment_id>/edit")
def edit_appointment_page(appointment_id):
    return render_template("edit_appointment.html", appointment_id=appointment_id)

@app.route("/queries", methods=["POST"])
def handle_queries():
    try:
        data = request.get_json() or {}
        question = data.get("question", "")
        lang = data.get("lang", "english").lower()

        answer = get_general_query_answer(question, lang)

        # --- Helper to localize values ---
        def pick(val):
            if isinstance(val, dict):
                return val.get(lang) or val.get("english") or ""
            return val or ""

        if answer.get("type") == "timings":
            answer["opd"] = pick(answer.get("opd"))
            answer["emergency"] = pick(answer.get("emergency"))
            answer["visiting"] = pick(answer.get("visiting"))

        elif answer.get("type") == "doctors":
            # ✅ Normalize department name
            dept = answer.get("department", "")
            if isinstance(dept, dict):
                answer["department"] = dept.get(lang) or dept.get("english") or ""
            else:
                answer["department"] = str(dept) if dept else ""

            # ✅ Normalize doctor info
            doctors = []
            for d in answer.get("doctors", []):
                doctors.append({
                    "name": pick(d.get("name")),
                    "qualification": pick(d.get("qualification")),
                    "experience": pick(d.get("experience")),
                    "timings": pick(d.get("timings")),
                    "fees": d.get("fees", "")
                })
            answer["doctors"] = doctors

        elif answer.get("type") == "departments":
            depts = []
            for d in answer.get("departments", []):
                if isinstance(d, dict):
                    depts.append(d.get(lang) or d.get("english") or "")
                else:
                    depts.append(str(d))
            answer["departments"] = depts

        elif answer.get("type") == "services":
            # Localize services
            new_services = {}
            for k, v in answer.get("services", {}).items():
                new_services[pick(k)] = pick(v)
            answer["services"] = new_services

        elif answer.get("type") == "symptom":
            if isinstance(answer.get("department"), dict):
                answer["department"] = answer["department"].get(lang) or answer["department"].get("english") or ""

            doctors = []
            for d in answer.get("doctors", []):
                doctors.append({
                    "name": pick(d.get("name")),
                    "qualification": pick(d.get("qualification")),
                    "experience": pick(d.get("experience")),
                    "timings": pick(d.get("timings")),
                    "fees": d.get("fees", "")
                })
            answer["doctors"] = doctors

        elif answer.get("type") == "text":
            answer["answer"] = pick(answer.get("answer"))

        return jsonify(answer)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/lang/<lang>")
def get_language(lang):
    try:
        lang_file = BASE_DIR / "static" / "lang" / "lang.json"
        if not lang_file.exists():
            return jsonify({"error": "lang.json file not found"}), 404

        with lang_file.open(encoding="utf-8") as f:
            data = json.load(f)

        if lang in data:
            return jsonify(data[lang])
        elif "english" in data:
            return jsonify(data["english"])
        else:
            return jsonify({"error": f"Language '{lang}' not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"404 error: {request.url}")
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {error}")
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(413)
def too_large(error):
    logger.warning(f"413 error: File too large - {request.url}")
    return jsonify({"error": "File too large"}), 413

# Health check endpoint
@app.route("/health")
def health_check():
    try:
        # Test database connection
        from config_db import DATABASE_URL
        if DATABASE_URL.startswith("postgresql"):
            session = SessionLocal()
            session.execute(text("SELECT 1"))
            session.close()
            db_status = "connected"
        else:
            db_status = "sqlite_fallback"
        
        return jsonify({
            "status": "healthy", 
            "timestamp": datetime.now().isoformat(),
            "database": db_status,
            "environment": os.getenv("FLASK_ENV", "development")
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        # Still return healthy status for basic app functionality
        return jsonify({
            "status": "healthy_with_warnings", 
            "timestamp": datetime.now().isoformat(),
            "database": "disconnected",
            "warning": str(e),
            "environment": os.getenv("FLASK_ENV", "development")
        }), 200

# Debug endpoint to check data
@app.route("/debug/data")
def debug_data():
    try:
        session = SessionLocal()
        dept_count = session.execute(text("SELECT COUNT(*) FROM departments")).scalar()
        doctor_count = session.execute(text("SELECT COUNT(*) FROM doctors")).scalar()
        session.close()
        return jsonify({
            "departments": dept_count,
            "doctors": doctor_count,
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Debug data check failed: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = settings.DEBUG
    
    logger.info(f"Starting Hospital Chat Assistant on {host}:{port}")
    logger.info(f"Environment: {settings.FLASK_ENV}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host=host, port=port, debug=debug)
