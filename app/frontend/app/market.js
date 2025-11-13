import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Loading from '../loading';

export default function MarketScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [filteredItems, setFilteredItems] = useState([]); 

  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const cachedItems = await AsyncStorage.getItem('shopItems');
        if (cachedItems) {
          const parsedItems = JSON.parse(cachedItems);
          setItems(parsedItems);
          setFilteredItems(parsedItems);
          setLoading(false);
        }

        const response = await axios.get('https://ficedu.onrender.com/shop/get-all');
        const newItems = response.data.data;
        setItems(newItems);
        setFilteredItems(newItems);
        await AsyncStorage.setItem('shopItems', JSON.stringify(newItems));
      } catch (err) {
        setError('Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Updated search function that filters items based solely on the query.
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#575757" />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  const handleAddItem = async () => {
    router.push({
      pathname: '/addItem',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Place</Text>
        <Text style={styles.subtitle}>Buy and sell items</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#AAA" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search"
            placeholderTextColor="#AAA"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>
      <View style={styles.filter}>
        <TouchableOpacity style={styles.addItem} onPress={handleAddItem}>
          <Ionicons name="add-sharp" size={20} color={'white'} />
          <Text style={{ color: 'white' }}> Add Item </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/itemDetail/${item._id}`)}
            >
              <Image
                source={{ uri: item.images[0] }}
                style={styles.image}
              />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>XAF {item.price}</Text>
              <View style={styles.icon}>
                <Ionicons name="heart-outline" size={20} color="lightblue" />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#4A4A4A',
    width: '100%',
    height: 200,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    color: '#D8C9AE',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#D8C9AE',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#4A4A4A',
  },
  content: {
    flex: 1,
  },
  filter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  addItem: {
    fontSize: 14,
    fontWeight: '500',
    flexDirection: 'row',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
  },
  card: {
    backgroundColor: '#FFF',
    width: '47%',
    height: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    justifyContent: 'space-between',
    padding: 10,
    marginTop: 15,
    marginHorizontal: 5,
  },
  image: {
    width: '100%',
    height: '60%',
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
    paddingHorizontal: 5,
  },
  price: {
    fontSize: 15,
    fontWeight: '300',
    color: 'black',
    paddingHorizontal: 5,
  },
  icon: {
    height: 40,
    padding: 10,
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// export default Shop;