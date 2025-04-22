import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import useNotesStore from '../store/notes';
import { useAuthStore } from '../store/auth';
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
  linkToTaskId?: string;
}

const RichTextEditor = ({ onClose, initialNote, linkToTaskId }: RichTextEditorProps) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const webViewRef = useRef<WebView | null>(null);
  
  const { addNote, updateNote, loading, error } = useNotesStore();
  const { user, isAuthReady } = useAuthStore();

  // Memoize the auth check to prevent unnecessary re-renders
  const checkAuth = useCallback(() => {
    if (!isAuthReady) {
      return { isValid: false, message: 'Loading authentication status...' };
    }
    if (!user) {
      return { isValid: false, message: 'Please log in to continue.' };
    }
    return { isValid: true };
  }, [user, isAuthReady]);

  // Monitor auth state changes
  useEffect(() => {
    const authStatus = checkAuth();
    console.log('RichTextEditor auth state:', { 
      user: user?.uid, 
      isAuthReady,
      isValid: authStatus.isValid,
      timestamp: new Date().toISOString()
    });

    // If auth becomes invalid while editing, save draft and notify user
    if (!authStatus.isValid && content.trim()) {
      const draftKey = `note_draft_${Date.now()}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, content }));
        Alert.alert(
          'Authentication Required',
          'Your draft has been saved. Please log in again to continue editing.',
          [{ text: 'OK', onPress: onClose }]
        );
      } catch (error) {
        console.error('Error saving draft:', error);
        Alert.alert(
          'Authentication Required',
          'Please log in again to continue editing.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    }
  }, [user, isAuthReady, content, title]);

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

  // Function to insert image into the editor
  const insertImage = async (imageUrl: string) => {
    const js = `insertImage("${imageUrl}");`;
    webViewRef.current?.injectJavaScript(js);
  };

  // Function to insert file link into the editor
  const insertFileLink = async (fileUrl: string, filename: string) => {
    const js = `insertFileLink("${fileUrl}", "${filename}");`;
    webViewRef.current?.injectJavaScript(js);
  };

  // Function to handle file picking
  const handleFilePick = async () => {
    const authStatus = checkAuth();
    if (!authStatus.isValid) {
      Alert.alert('Authentication Required', authStatus.message);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setIsSaving(true);
        try {
          const storagePath = `users/${user.uid}/files/${Date.now()}_${result.name}`;
          const fileUrl = await uploadFileToStorage(result.uri, storagePath);
          if (fileUrl) {
            insertFileLink(fileUrl, result.name);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          Alert.alert('Error', 'Failed to upload file. Please try again.');
        } finally {
          setIsSaving(false);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Function to handle starting audio recording
  const startRecording = async () => {
    const authStatus = checkAuth();
    if (!authStatus.isValid) {
      Alert.alert('Authentication Required', authStatus.message);
      return;
    }

    try {
      console.log('Requesting permissions...');
      await Audio.requestPermissionsAsync();
      await configureAudioSession();
      
      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  // Function to handle stopping audio recording
  const stopRecording = async () => {
    if (!recording) return;
    try {
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);

      if (uri) {
        setIsSaving(true);
        
        try {
          // Generate a unique path in storage including the user ID for proper isolation
          const storagePath = `users/${user.uid}/audio/${Date.now()}.m4a`;
          
          // Upload audio file to Firebase Storage
          const audioUrl = await uploadFileToStorage(uri, storagePath);
          
          if (audioUrl) {
            // Insert audio player in the editor
            const audioElement = `<div><audio controls src="${audioUrl}"></audio><div>Recorded Audio</div></div>`;
            const js = `document.execCommand('insertHTML', false, ${JSON.stringify(audioElement)});`;
            webViewRef.current?.injectJavaScript(js);
          }
        } catch (error) {
          console.error('Error uploading audio:', error);
          Alert.alert('Error', 'Failed to upload audio. Please try again.');
        } finally {
          setIsSaving(false);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
    
    setRecording(null);
    setIsRecording(false);
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your note');
      return;
    }

    const authStatus = checkAuth();
    if (!authStatus.isValid) {
      Alert.alert('Authentication Required', authStatus.message);
      return;
    }

    setIsSaving(true);
    try {
      const noteData = {
        title: title.trim(),
        content,
        userId: user.uid,
        linkedTaskId: linkToTaskId,
      };

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
      setIsSaving(false);
    }
  };

  // Cleanup function for WebView and other resources
  useEffect(() => {
    return () => {
      // Clean up WebView
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
        webViewRef.current = null;
      }
      
      // Clean up recording if active
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
      
      // Clear any pending operations
      setIsSaving(false);
      setIsRecording(false);
    };
  }, []);

  // Optimize WebView memory usage
  const webViewConfig = {
    source: { html: editorHTML },
    onMessage: handleMessage,
    style: styles.webView,
    javaScriptEnabled: true,
    domStorageEnabled: true,
    startInLoadingState: true,
    renderLoading: () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    ),
    scrollEnabled: false,
    automaticallyAdjustContentInsets: false,
    // Add memory optimization props
    cacheEnabled: false,
    cacheMode: 'LOAD_NO_CACHE',
    onShouldStartLoadWithRequest: () => true,
    onLoadEnd: () => {
      // Clear any cached data
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.localStorage.clear();
          window.sessionStorage.clear();
        `);
      }
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
            disabled={isSaving || !title.trim()}
            style={styles.saveButton}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
        >
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
                {...webViewConfig}
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
            {recording && !isRecording && (
              <View style={styles.audioUriContainer}>
                <Ionicons name="mic" size={20} color="#007AFF" />
                <Text style={styles.audioUriText}>Audio recording attached</Text>
              </View>
            )}
            
            {/* Upload indicator */}
            {loading && (
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
                disabled={isSaving}
              >
                <Ionicons name="document-attach" size={24} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toolbarButton, isRecording && styles.activeRecording]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isSaving}
              >
                <Ionicons 
                  name={isRecording ? "stop-circle" : "mic"} 
                  size={24} 
                  color={isRecording ? "#ff3b30" : "#007AFF"} 
                />
              </TouchableOpacity>
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
  activeRecording: {
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