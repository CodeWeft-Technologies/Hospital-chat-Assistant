#!/usr/bin/env python3
"""
Deployment Environment Configuration
This script helps configure the application for different deployment environments
"""
import os
import sys

def setup_deployment_environment():
    """Setup environment variables for deployment"""
    
    # Check if we're in a deployment environment
    is_deployment = os.getenv("FLASK_ENV") == "production" or os.getenv("PORT") is not None
    
    if is_deployment:
        print("🚀 Setting up deployment environment...")
        
        # Ensure required directories exist
        import pathlib
        app_dir = pathlib.Path(__file__).parent / "app"
        
        # Create necessary directories
        directories = [
            app_dir / "static" / "uploads",
            app_dir / "data" / "slips", 
            app_dir / "logs"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created directory: {directory}")
        
        # Check database configuration
        database_url = os.getenv("DATABASE_URL")
        if database_url and database_url.startswith("postgresql"):
            print("✅ PostgreSQL database configured")
        else:
            print("⚠️  Using SQLite fallback - ensure JSON data files are available")
            
        # Check if JSON data files exist
        json_files = [
            app_dir / "data" / "departments.json",
            app_dir / "data" / "doctors.json",
            app_dir / "data" / "appointments.json"
        ]
        
        for json_file in json_files:
            if json_file.exists():
                print(f"✅ JSON data file exists: {json_file.name}")
            else:
                print(f"⚠️  JSON data file missing: {json_file.name}")
        
        print("🎯 Deployment environment setup complete!")
    else:
        print("🏠 Local development environment detected")

if __name__ == "__main__":
    setup_deployment_environment()
