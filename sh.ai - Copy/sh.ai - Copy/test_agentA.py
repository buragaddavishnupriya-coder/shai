from agentA import AgentA

agent = AgentA()

request = input("Enter Booking Request : ")

booking = agent.understand_booking_request(request)

print("\nAI Output\n")

print(booking)

services = agent.search_booking(booking)

agent.display_services(services)