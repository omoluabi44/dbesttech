import sys
from google import genai
from google.genai.errors import APIError

def test_vertex_adc():
    project_id = "planar-ember-504408-k7"
    location = "us-central1"
    
    print(f"Initializing Vertex AI for project '{project_id}' in '{location}'...")
    print("This will automatically use your Application Default Credentials (ADC).")
    
    try:
        # Initialize google-genai Client for Vertex AI (uses ADC by default)
        client = genai.Client(vertexai=True, project=project_id, location=location)
        
        # Test with gemini-2.5-flash which is widely available
        model_id = 'gemini-2.5-flash'
        print(f"\nTesting GenerateContent with {model_id}...")
        
        response = client.models.generate_content(
            model=model_id,
            contents="Reply with the exact word 'SUCCESS' if you receive this."
        )
        
        print(f"\nSUCCESS! Response: {response.text.strip()}")
        
    except APIError as e:
        print(f"\nFAILED! API Error: {e.code} {e.message}")
        sys.exit(1)
    except Exception as e:
        print(f"\nFAILED! Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    test_vertex_adc()
