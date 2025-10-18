# services/data_service_db.py
from datetime import datetime, timedelta
import traceback
from config_db import SessionLocal
from models import Appointment, Doctor, Department, User, HospitalInfo
from sqlalchemy.orm.exc import NoResultFound

# Departments
def list_departments():
    session = SessionLocal()
    rows = session.query(Department).all()
    result = []
    for d in rows:
        result.append({
            "id": d.id,
            "name": {"en": d.name_en, "hi": d.name_hi, "mr": d.name_mr}
        })
    session.close()
    return result

# Doctors
def list_doctors(department_id=None):
    session = SessionLocal()
    q = session.query(Doctor)
    if department_id:
        q = q.filter_by(department_id=department_id)
    rows = q.all()
    result = []
    for doc in rows:
        result.append({
            "id": doc.id,
            "department_id": doc.department_id,
            "name": {"en": doc.name_en, "hi": doc.name_hi, "mr": doc.name_mr},
            "education": doc.education,
            "experience": doc.experience,
            "fees": float(doc.fees) if doc.fees else None,
            "available_days": doc.available_days,
            "start_time": doc.start_time,
            "end_time": doc.end_time,
            "photo": doc.photo
        })
    session.close()
    return result

# Appointments
def list_appointments(status=None):
    session = SessionLocal()
    q = session.query(Appointment)
    if status:
        q = q.filter_by(status=status)
    rows = q.all()
    result = []
    for a in rows:
        result.append({
            "id": a.id,
            "name": a.name,
            "phone": a.phone,
            "department_id": a.department_id,
            "doctor_id": a.doctor_id,
            "date": a.date,
            "time": a.time,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
            "can_edit": a.can_edit,
            "is_updated": a.is_updated,
            "is_new": a.is_new,
            "viewed_by_admin": a.viewed_by_admin,
        })
    session.close()
    return result

def get_appointment_by_id(appt_id):
    session = SessionLocal()
    try:
        obj = session.query(Appointment).filter_by(id=appt_id).one()
        d = obj.__dict__.copy()
        d.pop("_sa_instance_state", None)
        return d
    except NoResultFound:
        return None
    finally:
        session.close()

def create_preview(data):
    session = SessionLocal()
    try:
        # Validate required data
        if not data.get("name") or not data.get("phone") or not data.get("date") or not data.get("time"):
             raise ValueError("Missing required fields: name, phone, date, or time")

        # Ensure time is normalized to HH:MM format
        time_str = data.get("time")
        time_val = None
        try:
            # 1. Try parsing as HH:MM (internal format)
            time_val = datetime.strptime(time_str, "%H:%M").strftime("%H:%M")
        except ValueError:
            try:
                # 2. Try parsing as HH:MM AM/PM (display format, e.g., 02:45 PM)
                time_val = datetime.strptime(time_str, "%I:%M %p").strftime("%H:%M")
            except ValueError:
                 raise ValueError("Invalid time format. Must be HH:MM or HH:MM AM/PM.")

        if time_val is None:
            raise ValueError("Invalid time format. Must be HH:MM or HH:MM AM/PM.")

        # Safe casting for IDs: Keep them as strings, consistent with models.py
        dept_id = str(data.get("department_id")) if data.get("department_id") else None
        doc_id = str(data.get("doctor_id")) if data.get("doctor_id") else None

        if not dept_id or not doc_id:
            raise ValueError("department_id and doctor_id must be provided as strings")

        # Create appointment
        obj = Appointment(
            name=str(data.get("name", "")),
            phone=str(data.get("phone", "")),
            department_id=dept_id,
            doctor_id=doc_id,
            date=data.get("date"),
            time=time_val,
            status="preview", # Preview status before final confirmation
            created_at=datetime.now()
        )

        session.add(obj)
        session.commit()

        # Force DB refresh so ID is guaranteed
        session.refresh(obj) 
        if not getattr(obj, "id", None):
            raise ValueError("Database did not return appointment ID")

        d = obj.__dict__.copy()
        d.pop("_sa_instance_state", None)
        print("[SUCCESS] create_preview success with ID:", d.get("id"))
        return d

    except Exception as e:
        session.rollback()
        print("[ERROR] create_preview error:", e)
        traceback.print_exc()
        # Return only the error string
        return {"error": str(e)}

    finally:
        session.close()

