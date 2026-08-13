import mysql.connector
from mysql.connector import Error
import hashlib
import sys

# Ensure UTF-8 output if possible, but keep console prints plain to avoid exceptions
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

db_configs = [
    {"host": "127.0.0.1", "user": "root", "password": ""},
    {"host": "127.0.0.1", "user": "root", "password": "root"},
    {"host": "localhost", "user": "root", "password": ""},
    {"host": "localhost", "user": "root", "password": "root"},
]

def get_connection_no_db():
    for config in db_configs:
        try:
            conn = mysql.connector.connect(**config)
            if conn.is_connected():
                print(f"Connected to MySQL successfully with config: {config}")
                return conn
        except Exception as e:
            pass
    raise Exception("Could not connect to MySQL server with any default configuration.")

def hash_data(val):
    return hashlib.sha256(val.encode()).hexdigest()

def run_setup():
    conn = get_connection_no_db()
    cursor = conn.cursor()
    
    databases = ["shai", "shai_agent_ai"]
    for db_name in databases:
        print(f"\nSetting up database: {db_name}")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}`;")
        cursor.execute(f"USE `{db_name}`;")
        
        # Drop existing tables with foreign key checks disabled to prevent constraint errors
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("DROP TABLE IF EXISTS `transactions`;")
        cursor.execute("DROP TABLE IF EXISTS `website_services`;")
        cursor.execute("DROP TABLE IF EXISTS `user_wallet`;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        
        # 1. Create user_wallet table
        cursor.execute("""
        CREATE TABLE user_wallet (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(15),
            password_hash VARCHAR(64) NOT NULL,
            transaction_pin_hash VARCHAR(64) NOT NULL,
            wallet_balance DECIMAL(10,2) DEFAULT 0.00,
            transaction_limit DECIMAL(10,2) DEFAULT 5000.00,
            daily_limit DECIMAL(10,2) DEFAULT 20000.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # 2. Create website_services table
        cursor.execute("""
        CREATE TABLE website_services (
            service_id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            provider_name VARCHAR(100) NOT NULL,
            item_name VARCHAR(150) NOT NULL,
            source_location VARCHAR(100),
            destination_location VARCHAR(100),
            travel_date DATE,
            show_time VARCHAR(30),
            travel_class VARCHAR(50),
            available_quantity INT DEFAULT 0,
            price DECIMAL(10,2) NOT NULL,
            status ENUM('Available','Unavailable') DEFAULT 'Available'
        );
        """)
        
        # 3. Create transactions table
        cursor.execute("""
        CREATE TABLE transactions (
            transaction_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            service_id INT NOT NULL,
            payment_amount DECIMAL(10,2) NOT NULL,
            wallet_before DECIMAL(10,2) NOT NULL,
            wallet_after DECIMAL(10,2) NOT NULL,
            risk_score ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
            booking_status ENUM('SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'SUCCESS',
            transaction_hash VARCHAR(64) NOT NULL,
            transaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES user_wallet(user_id),
            FOREIGN KEY(service_id) REFERENCES website_services(service_id)
        );
        """)
        
        # Seed test user (password: password123, pin: 1234)
        pass_hash = hash_data("password123")
        pin_hash = hash_data("1234")
        cursor.execute("""
        INSERT INTO user_wallet (user_id, full_name, email, phone, password_hash, transaction_pin_hash, wallet_balance, transaction_limit, daily_limit)
        VALUES (1, 'Test User', 'test@shai.com', '9999999999', %s, %s, 5000.00, 2000.00, 3000.00);
        """, (pass_hash, pin_hash))
        
        # Seed website services
        services = [
            (1, "Travel", "IRCTC", "Train Ticket - Express", "Hyderabad", "Bengaluru", "2026-07-10", None, None, 50, 650.00, "Available"),
            (2, "Travel", "Red Bus", "AC Sleeper Bus", "Hyderabad", "Chennai", "2026-07-12", None, None, 20, 900.00, "Available"),
            (3, "Movies", "BookMyShow", "Movie Ticket - Evening Show", None, None, "2026-07-05", "7:00 PM", None, 100, 250.00, "Available"),
            (4, "Shopping", "Amazon", "Wireless Earbuds", None, None, None, None, None, 200, 1999.00, "Available"),
            (5, "Grocery", "Amazon Fresh", "Grocery Combo Pack", None, None, None, None, None, 500, 799.00, "Available"),
            (6, "Cabs", "Uber", "Cab Ride - Sedan", "Gachibowli", "Airport", None, None, None, 999, 450.00, "Available")
        ]
        
        for s in services:
            cursor.execute("""
            INSERT INTO website_services (service_id, category, provider_name, item_name, source_location, destination_location, travel_date, show_time, travel_class, available_quantity, price, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, s)
            
        conn.commit()
        print(f"SUCCESS: Database {db_name} setup and seed complete!")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    try:
        run_setup()
    except Exception as e:
        print("ERROR: Error setting up database:", str(e))
