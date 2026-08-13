import mysql.connector

try:
    connection = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="root",
        database="shai"
    )
    if connection.is_connected():
        cursor = connection.cursor()
        
        # Show all tables
        cursor.execute("SHOW TABLES;")
        tables = [r[0] for r in cursor.fetchall()]
        print("Existing tables:", tables)
        
        for table in tables:
            print(f"\nSchema for {table}:")
            cursor.execute(f"DESCRIBE {table};")
            for col in cursor.fetchall():
                print(col)
                
        connection.close()
except Exception as e:
    print(f"Error: {e}")
