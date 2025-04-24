import sys
import whisper
import json

def transcribe_audio(audio_path):
    try:
        # Load the Whisper model
        model = whisper.load_model("base")
        
        # Transcribe the audio
        result = model.transcribe(audio_path)
        
        # Return the transcription as JSON
        print(json.dumps({"transcript": result["text"]}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide an audio file path"}), file=sys.stderr)
        sys.exit(1)
        
    audio_path = sys.argv[1]
    transcribe_audio(audio_path) 