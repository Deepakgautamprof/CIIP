import requests

URL = "http://127.0.0.1:8000/api/complaints/1/status/"

TOKEN = "dcc2309c965bd309ad09906926aeb7d71034fd53"

headers = {
    "Authorization": f"Token {TOKEN}"
}

data = {
    "status": "IN_PROGRESS"
}

response = requests.post(
    URL,
    headers=headers,
    data=data
)

print("Status:", response.status_code)
print("Response:", response.text)