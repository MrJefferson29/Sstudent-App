import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { resolveAssetUrl, questionsAPI } from "./utils/api";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PDF_CACHE_DIR = FileSystem.cacheDirectory + 'pdfs/';
const PDF_STORAGE_DIR = FileSystem.documentDirectory + 'pdfs/';

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PDF_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PDF_CACHE_DIR, { intermediates: true });
    }
    const storageInfo = await FileSystem.getInfoAsync(PDF_STORAGE_DIR);
    if (!storageInfo.exists) {
      await FileSystem.makeDirectoryAsync(PDF_STORAGE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating directories:', error);
  }
};

// Get filename from URL
const getFilenameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'document.pdf';
    // Remove query params and ensure .pdf extension
    return filename.split('?')[0].endsWith('.pdf') ? filename.split('?')[0] : `${filename.split('?')[0]}.pdf`;
  } catch {
    // If URL parsing fails, use a hash-based name
    const hash = url.split('/').pop().split('?')[0];
    return hash.endsWith('.pdf') ? hash : `${hash}.pdf`;
  }
};

export default function PDFViewer() {
  const { file, pdfUrl, title, questionId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalUrl, setFinalUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const hasDownloadedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Use pdfUrl if provided, otherwise use file
  const rawUrl = pdfUrl || file;
  const resolvedUrl = resolveAssetUrl(rawUrl);
  const initialUrl = resolvedUrl || rawUrl;

  // Check if URL is from Cloudinary
  const isCloudinaryUrl = initialUrl && initialUrl.includes('res.cloudinary.com');

  // Initialize and check for cached PDF
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (hasInitializedRef.current || !initialUrl) return;
      hasInitializedRef.current = true;

      try {
        await ensureDirectories();

        // Check if PDF is already downloaded
        const filename = getFilenameFromUrl(initialUrl);
        const localPath = PDF_STORAGE_DIR + filename;
        const fileInfo = await FileSystem.getInfoAsync(localPath);

        if (fileInfo.exists) {
          console.log('Using cached PDF:', localPath);
          // Use file:// URI for WebView (works on both platforms)
          if (isMounted) {
            setFinalUrl(localPath);
            setIsDownloaded(true);
            setLoading(false);
            return;
          }
        }

        // If not cached, fetch the URL (with signed URL if needed)
        let urlToUse = initialUrl;

        // Try to get signed URL if we have questionId and it's Cloudinary
        if (questionId && isCloudinaryUrl) {
          try {
            console.log('Fetching signed URL for Cloudinary PDF');
            const response = await questionsAPI.getSignedUrl(questionId);
            if (response.success && response.url) {
              urlToUse = response.url;
              console.log('Using signed URL');
            }
          } catch (err) {
            console.warn('Could not get signed URL, using direct URL:', err);
          }
        }

        if (isMounted) {
          setFinalUrl(urlToUse);
          setLoading(false);
        }

        // Download PDF in background after first view
        if (isMounted && !hasDownloadedRef.current) {
          hasDownloadedRef.current = true;
          downloadPDF(urlToUse, filename);
        }
      } catch (err) {
        console.error('Error initializing PDF viewer:', err);
        if (isMounted) {
          setError('Failed to load PDF. Please try again.');
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [initialUrl, questionId, isCloudinaryUrl]);

  // Download PDF to device storage
  const downloadPDF = async (url, filename) => {
    try {
      setDownloading(true);
      const localPath = PDF_STORAGE_DIR + filename;

      console.log('Downloading PDF to:', localPath);

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        console.log('PDF downloaded successfully:', result.uri);
        // Store download info in AsyncStorage
        await AsyncStorage.setItem(`pdf_downloaded_${filename}`, JSON.stringify({
          url: initialUrl,
          downloadedAt: new Date().toISOString(),
          path: result.uri,
        }));
        setIsDownloaded(true);
        Alert.alert('Success', 'PDF has been saved to your device for offline access.');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      // Don't show error to user - download is optional
    } finally {
      setDownloading(false);
    }
  };

  // Generate PDF viewer HTML
  const getPDFViewerHTML = (pdfUrl) => {
    const isDataUri = pdfUrl && pdfUrl.startsWith('data:application/pdf;base64,');
    const isFileUri = pdfUrl && (pdfUrl.startsWith('file://') || pdfUrl.startsWith('content://'));
    const escapedUrl = pdfUrl.replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #pdf-container {
      width: 100%; height: 100vh; position: relative;
      background-color: #f8fafc;
    }
    iframe {
      width: 100%; height: 100%; border: none;
      background-color: #f8fafc;
    }
    .loading {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center; z-index: 1000;
      background: rgba(255,255,255,0.95);
      padding: 24px; border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    .loading-spinner {
      border: 3px solid #e2e8f0; border-radius: 50%;
      border-top: 3px solid #3b82f6;
      width: 32px; height: 32px;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="pdf-container">
    <div id="loading" class="loading">
      <div class="loading-spinner"></div>
      <div style="font-size: 16px; font-weight: 600; color: #1e293b;">Loading PDF...</div>
    </div>

    ${isDataUri || isFileUri ? `
    <iframe id="pdf-viewer" src="${pdfUrl}" style="width:100%;height:100%;border:none;" type="application/pdf"></iframe>
    ` : `
    <iframe id="google-viewer" src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true" style="width:100%;height:100%;border:none;"></iframe>
    <iframe id="pdfjs-viewer" src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}" style="width:100%;height:100%;border:none;display:none;"></iframe>
    <iframe id="direct-viewer" src="${pdfUrl}" style="width:100%;height:100%;border:none;display:none;" type="application/pdf"></iframe>
    `}
  </div>

  <script>
    var loading = document.getElementById('loading');
    var loaded = false;
    var isDataUri = ${isDataUri ? 'true' : 'false'};
    var isFileUri = ${isFileUri ? 'true' : 'false'};
    
    function hideLoading() {
      if (loading && !loaded) {
        loaded = true;
        loading.style.display = 'none';
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage('pdfLoaded');
        }
      }
    }

    ${isDataUri || isFileUri ? `
    // For local files, use direct embed
    var viewer = document.getElementById('pdf-viewer');
    viewer.onload = function() {
      setTimeout(hideLoading, 1000);
    };
    viewer.onerror = function() {
      hideLoading();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('pdfError');
      }
    };
    // Hide loading after timeout
    setTimeout(hideLoading, 5000);
    ` : `
    // For remote URLs, try multiple methods
    var googleViewer = document.getElementById('google-viewer');
    var pdfjsViewer = document.getElementById('pdfjs-viewer');
    var directViewer = document.getElementById('direct-viewer');
    var currentMethod = 0;
    var methods = [
      { name: 'google', element: googleViewer, timeout: 8000 },
      { name: 'pdfjs', element: pdfjsViewer, timeout: 6000 },
      { name: 'direct', element: directViewer, timeout: 5000 }
    ];

    function tryNextMethod() {
      if (currentMethod >= methods.length || loaded) {
        if (!loaded) {
          hideLoading();
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage('pdfError');
          }
        }
        return;
      }

      var method = methods[currentMethod];
      if (currentMethod > 0) {
        methods[currentMethod - 1].element.style.display = 'none';
      }
      method.element.style.display = 'block';
      var methodIndex = currentMethod;
      currentMethod++;

      setTimeout(function() {
        if (!loaded && methodIndex === currentMethod - 1) {
          tryNextMethod();
        }
      }, method.timeout);
    }

    methods.forEach(function(method, index) {
      method.element.onload = function() {
        if (!loaded) {
          setTimeout(function() {
            if (!loaded) {
              hideLoading();
            }
          }, 2000);
        }
      };
      method.element.onerror = function() {
        if (currentMethod === index + 1 && !loaded) {
          tryNextMethod();
        }
      };
    });

    // Start checking after 5 seconds
    setTimeout(function() {
      if (!loaded) {
        tryNextMethod();
      }
    }, 5000);

    // Overall timeout
    setTimeout(hideLoading, 15000);
    `}
  </script>
</body>
</html>
    `;
  };

  const handleOpenInBrowser = async () => {
    try {
      const urlToOpen = finalUrl || initialUrl;
      const supported = await Linking.canOpenURL(urlToOpen);
      if (supported) {
        await Linking.openURL(urlToOpen);
      } else {
        Alert.alert("Error", "Cannot open this PDF link.");
      }
    } catch (error) {
      console.error("Failed to open PDF:", error);
      Alert.alert("Error", "Something went wrong while opening the PDF.");
    }
  };

  if (!initialUrl && !finalUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text style={styles.errorText}>No PDF URL provided</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayUrl = finalUrl || initialUrl;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || "PDF Viewer"}
          </Text>
          {isDownloaded && (
            <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2 }} />
          )}
        </View>
        <TouchableOpacity onPress={handleOpenInBrowser} style={styles.headerButton}>
          <Ionicons name="open-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Download Progress */}
      {downloading && (
        <View style={styles.downloadContainer}>
          <Text style={styles.downloadText}>
            Downloading PDF... {Math.round(downloadProgress * 100)}%
          </Text>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && !error && displayUrl && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              hasInitializedRef.current = false;
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, styles.browserButton]}
            onPress={handleOpenInBrowser}
          >
            <Text style={styles.retryButtonText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PDF Viewer */}
      {!error && displayUrl && (
        <View style={styles.pdfContainer}>
          <WebView
            source={{ html: getPDFViewerHTML(displayUrl) }}
            key={displayUrl}
            style={styles.webview}
            onLoadStart={() => {
              setLoading(true);
              setError(null);
            }}
            onLoadEnd={() => {
              // HTML loaded, PDF might still be loading
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              setLoading(false);
              setError("Failed to load PDF viewer. Please try opening in browser.");
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView HTTP error:", nativeEvent.statusCode);
              if (nativeEvent.statusCode === 401 || nativeEvent.statusCode === 403) {
                if (questionId && !error) {
                  // Try signed URL
                  questionsAPI.getSignedUrl(questionId)
                    .then(response => {
                      if (response.success && response.url) {
                        setFinalUrl(response.url);
                        setError(null);
                      } else {
                        setLoading(false);
                        setError(`PDF access denied (Error ${nativeEvent.statusCode})`);
                      }
                    })
                    .catch(() => {
                      setLoading(false);
                      setError(`PDF access denied (Error ${nativeEvent.statusCode})`);
                    });
                  return;
                }
              }
              setLoading(false);
              setError(`PDF not found or access denied (Error ${nativeEvent.statusCode})`);
            }}
            onShouldStartLoadWithRequest={(request) => {
              if (request.url.includes('docs.google.com') ||
                  request.url.includes('mozilla.github.io') ||
                  request.url.includes('pdf.js') ||
                  request.url === displayUrl ||
                  request.url.startsWith('blob:') ||
                  request.url.startsWith('data:') ||
                  request.url.startsWith('file:') ||
                  request.url.startsWith('content:') ||
                  request.url.startsWith('about:blank')) {
                return true;
              }
              return false;
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            allowsBackForwardNavigationGestures={false}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              if (message === 'openPDF') {
                handleOpenInBrowser();
              } else if (message === 'pdfLoaded') {
                setLoading(false);
                setError(null);
              } else if (message === 'pdfError') {
                setLoading(false);
                setError("Failed to load PDF. Please try opening in browser.");
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    textAlign: "center",
  },
  downloadContainer: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  downloadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  webview: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(248, 250, 252, 0.95)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  browserButton: {
    backgroundColor: "#10B981",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

