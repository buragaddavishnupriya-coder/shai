from security import *

SECRET = "SHAI_AGENT_AI_SECRET_2026"

request_id = generate_request_id()
session = generate_session_token()
timestamp = get_timestamp()

hash_value = generate_transaction_hash(
    request_id,
    session,
    1,
    1,
    1450,
    timestamp,
    SECRET
)

print("Request ID :", request_id)
print("Session :", session)
print("Timestamp :", timestamp)
print("Hash :", hash_value)

print(
    verify_transaction_hash(
        request_id,
        session,
        1,
        1,
        1450,
        timestamp,
        SECRET,
        hash_value
    )
)