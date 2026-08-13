import mysql.connector

db_configs = [
    {"host": "127.0.0.1", "user": "root", "password": "root"},
    {"host": "127.0.0.1", "user": "root", "password": ""},
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

def verify():
    conn = get_connection()
    if conn is None:
        print("Failed to connect to MySQL")
        return
        
    cursor = conn.cursor()
    databases = ["shai", "shai_agent_ai"]
    
    for db in databases:
        print(f"\n========================================\nVERIFYING DATABASE: {db}\n========================================")
        cursor.execute(f"USE `{db}`;")
        cursor.execute("SHOW TABLES;")
        tables = [r[0] for r in cursor.fetchall()]
        print("Tables in database:", tables)
        
        for table in tables:
            print(f"\nTable '{table}' columns:")
            cursor.execute(f"DESCRIBE `{table}`;")
            for col in cursor.fetchall():
                # Print column description safely
                print(f"  Field: {col[0]:22} Type: {col[1]:25} Null: {col[2]:5} Key: {col[3]:5} Default: {str(col[4]):15} Extra: {col[5]}")
                
            cursor.execute(f"SELECT COUNT(*) FROM `{table}`;")
            count = cursor.fetchone()[0]
            print(f"Row count in '{table}': {count}")
            
    cursor.close()
    conn.close()

if __name__ == "__main__":
    verify()
