const { whisper } = require('node-whisper');
const path = require('path');

async function setupWhisper() {
  console.log('Setting up Whisper...');
  
  try {
    // Download and set up the base model
    await whisper.download('base');
    console.log('✅ Whisper base model downloaded successfully');
    
    // Test the installation
    const testResult = await whisper.transcribe(
      path.join(__dirname, 'test.wav'),
      {
        modelName: 'base',
        language: 'en'
      }
    );
    console.log('✅ Whisper installation test successful');
  } catch (error) {
    console.error('❌ Error setting up Whisper:', error);
    process.exit(1);
  }
}

setupWhisper(); 