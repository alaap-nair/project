import whisper

def test_whisper():
    try:
        # Load the model
        model = whisper.load_model("base")
        print("✅ Whisper model loaded successfully!")
        print("✨ Installation is working correctly!")
    except Exception as e:
        print("❌ Error loading Whisper model:")
        print(e)

if __name__ == "__main__":
    test_whisper() 