import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { AuthContext } from './Contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AddItem = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const { userToken } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'You need to grant access to your media library');
    }
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert('Camera permission required', 'You need to grant access to your camera');
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.cancelled && result.assets) {
      setImages(result.assets);
    } else {
      Alert.alert('No images selected');
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || images.length === 0 || !category) {
      Alert.alert('All fields are required');
      return;
    }

    if (isNaN(price)) {
      Alert.alert('Invalid price', 'Please enter a valid price');
      return;
    }

    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        name: `image-${index}.jpg`,
        type: 'image/jpeg',
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
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${userToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Item added successfully');
        router.push('/shop');
        setName('');
        setPrice('');
        setDescription('');
        setCategory('');
        setImages([]);
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to add item. Please try again later.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Add New Item</Text>

      <TextInput
        style={styles.input}
        placeholder="Item Name"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Price (XAF)"
        placeholderTextColor="#9CA3AF"
        value={price}
        keyboardType="numeric"
        onChangeText={setPrice}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        placeholderTextColor="#9CA3AF"
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        placeholderTextColor="#9CA3AF"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
        <Ionicons name="image-outline" size={20} color="#fff" />
        <Text style={styles.pickButtonText}>Pick Images</Text>
      </TouchableOpacity>

      <View style={styles.imagePreview}>
        {images.length > 0 ? (
          images.map((img, index) => (
            <Image key={index} source={{ uri: img.uri }} style={styles.image} />
          ))
        ) : (
          <Text style={{ color: '#6B7280' }}>No images selected</Text>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Add Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20 },
  header: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 20, textAlign: 'center' },
  input: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#111827'
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },
  pickButtonText: { color: '#fff', marginLeft: 8, fontWeight: '600', fontSize: 16 },
  imagePreview: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  image: { width: 100, height: 100, borderRadius: 10, marginRight: 10, marginBottom: 10 },
  submitButton: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default AddItem;
