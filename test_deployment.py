#!/usr/bin/env python3
"""
Deployment Test Script
Tests critical endpoints to ensure deployment is working correctly
"""
import requests
import json
import sys
import os

def test_endpoint(url, expected_status=200, description=""):
    """Test a single endpoint"""
    try:
        response = requests.get(url, timeout=10)
        print(f"✅ {description}: {response.status_code}")
        
        if response.status_code == expected_status:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"   📊 Returned {len(data)} items")
                elif isinstance(data, dict):
                    print(f"   📊 Response keys: {list(data.keys())}")
            except:
                print(f"   📊 Response length: {len(response.text)} chars")
            return True
        else:
            print(f"   ❌ Expected {expected_status}, got {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ {description}: Connection failed - {e}")
        return False
    except Exception as e:
        print(f"❌ {description}: Error - {e}")
        return False

def main():
    """Run deployment tests"""
    # Get base URL from command line or use default
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    print(f"🧪 Testing deployment at: {base_url}")
    print("=" * 50)
    
    tests = [
        (f"{base_url}/health", 200, "Health Check"),
        (f"{base_url}/meta/departments", 200, "Departments API"),
        (f"{base_url}/meta/doctors", 200, "Doctors API"),
        (f"{base_url}/meta/doctors?department_id=general_medicine", 200, "Doctors by Department"),
    ]
    
    passed = 0
    total = len(tests)
    
    for url, status, description in tests:
        if test_endpoint(url, status, description):
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! Deployment is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the deployment configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
