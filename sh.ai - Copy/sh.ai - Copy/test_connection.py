import mysql.connector
from config import *

try:
    connection = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

    if connection.is_connected():
        print("SUCCESS: Database Connected Successfully")
        connection.close()

except Exception as e:
    print("Connection Failed")
    print(e)