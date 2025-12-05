import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, Platform, BackHandler } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { resolveAssetUrl, questionsAPI } from "./utils/api";

// Use standard directories
const PDF_DIR = FileSystem.documentDirectory + 'pdfs/';

const ensureDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(PDF_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PDF_DIR, { intermediates: true });
  }
};

const getFilename = (url) => {
  try {
    const name = url.split('/').pop().split('?')[0];
    return name.endsWith('.pdf') ? name : `${name}.pdf`;
  } catch {
    return `document_${Date.now()}.pdf`;
  }
};

export default function PDFViewer() {
  const { file, pdfUrl, title, questionId } = useLocalSearchParams();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [displayUrl, setDisplayUrl] = useState(null); // The URL passed to WebView
  const [localPath, setLocalPath] = useState(null);   // The path on the file system
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Refs to prevent double-initialization
  const isMounted = useRef(true);

  const rawUrl = pdfUrl || file;
  
  useEffect(() => {
    isMounted.current = true;
    initializeViewer();
    return () => { isMounted.current = false; };
  }, [rawUrl]);

  const initializeViewer = async () => {
    try {
      await ensureDirectory();
      
      let urlToUse = resolveAssetUrl(rawUrl) || rawUrl;
      const filename = getFilename(urlToUse);
      const fsPath = PDF_DIR + filename;

      // 1. Handle Cloudinary Signed URLs if needed
      if (questionId && urlToUse && urlToUse.includes('res.cloudinary.com')) {
         try {
           const response = await questionsAPI.getSignedUrl(questionId);
           if (response.success && response.url) urlToUse = response.url;
         } catch (e) { console.warn("Using public URL"); }
      }

      // 2. Check if we already have it downloaded
      const fileInfo = await FileSystem.getInfoAsync(fsPath);
      
      if (fileInfo.exists) {
        setLocalPath(fsPath);
        setIsDownloaded(true);
        
        // CRITICAL FIX FOR ANDROID CRASH:
        if (Platform.OS === 'android') {
          // On Android, we CANNOT view a local file:// in WebView.
          // We must continue to use the Remote URL via Google Viewer.
          setDisplayUrl(urlToUse); 
        } else {
          // On iOS, we prefer the local file for speed.
          setDisplayUrl(fsPath);
        }
      } else {
        // Not downloaded yet, use remote
        setDisplayUrl(urlToUse);
        // Start background download
        downloadPDF(urlToUse, fsPath);
      }
      
      setLoading(false);

    } catch (error) {
      console.error("Init error:", error);
      Alert.alert("Error", "Could not load PDF details");
      setLoading(false);
    }
  };

  const downloadPDF = async (url, savePath) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        savePath,
        {},
        (progress) => {
            const p = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            if(isMounted.current) setDownloadProgress(p);
        }
      );
      const result = await downloadResumable.downloadAsync();
      if (result && isMounted.current) {
        setIsDownloaded(true);
        setLocalPath(result.uri);
      }
    } catch (e) {
      console.log("Download failed (non-critical):", e);
    } finally {
      if(isMounted.current) setDownloading(false);
    }
  };

  const handleOpenExternal = async () => {
    try {
      // Prefer local file if available, else remote
      const url = localPath || displayUrl;
      
      if (Platform.OS === 'android' && localPath) {
        // On Android, to open a local file, we usually need a Content URI (Expo Sharing)
        // But Linking can sometimes handle file:// if a PDF reader is installed
        const contentUri = await FileSystem.getContentUriAsync(localPath);
        await Linking.openURL(contentUri);
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      Alert.alert("Error", "No app available to open this PDF.");
    }
  };

  // --- RENDER LOGIC ---

  // Generate the Source object for WebView
  const getWebViewSource = () => {
    if (!displayUrl) return null;

    if (Platform.OS === 'ios') {
      // iOS can render PDF directly
      return { uri: displayUrl };
    } 
    
    // ANDROID LOGIC
    if (Platform.OS === 'android') {
      // We must use Google Docs Viewer for Android WebView
      // We cannot feed it a file:// URL. It must be http/https.
      if (displayUrl.startsWith('file://')) {
          // If we ended up here with a file path on Android, we can't show it in WebView.
          return null; 
      }
      return { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(displayUrl)}` };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title || "Document"}</Text>
          {isDownloaded && <Text style={styles.subtitle}>Saved on device</Text>}
        </View>
        <TouchableOpacity onPress={handleOpenExternal} style={styles.headerButton}>
          <Ionicons name="open-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {downloading && (
        <View style={{height: 2, backgroundColor: '#E2E8F0', width: '100%'}}>
           <View style={{height: '100%', backgroundColor: '#10B981', width: `${downloadProgress * 100}%`}} />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
           <View style={styles.center}>
             <ActivityIndicator size="large" color="#3B82F6" />
             <Text style={styles.loadingText}>Preparing PDF...</Text>
           </View>
        ) : (
          <>
            {/* ANDROID FALLBACK FOR OFFLINE/LOCAL FILES */}
            {Platform.OS === 'android' && displayUrl && displayUrl.startsWith('file://') ? (
               <View style={styles.center}>
                 <Ionicons name="document-text" size={64} color="#94A3B8" />
                 <Text style={styles.errorText}>
                   Android cannot view offline PDFs inside the app.
                 </Text>
                 <TouchableOpacity style={styles.openBtn} onPress={handleOpenExternal}>
                   <Text style={styles.openBtnText}>Open with PDF Viewer</Text>
                 </TouchableOpacity>
               </View>
            ) : (
              /* THE WEBVIEW */
              <WebView
                originWhitelist={['*']}
                source={getWebViewSource()}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                  </View>
                )}
                onError={(e) => console.log("WebView Error", e.nativeEvent)}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B",
    paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, paddingHorizontal: 16
  },
  headerButton: { padding: 8 },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  title: { fontSize: 16, fontWeight: "600", color: "#F8FAFC" },
  subtitle: { fontSize: 10, color: "#10B981", marginTop: 2 },
  content: { flex: 1, position: 'relative' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#64748B' },
  loadingOverlay: {
    position: 'absolute', top:0, left:0, right:0, bottom:0, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC'
  },
  errorText: { textAlign: 'center', color: '#64748B', marginTop: 16, marginBottom: 24 },
  openBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  openBtnText: { color: 'white', fontWeight: '600' }
});