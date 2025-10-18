#!/usr/bin/env python3
"""
Quick Responsive Testing Runner
Simplified version for immediate testing without Selenium dependencies
"""

import requests
import json
import time
from urllib.parse import urljoin

class QuickResponsiveTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.results = {}
        
    def test_endpoints(self):
        """Test if all endpoints are accessible"""
        endpoints = [
            {'url': '/', 'name': 'Language Selection'},
            {'url': '/assistant', 'name': 'Assistant Main'},
            {'url': '/chat', 'name': 'Chat Interface'},
            {'url': '/responsive-demo', 'name': 'Responsive Demo'}
        ]
        
        print("Testing endpoint accessibility...")
        
        for endpoint in endpoints:
            try:
                response = requests.get(urljoin(self.base_url, endpoint['url']), timeout=10)
                status = "PASS" if response.status_code == 200 else "FAIL"
                print(f"  {endpoint['name']}: {status} ({response.status_code})")
                
                self.results[endpoint['name']] = {
                    'accessible': response.status_code == 200,
                    'status_code': response.status_code,
                    'content_length': len(response.content)
                }
                
            except requests.exceptions.RequestException as e:
                print(f"  {endpoint['name']}: FAIL ({str(e)})")
                self.results[endpoint['name']] = {
                    'accessible': False,
                    'error': str(e)
                }
    
    def test_responsive_features(self):
        """Test responsive features by checking HTML content"""
        print("\nTesting responsive features...")
        
        try:
            # Test responsive demo page
            response = requests.get(urljoin(self.base_url, '/responsive-demo'), timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Check for responsive CSS classes
                responsive_features = {
                    'responsive_css': 'responsive.css' in content,
                    'viewport_meta': 'viewport' in content,
                    'flexbox_layout': 'flex' in content or 'grid' in content,
                    'media_queries': '@media' in content,
                    'touch_targets': 'min-height' in content and ('44px' in content or '48px' in content),
                    'dynamic_js': 'responsive-interactions.js' in content,
                    'animations_js': 'dynamic-animations.js' in content,
                    'testing_js': 'responsive-testing.js' in content
                }
                
                for feature, present in responsive_features.items():
                    status = "PASS" if present else "FAIL"
                    print(f"  {feature.replace('_', ' ').title()}: {status}")
                
                self.results['responsive_features'] = responsive_features
                
            else:
                print("  Could not access responsive demo page")
                
        except requests.exceptions.RequestException as e:
            print(f"  Error testing responsive features: {e}")
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "="*50)
        print("QUICK RESPONSIVE TEST REPORT")
        print("="*50)
        
        # Endpoint accessibility
        accessible_count = sum(1 for result in self.results.values() 
                             if isinstance(result, dict) and result.get('accessible', False))
        total_endpoints = len([k for k in self.results.keys() if k != 'responsive_features'])
        
        print(f"\nEndpoint Accessibility: {accessible_count}/{total_endpoints}")
        
        # Responsive features
        if 'responsive_features' in self.results:
            features = self.results['responsive_features']
            passed_features = sum(1 for present in features.values() if present)
            total_features = len(features)
            
            print(f"Responsive Features: {passed_features}/{total_features}")
            
            print("\nDetailed Results:")
            for feature, present in features.items():
                status = "PASS" if present else "FAIL"
                print(f"  {status}: {feature.replace('_', ' ').title()}")
        
        # Save report
        with open('quick_responsive_report.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nReport saved to: quick_responsive_report.json")
        
        return accessible_count == total_endpoints and passed_features == total_features

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Quick responsive design test')
    parser.add_argument('--url', default='http://localhost:5000', 
                       help='Base URL of the application')
    
    args = parser.parse_args()
    
    print("Starting Quick Responsive Design Test")
    print(f"Testing URL: {args.url}")
    
    tester = QuickResponsiveTester(args.url)
    
    # Run tests
    tester.test_endpoints()
    tester.test_responsive_features()
    
    # Generate report
    success = tester.generate_report()
    
    if success:
        print("\nQuick responsive test completed successfully!")
        print("\nNext steps:")
        print("  1. Visit /responsive-demo for interactive testing")
        print("  2. Add ?test=true to any URL to enable testing tools")
        print("  3. Run 'python test_responsive.py' for comprehensive testing")
        return 0
    else:
        print("\nSome tests failed. Check the report for details.")
        return 1

if __name__ == "__main__":
    exit(main())
