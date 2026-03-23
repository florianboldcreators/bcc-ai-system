#!/usr/bin/env python3
"""
TikTok Android Automation via Appium
Logs into Account #5 and performs realistic warming session
"""

import time
import random
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Account #5 credentials
ACCOUNT = {
    'phone': '+14255204572',
    'password': 'Rn_FCR9DMoRwguY',
    'username': '@ronny_pqbeci'
}

def random_wait(min_sec=2, max_sec=5):
    """Human-like random wait"""
    time.sleep(random.uniform(min_sec, max_sec))

def setup_driver():
    """Initialize Appium driver for Android emulator"""
    options = UiAutomator2Options()
    options.platform_name = 'Android'
    options.automation_name = 'UiAutomator2'
    options.device_name = 'TikTok_AVD'  # Will be created
    options.app_package = 'com.zhiliaoapp.musically'  # TikTok package
    options.app_activity = 'com.ss.android.ugc.aweme.splash.SplashActivity'
    options.no_reset = True  # Keep session
    
    driver = webdriver.Remote('http://127.0.0.1:4723', options=options)
    return driver

def login_tiktok(driver):
    """Log into TikTok with phone + password"""
    print("🔐 Logging into TikTok...")
    
    try:
        # Wait for app to load
        random_wait(5, 8)
        
        # Click profile/login (usually bottom-right)
        profile_btn = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((AppiumBy.XPATH, "//android.widget.TextView[@text='Profile']"))
        )
        profile_btn.click()
        random_wait(2, 3)
        
        # Click "Log in" if not already logged in
        try:
            login_btn = driver.find_element(AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Log in')]")
            login_btn.click()
            random_wait(3, 5)
            
            # Choose "Use phone or email"
            phone_option = driver.find_element(AppiumBy.XPATH, "//*[contains(@text, 'phone') or contains(@text, 'email')]")
            phone_option.click()
            random_wait(2, 3)
            
            # Enter phone number
            phone_field = driver.find_element(AppiumBy.CLASS_NAME, "android.widget.EditText")
            phone_field.click()
            random_wait(1, 2)
            phone_field.send_keys(ACCOUNT['phone'])
            random_wait(2, 3)
            
            # Click "Next" or "Continue"
            next_btn = driver.find_element(AppiumBy.XPATH, "//*[contains(@text, 'Next') or contains(@text, 'Continue')]")
            next_btn.click()
            random_wait(3, 5)
            
            # Enter password
            pwd_field = driver.find_element(AppiumBy.CLASS_NAME, "android.widget.EditText")
            pwd_field.click()
            random_wait(1, 2)
            pwd_field.send_keys(ACCOUNT['password'])
            random_wait(2, 3)
            
            # Submit
            submit_btn = driver.find_element(AppiumBy.XPATH, "//*[contains(@text, 'Log in') or contains(@text, 'Submit')]")
            submit_btn.click()
            random_wait(5, 8)
            
            print("✅ Login successful")
        except:
            print("✅ Already logged in")
            
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return False
    
    return True

def warming_session(driver, duration_min=3):
    """
    Realistic TikTok browsing session with likes/saves
    
    Args:
        driver: Appium WebDriver
        duration_min: Session duration in minutes
    """
    print(f"🎬 Starting {duration_min}-minute warming session...")
    
    start_time = time.time()
    end_time = start_time + (duration_min * 60)
    
    video_count = 0
    likes_given = 0
    saves_given = 0
    
    while time.time() < end_time:
        # Random watch time (weighted to short)
        rand = random.random()
        if rand < 0.3:
            watch_time = random.uniform(2, 5)  # Quick skip
        elif rand < 0.7:
            watch_time = random.uniform(5, 10)  # Normal watch
        else:
            watch_time = random.uniform(10, 22)  # Interested
        
        print(f"Video {video_count + 1}: watching {watch_time:.1f}s...")
        time.sleep(watch_time)
        
        # Like probability based on watch time
        if watch_time > 12:
            like_chance = 0.5
        elif watch_time > 8:
            like_chance = 0.25
        elif watch_time > 5:
            like_chance = 0.1
        else:
            like_chance = 0.02
        
        # Randomly like
        if random.random() < like_chance:
            try:
                # Find like button (usually right side)
                like_btn = driver.find_element(AppiumBy.XPATH, 
                    "//android.widget.ImageView[contains(@content-desc, 'Like') or contains(@content-desc, 'like')]")
                like_btn.click()
                likes_given += 1
                print(f"  ❤️ Liked!")
                random_wait(1, 2)
                
                # Rarely save too
                if watch_time > 15 and random.random() < 0.3:
                    try:
                        save_btn = driver.find_element(AppiumBy.XPATH,
                            "//android.widget.ImageView[contains(@content-desc, 'Favorite') or contains(@content-desc, 'Save')]")
                        save_btn.click()
                        saves_given += 1
                        print(f"  💾 Saved!")
                        random_wait(1, 2)
                    except:
                        pass
            except:
                pass  # No like button found
        
        # Swipe to next video
        screen_size = driver.get_window_size()
        start_y = int(screen_size['height'] * 0.8)
        end_y = int(screen_size['height'] * 0.2)
        center_x = int(screen_size['width'] / 2)
        
        driver.swipe(center_x, start_y, center_x, end_y, duration=300)
        video_count += 1
        random_wait(0.5, 1)
    
    print(f"\n✅ Session complete:")
    print(f"   Videos: {video_count}")
    print(f"   Likes: {likes_given}")
    print(f"   Saves: {saves_given}")
    print(f"   Duration: {(time.time() - start_time) / 60:.1f} minutes")

def main():
    """Main execution"""
    print("🚀 TikTok Appium Automation")
    print(f"   Account: {ACCOUNT['username']}")
    print()
    
    # Start driver
    driver = setup_driver()
    
    try:
        # Login
        if not login_tiktok(driver):
            print("❌ Login failed, exiting")
            return
        
        # Run warming session
        warming_session(driver, duration_min=3)
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        # Keep session open or close
        choice = input("\nKeep emulator running? (y/n): ")
        if choice.lower() != 'y':
            driver.quit()

if __name__ == "__main__":
    main()
