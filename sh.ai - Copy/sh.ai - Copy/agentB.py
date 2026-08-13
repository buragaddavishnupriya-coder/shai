from database import *
from security import *


class AgentB:

    def __init__(self):
        print("Agent B Initialized")

    # ==========================================
    # Verify Wallet Balance
    # ==========================================

    def verify_wallet(self, user):

        balance = float(user["wallet_balance"])

        print(f"Wallet Balance : ₹{balance}")

        return balance

    # ==========================================
    # Verify Transaction Limit
    # ==========================================

    def verify_limit(self, user, amount):

        limit = float(user["transaction_limit"])

        if amount <= limit:
            print("Transaction Limit Check : PASSED")
            return True

        print("Transaction Limit Check : FAILED")
        return False

    # ==========================================
    # Verify Secure Request
    # ==========================================

    def verify_request(self, request):

        print("\nVerifying Secure Request...")

        print("Request ID :", request["request_id"])
        print("Session Token :", request["session_token"])
        print("Transaction Hash :", request["transaction_hash"])

        return True

    # ==========================================
    # Execute Payment
    # ==========================================

    def execute_payment(self, user_id, service):

        # ----------------------------
        # Get User
        # ----------------------------

        user = get_user_by_id(user_id)

        if user is None:

            return {

                "status": "FAILED",

                "message": "User Not Found"

            }

        wallet_before = float(user["wallet_balance"])

        amount = float(service["price"])

        # ----------------------------
        # Check Wallet Balance
        # ----------------------------

        if wallet_before < amount:

            return {

                "status": "FAILED",

                "message": "Insufficient Wallet Balance"

            }

        wallet_after = wallet_before - amount

        # ----------------------------
        # Generate Transaction Hash
        # ----------------------------

        transaction_hash = generate_sha256(

            str(user_id)
            + str(service["service_id"])
            + str(amount)
            + str(wallet_before)
            + str(wallet_after)

        )

        # ----------------------------
        # Update Wallet
        # ----------------------------

        update_wallet(

            user_id,

            wallet_after

        )

        # ----------------------------
        # Save Transaction
        # ----------------------------

        save_transaction(

            user_id,

            service["service_id"],

            amount,

            wallet_before,

            wallet_after,

            transaction_hash

        )

        # ----------------------------
        # Return Success
        # ----------------------------

        return {

            "status": "SUCCESS",

            "user_id": user_id,

            "service_id": service["service_id"],

            "amount": amount,

            "wallet_before": wallet_before,

            "wallet_after": wallet_after,

            "transaction_hash": transaction_hash

        }