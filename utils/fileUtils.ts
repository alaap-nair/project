import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { uriToBlob } from './audioUtils';

/**
 * Extracts the filename from a URI
 * @param uri The file URI
 * @returns The extracted filename
 */
export const getFilenameFromUri = (uri: string): string => {
  // Handle file:// scheme
  let path = uri;
  if (path.startsWith('file://')) {
    path = path.substring(7);
  }
  
  // Extract the filename
  const parts = path.split('/');
  let filename = parts[parts.length - 1];
  
  // Remove query parameters if present
  if (filename.includes('?')) {
    filename = filename.split('?')[0];
  }
  
  return filename;
};

/**
 * Uploads a file to Firebase Storage
 * @param uri The local file URI
 * @param folder The folder in Firebase Storage (e.g., 'images', 'files', 'audio')
 * @returns The download URL of the uploaded file
 */
export const uploadFileToStorage = async (uri: string, folder: string = 'files'): Promise<string> => {
  try {
    // Validate URI before proceeding
    if (!uri) {
      console.error('Invalid file URI: URI is empty or undefined');
      throw new Error('Invalid file URI: URI is empty or undefined');
    }
    
    console.log(`Starting upload for file: ${uri} to folder: ${folder}`);
    
    // Handle file:// URI for iOS
    let fileUri = uri;
    if (fileUri.startsWith('file://')) {
      fileUri = fileUri.substring('file://'.length);
    }
    
    const storage = getStorage();
    const filename = getFilenameFromUri(uri);
    const timestamp = new Date().getTime();
    const storageRef = ref(storage, `${folder}/${timestamp}_${filename}`);
    
    let blob: Blob;
    try {
      // First try using uriToBlob from audioUtils
      blob = await uriToBlob(uri);
    } catch (error) {
      console.log('Failed to convert with uriToBlob, trying FileSystem.readAsStringAsync', error);
      
      // Fallback method using FileSystem
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist at URI: ${uri}`);
      }
      
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      blob = await fetch(`data:application/octet-stream;base64,${fileContent}`).then(res => res.blob());
    }
    
    console.log(`Uploading blob with size: ${blob.size} bytes`);
    await uploadBytes(storageRef, blob);
    
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`File uploaded successfully, URL: ${downloadUrl}`);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};

/**
 * Determines the MIME type from a file extension
 * @param filename The filename with extension
 * @returns The MIME type string
 */
export const getMimeTypeFromFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // Audio
    'mp3': 'audio/mpeg',
    'm4a': 'audio/mp4',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Video
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'webm': 'video/webm',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    
    // Other
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}; 