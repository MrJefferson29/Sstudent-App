import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Linking, Alert } from 'react-native';
import { useState, useRef } from 'react';

export default function VideoDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { videoId, title, youtubeUrl } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('keyTakeaways');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const webViewRef = useRef(null);

  console.log('Video Details Params:', { videoId, title, youtubeUrl });

  // Language options with their corresponding stream URLs
  const languages = [
    { name: 'English', code: 'en', streamUrl: 'https://www.youtube.com/embed/-VJKbieTmKA' },
    { name: 'French', code: 'fr', streamUrl: 'https://www.youtube.com/embed/-VJKbieTmKA' },
    { name: 'Chinese', code: 'zh', streamUrl: 'https://www.youtube.com/embed/-VJKbieTmKA' },
    { name: 'Spanish', code: 'es', streamUrl: 'https://www.youtube.com/embed/-VJKbieTmKA' },
    { name: 'German', code: 'de', streamUrl: 'https://www.youtube.com/embed/-VJKbieTmKA' }
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.name);
    setShowLanguageModal(false);
  };

  const handleWatchFullVideo = () => {
    console.log('Opening YouTube URL:', youtubeUrl);
    Linking.openURL(youtubeUrl)
      .catch(err => {
        console.error('Error opening YouTube link:', err);
        Alert.alert('Error', 'Something went wrong while opening the video');
      });
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            margin: 0; 
            background-color: black;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
          }
          #player {
            width: 100%;
            height: 100%;
          }
          .loading {
            color: white;
            text-align: center;
            font-size: 16px;
          }
          .error {
            color: red;
            text-align: center;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div id="player">
          <div class="loading">Loading YouTube video: ${videoId}...</div>
        </div>
        <script>
          console.log('Starting YouTube player setup for video:', '${videoId}');
          
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          var timeoutId;
          
          function onYouTubeIframeAPIReady() {
            console.log('YouTube API ready, creating player...');
            try {
            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${videoId}',
              playerVars: {
                'autoplay': 1,
                'playsinline': 1,
                'modestbranding': 1,
                'rel': 0,
                'showinfo': 0,
                'controls': 1
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
              }
            });
              
              // Set a timeout in case the API doesn't load
              timeoutId = setTimeout(function() {
                if (!player || !player.getPlayerState) {
                  console.error('Player failed to initialize');
                  window.ReactNativeWebView.postMessage('player_error:timeout');
                }
              }, 10000);
            } catch (error) {
              console.error('Error creating player:', error);
              window.ReactNativeWebView.postMessage('player_error:creation');
            }
          }

          function onPlayerReady(event) {
            console.log('Player is ready');
            clearTimeout(timeoutId);
            window.ReactNativeWebView.postMessage('player_ready');
            event.target.playVideo();
          }

          function onPlayerStateChange(event) {
            console.log('Player state changed:', event.data);
            window.ReactNativeWebView.postMessage('player_state:' + event.data);
          }

          function onPlayerError(event) {
            console.error('Player error:', event.data);
            clearTimeout(timeoutId);
            window.ReactNativeWebView.postMessage('player_error:' + event.data);
          }
          
          // Fallback if API doesn't load
          setTimeout(function() {
            if (typeof YT === 'undefined' || !YT.Player) {
              console.error('YouTube API failed to load, trying direct iframe...');
              try {
                var iframe = document.createElement('iframe');
                iframe.src = 'https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&modestbranding=1&rel=0&showinfo=0&controls=1';
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                
                var playerDiv = document.getElementById('player');
                playerDiv.innerHTML = '';
                playerDiv.appendChild(iframe);
                
                window.ReactNativeWebView.postMessage('player_ready');
              } catch (error) {
                console.error('Fallback iframe also failed:', error);
                window.ReactNativeWebView.postMessage('player_error:api_failed');
              }
            }
          }, 5000);
        </script>
      </body>
    </html>
  `;

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    setError('Failed to load video. Please try again.');
  };

  const handleWebViewLoad = () => {
    console.log('WebView loaded successfully');
    setIsLoading(false);
  };

  const handleMessage = (event) => {
    const message = event.nativeEvent.data;
    console.log('Received message from WebView:', message);
    
    if (message === 'player_ready') {
      setIsLoading(false);
    } else if (message.startsWith('player_error')) {
      const errorCode = message.split(':')[1];
      console.error('YouTube Player Error:', errorCode);
      
      // Handle specific error codes
      if (errorCode === '150') {
        Alert.alert(
          'Video Not Available',
          'This video cannot be played in the app. Would you like to watch it on YouTube instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => router.back()
            },
            {
              text: 'Watch on YouTube',
              onPress: handleWatchFullVideo
            }
          ]
        );
      } else if (errorCode === 'timeout' || errorCode === 'creation' || errorCode === 'api_failed') {
        setError('Failed to initialize video player. Please try again or watch on YouTube.');
      } else {
        setError('Failed to load video. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
     
        <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.retryButton, { marginTop: 10, backgroundColor: '#4285F4' }]}
              onPress={handleWatchFullVideo}
            >
              <Text style={styles.retryButtonText}>Watch on YouTube</Text>
            </TouchableOpacity>
          </View>
        )}
        <WebView
          ref={webViewRef}
          style={styles.video}
          javaScriptEnabled={true}
          source={{ html: htmlContent }}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          onError={handleWebViewError}
          onLoad={handleWebViewLoad}
          onMessage={handleMessage}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP Error:', nativeEvent);
            setError('Network error. Please check your connection.');
          }}
        />
      </View>

      {/* Tab Headers */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'keyTakeaways' && styles.activeTabButton]}
          onPress={() => setActiveTab('keyTakeaways')}
        >
          <Text style={[styles.tabText, activeTab === 'keyTakeaways' && styles.activeTabText]}>
            Key Takeaways
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'assignments' && styles.activeTabButton]}
          onPress={() => setActiveTab('assignments')}
        >
          <Text style={[styles.tabText, activeTab === 'assignments' && styles.activeTabText]}>
            Assignments
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'discussions' && styles.activeTabButton]}
          onPress={() => setActiveTab('discussions')}
        >
          <Text style={[styles.tabText, activeTab === 'discussions' && styles.activeTabText]}>
            Discussions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'keyTakeaways' && (
          <View style={styles.tabSection}>
            <Text style={styles.tabSectionTitle}>Key Points from This Lesson</Text>
            <View style={styles.keyPointItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.keyPointText}>Grasping the core concepts of this subject</Text>
            </View>
            <View style={styles.keyPointItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.keyPointText}>Applying theory to real-world school problems</Text>
            </View>
            <View style={styles.keyPointItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.keyPointText}>Collaborating effectively with classmates</Text>
            </View>
            <View style={styles.keyPointItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.keyPointText}>Building study and research skills</Text>
            </View>
          </View>
        )}

        {activeTab === 'assignments' && (
          <View style={styles.tabSection}>
            <Text style={styles.tabSectionTitle}>Your Assignments</Text>
            <View style={styles.assignmentItem}>
              <Ionicons name="document-text" size={20} color="#3498DB" />
              <Text style={styles.assignmentText}>Read the assigned textbook chapters</Text>
            </View>
            <View style={styles.assignmentItem}>
              <Ionicons name="chatbubbles" size={20} color="#3498DB" />
              <Text style={styles.assignmentText}>Complete the practice exercises</Text>
            </View>
            <View style={styles.assignmentItem}>
              <Ionicons name="people" size={20} color="#3498DB" />
              <Text style={styles.assignmentText}>Work on a group project or presentation</Text>
            </View>
            <View style={styles.assignmentItem}>
              <Ionicons name="book" size={20} color="#3498DB" />
              <Text style={styles.assignmentText}>Submit a summary or report on your findings</Text>
            </View>
          </View>
        )}

        {activeTab === 'discussions' && (
          <View style={styles.tabSection}>
            <Text style={styles.tabSectionTitle}>Discussion Topics</Text>
            <View style={styles.discussionItem}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#E74C3C" />
              <Text style={styles.discussionText}>What are the most effective study strategies for this subject?</Text>
            </View>
            <View style={styles.discussionItem}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#E74C3C" />
              <Text style={styles.discussionText}>How can technology enhance learning in this course?</Text>
            </View>
            <View style={styles.discussionItem}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#E74C3C" />
              <Text style={styles.discussionText}>Share a real-life application of a concept from this lesson.</Text>
            </View>
            <View style={styles.discussionItem}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#E74C3C" />
              <Text style={styles.discussionText}>What challenges do students face in this subject and how can they be overcome?</Text>
            </View>
          </View>
        )}
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageModal}>
            <Text style={styles.languageModalTitle}>Select Language</Text>
            {languages.map((language) => (
      <TouchableOpacity 
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.name && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect(language)}
              >
                <Text style={[
                  styles.languageOptionText,
                  selectedLanguage === language.name && styles.languageOptionTextSelected
                ]}>
                  {language.name}
                </Text>
                {selectedLanguage === language.name && (
                  <Ionicons name="checkmark" size={20} color="#3498DB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
      </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  videoContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.4,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  watchFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  // Language Button Styles
  languageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  languageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#3498DB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#3498DB',
    fontWeight: '600',
  },

  // Tab Content Styles
  tabContent: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
  tabSection: {
    flex: 1,
  },
  tabSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 20,
  },

  // Key Points Styles
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  keyPointText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 22,
  },

  // Assignment Styles
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  assignmentText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 22,
  },

  // Discussion Styles
  discussionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  discussionText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 22,
  },

  // Language Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
  },
  languageOptionSelected: {
    backgroundColor: '#EBF3FD',
    borderWidth: 1,
    borderColor: '#3498DB',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageOptionTextSelected: {
    color: '#3498DB',
    fontWeight: '600',
  },
});