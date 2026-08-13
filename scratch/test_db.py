import mysql.connector

try:
    connection = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="root",
        database="shai"
    )
    if connection.is_connected():
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM user_wallet;")
        print("user_wallet rows:")
        for r in cursor.fetchall():
            print(r)
            
        cursor.execute("SELECT * FROM website_services;")
        print("\nwebsite_services rows:")
        for r in cursor.fetchall():
            print(r)
            
        connection.close()
except Exception as e:
    print(f"Error: {e}")
