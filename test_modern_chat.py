#!/usr/bin/env python3
"""
Modern Chat UI Testing Script
Tests the new modern chat interface across different devices and screen sizes
"""

import time
import json
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

class ModernChatTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.results = {}
        self.driver = None
        
        # Test configurations for modern chat
        self.devices = {
            'mobile_portrait': {'width': 375, 'height': 667, 'name': 'Mobile Portrait'},
            'mobile_landscape': {'width': 667, 'height': 375, 'name': 'Mobile Landscape'},
            'tablet_portrait': {'width': 768, 'height': 1024, 'name': 'Tablet Portrait'},
            'tablet_landscape': {'width': 1024, 'height': 768, 'name': 'Tablet Landscape'},
            'desktop_small': {'width': 1280, 'height': 720, 'name': 'Desktop Small'},
            'desktop_large': {'width': 1920, 'height': 1080, 'name': 'Desktop Large'}
        }
        
        self.chat_pages = [
            {'url': '/chat', 'name': 'Main Chat Interface'},
            {'url': '/modern-chat', 'name': 'Modern Chat Interface'},
            {'url': '/responsive-demo', 'name': 'Responsive Demo'}
        ]

    def setup_driver(self):
        """Setup Chrome driver with modern chat testing options"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--enable-features=NetworkService,NetworkServiceInProcess')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            return True
        except WebDriverException as e:
            print(f"Error setting up Chrome driver: {e}")
            print("Please ensure ChromeDriver is installed and in PATH")
            return False

    def test_modern_chat_interface(self, page_url, device_config):
        """Test modern chat interface with specific device configuration"""
        device_name = device_config['name']
        width = device_config['width']
        height = device_config['height']
        
        print(f"Testing {page_url} on {device_name} ({width}x{height})")
        
        try:
            # Set viewport size
            self.driver.set_window_size(width, height)
            
            # Navigate to page
            full_url = self.base_url + page_url
            self.driver.get(full_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Take screenshot
            screenshot_name = f"modern_chat_{device_name.replace(' ', '_')}_{page_url.replace('/', '_')}.png"
            self.driver.save_screenshot(screenshot_name)
            
            # Test modern chat elements
            test_results = self.run_modern_chat_tests(device_config, page_url)
            
            return {
                'success': True,
                'screenshot': screenshot_name,
                'tests': test_results,
                'viewport': {'width': width, 'height': height}
            }
            
        except TimeoutException:
            return {
                'success': False,
                'error': 'Page load timeout',
                'viewport': {'width': width, 'height': height}
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'viewport': {'width': width, 'height': height}
            }

    def run_modern_chat_tests(self, device_config, page_url):
        """Run specific modern chat interface tests"""
        tests = {}
        
        try:
            # Test 1: Modern Chat Container
            modern_container = self.driver.find_element(By.CLASS_NAME, "modern-chat-container")
            if modern_container:
                container_rect = modern_container.get_property('getBoundingClientRect')()
                tests['modern_chat_container'] = {
                    'passed': container_rect['height'] > 0,
                    'height': container_rect['height'],
                    'visible': modern_container.is_displayed()
                }
            
            # Test 2: Chat Header
            chat_header = self.driver.find_element(By.CLASS_NAME, "modern-chat-header")
            if chat_header:
                header_rect = chat_header.get_property('getBoundingClientRect')()
                tests['chat_header'] = {
                    'passed': header_rect['height'] >= 60,
                    'height': header_rect['height'],
                    'visible': chat_header.is_displayed()
                }
                
                # Test chat avatar
                avatar = self.driver.find_element(By.CLASS_NAME, "chat-avatar")
                if avatar:
                    avatar_rect = avatar.get_property('getBoundingClientRect')()
                    tests['chat_avatar'] = {
                        'passed': avatar_rect['width'] >= 30 and avatar_rect['height'] >= 30,
                        'size': f"{avatar_rect['width']}x{avatar_rect['height']}"
                    }
            
            # Test 3: Chat Messages Area
            messages_area = self.driver.find_element(By.CLASS_NAME, "modern-chat-messages")
            if messages_area:
                messages_rect = messages_area.get_property('getBoundingClientRect')()
                tests['messages_area'] = {
                    'passed': messages_rect['height'] > 0,
                    'height': messages_rect['height'],
                    'scrollable': messages_area.get_attribute('scrollHeight') > messages_rect['height']
                }
            
            # Test 4: Chat Input Area
            input_area = self.driver.find_element(By.CLASS_NAME, "modern-chat-input")
            if input_area:
                input_rect = input_area.get_property('getBoundingClientRect')()
                tests['input_area'] = {
                    'passed': input_rect['height'] >= 60,
                    'height': input_rect['height'],
                    'visible': input_area.is_displayed()
                }
                
                # Test message input
                message_input = self.driver.find_element(By.CLASS_NAME, "message-input")
                if message_input:
                    input_rect = message_input.get_property('getBoundingClientRect')()
                    tests['message_input'] = {
                        'passed': input_rect['height'] >= 40,
                        'height': input_rect['height'],
                        'placeholder': message_input.get_attribute('placeholder') is not None
                    }
                
                # Test send button
                send_button = self.driver.find_element(By.CLASS_NAME, "send-button")
                if send_button:
                    button_rect = send_button.get_property('getBoundingClientRect')()
                    tests['send_button'] = {
                        'passed': button_rect['width'] >= 40 and button_rect['height'] >= 40,
                        'size': f"{button_rect['width']}x{button_rect['height']}",
                        'clickable': send_button.is_enabled()
                    }
            
            # Test 5: Quick Actions
            quick_actions = self.driver.find_element(By.CLASS_NAME, "quick-actions")
            if quick_actions:
                actions_rect = quick_actions.get_property('getBoundingClientRect')()
                action_buttons = self.driver.find_elements(By.CLASS_NAME, "quick-action-btn")
                
                tests['quick_actions'] = {
                    'passed': len(action_buttons) >= 3,
                    'button_count': len(action_buttons),
                    'height': actions_rect['height'],
                    'visible': quick_actions.is_displayed()
                }
            
            # Test 6: Responsive Behavior
            viewport_width = device_config['width']
            if viewport_width <= 768:  # Mobile
                tests['mobile_optimization'] = {
                    'passed': self.test_mobile_optimization(),
                    'viewport_width': viewport_width
                }
            elif viewport_width <= 1024:  # Tablet
                tests['tablet_optimization'] = {
                    'passed': self.test_tablet_optimization(),
                    'viewport_width': viewport_width
                }
            else:  # Desktop
                tests['desktop_optimization'] = {
                    'passed': self.test_desktop_optimization(),
                    'viewport_width': viewport_width
                }
            
            # Test 7: CSS Grid and Flexbox Support
            tests['css_support'] = {
                'grid_support': self.test_css_grid_support(),
                'flexbox_support': self.test_flexbox_support(),
                'modern_css_features': self.test_modern_css_features()
            }
            
        except Exception as e:
            tests['error'] = str(e)
        
        return tests

    def test_mobile_optimization(self):
        """Test mobile-specific optimizations"""
        try:
            # Check if touch targets are adequate
            buttons = self.driver.find_elements(By.CSS_SELECTOR, "button, .quick-action-btn, .send-button")
            adequate_targets = 0
            
            for button in buttons:
                if button.is_displayed():
                    rect = button.get_property('getBoundingClientRect')()
                    if rect['width'] >= 44 and rect['height'] >= 44:
                        adequate_targets += 1
            
            # Check if layout is single column
            quick_actions = self.driver.find_element(By.CLASS_NAME, "quick-actions")
            actions_rect = quick_actions.get_property('getBoundingClientRect')()
            
            return adequate_targets >= len(buttons) * 0.8 and actions_rect['height'] <= 100
            
        except:
            return False

    def test_tablet_optimization(self):
        """Test tablet-specific optimizations"""
        try:
            # Check if layout adapts well to tablet size
            container = self.driver.find_element(By.CLASS_NAME, "modern-chat-container")
            container_rect = container.get_property('getBoundingClientRect')()
            
            # Check if quick actions are properly arranged
            quick_actions = self.driver.find_element(By.CLASS_NAME, "quick-actions")
            actions_rect = quick_actions.get_property('getBoundingClientRect')()
            
            return container_rect['width'] > 700 and actions_rect['height'] <= 80
            
        except:
            return False

    def test_desktop_optimization(self):
        """Test desktop-specific optimizations"""
        try:
            # Check if layout uses full desktop space efficiently
            container = self.driver.find_element(By.CLASS_NAME, "modern-chat-container")
            container_rect = container.get_property('getBoundingClientRect')()
            
            # Check if hover effects are available
            header_buttons = self.driver.find_elements(By.CLASS_NAME, "header-btn")
            
            return container_rect['width'] > 1200 and len(header_buttons) >= 2
            
        except:
            return False

    def test_css_grid_support(self):
        """Test CSS Grid support"""
        try:
            # Check if modern CSS features are working
            result = self.driver.execute_script("""
                return CSS.supports('display', 'grid');
            """)
            return result
        except:
            return False

    def test_flexbox_support(self):
        """Test Flexbox support"""
        try:
            result = self.driver.execute_script("""
                return CSS.supports('display', 'flex');
            """)
            return result
        except:
            return False

    def test_modern_css_features(self):
        """Test modern CSS features"""
        try:
            result = self.driver.execute_script("""
                return CSS.supports('backdrop-filter', 'blur(10px)') && 
                       CSS.supports('transform', 'translateY(0)') &&
                       CSS.supports('animation', 'fadeIn 1s');
            """)
            return result
        except:
            return False

    def test_chat_interactions(self):
        """Test chat interactions and animations"""
        print("Testing chat interactions...")
        
        try:
            # Navigate to modern chat page
            self.driver.get(self.base_url + "/modern-chat")
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "modern-chat-container"))
            )
            
            interaction_results = {}
            
            # Test message input
            message_input = self.driver.find_element(By.CLASS_NAME, "message-input")
            if message_input:
                message_input.send_keys("Hello, this is a test message")
                interaction_results['message_input'] = True
                
                # Test send button
                send_button = self.driver.find_element(By.CLASS_NAME, "send-button")
                if send_button:
                    send_button.click()
                    time.sleep(1)
                    interaction_results['send_message'] = True
            
            # Test quick action buttons
            quick_buttons = self.driver.find_elements(By.CLASS_NAME, "quick-action-btn")
            for i, button in enumerate(quick_buttons[:3]):  # Test first 3 buttons
                try:
                    button.click()
                    time.sleep(0.5)
                    interaction_results[f'quick_action_{i}'] = True
                except:
                    interaction_results[f'quick_action_{i}'] = False
            
            # Test header buttons
            header_buttons = self.driver.find_elements(By.CLASS_NAME, "header-btn")
            for i, button in enumerate(header_buttons):
                try:
                    button.click()
                    time.sleep(0.5)
                    interaction_results[f'header_button_{i}'] = True
                except:
                    interaction_results[f'header_button_{i}'] = False
            
            return interaction_results
            
        except Exception as e:
            return {'error': str(e)}

    def run_comprehensive_test(self):
        """Run comprehensive modern chat testing"""
        print("Starting comprehensive modern chat UI testing...")
        
        if not self.setup_driver():
            return False
        
        try:
            # Test each page on each device
            for page in self.chat_pages:
                page_results = {}
                
                for device_name, device_config in self.devices.items():
                    result = self.test_modern_chat_interface(page['url'], device_config)
                    page_results[device_name] = result
                
                self.results[page['name']] = page_results
            
            # Test chat interactions
            self.results['chat_interactions'] = self.test_chat_interactions()
            
            # Generate report
            self.generate_report()
            
            return True
            
        except Exception as e:
            print(f"Error during testing: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*70)
        print("MODERN CHAT UI TEST REPORT")
        print("="*70)
        
        total_tests = 0
        passed_tests = 0
        
        for page_name, page_results in self.results.items():
            if page_name == 'chat_interactions':
                continue
                
            print(f"\n📱 {page_name}")
            print("-" * 50)
            
            for device_name, result in page_results.items():
                device_display = self.devices[device_name]['name']
                status = "✅ PASS" if result['success'] else "❌ FAIL"
                
                print(f"  {device_display}: {status}")
                
                if result['success'] and 'tests' in result:
                    for test_name, test_result in result['tests'].items():
                        total_tests += 1
                        if isinstance(test_result, dict) and test_result.get('passed', False):
                            passed_tests += 1
                        elif isinstance(test_result, bool) and test_result:
                            passed_tests += 1
        
        # Chat interactions summary
        if 'chat_interactions' in self.results:
            print(f"\n🎯 Chat Interactions")
            print("-" * 50)
            interactions = self.results['chat_interactions']
            for interaction, success in interactions.items():
                status = "✅ PASS" if success else "❌ FAIL"
                print(f"  {interaction.replace('_', ' ').title()}: {status}")
        
        # Overall summary
        print(f"\n📊 SUMMARY")
        print("-" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
        
        # Save detailed report
        with open('modern_chat_test_report.json', 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📋 Detailed report saved to: modern_chat_test_report.json")
        print(f"📸 Screenshots saved in current directory")

def main():
    """Main function to run modern chat testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test modern chat UI of hospital chat assistant')
    parser.add_argument('--url', default='http://localhost:5000', 
                       help='Base URL of the application (default: http://localhost:5000)')
    parser.add_argument('--quick', action='store_true',
                       help='Run quick test with fewer devices')
    
    args = parser.parse_args()
    
    tester = ModernChatTester(args.url)
    
    if args.quick:
        # Quick test with fewer devices
        tester.devices = {
            'mobile': {'width': 375, 'height': 667, 'name': 'Mobile'},
            'desktop': {'width': 1920, 'height': 1080, 'name': 'Desktop'}
        }
    
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 Modern chat UI testing completed successfully!")
        return 0
    else:
        print("\n❌ Modern chat UI testing failed!")
        return 1

if __name__ == "__main__":
    exit(main())
