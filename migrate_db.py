#!/usr/bin/env python3
"""
Database migration script for Hospital Chat Assistant
This script ensures the database schema is up to date
"""
import os
import sys

# Add the app directory to the Python path
app_dir = os.path.join(os.path.dirname(__file__), 'app')
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

try:
    from config_db import engine
    from sqlalchemy import text, inspect
    
    def migrate_database():
        """Run database migrations"""
        print("🔄 Starting database migration...")
        
        try:
            with engine.connect() as conn:
                # Check if doctors table exists
                inspector = inspect(engine)
                tables = inspector.get_table_names()
                
                if 'doctors' not in tables:
                    print("❌ Doctors table not found. Please run initial database setup.")
                    return False
                
                # Check if photo column exists
                columns = [col['name'] for col in inspector.get_columns('doctors')]
                
                if 'photo' not in columns:
                    print("📸 Adding photo column to doctors table...")
                    conn.execute(text("ALTER TABLE doctors ADD COLUMN photo VARCHAR(255)"))
                    conn.commit()
                    print("✅ Photo column added successfully")
                else:
                    print("✅ Photo column already exists")
                
                print("🎉 Database migration completed successfully")
                return True
                
        except Exception as e:
            print(f"❌ Database migration failed: {e}")
            return False
    
    if __name__ == "__main__":
        success = migrate_database()
        sys.exit(0 if success else 1)
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please ensure all dependencies are installed")
    sys.exit(1)
