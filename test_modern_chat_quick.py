#!/usr/bin/env python3
"""
Quick Modern Chat UI Testing Script
Tests the modern chat interface without Selenium dependencies
"""

import requests
import json
import time
from urllib.parse import urljoin

class QuickModernChatTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.results = {}
        
    def test_modern_chat_endpoints(self):
        """Test if modern chat endpoints are accessible"""
        endpoints = [
            {'url': '/modern-chat', 'name': 'Modern Chat Interface'},
            {'url': '/chat', 'name': 'Enhanced Chat Interface'},
            {'url': '/responsive-demo', 'name': 'Responsive Demo'}
        ]
        
        print("Testing modern chat endpoint accessibility...")
        
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
    
    def test_modern_chat_features(self):
        """Test modern chat features by checking HTML content"""
        print("\nTesting modern chat features...")
        
        try:
            # Test modern chat page
            response = requests.get(urljoin(self.base_url, '/modern-chat'), timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Check for modern chat CSS classes and features
                modern_features = {
                    'modern_chat_css': 'modern-chat.css' in content,
                    'modern_chat_container': 'modern-chat-container' in content,
                    'modern_chat_header': 'modern-chat-header' in content,
                    'modern_chat_messages': 'modern-chat-messages' in content,
                    'modern_chat_input': 'modern-chat-input' in content,
                    'message_bubbles': 'message-bubble' in content,
                    'quick_actions': 'quick-actions' in content,
                    'typing_indicator': 'typing-indicator' in content,
                    'chat_avatar': 'chat-avatar' in content,
                    'status_indicator': 'status-indicator' in content,
                    'send_button': 'send-button' in content,
                    'attachment_button': 'attachment-button' in content,
                    'modern_chat_js': 'modern-chat.js' in content,
                    'backdrop_filter': 'backdrop-filter' in content,
                    'gradient_backgrounds': 'linear-gradient' in content,
                    'css_animations': '@keyframes' in content,
                    'responsive_breakpoints': '@media' in content,
                    'touch_friendly': 'min-height: 44px' in content or 'min-height:44px' in content,
                    'viewport_meta': 'viewport' in content,
                    'font_awesome': 'font-awesome' in content
                }
                
                for feature, present in modern_features.items():
                    status = "PASS" if present else "FAIL"
                    print(f"  {feature.replace('_', ' ').title()}: {status}")
                
                self.results['modern_chat_features'] = modern_features
                
            else:
                print("  Could not access modern chat page")
                
        except requests.exceptions.RequestException as e:
            print(f"  Error testing modern chat features: {e}")
    
    def test_responsive_design(self):
        """Test responsive design features"""
        print("\nTesting responsive design features...")
        
        try:
            # Test responsive demo page
            response = requests.get(urljoin(self.base_url, '/responsive-demo'), timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                responsive_features = {
                    'responsive_demo': 'responsive-demo' in content,
                    'device_preview': 'device-frame' in content,
                    'interactive_demos': 'interaction-button' in content,
                    'performance_metrics': 'performance-metrics' in content,
                    'test_controls': 'test-controls' in content,
                    'responsive_testing': 'responsive-testing.js' in content,
                    'dynamic_animations': 'dynamic-animations.js' in content,
                    'responsive_interactions': 'responsive-interactions.js' in content,
                    'css_grid': 'grid-template-columns' in content,
                    'flexbox': 'display: flex' in content or 'display:flex' in content,
                    'media_queries': '@media (max-width:' in content,
                    'mobile_optimization': 'mobile-device' in content,
                    'tablet_optimization': 'tablet-device' in content,
                    'desktop_optimization': 'desktop-device' in content
                }
                
                for feature, present in responsive_features.items():
                    status = "PASS" if present else "FAIL"
                    print(f"  {feature.replace('_', ' ').title()}: {status}")
                
                self.results['responsive_design'] = responsive_features
                
            else:
                print("  Could not access responsive demo page")
                
        except requests.exceptions.RequestException as e:
            print(f"  Error testing responsive design: {e}")
    
    def test_ui_components(self):
        """Test UI components and structure"""
        print("\nTesting UI components...")
        
        try:
            # Test main chat page
            response = requests.get(urljoin(self.base_url, '/chat'), timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                ui_components = {
                    'chat_shell': 'chat-shell' in content,
                    'menu_cards': 'menu-card' in content,
                    'ai_icon': 'ai-doctor-icon' in content,
                    'gradient_backgrounds': 'linear-gradient(135deg' in content,
                    'modern_animations': 'animation:' in content,
                    'hover_effects': 'hover' in content,
                    'touch_interactions': 'touch' in content,
                    'keyboard_navigation': 'keyboard' in content,
                    'accessibility': 'aria-' in content or 'role=' in content,
                    'loading_states': 'loading' in content,
                    'error_handling': 'error' in content,
                    'connection_status': 'connection-status' in content,
                    'file_upload': 'file' in content and 'upload' in content,
                    'quick_replies': 'quick-reply' in content,
                    'message_timestamps': 'timestamp' in content
                }
                
                for component, present in ui_components.items():
                    status = "PASS" if present else "FAIL"
                    print(f"  {component.replace('_', ' ').title()}: {status}")
                
                self.results['ui_components'] = ui_components
                
            else:
                print("  Could not access main chat page")
                
        except requests.exceptions.RequestException as e:
            print(f"  Error testing UI components: {e}")
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "="*60)
        print("MODERN CHAT UI QUICK TEST REPORT")
        print("="*60)
        
        # Endpoint accessibility
        accessible_count = sum(1 for result in self.results.values() 
                             if isinstance(result, dict) and result.get('accessible', False))
        total_endpoints = len([k for k in self.results.keys() if k in ['Modern Chat Interface', 'Enhanced Chat Interface', 'Responsive Demo']])
        
        print(f"\nEndpoint Accessibility: {accessible_count}/{total_endpoints}")
        
        # Feature summaries
        feature_categories = ['modern_chat_features', 'responsive_design', 'ui_components']
        
        for category in feature_categories:
            if category in self.results:
                features = self.results[category]
                passed_features = sum(1 for present in features.values() if present)
                total_features = len(features)
                
                print(f"\n{category.replace('_', ' ').title()}: {passed_features}/{total_features}")
                
                print("  Detailed Results:")
                for feature, present in features.items():
                    status = "PASS" if present else "FAIL"
                    print(f"    {status}: {feature.replace('_', ' ').title()}")
        
        # Save report
        with open('modern_chat_quick_report.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nReport saved to: modern_chat_quick_report.json")
        
        # Overall success rate
        all_features = []
        for category in feature_categories:
            if category in self.results:
                all_features.extend(self.results[category].values())
        
        if all_features:
            success_rate = sum(1 for feature in all_features if feature) / len(all_features) * 100
            print(f"\nOverall Success Rate: {success_rate:.1f}%")
            
            return accessible_count == total_endpoints and success_rate >= 80
        else:
            return accessible_count == total_endpoints
    
    def run_quick_test(self):
        """Run quick modern chat test"""
        print("Starting Quick Modern Chat UI Test")
        print(f"Testing URL: {self.base_url}")
        
        # Run tests
        self.test_modern_chat_endpoints()
        self.test_modern_chat_features()
        self.test_responsive_design()
        self.test_ui_components()
        
        # Generate report
        success = self.generate_report()
        
        return success

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Quick modern chat UI test')
    parser.add_argument('--url', default='http://localhost:5000', 
                       help='Base URL of the application')
    
    args = parser.parse_args()
    
    print("Starting Quick Modern Chat UI Test")
    print(f"Testing URL: {args.url}")
    
    tester = QuickModernChatTester(args.url)
    success = tester.run_quick_test()
    
    if success:
        print("\nModern chat UI quick test completed successfully!")
        print("\nNext steps:")
        print("  1. Visit /modern-chat for the new chat interface")
        print("  2. Visit /responsive-demo for interactive testing")
        print("  3. Run 'python test_modern_chat.py' for comprehensive testing")
        return 0
    else:
        print("\nSome tests failed. Check the report for details.")
        return 1

if __name__ == "__main__":
    exit(main())
