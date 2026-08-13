from agentB import AgentB

agent = AgentB()

user = {

    "wallet_balance":25000,

    "transaction_limit":5000

}

service = {

    "price":1450

}

request = {

    "request_id":"REQ001",

    "session_token":"ABC123",

    "transaction_hash":"XYZ987"

}

print()

print(agent.verify_wallet(user))

print(agent.verify_limit(user,1450))

print(agent.verify_request(request))

print(agent.execute_payment(user,service,request))