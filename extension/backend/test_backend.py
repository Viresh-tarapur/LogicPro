import requests
import json
import base64

def test_backend():
    url = "http://localhost:8000/analyze"
    
    # Simulate history
    history = [
        {"role": "user", "content": [{"type": "text", "text": "Hello, who are you?"}]},
        {"role": "assistant", "content": "I am an AI assistant."},
        {"role": "user", "content": [{"type": "text", "text": "What is 2+2?"}]}
    ]
    
    payload = {
        "history": json.dumps(history)
    }
    
    try:
        print("Sending request to backend...")
        response = requests.post(url, data=payload)
        
        if response.status_code == 200:
            print("Success!")
            print("Response:", response.json())
        else:
            print(f"Failed with status {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_backend()
