import csv
import json
from datetime import datetime
from config_db import SessionLocal, engine, Base
from models import User, Department, Doctor, Appointment, HospitalInfo

# Create tables (if not already created)
Base.metadata.create_all(bind=engine)

def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def parse_date(date_str):
    """Normalize date strings to YYYY-MM-DD format."""
    if not date_str:
        return None
    try:
        # Try YYYY-MM-DD
        return datetime.strptime(date_str, "%Y-%m-%d").date().isoformat()
    except ValueError:
        try:
            # Try DD-MM-YYYY
            return datetime.strptime(date_str, "%d-%m-%Y").date().isoformat()
        except ValueError:
            print(f"Invalid date format: {date_str}")
            return date_str

def parse_timestamp(timestamp_str):
    """Convert timestamp string to datetime object or None if NULL."""
    if not timestamp_str or timestamp_str.lower() == "null":
        return None
    try:
        return datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S.%f")
    except ValueError:
        print(f"Invalid timestamp format: {timestamp_str}")
        return None

def parse_boolean(bool_str):
    """Convert string or None to boolean."""
    if bool_str is None or bool_str.lower() == "null":
        return False
    return bool_str.lower() == "true"

def migrate():
    # Check if we're using PostgreSQL (Supabase) or SQLite
    from config_db import DATABASE_URL
    if not DATABASE_URL.startswith("postgresql"):
        print("⚠️  Skipping data migration - not using PostgreSQL database")
        print("   Data migration only works with Supabase PostgreSQL")
        return
    
    print("🔄 Starting data migration to Supabase PostgreSQL...")
    session = SessionLocal()
    try:
        # --- USERS ---
        try:
            users = load_json("app/data/users.json")
            for u in users:
                session.merge(User(**u))
            session.commit()
            print("Users migrated successfully")
        except FileNotFoundError:
            print("Warning: app/data/users.json not found, skipping user migration")

        # --- DEPARTMENTS ---
        try:
            depts = load_json("app/data/departments.json")
            for d in depts:
                dept_obj = Department(
                    id=d["id"],
                    name_en=d["name"].get("en"),
                    name_hi=d["name"].get("hi"),
                    name_mr=d["name"].get("mr"),
                )
                session.merge(dept_obj)
            session.commit()
            print("Departments migrated successfully")
        except FileNotFoundError:
            print("Warning: app/data/departments.json not found, skipping department migration")

        # --- DOCTORS ---
        try:
            doctors = load_json("app/data/doctors.json")
            for d in doctors:
                doc_obj = Doctor(
                    id=d["id"],
                    department_id=d["department_id"],
                    name_en=d["name"].get("en"),
                    name_hi=d["name"].get("hi"),
                    name_mr=d["name"].get("mr"),
                    education=d["education"],
                    experience=d["experience"],
                    fees=d["fees"],
                    available_days=d["available_days"],
                    start_time=d.get("start_time"),
                    end_time=d.get("end_time"),
                )
                session.merge(doc_obj)
            session.commit()
            print("Doctors migrated successfully")
        except FileNotFoundError:
            print("Warning: app/data/doctors.json not found, skipping doctor migration")

        # --- APPOINTMENTS ---
        with open("app/data/appointments.csv", newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                appt_obj = Appointment(
                    # Do not set id to avoid conflicts with autoincrement
                    name=row["name"],
                    phone=row["phone"],
                    department_id=row["department_id"],
                    doctor_id=row["doctor_id"],
                    date=parse_date(row["date"]),
                    time=row["time"],
                    status=row["status"].lower(),
                    created_at=parse_timestamp(row["created_at"]),
                    updated_at=parse_timestamp(row["updated_at"]),
                    can_edit=parse_boolean(row["can_edit"]),
                    is_updated=parse_boolean(row["is_updated"]),
                    is_new=parse_boolean(row["is_new"]),
                    viewed_by_admin=parse_boolean(row["viewed_by_admin"]),
                )
                session.merge(appt_obj)
            session.commit()
            print("Appointments migrated successfully")

        # --- HOSPITAL INFO ---
        try:
            hosp = load_json("app/data/hospital_info.json")["hospital"]
            hosp_obj = HospitalInfo(
                name_en=hosp["name"]["english"],
                name_hi=hosp["name"]["hindi"],
                name_mr=hosp["name"]["marathi"],
                address_en=hosp["address"]["english"],
                address_hi=hosp["address"]["hindi"],
                address_mr=hosp["address"]["marathi"],
                phone=hosp["phone"],
                email=hosp["email"]
            )
            session.merge(hosp_obj)
            session.commit()
            print("Hospital info migrated successfully")
        except FileNotFoundError:
            print("Warning: data/hospital_info.json not found, skipping hospital info migration")

    except Exception as e:
        print(f"Migration failed: {str(e)}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
    print("Database migration complete.")