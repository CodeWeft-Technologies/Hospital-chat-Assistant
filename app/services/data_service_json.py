# app/services/data_service_json.py
import json
from pathlib import Path
from threading import Lock
from datetime import datetime

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"
APPOINTMENTS_FILE = DATA_DIR / "appointments.json"
DEPTS_FILE = DATA_DIR / "departments.json"
DOCTORS_FILE = DATA_DIR / "doctors.json"

LOCK = Lock()

def _read(path):
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except:
        return []

def _write(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

def list_departments():
    return _read(DEPTS_FILE)

def list_doctors(department_id=None):
    docs = _read(DOCTORS_FILE)
    if department_id:
        return [d for d in docs if d["department_id"] == department_id]
    return docs

def list_slots(doctor_id, date_str):
    default_slots = ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00"]
    appts = _read(APPOINTMENTS_FILE)
    booked = {a["time"] for a in appts if a["doctor_id"]==doctor_id and a["date"]==date_str and a["status"] in ["pending","booked"]}
    return [s for s in default_slots if s not in booked]

def _next_id(appts):
    if not appts:
        return 101
    return max(a.get("id",100) for a in appts) + 1

def create_preview(payload: dict):
    """
    payload: {name, phone, department_id, doctor_id, date (YYYY-MM-DD), time (HH:MM)}
    Creates a 'pending' appointment (preview) that can be confirmed.
    """
    with LOCK:
        appts = _read(APPOINTMENTS_FILE)
        # check duplicate
        for a in appts:
            if a["doctor_id"]==payload["doctor_id"] and a["date"]==payload["date"] and a["time"]==payload["time"] and a["status"] in ["pending","booked"]:
                raise ValueError("Slot already taken")
        new_id = _next_id(appts)
        now = datetime.utcnow().isoformat()
        appt = {
            "id": new_id,
            "name": payload["name"],
            "phone": payload["phone"],
            "department_id": payload["department_id"],
            "doctor_id": payload["doctor_id"],
            "date": payload["date"],
            "time": payload["time"],
            "status": "pending",
            "created_at": now,
            "updated_at": now,
            "can_edit": True
        }
        appts.append(appt)
        _write(APPOINTMENTS_FILE, appts)
        return appt

def confirm_appointment(preview_id: int):
    with LOCK:
        appts = _read(APPOINTMENTS_FILE)
        for a in appts:
            if a["id"]==preview_id and a["status"]=="pending":
                # re-check duplicates
                for other in appts:
                    if other["id"]!=a["id"] and other["doctor_id"]==a["doctor_id"] and other["date"]==a["date"] and other["time"]==a["time"] and other["status"] in ["pending","booked"]:
                        raise ValueError("Slot became unavailable")
                a["status"] = "booked"
                a["can_edit"] = False
                a["updated_at"] = datetime.utcnow().isoformat()
                _write(APPOINTMENTS_FILE, appts)
                return a
        return None

def get_appointment(appointment_id:int):
    appts = _read(APPOINTMENTS_FILE)
    return next((a for a in appts if a["id"]==appointment_id), None)

def find_by_key(key:str):
    appts = _read(APPOINTMENTS_FILE)
    key = key.strip()
    if len(key)==10 and key.isdigit():
        return next((a for a in appts if a["phone"]==key), None)
    else:
        return next((a for a in appts if str(a["id"]).endswith(key)), None)

def update_appointment(appointment_id:int, patch:dict):
    with LOCK:
        appts = _read(APPOINTMENTS_FILE)
        for a in appts:
            if a["id"]==appointment_id and a["status"]!="cancelled":
                new_doctor = patch.get("doctor_id", a["doctor_id"])
                new_date = patch.get("date", a["date"])
                new_time = patch.get("time", a["time"])
                # check slot availability
                for other in appts:
                    if other["id"]!=a["id"] and other["doctor_id"]==new_doctor and other["date"]==new_date and other["time"]==new_time and other["status"] in ["pending","booked"]:
                        raise ValueError("Slot already taken")
                # apply patch
                for k,v in patch.items():
                    if k in ["name","phone","department_id","doctor_id","date","time"]:
                        a[k] = v
                a["updated_at"] = datetime.utcnow().isoformat()
                _write(APPOINTMENTS_FILE, appts)
                return a
        return None

def delete_appointment(appointment_id:int) -> bool:
    with LOCK:
        appts = _read(APPOINTMENTS_FILE)
        new_appts = [a for a in appts if a["id"] != appointment_id]
        if len(new_appts) == len(appts):  # nothing removed
            return False
        _write(APPOINTMENTS_FILE, new_appts)
        return True
