import hashlib
import secrets
import uuid
from datetime import datetime
def hash_password(password):

    return hashlib.sha256(password.encode()).hexdigest()
def verify_password(password, stored_hash):

    return hash_password(password) == stored_hash
def hash_pin(pin):

    return hashlib.sha256(pin.encode()).hexdigest()
def verify_pin(pin, stored_hash):

    return hash_pin(pin) == stored_hash
def generate_session_token():

    return secrets.token_hex(32)
def generate_request_id():

    return str(uuid.uuid4())
def get_timestamp():

    return datetime.utcnow().isoformat()
def generate_transaction_hash(request_id,
                              session_token,
                              user_id,
                              service_id,
                              amount,
                              timestamp,
                              secret_key):

    data = f"{request_id}{session_token}{user_id}{service_id}{amount}{timestamp}{secret_key}"

    return hashlib.sha256(data.encode()).hexdigest()
def verify_transaction_hash(request_id,
                            session_token,
                            user_id,
                            service_id,
                            amount,
                            timestamp,
                            secret_key,
                            received_hash):

    generated_hash = generate_transaction_hash(

        request_id,
        session_token,
        user_id,
        service_id,
        amount,
        timestamp,
        secret_key

    )

    return generated_hash == received_hash
def generate_sha256(data):

    return hashlib.sha256(data.encode()).hexdigest()