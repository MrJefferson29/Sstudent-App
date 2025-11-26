import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BOOKS = [
  {
    id: "1",
    title: "Engineering Mathematics",
    author: "K. A. Stroud",
    category: "Mathematics",
    thumbnail: "https://i.ibb.co/3B5pFjW/book1.png",
  },
  {
    id: "2",
    title: "Data Structures & Algorithms",
    author: "Norris W.",
    category: "Computer Science",
    thumbnail: "https://i.ibb.co/4Tg3bxT/book2.png",
  },
  {
    id: "3",
    title: "Physics for Scientists",
    author: "Serway",
    category: "Physics",
    thumbnail: "https://i.ibb.co/h2qYZ7F/book3.png",
  },
];

const CATEGORIES = ["All", "Mathematics", "Computer Science", "Physics"];

export default function LibraryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredBooks = BOOKS.filter((book) => {
    const matchCategory = selectedCategory === "All" || book.category === selectedCategory;
    const matchSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Library</Text>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#777" />
        <TextInput
          placeholder="Search books..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close" size={20} color="#777" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, active ? styles.chipActive : styles.chipInactive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={active ? styles.chipTextActive : styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Books List */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No books found matching your criteria.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/library/${item.id}`)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookAuthor}>{item.author}</Text>
              <Text style={styles.categoryLabel}>{item.category}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#333" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc", paddingHorizontal: 15, paddingTop: 10 },
  header: { fontSize: 28, fontWeight: "700", marginTop: 20, marginBottom: 15, color: "#2c3e50" },
  searchRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: { marginLeft: 6, fontSize: 16, flex: 1, color: "#333" },
  categoryRow: { marginVertical: 15 },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: "#3498DB",
  },
  chipInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  chipText: { color: "#555", fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderColor: "#e6e6e6",
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: 6,
    marginRight: 15,
  },
  bookTitle: { fontSize: 17, fontWeight: "700", color: "#2c3e50" },
  bookAuthor: { color: "#777", marginTop: 2, fontSize: 14 },
  categoryLabel: {
    backgroundColor: "#ecf5ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 6,
    color: "#3498DB",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#777', marginTop: 50 },
});