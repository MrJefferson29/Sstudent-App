import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const API_URL = 'https://ficedu-payment.onrender.com';
const { width } = Dimensions.get('window');
// Increase the video height by using a higher ratio (e.g., 0.75 for a 4:3 ratio look)
const VIDEO_HEIGHT = width * 0.75;

const VideoDetails = () => {
  const { id } = useLocalSearchParams();
  const [videoDetails, setVideoDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/courses/video/${id}`);
        setVideoDetails(response.data.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load video details.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideoDetails();
  }, [id]);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!videoDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Video details not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <TouchableOpacity
          style={styles.videoTouchable}
          onPress={() => setControlsVisible(!controlsVisible)}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoDetails.videoUrl || videoDetails.file }}
            style={styles.video}
            resizeMode="contain"
            shouldPlay={isPlaying}
            useNativeControls={false}
          />
          {controlsVisible && (
            <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={50} color="#FFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.title}>{videoDetails.title}</Text>
        <View style={styles.divider} />
        <Text style={styles.description}>{videoDetails.description}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Immersive black background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: '#000',
    height: VIDEO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
  },
  controlButton: {
    position: 'absolute',
    // Center the icon both horizontally and vertically
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }], // Adjust based on half the size of the icon
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 50,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    marginTop: -12, // Overlap slightly for a smooth transition
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 20,
    color: '#d9534f',
  },
});

export default VideoDetails;