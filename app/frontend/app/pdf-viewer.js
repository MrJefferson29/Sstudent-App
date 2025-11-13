import React, { useState } from "react";
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { resolveAssetUrl } from "./utils/api";

export default function PDFViewer() {
  const { file, pdfUrl, title } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use pdfUrl if provided, otherwise use file
  const rawUrl = pdfUrl || file;
  const resolvedUrl = resolveAssetUrl(rawUrl);
  let url = resolvedUrl || rawUrl;

  console.log('PDF URL:', url);

  const handleOpenInBrowser = async () => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this PDF link.");
      }
    } catch (error) {
      console.error("Failed to open PDF:", error);
      Alert.alert("Error", "Something went wrong while opening the PDF.");
    }
  };


  // Generate PDF viewer HTML with multiple strategies to prevent downloads
  const getPDFViewerHTML = (pdfUrl) => {
    const isLocal = pdfUrl.includes('localhost') || pdfUrl.includes('192.168.') || pdfUrl.includes('127.0.0.1');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #525252;
      font-family: Arial, sans-serif;
    }
    #pdf-container {
      width: 100%;
      height: 100vh;
      position: relative;
    }
    #viewer, #fallback-viewer {
      width: 100%;
      height: 100%;
      border: none;
      position: absolute;
      top: 0;
      left: 0;
    }
    #fallback-viewer {
      display: none;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      text-align: center;
      z-index: 1000;
      background: rgba(0,0,0,0.7);
      padding: 20px;
      border-radius: 10px;
    }
    .loading-spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 4px solid #2563EB;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      text-align: center;
      padding: 20px;
      background: rgba(0,0,0,0.9);
      border-radius: 10px;
      max-width: 90%;
      z-index: 1001;
    }
    .error a {
      display: inline-block;
      margin-top: 15px;
      padding: 12px 24px;
      background: #2563EB;
      border-radius: 5px;
      color: white;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div id="pdf-container">
    <div id="loading" class="loading">
      <div class="loading-spinner"></div>
      <div>Loading PDF...</div>
    </div>
    ${isLocal ? `
    <!-- For local URLs, try direct iframe first (WebView can handle this) -->
    <iframe 
      id="viewer"
      src="${pdfUrl}"
      style="width:100%;height:100%;border:none;"
      onload="handleLoad()"
      onerror="tryFallback()"
    ></iframe>
    <iframe 
      id="fallback-viewer"
      src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true"
      style="width:100%;height:100%;border:none;"
      onload="handleLoad()"
      onerror="showError()"
    ></iframe>
    ` : `
    <!-- For remote URLs, use Google Docs Viewer (more reliable) -->
    <iframe 
      id="viewer"
      src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true"
      style="width:100%;height:100%;border:none;"
      onload="handleLoad()"
      onerror="tryPDFJS()"
    ></iframe>
    <iframe 
      id="fallback-viewer"
      src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}"
      style="width:100%;height:100%;border:none;"
      onload="handleLoad()"
      onerror="showError()"
    ></iframe>
    `}
  </div>
  <script>
    var loading = document.getElementById('loading');
    var viewer = document.getElementById('viewer');
    var fallbackViewer = document.getElementById('fallback-viewer');
    var container = document.getElementById('pdf-container');
    var loaded = false;
    var errorShown = false;
    
    function handleLoad() {
      if (loaded) return;
      loaded = true;
      hideLoading();
      if (viewer) viewer.style.display = 'block';
    }
    
    function hideLoading() {
      if (loading) {
        loading.style.display = 'none';
      }
    }
    
    function tryFallback() {
      console.log('Primary viewer failed, trying fallback...');
      if (viewer) viewer.style.display = 'none';
      if (fallbackViewer) {
        fallbackViewer.style.display = 'block';
        setTimeout(function() {
          if (!loaded) {
            showError('Unable to load PDF. Please check your connection.');
          }
        }, 5000);
      } else {
        showError('Unable to load PDF.');
      }
    }
    
    function tryPDFJS() {
      console.log('Google Docs viewer failed, trying PDF.js...');
      if (viewer) viewer.style.display = 'none';
      if (fallbackViewer) {
        fallbackViewer.style.display = 'block';
      } else {
        showError('Unable to load PDF.');
      }
    }
    
    function showError(message) {
      if (errorShown) return;
      errorShown = true;
      hideLoading();
      if (viewer) viewer.style.display = 'none';
      if (fallbackViewer) fallbackViewer.style.display = 'none';
      container.innerHTML = '<div class="error"><p>' + (message || 'Unable to load PDF') + '</p><a href="javascript:void(0)" onclick="openPDF()">Open in Browser</a></div>';
    }
    
    function openPDF() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('openPDF');
      } else {
        window.location.href = '${pdfUrl}';
      }
    }
    
    // Timeout - show error if PDF doesn't load within 15 seconds
    setTimeout(function() {
      if (!loaded && !errorShown) {
        if (fallbackViewer && fallbackViewer.style.display === 'none') {
          tryFallback();
        } else {
          showError('PDF is taking too long to load. Please check your connection.');
        }
      }
    }, 15000);
    
    // Handle messages from React Native
    if (window.ReactNativeWebView) {
      window.addEventListener('message', function(event) {
        if (event.data === 'openPDF') {
          openPDF();
        }
      });
    }
  </script>
</body>
</html>
    `;
  };

  if (!url) {
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
        </View>
        <TouchableOpacity onPress={handleOpenInBrowser} style={styles.headerButton}>
          <Ionicons name="open-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
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
      {!error && (
        <View style={styles.pdfContainer}>
      <WebView
            source={{ html: getPDFViewerHTML(url) }}
        style={styles.webview}
            onLoadEnd={() => {
              setLoading(false);
              console.log("PDF viewer loaded");
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              // Don't set error immediately - let the HTML fallbacks handle it
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView HTTP error:", nativeEvent.statusCode);
              // Continue - PDF.js or Google Docs might still work
            }}
            onShouldStartLoadWithRequest={(request) => {
              // Prevent downloads by allowing navigation within the viewer
              console.log("Navigation request:", request.url);
              // Allow PDF.js viewer and Google Docs viewer URLs
              if (request.url.includes('pdf.js') || 
                  request.url.includes('docs.google.com') || 
                  request.url === url ||
                  request.url.startsWith('blob:') ||
                  request.url.startsWith('data:')) {
                return true;
              }
              // Block direct PDF downloads
              if (request.url.endsWith('.pdf') && !request.url.includes('viewer')) {
                console.log("Blocking PDF download, using viewer instead");
                return false;
              }
              return true;
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures={false}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              if (message === 'openPDF') {
                handleOpenInBrowser();
              }
            }}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "#E5E7EB",
  },
  webview: {
    flex: 1,
    backgroundColor: "#525252",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  browserButton: {
    backgroundColor: "#10B981",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
