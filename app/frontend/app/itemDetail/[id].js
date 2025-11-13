import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
// import Loading from '../loading';

export default function ItemDetail() {
  const [item, setItem] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  if (!id) {
    return <Text>Invalid ID or no ID provided</Text>;
  }

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        const response = await axios.get(`https://ficedu-payment.onrender.com/shop/${id}`);
        const itemData = response.data.data;
        setItem(itemData);
        if (itemData.author) {
          setAuthor(itemData.author);
        }
      } catch (err) {
        setError('Failed to fetch item details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItemDetail();
    }
  }, [id]);

  const handleCallPress = () => {
    if (author?.phone) {
      Linking.openURL(`tel:${author.phone}`);
    } else {
      alert('Phone number not available');
    }
  };

  const handleWhatsappPress = () => {
    if (author?.whatsapp) {
      Linking.openURL(`whatsapp://send?phone=${author.whatsapp}`);
    } else {
      alert('WhatsApp number not available');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#575757" />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {item && (
        <>
          {/* Image Carousel */}
          <Swiper
            style={styles.wrapper}
            showsButtons={false}
            autoplay={true}
            autoplayTimeout={5}
            showsPagination={false}
            dotStyle={styles.dot}
            activeDotStyle={styles.activeDot}
          >
            {item.images.map((image, index) => (
              <View key={index} style={styles.slide}>
                <Image source={{ uri: image }} style={styles.image} />
              </View>
            ))}
          </Swiper>

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>XAF {item.price}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.description}>Based on our privacy policy, purchasing an item requires that you contact the individual via third party means. FICEDU would not be held accountable for any decissions you make concerning your transactions</Text>
            <View style={styles.divider} />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallPress}>
                <Ionicons name="call" size={20} color="#007AFF" />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleWhatsappPress}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.actionText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  wrapper: {
    height: 320, // Keeps the image carousel height intact
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  image: {
    width: '100%', // Do not modify horizontal padding or margins
    height: 400,
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 15,
    marginTop: -30,
    padding: 20,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // Android shadow
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  itemPrice: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  description: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 22,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#C7C7CC',
    marginVertical: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  dot: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#007AFF',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
  },
});