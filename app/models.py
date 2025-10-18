from sqlalchemy import Column, Integer, String, Boolean, Text, Numeric, ARRAY, TIMESTAMP, ForeignKey
from config_db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String)
    password = Column(String)
    hospital_id = Column(String)
    address = Column(Text)
    about = Column(Text)
    services = Column(Text)
    staff = Column(Text)
    working_hours = Column(Text)

class Department(Base):
    __tablename__ = "departments"
    id = Column(String, primary_key=True)
    name_en = Column(String)
    name_hi = Column(String)
    name_mr = Column(String)

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(String, primary_key=True)
    department_id = Column(String, ForeignKey("departments.id"))
    name_en = Column(String)
    name_hi = Column(String)
    name_mr = Column(String)
    education = Column(String)
    experience = Column(String)
    fees = Column(Numeric)
    available_days = Column(ARRAY(String))
    start_time = Column(String)
    end_time = Column(String)
    photo = Column(String)  # Store photo filename/path

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String)
    phone = Column(String)
    department_id = Column(String, ForeignKey("departments.id"))
    doctor_id = Column(String, ForeignKey("doctors.id"))
    date = Column(String)
    time = Column(String)
    status = Column(String)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    
    # 💡 CHANGED: New appointments will now be editable by default.
    can_edit = Column(Boolean, default=True) 
    
    is_updated = Column(Boolean, default=False)
    is_new = Column(Boolean, default=True)
    viewed_by_admin = Column(Boolean, default=False)

class HospitalInfo(Base):
    __tablename__ = "hospital_info"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name_en = Column(String)
    name_hi = Column(String)
    name_mr = Column(String)
    address_en = Column(String)
    address_hi = Column(String)
    address_mr = Column(String)
    phone = Column(String)
    email = Column(String)
    website = Column(String)
