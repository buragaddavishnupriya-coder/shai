import mysql.connector

db_configs = [
    {"host": "127.0.0.1", "user": "root", "password": "root"},
    {"host": "127.0.0.1", "user": "root", "password": ""},
    {"host": "localhost", "user": "root", "password": "root"},
    {"host": "localhost", "user": "root", "password": ""},
]

def get_connection():
    for config in db_configs:
        try:
            conn = mysql.connector.connect(**config)
            if conn.is_connected():
                return conn
        except Exception:
            pass
    return None

def insert_sample_data():
    conn = get_connection()
    if conn is None:
        print("ERROR: Failed to connect to MySQL server")
        return
        
    cursor = conn.cursor()
    databases = ["shai", "shai_agent_ai"]
    
    for db in databases:
        print(f"\nInserting sample data into database: {db}")
        cursor.execute(f"USE `{db}`;")
        
        # Disable foreign key checks to safely truncate
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("TRUNCATE TABLE `transactions`;")
        cursor.execute("TRUNCATE TABLE `website_services`;")
        cursor.execute("TRUNCATE TABLE `user_wallet`;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        
        # 1. Insert user_wallet sample data
        user_wallet_sql = """
        INSERT INTO user_wallet 
            (full_name, email, phone, password_hash, transaction_pin_hash, wallet_balance, transaction_limit, daily_limit)
        VALUES
        ('Ravi Kumar', 'ravi.kumar@example.com', '9876543210', SHA2('password123', 256), SHA2('1234', 256), 15000.00, 5000.00, 20000.00),
        ('Ananya Sharma', 'ananya.sharma@example.com', '9123456780', SHA2('mypassword', 256), SHA2('4321', 256), 8000.50, 5000.00, 20000.00),
        ('Mohammed Ali', 'mohammed.ali@example.com', '9988776655', SHA2('securepass', 256), SHA2('5678', 256), 25000.00, 7000.00, 25000.00),
        ('Priya Reddy', 'priya.reddy@example.com', '9871234560', SHA2('priya@123', 256), SHA2('2468', 256), 500.00, 5000.00, 20000.00),
        ('Suresh Naidu', 'suresh.naidu@example.com', '9012345678', SHA2('sureshpass', 256), SHA2('1357', 256), 32000.00, 10000.00, 30000.00);
        """
        cursor.execute(user_wallet_sql)
        print("Inserted user_wallet sample data")
        
        # 2. Insert website_services sample data
        website_services_sql = """
        INSERT INTO website_services 
            (category, provider_name, item_name, source_location, destination_location, travel_date, show_time, travel_class, available_quantity, price, status)
        VALUES
        ('Bus', 'RedBus Travels', 'AC Sleeper Bus', 'Nellore', 'Hyderabad', '2026-07-10', NULL, 'Sleeper', 20, 850.00, 'Available'),
        ('Train', 'IRCTC', 'Express Train', 'Chennai', 'Bengaluru', '2026-07-12', NULL, 'AC 3 Tier', 15, 1200.00, 'Available'),
        ('Flight', 'IndiGo', 'Domestic Flight', 'Hyderabad', 'Delhi', '2026-07-15', NULL, 'Economy', 8, 4500.00, 'Available'),
        ('Movie', 'PVR Cinemas', 'Avengers: New Era', NULL, NULL, '2026-07-06', '7:30 PM', NULL, 50, 300.00, 'Available'),
        ('Event', 'BookMyShow', 'Music Concert', NULL, NULL, '2026-07-20', '6:00 PM', NULL, 100, 1500.00, 'Available'),
        ('Bus', 'VRL Travels', 'Non-AC Seater Bus', 'Bengaluru', 'Chennai', '2026-07-08', NULL, 'Seater', 0, 450.00, 'Unavailable');
        """
        cursor.execute(website_services_sql)
        print("Inserted website_services sample data")
        
        # 3. Insert transactions sample data
        transactions_sql = """
        INSERT INTO transactions 
            (user_id, service_id, payment_amount, wallet_before, wallet_after, risk_score, booking_status, transaction_hash)
        VALUES
        (1, 1, 850.00, 15850.00, 15000.00, 'LOW', 'SUCCESS', SHA2(CONCAT(1,1,NOW(),'txn1'), 256)),
        (2, 4, 300.00, 8300.50, 8000.50, 'LOW', 'SUCCESS', SHA2(CONCAT(2,4,NOW(),'txn2'), 256)),
        (3, 3, 4500.00, 29500.00, 25000.00, 'MEDIUM', 'SUCCESS', SHA2(CONCAT(3,3,NOW(),'txn3'), 256)),
        (4, 6, 450.00, 950.00, 500.00, 'HIGH', 'FAILED', SHA2(CONCAT(4,6,NOW(),'txn4'), 256)),
        (5, 2, 1200.00, 33200.00, 32000.00, 'LOW', 'SUCCESS', SHA2(CONCAT(5,2,NOW(),'txn5'), 256));
        """
        cursor.execute(transactions_sql)
        print("Inserted transactions sample data")
        
        conn.commit()
        print(f"SUCCESS: Database {db} sample data insertion complete!")
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    insert_sample_data()
