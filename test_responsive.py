#!/usr/bin/env python3
"""
Responsive Design Testing Script
Tests the hospital chat assistant across different screen sizes and devices
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

class ResponsiveTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.results = {}
        self.driver = None
        
        # Test configurations
        self.devices = {
            'mobile_portrait': {'width': 375, 'height': 667, 'name': 'Mobile Portrait'},
            'mobile_landscape': {'width': 667, 'height': 375, 'name': 'Mobile Landscape'},
            'tablet_portrait': {'width': 768, 'height': 1024, 'name': 'Tablet Portrait'},
            'tablet_landscape': {'width': 1024, 'height': 768, 'name': 'Tablet Landscape'},
            'desktop_small': {'width': 1280, 'height': 720, 'name': 'Desktop Small'},
            'desktop_large': {'width': 1920, 'height': 1080, 'name': 'Desktop Large'}
        }
        
        self.pages = [
            {'url': '/', 'name': 'Language Selection'},
            {'url': '/assistant', 'name': 'Assistant Main'},
            {'url': '/chat', 'name': 'Chat Interface'},
            {'url': '/responsive-demo', 'name': 'Responsive Demo'}
        ]

    def setup_driver(self):
        """Setup Chrome driver with responsive testing options"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            return True
        except WebDriverException as e:
            print(f"Error setting up Chrome driver: {e}")
            print("Please ensure ChromeDriver is installed and in PATH")
            return False

    def test_page_responsiveness(self, page_url, device_config):
        """Test a specific page with a specific device configuration"""
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
            screenshot_name = f"screenshot_{device_name.replace(' ', '_')}_{page_url.replace('/', '_')}.png"
            self.driver.save_screenshot(screenshot_name)
            
            # Test responsive elements
            test_results = self.run_responsive_tests(device_config)
            
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

    def run_responsive_tests(self, device_config):
        """Run specific responsive design tests"""
        tests = {}
        
        try:
            # Test 1: Check if main container is responsive
            container = self.driver.find_element(By.CLASS_NAME, "container")
            if container:
                container_rect = container.get_property('getBoundingClientRect')()
                tests['container_responsive'] = {
                    'passed': container_rect['width'] <= device_config['width'],
                    'width': container_rect['width'],
                    'expected_max': device_config['width']
                }
            
            # Test 2: Check menu cards layout
            menu_cards = self.driver.find_elements(By.CLASS_NAME, "menu-card")
            if menu_cards:
                card_count = len(menu_cards)
                tests['menu_cards_layout'] = {
                    'passed': card_count > 0,
                    'count': card_count,
                    'cards_visible': all(card.is_displayed() for card in menu_cards)
                }
                
                # Check card sizes
                first_card = menu_cards[0]
                card_rect = first_card.get_property('getBoundingClientRect')()
                tests['menu_card_sizes'] = {
                    'passed': card_rect['width'] >= 200 and card_rect['height'] >= 60,
                    'width': card_rect['width'],
                    'height': card_rect['height']
                }
            
            # Test 3: Check chat interface
            chat_shell = self.driver.find_element(By.CLASS_NAME, "chat-shell")
            if chat_shell:
                chat_rect = chat_shell.get_property('getBoundingClientRect')()
                tests['chat_interface'] = {
                    'passed': chat_rect['height'] > 0,
                    'height': chat_rect['height'],
                    'visible': chat_shell.is_displayed()
                }
            
            # Test 4: Check touch targets
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            touch_targets_ok = 0
            total_buttons = len(buttons)
            
            for button in buttons:
                if button.is_displayed():
                    rect = button.get_property('getBoundingClientRect')()
                    if rect['width'] >= 44 and rect['height'] >= 44:
                        touch_targets_ok += 1
            
            tests['touch_targets'] = {
                'passed': touch_targets_ok == total_buttons,
                'adequate_targets': touch_targets_ok,
                'total_targets': total_buttons
            }
            
            # Test 5: Check text readability
            text_elements = self.driver.find_elements(By.TAG_NAME, "h1, h2, h3, p")
            readable_text = 0
            total_text = len(text_elements)
            
            for element in text_elements:
                if element.is_displayed():
                    font_size = self.driver.execute_script(
                        "return window.getComputedStyle(arguments[0]).fontSize", element
                    )
                    size_value = float(font_size.replace('px', ''))
                    if size_value >= 14:
                        readable_text += 1
            
            tests['text_readability'] = {
                'passed': readable_text >= total_text * 0.8,
                'readable_text': readable_text,
                'total_text': total_text
            }
            
        except Exception as e:
            tests['error'] = str(e)
        
        return tests

    def test_interactive_features(self):
        """Test interactive features and animations"""
        print("Testing interactive features...")
        
        try:
            # Navigate to responsive demo page
            self.driver.get(self.base_url + "/responsive-demo")
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "demo-container"))
            )
            
            # Test button interactions
            buttons = self.driver.find_elements(By.CLASS_NAME, "interaction-button")
            interaction_results = {}
            
            for i, button in enumerate(buttons[:3]):  # Test first 3 buttons
                try:
                    button.click()
                    time.sleep(0.5)  # Wait for animation
                    interaction_results[f'button_{i}'] = True
                except Exception as e:
                    interaction_results[f'button_{i}'] = False
            
            # Test responsive breakpoints
            breakpoint_tests = {}
            for device_name, config in self.devices.items():
                self.driver.set_window_size(config['width'], config['height'])
                time.sleep(0.5)  # Wait for layout adjustment
                
                # Check if layout adjusted properly
                container = self.driver.find_element(By.CLASS_NAME, "demo-container")
                container_rect = container.get_property('getBoundingClientRect')()
                
                breakpoint_tests[device_name] = {
                    'layout_adjusted': container_rect['width'] <= config['width'],
                    'viewport_width': config['width'],
                    'container_width': container_rect['width']
                }
            
            return {
                'interactions': interaction_results,
                'breakpoints': breakpoint_tests
            }
            
        except Exception as e:
            return {'error': str(e)}

    def run_comprehensive_test(self):
        """Run comprehensive responsive design test suite"""
        print("Starting comprehensive responsive design testing...")
        
        if not self.setup_driver():
            return False
        
        try:
            # Test each page on each device
            for page in self.pages:
                page_results = {}
                
                for device_name, device_config in self.devices.items():
                    result = self.test_page_responsiveness(page['url'], device_config)
                    page_results[device_name] = result
                
                self.results[page['name']] = page_results
            
            # Test interactive features
            self.results['interactive_features'] = self.test_interactive_features()
            
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
        print("\n" + "="*60)
        print("RESPONSIVE DESIGN TEST REPORT")
        print("="*60)
        
        total_tests = 0
        passed_tests = 0
        
        for page_name, page_results in self.results.items():
            if page_name == 'interactive_features':
                continue
                
            print(f"\n📄 {page_name}")
            print("-" * 40)
            
            for device_name, result in page_results.items():
                device_display = self.devices[device_name]['name']
                status = "✅ PASS" if result['success'] else "❌ FAIL"
                
                print(f"  {device_display}: {status}")
                
                if result['success'] and 'tests' in result:
                    for test_name, test_result in result['tests'].items():
                        total_tests += 1
                        if test_result.get('passed', False):
                            passed_tests += 1
                        else:
                            print(f"    ⚠️  {test_name}: FAILED")
        
        # Interactive features summary
        if 'interactive_features' in self.results:
            print(f"\n🎯 Interactive Features")
            print("-" * 40)
            interactive = self.results['interactive_features']
            if 'interactions' in interactive:
                for interaction, success in interactive['interactions'].items():
                    status = "✅ PASS" if success else "❌ FAIL"
                    print(f"  {interaction}: {status}")
        
        # Overall summary
        print(f"\n📊 SUMMARY")
        print("-" * 40)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
        
        # Save detailed report
        with open('responsive_test_report.json', 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📋 Detailed report saved to: responsive_test_report.json")
        print(f"📸 Screenshots saved in current directory")

def main():
    """Main function to run responsive testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test responsive design of hospital chat assistant')
    parser.add_argument('--url', default='http://localhost:5000', 
                       help='Base URL of the application (default: http://localhost:5000)')
    parser.add_argument('--quick', action='store_true',
                       help='Run quick test with fewer devices')
    
    args = parser.parse_args()
    
    tester = ResponsiveTester(args.url)
    
    if args.quick:
        # Quick test with fewer devices
        tester.devices = {
            'mobile': {'width': 375, 'height': 667, 'name': 'Mobile'},
            'desktop': {'width': 1920, 'height': 1080, 'name': 'Desktop'}
        }
    
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 Responsive design testing completed successfully!")
        return 0
    else:
        print("\n❌ Responsive design testing failed!")
        return 1

if __name__ == "__main__":
    exit(main())
