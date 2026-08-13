import json
import google.generativeai as genai

from database import *
from security import *
from config import *

genai.configure(api_key="YOUR_GEMINI_API_KEY")

model = genai.GenerativeModel("gemini-2.5-flash")
class AgentA:

    def __init__(self):
        self.model = model
    def understand_booking_request(self, user_prompt):

        prompt = f"""
    You are Booking Agent AI.

    Extract booking details.

    Return ONLY JSON.

    JSON format:

    {{
    "category":"",
    "provider_name":"",
    "item_name":"",
    "source_location":"",
    "destination_location":"",
    "travel_date":""
    }}

    User Request:

    {user_prompt}
    """

        response = self.model.generate_content(prompt)

        text = response.text.strip()

        text = text.replace("```json", "").replace("```", "").strip()

        return json.loads(text)
    def search_booking(self, booking):

        services = search_services(

            booking["category"],

            booking["source_location"],

            booking["destination_location"],

            booking["travel_date"]

        )

        return services
    def display_services(self, services):

        if len(services) == 0:

            print("No services found")

            return

        print("\nAvailable Services\n")

        for service in services:

            print("------------------------------")

            print("Service ID :", service["service_id"])

            print("Provider :", service["provider_name"])

            print("Item :", service["item_name"])

            print("Class :", service["travel_class"])

            print("Price :", service["price"])

            print("Seats :", service["available_quantity"])

            print("------------------------------")

            