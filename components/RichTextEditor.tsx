import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useNotesStore } from '../store/notes';
import { uploadFileToStorage } from '../utils/fileUtils';
import { Audio } from 'expo-av';
import { configureAudioSession } from '../utils/audioUtils';

// HTML template for the rich text editor
const editorHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 8px;
            margin: 0;
            color: #333;
            font-size: 16px;
        }
        #editor {
            min-height: 200px;
            outline: none;
            padding: 8px;
            overflow-y: auto;
        }
        img {
            max-width: 100%;
        }
        .toolbar {
            display: flex;
            flex-wrap: wrap;
            padding: 8px;
            background-color: #f5f5f5;
            border-bottom: 1px solid #ddd;
        }
        .toolbar button {
            margin-right: 4px;
            margin-bottom: 4px;
            padding: 6px 10px;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
        }
        .toolbar button:hover {
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="document.execCommand('bold')"><b>B</b></button>
        <button onclick="document.execCommand('italic')"><i>I</i></button>
        <button onclick="document.execCommand('underline')"><u>U</u></button>
        <button onclick="document.execCommand('formatBlock', false, 'h1')">H1</button>
        <button onclick="document.execCommand('formatBlock', false, 'h2')">H2</button>
        <button onclick="document.execCommand('formatBlock', false, 'p')">P</button>
        <button onclick="document.execCommand('insertUnorderedList')">• List</button>
        <button onclick="document.execCommand('insertOrderedList')">1. List</button>
    </div>
    <div id="editor" contenteditable="true"></div>
    <script>
        const editor = document.getElementById('editor');
        
        // Listen for content changes
        editor.addEventListener('input', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'content',
                content: editor.innerHTML
            }));
        });
        
        // Method to insert image
        function insertImage(url) {
            document.execCommand('insertImage', false, url);
        }
        
        // Method to insert a file link
        function insertFileLink(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.textContent = filename;
            link.target = '_blank';
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(link);
            } else {
                editor.appendChild(link);
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'content',
                content: editor.innerHTML
            }));
        }
        
        // Set focus to the editor when the page loads
        window.onload = function() {
            editor.focus();
        };
    </script>
</body>
</html>
`;

interface RichTextEditorProps {
  onClose: () => void;
  initialNote?: {
    _id?: string;
    title?: string;
    content?: string;
  };
}

const RichTextEditor = ({ onClose, initialNote }: RichTextEditorProps) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  const { addNote, updateNote } = useNotesStore();

  // Handle messages from the WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'content') {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Insert an image into the editor
  const insertImage = async (imageUrl: string) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`insertImage("${imageUrl}"); true;`);
    }
  };

  // Insert a file link into the editor
  const insertFileLink = async (fileUrl: string, filename: string) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `insertFileLink("${fileUrl}", "${filename}"); true;`
      );
    }
  };

  // Handle file picking
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploading(true);
        
        try {
          const fileUrl = await uploadFileToStorage(asset.uri, 'files');
          
          if (asset.mimeType?.startsWith('image/')) {
            insertImage(fileUrl);
          } else {
            insertFileLink(fileUrl, asset.name);
          }
        } catch (error) {
          console.error('File upload error:', error);
          Alert.alert('Upload Error', 'Failed to upload file. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick a document');
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      await configureAudioSession();
      
      console.log('Starting recording...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access to record audio.');
        return;
      }
      
      setIsRecording(true);
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
    } catch (error) {
      console.error('Failed to start recording', error);
      setIsRecording(false);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  // Stop audio recording
  const stopRecording = async () => {
    try {
      if (!recording) {
        setIsRecording(false);
        return;
      }
      
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        console.log('Recording stopped, URI:', uri);
        setAudioUri(uri);
      }
      
      setIsRecording(false);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording', error);
      setIsRecording(false);
      setRecording(null);
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
    }
  };

  // Submit the note
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload audio if recorded
      let processedAudioUrl = audioUri;
      
      if (audioUri) {
        try {
          setIsUploading(true);
          processedAudioUrl = await uploadFileToStorage(audioUri, 'audio');
          setIsUploading(false);
        } catch (error) {
          console.error('Audio upload error:', error);
          Alert.alert('Warning', 'Failed to upload audio recording, but note will be saved.');
        }
      }
      
      const noteData = {
        title: title.trim(),
        content: content.trim() || '',
        taskIds: []
      };
      
      // Only add audioUrl if it has a value
      if (processedAudioUrl) {
        noteData.audioUrl = processedAudioUrl;
      }
      
      if (initialNote?._id) {
        await updateNote(initialNote._id, noteData);
      } else {
        await addNote(noteData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {initialNote?._id ? 'Edit Note' : 'New Note'}
          </Text>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isSubmitting || isUploading}
            style={styles.saveButton}
          >
            <Text style={[
              styles.saveButtonText, 
              (isSubmitting || isUploading) && styles.saveButtonTextDisabled
            ]}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor="#666"
                autoFocus
              />
            </View>

            <View style={styles.webViewContainer}>
              <WebView
                ref={webViewRef}
                source={{ html: editorHTML }}
                onMessage={handleMessage}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                )}
                scrollEnabled={false}
                automaticallyAdjustContentInsets={false}
              />
            </View>
            
            {/* Audio recording indicator */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <ActivityIndicator size="small" color="#FF3B30" />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
            )}
            
            {/* Audio URI indicator */}
            {audioUri && !isRecording && (
              <View style={styles.audioUriContainer}>
                <Ionicons name="mic" size={20} color="#007AFF" />
                <Text style={styles.audioUriText}>Audio recording attached</Text>
              </View>
            )}
            
            {/* Upload indicator */}
            {isUploading && (
              <View style={styles.uploadingIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.uploadingText}>Uploading file...</Text>
              </View>
            )}
            
            {/* Toolbar for additional actions */}
            <View style={styles.toolbar}>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={handleFilePick}
                disabled={isUploading || isSubmitting}
              >
                <Ionicons name="document-attach" size={24} color="#007AFF" />
              </TouchableOpacity>
              
              {!isRecording ? (
                <TouchableOpacity 
                  style={styles.toolbarButton}
                  onPress={startRecording}
                  disabled={isRecording || isUploading || isSubmitting}
                >
                  <Ionicons name="mic" size={24} color="#007AFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.toolbarButton, styles.stopRecordingButton]}
                  onPress={stopRecording}
                >
                  <Ionicons name="square" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  webViewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    minHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  webView: {
    minHeight: 300,
    height: 'auto',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  toolbarButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  stopRecordingButton: {
    backgroundColor: '#FF3B30',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  recordingText: {
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
  },
  audioUriContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  audioUriText: {
    color: '#007AFF',
    marginLeft: 8,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  uploadingText: {
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default RichTextEditor; 