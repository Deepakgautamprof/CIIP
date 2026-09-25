import requests

URL = "http://127.0.0.1:8000/api/complaints/"

TOKEN = "dcc2309c965bd309ad09906926aeb7d71034fd53"

headers = {
    "Authorization": f"Token {TOKEN}"
}

data = {
    "category": "POTHOLE",
    "description": "Large pothole near Ward 42 causing difficulty for vehicles and pedestrians.",
    "latitude": "26.8467000",
    "longitude": "80.9462000",
    "address": "Ward 42, Lucknow, Uttar Pradesh",
    "ward": "Ward 42",
    "priority": "HIGH"
}

response = requests.post(
    URL,
    headers=headers,
    data=data
)

print("Status:", response.status_code)
print("Response:", response.text)