import mysql.connector
from mysql.connector import Error

from config import *

# ===========================================
# DATABASE CONNECTION
# ===========================================
import mysql.connector
from mysql.connector import Error
from config import *

def get_connection():

    try:

        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )

        if connection.is_connected():
            print("SUCCESS: Connected to MySQL")
            return connection

    except Error as e:
        print("ERROR: Database Connection Error:")
        print(e)
        return None
# ==========================================
# Get User By ID
# ==========================================

def get_user_by_id(user_id):

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    query = "SELECT * FROM user_wallet WHERE user_id=%s"

    cursor.execute(query, (user_id,))

    user = cursor.fetchone()

    cursor.close()
    connection.close()

    return user


# ==========================================
# Get Service By ID
# ==========================================

def get_service_by_id(service_id):

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    query = "SELECT * FROM website_services WHERE service_id=%s"

    cursor.execute(query, (service_id,))

    service = cursor.fetchone()

    cursor.close()
    connection.close()

    return service


# ==========================================
# Update Wallet
# ==========================================

def update_wallet(user_id, new_balance):

    connection = get_connection()

    cursor = connection.cursor()

    query = """
    UPDATE user_wallet
    SET wallet_balance=%s
    WHERE user_id=%s
    """

    cursor.execute(query, (new_balance, user_id))

    connection.commit()

    cursor.close()
    connection.close()


# ==========================================
# Save Transaction
# ==========================================

def save_transaction(
    user_id,
    service_id,
    amount,
    wallet_before,
    wallet_after,
    transaction_hash
):

    connection = get_connection()

    cursor = connection.cursor()

    query = """
    INSERT INTO transactions
    (
        user_id,
        service_id,
        payment_amount,
        wallet_before,
        wallet_after,
        transaction_hash
    )
    VALUES
    (%s,%s,%s,%s,%s,%s)
    """

    cursor.execute(
        query,
        (
            user_id,
            service_id,
            amount,
            wallet_before,
            wallet_after,
            transaction_hash
        )
    )
    connection.commit()

    cursor.close()
    connection.close()    
    
def search_services(category, source, destination, travel_date):

    connection = get_connection()

    if connection is None:
        print("Database connection failed.")
        return []

    cursor = connection.cursor(dictionary=True)
    query = """
    SELECT *
    FROM website_services
    WHERE category=%s
    AND source_location=%s
    AND destination_location=%s
    AND travel_date=%s
    AND status='Available'
    """

    cursor.execute(
        query,
        (
            category,
            source,
            destination,
            travel_date
        )
    )

    services = cursor.fetchall()

    cursor.close()
    connection.close()

    return services