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


  // Generate simple, reliable PDF viewer HTML
  const getPDFViewerHTML = (pdfUrl) => {
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #pdf-container {
      width: 100%;
      height: 100vh;
      position: relative;
      background-color: #f8fafc;
    }
    #viewer {
      width: 100%;
      height: 100%;
      border: none;
      background-color: #f8fafc;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 1000;
      background: rgba(255,255,255,0.95);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    .loading-spinner {
      border: 3px solid #e2e8f0;
      border-radius: 50%;
      border-top: 3px solid #3b82f6;
      width: 32px;
      height: 32px;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
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
      text-align: center;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      max-width: 90%;
      z-index: 1001;
    }
    .error-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .error-message {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 16px;
      line-height: 20px;
    }
    .error-button {
      display: inline-block;
      padding: 12px 24px;
      background: #3b82f6;
      border-radius: 8px;
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .error-button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div id="pdf-container">
    <div id="loading" class="loading">
      <div class="loading-spinner"></div>
      <div style="font-size: 16px; font-weight: 600; color: #1e293b;">Loading PDF...</div>
      <div style="font-size: 14px; color: #64748b; margin-top: 4px;">This may take a few moments</div>
    </div>

    <!-- Try PDF.js first, fallback to Microsoft Viewer if needed -->
    <iframe
      id="viewer"
      src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}"
      style="width:100%;height:100%;border:none;"
      onload="handleLoad()"
      onerror="tryMicrosoftViewer()"
    ></iframe>

    <!-- Microsoft Office Online Viewer as fallback -->
    <iframe
      id="fallback-viewer"
      src="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(pdfUrl)}"
      style="width:100%;height:100%;border:none;display:none;"
      onload="handleLoad()"
      onerror="showError()"
    ></iframe>
  </div>

  <script>
    var loading = document.getElementById('loading');
    var viewer = document.getElementById('viewer');
    var fallbackViewer = document.getElementById('fallback-viewer');
    var container = document.getElementById('pdf-container');
    var loaded = false;
    var errorShown = false;
    var triedFallback = false;

    function handleLoad() {
      if (loaded) return;
      loaded = true;
      hideLoading();
      console.log('PDF loaded successfully');
    }

    function hideLoading() {
      if (loading) {
        loading.style.display = 'none';
      }
    }

    function tryMicrosoftViewer() {
      if (triedFallback) return;
      triedFallback = true;
      console.log('PDF.js failed, trying Microsoft Viewer...');

      if (viewer) viewer.style.display = 'none';
      if (fallbackViewer) {
        fallbackViewer.style.display = 'block';
        // Give Microsoft viewer time to load
        setTimeout(function() {
          if (!loaded) {
            console.log('Microsoft viewer loaded or timed out');
            loaded = true;
            hideLoading();
          }
        }, 3000);
      } else {
        showError();
      }
    }

    function showError() {
      if (errorShown) return;
      errorShown = true;
      hideLoading();

      container.innerHTML = \`
        <div class="error">
          <div class="error-title">Unable to Load PDF</div>
          <div class="error-message">
            The PDF could not be loaded in the app. This might be due to network issues or the PDF being unavailable.
          </div>
          <a href="javascript:void(0)" class="error-button" onclick="openPDF()">Open in Browser</a>
        </div>
      \`;
    }

    function openPDF() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('openPDF');
      } else {
        window.location.href = '${pdfUrl}';
      }
    }

    // Timeout - show error if PDF doesn't load within 15 seconds (gives time for fallback)
    setTimeout(function() {
      if (!loaded && !errorShown) {
        showError();
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
              setError("Failed to load PDF viewer");
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView HTTP error:", nativeEvent.statusCode);
              if (nativeEvent.statusCode >= 400) {
                setError("PDF not found or access denied");
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              // Allow PDF viewers, blob URLs, and data URLs for proper PDF display
              if (request.url.includes('pdf.js') ||
                  request.url.includes('mozilla.github.io') ||
                  request.url.includes('officeapps.live.com') ||
                  request.url.includes('view.officeapps.live.com') ||
                  request.url.startsWith('blob:') ||
                  request.url.startsWith('data:') ||
                  request.url === url) {
                return true;
              }
              // Block direct PDF access to prevent downloads
              if (request.url.endsWith('.pdf') && !request.url.includes('viewer.html')) {
                return false;
              }
              return true;
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
              }
            }}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
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
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    textAlign: "center",
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
