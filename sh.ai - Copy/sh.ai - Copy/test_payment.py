from database import *
from agentB import *

agent = AgentB()

# Get service from database
service = get_service_by_id(1)

# Check if service exists
if service is None:
    print("❌ Service not found.")
    exit()

# Execute payment for User ID 1
result = agent.execute_payment(
    1,
    service
)

print("\n========== PAYMENT RESULT ==========")
print(result)
print("====================================")