def confirm_appointment(appt_id):
    session = SessionLocal()
    try:
        obj = session.query(Appointment).filter_by(id=appt_id).one()
        obj.status = "booked"
        obj.updated_at = datetime.now()
        session.commit()
        session.refresh(obj)

        d = obj.__dict__.copy()
        d.pop("_sa_instance_state", None)
        return d
    except NoResultFound:
        return {"error": f"Appointment with ID {appt_id} not found."}
    except Exception as e:
        session.rollback()
        return {"error": str(e)}
    finally:
        session.close()


def update_appointment(appt_id, patch_data):
    session = SessionLocal()
    try:
        obj = session.query(Appointment).filter_by(id=appt_id).one()
        for k, v in patch_data.items():
            if hasattr(obj, k) and v is not None:
                setattr(obj, k, v)
        obj.is_updated = True
        obj.updated_at = datetime.now()
        session.commit()
        session.refresh(obj)
        d = obj.__dict__.copy()
        d.pop("_sa_instance_state", None)
        return d
    except NoResultFound:
        return None
    except Exception:
        session.rollback()
        return None
    finally:
        session.close()

def delete_appointment(appt_id):
    session = SessionLocal()
    try:
        obj = session.query(Appointment).filter_by(id=appt_id).one()
        session.delete(obj)
        session.commit()
        return True
    except NoResultFound:
        return False
    except Exception:
        session.rollback()
        return False
    finally:
        session.close()

def find_by_key(key):
    session = SessionLocal()
    try:
        # Try to find by phone number first
        obj = session.query(Appointment).filter(
            Appointment.phone.like(f"%{key}%")
        ).first()
        
        # If not found by phone, try by ID (only if key is numeric)
        if not obj and key.isdigit():
            obj = session.query(Appointment).filter(
                Appointment.id == int(key)
            ).first()
        
        if not obj:
            return None
        d = obj.__dict__.copy()
        d.pop("_sa_instance_state", None)
        
        # Convert any datetime objects to strings to avoid serialization issues
        for k, v in d.items():
            if hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
        
        return d
    except Exception as e:
        print(f"Error in find_by_key: {e}")
        return None
    finally:
        session.close()

def get_hospital_info():
    session = SessionLocal()
    try:
        hosp = session.query(HospitalInfo).first()
        if not hosp:
            return {}
        result = {
            "name": {"en": hosp.name_en, "hi": hosp.name_hi, "mr": hosp.name_mr},
            "address": {"en": hosp.address_en, "hi": hosp.address_hi, "mr": hosp.address_mr},
            "phone": hosp.phone,
            "email": hosp.email,
            "website": hosp.website
        }
        return result
    except Exception:
        return {}
    finally:
        session.close()

