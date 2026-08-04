import os
import sys
import google.generativeai as genai

def test_api_key(api_key: str):
    print(f"Testing API Key: {api_key[:10]}... (length: {len(api_key)})")
    
    # Configure the library
    genai.configure(api_key=api_key)
    
    models_to_test = [
        "models/gemini-flash-latest",
        "models/gemini-3.1-pro-preview"
    ]
    
    for model_name in models_to_test:
        print(f"\n--- Testing Model: {model_name} ---")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Reply with the word 'SUCCESS' if you receive this.")
            print(f"SUCCESS! Response: {response.text.strip()}")
        except Exception as e:
            print(f"FAILED! Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        key = sys.argv[1]
    else:
        # Fallback to the .env file or environment variable if no arg is provided
        from dotenv import load_dotenv
        load_dotenv()
        key = os.getenv("GEMINI_API_KEY")
        
    if not key:
        print("Please provide an API key as an argument, or set GEMINI_API_KEY in your .env file.")
        print("Usage: python test_api_key.py YOUR_API_KEY")
        sys.exit(1)
        
    test_api_key(key)
