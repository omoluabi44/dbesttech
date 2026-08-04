import sys
from google import genai
from google.genai.errors import APIError

def test_vertex_list():
    project_id = "planar-ember-504408-k7"
    location = "us-central1"
    
    print(f"Initializing Vertex AI for project '{project_id}' in '{location}'...")
    
    try:
        client = genai.Client(vertexai=True, project=project_id, location=location)
        print("Listing models...")
        for m in client.models.list():
            print(m.name)
        print("Done!")
    except Exception as e:
        print(f"\nFAILED! Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    test_vertex_list()
