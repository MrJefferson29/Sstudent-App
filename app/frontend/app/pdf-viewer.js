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


  // Generate improved PDF viewer HTML - Start with Google Docs Viewer (most reliable)
  const getPDFViewerHTML = (pdfUrl) => {
    // Escape the PDF URL for use in JavaScript string
    const escapedUrl = pdfUrl.replace(/'/g, "\\'").replace(/"/g, '\\"');
    
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
    iframe {
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
      margin: 4px;
      cursor: pointer;
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

    <!-- Method 1: Google Docs Viewer (most reliable) -->
    <iframe
      id="google-viewer"
      src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true"
      style="width:100%;height:100%;border:none;"
    ></iframe>

    <!-- Method 2: PDF.js Viewer (fallback) -->
    <iframe
      id="pdfjs-viewer"
      src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}"
      style="width:100%;height:100%;border:none;display:none;"
    ></iframe>

    <!-- Method 3: Direct embed (fallback) -->
    <iframe
      id="direct-viewer"
      src="${pdfUrl}"
      style="width:100%;height:100%;border:none;display:none;"
      type="application/pdf"
    ></iframe>
  </div>

  <script>
    var loading = document.getElementById('loading');
    var googleViewer = document.getElementById('google-viewer');
    var pdfjsViewer = document.getElementById('pdfjs-viewer');
    var directViewer = document.getElementById('direct-viewer');
    var container = document.getElementById('pdf-container');
    var loaded = false;
    var errorShown = false;
    var currentMethod = 0;
    var pdfUrl = '${escapedUrl}';
    
    var methods = [
      { name: 'google', element: googleViewer, timeout: 8000 },
      { name: 'pdfjs', element: pdfjsViewer, timeout: 6000 },
      { name: 'direct', element: directViewer, timeout: 5000 }
    ];

    function hideLoading() {
      if (loading) {
        loading.style.display = 'none';
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
            The PDF could not be loaded in the app. This might be due to network issues, CORS restrictions, or the PDF being unavailable.
          </div>
          <a href="javascript:void(0)" class="error-button" onclick="openPDF()">Open in Browser</a>
        </div>
      \`;
    }

    function openPDF() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('openPDF');
      } else {
        window.location.href = pdfUrl;
      }
    }

    function checkIfBlank() {
      // Check if the iframe content appears to be blank
      try {
        var iframe = methods[currentMethod].element;
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          var bodyText = iframeDoc.body ? iframeDoc.body.innerText || iframeDoc.body.textContent : '';
          var bodyHTML = iframeDoc.body ? iframeDoc.body.innerHTML : '';
          // If body is empty or only contains whitespace/loading text, might be blank
          if (bodyText.trim().length < 10 && !bodyHTML.includes('pdf') && !bodyHTML.includes('PDF')) {
            return true;
          }
        }
      } catch (e) {
        // Cross-origin - can't check, assume it's loading
        return false;
      }
      return false;
    }

    function tryNextMethod() {
      if (currentMethod >= methods.length) {
        showError();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage('pdfError');
        }
        return;
      }

      var method = methods[currentMethod];
      console.log('Trying PDF viewer method:', method.name);
      
      // Hide previous method
      if (currentMethod > 0) {
        methods[currentMethod - 1].element.style.display = 'none';
      }
      
      // Show current method
      method.element.style.display = 'block';
      var methodIndex = currentMethod;
      currentMethod++;

      // Set timeout for this method
      setTimeout(function() {
        if (!loaded && !errorShown && methodIndex === currentMethod - 1) {
          // Check if blank
          if (checkIfBlank() && methodIndex < methods.length - 1) {
            console.log('PDF appears blank, trying next method');
            tryNextMethod();
          } else {
            // Assume loaded after timeout
            loaded = true;
            hideLoading();
            console.log('PDF loaded with method:', method.name);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('pdfLoaded');
            }
          }
        }
      }, method.timeout);
    }

    // Handle iframe load events
    methods.forEach(function(method, index) {
      method.element.onload = function() {
        console.log('Iframe loaded:', method.name);
        // Give it a moment to render
        setTimeout(function() {
          if (!loaded && currentMethod > index) {
            if (!checkIfBlank() || index === methods.length - 1) {
              loaded = true;
              hideLoading();
              console.log('PDF loaded with method:', method.name);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('pdfLoaded');
              }
            } else if (currentMethod === index + 1) {
              // Current method is blank, try next
              tryNextMethod();
            }
          }
        }, 2000);
      };
      method.element.onerror = function() {
        console.log('Iframe error:', method.name);
        if (currentMethod === index + 1) {
          tryNextMethod();
        }
      };
    });

    // Start with Google Docs Viewer
    setTimeout(function() {
      if (!loaded) {
        // Check if Google viewer loaded
        if (checkIfBlank()) {
          tryNextMethod();
        } else {
          // Give it more time
          setTimeout(function() {
            if (!loaded && checkIfBlank()) {
              tryNextMethod();
            }
          }, 3000);
        }
      }
    }, 5000);

    // Overall timeout - show error if nothing loads within 25 seconds
    setTimeout(function() {
      if (!loaded && !errorShown) {
        showError();
      }
    }, 25000);

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
            onLoadStart={() => {
              setLoading(true);
              setError(null);
              console.log("PDF viewer loading started");
            }}
            onLoadEnd={() => {
              // Don't hide loading immediately - let the HTML script handle it
              console.log("PDF viewer HTML loaded");
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
              if (nativeEvent.statusCode >= 400) {
                setLoading(false);
                setError(`PDF not found or access denied (Error ${nativeEvent.statusCode})`);
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              // Allow all PDF viewer services and the PDF URL
              if (request.url.includes('docs.google.com') ||
                  request.url.includes('mozilla.github.io') ||
                  request.url.includes('pdf.js') ||
                  request.url.includes('officeapps.live.com') ||
                  request.url.includes('view.officeapps.live.com') ||
                  request.url === url ||
                  request.url.startsWith('blob:') ||
                  request.url.startsWith('data:') ||
                  request.url.startsWith('about:blank')) {
                return true;
              }
              // Block navigation away from PDF viewer
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
