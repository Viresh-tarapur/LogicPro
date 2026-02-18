import os
import base64
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenRouter Client
API_KEY = os.getenv("OPENROUTER_API_KEY")
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

SYSTEM_PROMPT = """
You are an AI Study and Coding Assistant.
Your goal is to provide EXTREMELY DETAILED, STRUCTURED, and EDUCATIONAL explanations for EVERY coding question.

You MUST use this exact structure for all code-related answers:

🔍 Problem Statement: [Problem Name]
- Clearly state what the problem is.
- Explain the input and output.
- List any assumptions.

🧠 Key Constraints
- List the constraints (e.g., input size, time limits) if known or standard.

🧩 Approach: [Method Name]
- Explain the idea clearly.
- Explain "Why this works".

🧮 Algorithm
- Step-by-step breakdown of the algorithm.

🧪 Example Walkthrough
- Provide at least 2 clear examples.
- Walk through the logic step-by-step for one example.
- Show detailed state changes.

code:
- Provide the full solution code (Default to Python unless user asks for another language).
- Comment the code heavily.

🧪 Edge Cases
- List potential edge cases and how the solution handles them.

GENERAL QUERY BEHAVIOR:
- For non-coding questions, still use a structured, detailed format with headings and bullet points.
- Never give one-line answers unless explicitly asked.
- Be an enthusiastic teacher!
"""

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Study Assistant Backend is running (OpenRouter)."}

@app.post("/analyze")
async def analyze_content(
    text: str = Form(None),
    image: UploadFile = File(None)
):
    """
    Endpoint to analyze text or image content using OpenRouter.
    """
    if not API_KEY:
         return {"error": "API Key not found. Please check .env file."}

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    user_content = []

    if text:
        user_content.append({"type": "text", "text": f"User Question/Context: {text}"})

    if image:
        try:
            contents = await image.read()
            # Encode image to base64
            base64_image = base64.b64encode(contents).decode('utf-8')
            user_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}" # Assuming jpeg/png
                }
            })
        except Exception as e:
            return {"error": f"Invalid image: {str(e)}"}

    if not user_content:
        return {"error": "No text or image provided."}

    messages.append({"role": "user", "content": user_content})

    try:
        # Using a model that supports vision, e.g., google/gemini-2.0-flash-001 or openai/gpt-4o
        # OpenRouter will route to the best available if we use a generic tag or specific model.
        # "google/gemini-2.0-flash-001" is often a good choice on OpenRouter for free/cheap vision.
        # Or "google/gemini-pro-1.5"
        completion = client.chat.completions.create(
            model="google/gemini-2.0-flash-001", 
            messages=messages,
        )
        
        result_text = completion.choices[0].message.content
        return {"result": result_text}

    except Exception as e:
        print(f"OpenRouter Error: {e}")
        return {"error": f"AI Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
