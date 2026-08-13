import google.generativeai as genai

try:
    genai.configure(api_key="YOUR_GEMINI_API_KEY")
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content("Hello! Say hi.")
    print("Gemini response:")
    print(response.text)
except Exception as e:
    print("Gemini call failed:")
    print(e)
