import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from './Contexts/AuthContext'; // Assuming this path is correct

// --- Design Tokens ---
const PRIMARY_COLOR = '#4F46E5'; // Indigo
const BACKGROUND_COLOR = '#F9FAFB'; // Light Gray Background
const CARD_COLOR = '#FFFFFF'; // White Card
const TEXT_COLOR = '#1F2937'; // Dark Gray for primary text
const BORDER_COLOR = '#E5E7EB'; // Light Border

export default function AddItem() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false); // New state for loading/submit feedback
  const { userToken } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Requesting permissions upfront for a smoother UX
    const mediaStatus = await MediaLibrary.requestPermissionsAsync();
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    
    if (mediaStatus.status !== 'granted' || cameraStatus.status !== 'granted') {
      // Optional: Inform user if permissions are not granted
      console.log("Permissions not fully granted.");
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, // Lower quality for faster upload/better performance
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      // Limit to a reasonable number of images (e.g., 5) for UX
      setImages(result.assets.slice(0, 5));
    }
  };
  
  const removeImage = (uriToRemove) => {
    setImages(images.filter(image => image.uri !== uriToRemove));
  };

  const handleSubmit = async () => {
    if (!name || !price || !category || images.length === 0) {
      Alert.alert('Incomplete Form', 'Please fill in the Item Name, Price, Category, and select at least one Image.');
      return;
    }

    if (isNaN(price) || Number(price) <= 0) {
      Alert.alert('Invalid Price', 'Price must be a valid number greater than zero.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    images.forEach((image, index) => {
      // Adjusting image type for iOS compatibility (may need adjustments based on actual image format)
      const fileName = image.fileName || `image-${index}.${image.type === 'image' ? 'jpeg' : image.type.split('/')[1]}`;
      
      formData.append('images', {
        uri: image.uri,
        name: fileName,
        type: image.type || 'image/jpeg',
      });
    });

    formData.append('name', name);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('description', description);

    try {
      const response = await fetch('https://ficedu.onrender.com/shop/add', {
        method: 'POST',
        headers: {
          // 'Content-Type' is usually handled automatically by fetch/FormData for multipart/form-data
          'Authorization': `Bearer ${userToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success 🎉', 'Item added successfully and is now live!');
        // Reset form after success
        setName('');
        setPrice('');
        setCategory('');
        setDescription('');
        setImages([]);
        router.push('/shop');
      } else {
        Alert.alert('Submission Failed', data.message || 'An error occurred while adding the item.');
      }
    } catch (e) {
      console.error('Submission Error:', e);
      Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" // Improved keyboard UX
    >
      <Text style={styles.title}>List a New Item</Text>
      <Text style={styles.subtitle}>Fill in the details below to add your product to the shop.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Item Name **(Required)**</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="e.g., Ergonomic Office Chair" 
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Price (XAF) **(Required)**</Text>
        <TextInput 
          style={styles.input} 
          value={price} 
          onChangeText={setPrice} 
          keyboardType="numeric" 
          placeholder="e.g., 50000" 
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Category **(Required)**</Text>
        <TextInput 
          style={styles.input} 
          value={category} 
          onChangeText={setCategory} 
          placeholder="e.g., Electronics, Furniture, Books" 
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Provide a detailed description of the item, condition, features, etc."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
        />

        {/* --- Image Picker Section --- */}
        <Text style={styles.label}>Product Images **(Required)**</Text>
        <TouchableOpacity 
          style={styles.pickButton} 
          onPress={pickImages}
          disabled={loading}
        >
          <Ionicons name="camera-outline" size={24} color={CARD_COLOR} />
          <Text style={styles.pickText}>
            {images.length > 0 ? `Select More (${images.length} added)` : 'Upload Product Photos'}
          </Text>
        </TouchableOpacity>

        <View style={styles.previewContainer}>
          {images.length > 0 ? (
            images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => removeImage(img.uri)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noImage}>Please select up to 5 high-quality images of your product.</Text>
          )}
        </View>

        {/* --- Submission Button --- */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Adding Item...' : 'Add Item to Shop'}
          </Text>
          {loading && <Ionicons name="reload" size={20} color={CARD_COLOR} style={styles.spinner} />}
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} /> {/* Extra space at the bottom */}
    </ScrollView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20, // Better spacing for Android status bar
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: TEXT_COLOR,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
  },
  card: {
    backgroundColor: CARD_COLOR,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    color: TEXT_COLOR,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  // Image Picker Styles
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pickText: {
    color: CARD_COLOR,
    marginLeft: 10,
    fontWeight: '700',
    fontSize: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR, // Highlight selected images
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: CARD_COLOR,
    borderRadius: 15,
  },
  noImage: {
    color: '#9CA3AF',
    fontSize: 14,
    padding: 5,
    fontStyle: 'italic',
  },
  // Submission Button Styles
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEXT_COLOR, // Dark, professional look
    padding: 18,
    borderRadius: 12,
    marginTop: 30,
    shadowColor: TEXT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.8,
  },
  submitText: {
    color: CARD_COLOR,
    fontSize: 18,
    fontWeight: '700',
  },
  spinner: {
    marginLeft: 10,
    transform: [{ rotate: '45deg' }], // Simple loading indicator
  }
});