import sys
import whisper
import json
import os

def transcribe_audio(audio_path):
    try:
        # Check if file exists
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        # Load model with FP32
        model = whisper.load_model("base", device="cpu")
        
        # Transcribe audio
        result = model.transcribe(audio_path)
        
        # Return result as JSON
        print(json.dumps({
            "text": result["text"],
            "segments": result["segments"]
        }))
        sys.exit(0)
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide the path to the audio file"}), file=sys.stderr)
        sys.exit(1)
        
    audio_path = sys.argv[1]
    transcribe_audio(audio_path) 