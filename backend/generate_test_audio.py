import sounddevice as sd
import scipy.io.wavfile as wav
import numpy as np
import time

# Recording parameters
duration = 5  # seconds
sample_rate = 44100  # Hz
channels = 1  # mono recording

print("Recording will start in 3 seconds...")
print("Please say something like 'This is a test recording'")
time.sleep(3)

print("🎤 Recording...")
recording = sd.rec(int(duration * sample_rate), 
                  samplerate=sample_rate,
                  channels=channels)
sd.wait()  # Wait until recording is finished
print("✅ Recording finished")

# Normalize the recording
recording = recording / np.max(np.abs(recording))

# Save as WAV file
wav.write('test_audio.wav', sample_rate, recording.astype(np.float32))

print("Test audio file 'test_audio.wav' has been generated successfully.") 