# 🔥 CRITICAL DEBUGGING ADDITIONS
def list_slots(doctor_id, date_str):
    session = SessionLocal()
    try:
        doctor = session.query(Doctor).filter_by(id=doctor_id).first()
        if not doctor:
            print(f"[ERROR] list_slots: Doctor ID {doctor_id} not found.")
            return {"slots": []}

        # parse date
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
             print(f"[ERROR] list_slots: Invalid date format received: {date_str}")
             return {"slots": []}

        # normalize doctor available_days into list
        available_days = []
        if doctor.available_days:
            if isinstance(doctor.available_days, str):
                available_days = [d.strip().lower() for d in doctor.available_days.split(",")]
            elif isinstance(doctor.available_days, list):
                available_days = [d.lower() for d in doctor.available_days]

        weekday = date.strftime("%A").lower()
        
        # --- DEBUG LOGGING ---
        print(f"[DEBUG] list_slots: Doctor {doctor_id}, Date {date_str}, Weekday {weekday}")
        print(f"[DEBUG] list_slots: Doctor's DB available_days (RAW): {doctor.available_days}")
        print(f"[DEBUG] list_slots: Normalized available_days: {available_days}")
        # ---------------------
        
        if weekday not in available_days:
            print(f"[DEBUG] list_slots: {weekday} is NOT in doctor's available days.")
            return {"slots": []}

        # generate slots between start_time and end_time (default 10:00–17:00 if missing)
        start_str = doctor.start_time or "10:00"
        end_str = doctor.end_time or "17:00"

        start = datetime.strptime(start_str, "%H:%M")
        end = datetime.strptime(end_str, "%H:%M")

        slots = []
        cur = start
        while cur < end:
            slots.append({
                "value": cur.strftime("%H:%M"),          # backend format
                "display": cur.strftime("%I:%M %p")      # frontend display
            })
            cur += timedelta(minutes=15)

        # remove already booked slots
        booked = session.query(Appointment).filter_by(
            doctor_id=doctor_id, date=str(date), status="booked"
        ).all()
        booked_times = {b.time for b in booked}

        available = [s for s in slots if s["value"] not in booked_times]
        
        print(f"[DEBUG] list_slots: Found {len(available)} available slots.")

        return {"slots": available}

    except NoResultFound:
        return {"slots": []}
    except Exception as e:
        # Print error for debugging
        print("[ERROR] list_slots error:", e)
        traceback.print_exc()
        # Return an error structure for the route to handle
        return {"error": str(e)}
    finally:
        session.close()

# User authentication
def find_user(name):
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(name=name).one()
        d = user.__dict__.copy()
        d.pop("_sa_instance_state", None)
        return d
    except NoResultFound:
        return None
    finally:
        session.close()

# Misc
def check_for_appointments_by_phone(phone):
    session = SessionLocal()
    try:
        appts = session.query(Appointment).filter_by(phone=phone)\
            .filter(Appointment.status.in_(["booked", "preview"]))\
            .all()
        return [a.id for a in appts]
    except Exception:
        return []
    finally:
        session.close()

def get_appointments_by_phone(phone):
    """Get all appointments for a phone number with full details"""
    session = SessionLocal()
    try:
        appts = session.query(Appointment).filter_by(phone=phone).all()
        result = []
        for appt in appts:
            appt_dict = appt.__dict__.copy()
            appt_dict.pop("_sa_instance_state", None)
            # Convert datetime objects to strings
            for k, v in appt_dict.items():
                if hasattr(v, 'isoformat'):
                    appt_dict[k] = v.isoformat()
            result.append(appt_dict)
        return result
    except Exception as e:
        print(f"Error getting appointments by phone {phone}: {e}")
        return []
    finally:
        session.close()

def count_appointments_by_status(status):
    session = SessionLocal()
    try:
        count = session.query(Appointment).filter_by(status=status).count()
        return count
    except Exception:
        return 0
    finally:
        session.close()

def mark_appointment_viewed(appt_id):
    session = SessionLocal()
    try:
        obj = session.query(Appointment).filter_by(id=appt_id).one()
        obj.viewed_by_admin = True
        obj.updated_at = datetime.now()
        session.commit()
        session.refresh(obj)
        d = obj.__dict__.copy()
        d.pop("_sa_instance_state", None)
        return d
    except NoResultFound:
        return None
    except Exception:
        session.rollback()
        return None
    finally:
        session.close()
        
def get_slot_for_appointment(doctorid, date, slot=None):
    slots = listslots(doctorid, date)
    if slot in slots:
        return slot
    if slots:
        return slots[0]
    return ""
def listslots(doctorid, date):
    result = list_slots(doctorid, date)
    if "slots" in result:
        return [s["value"] for s in result["slots"]]
    return []
# --- End of services/data_service_db.py ---