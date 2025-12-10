import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { libraryAPI } from "../utils/api";
import { useOptimizedFetch } from "../utils/useOptimizedFetch";
import { resolveAssetUrl } from "../utils/api";

export default function LibraryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Fetch books from backend
  const { data: booksData, isLoading, error, refreshing, refresh } = useOptimizedFetch(
    async (signal) => {
      const filters = {};
      if (selectedCategory !== "All") {
        filters.category = selectedCategory;
      }
      if (search.trim()) {
        filters.query = search.trim();
      }
      const response = await libraryAPI.getAll(filters, signal);
      return response.success ? response.data : [];
    },
    [selectedCategory, search],
    { cacheDuration: 10 * 60 * 1000 } // 10 minutes cache
  );

  const books = booksData || [];

  // Extract unique categories from books
  const categories = useMemo(() => {
    const cats = new Set(books.map((book) => book.category || "General"));
    return ["All", ...Array.from(cats).sort()];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchCategory = selectedCategory === "All" || (book.category || "General") === selectedCategory;
      const matchSearch =
        !search.trim() ||
        book.title?.toLowerCase().includes(search.toLowerCase()) ||
        book.author?.toLowerCase().includes(search.toLowerCase()) ||
        book.description?.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [books, selectedCategory, search]);

  const renderBookCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/library/${item._id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        {item.thumbnail?.url ? (
          <Image source={{ uri: resolveAssetUrl(item.thumbnail.url) }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="book" size={32} color="#94A3B8" />
          </View>
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author || "Unknown Author"}</Text>
        <View style={styles.metaRow}>
          <View style={styles.categoryLabel}>
            <Text style={styles.categoryText}>{item.category || "General"}</Text>
          </View>
          {item.publishedDate && (
            <Text style={styles.publishedDate}>{item.publishedDate}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#64748B" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Digital Library</Text>
        <Text style={styles.subheader}>Explore our collection of books</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Search books by title, author..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryRowContent}
      >
        {categories.map((cat) => {
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
      {isLoading && !books.length ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : error && !books.length ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load books</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="library-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyText}>No books found</Text>
          <Text style={styles.emptySubtext}>
            {search.trim() || selectedCategory !== "All"
              ? "Try adjusting your search or filters"
              : "Check back later for new books"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item._id}
          renderItem={renderBookCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#3498DB" />
          }
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"} found
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  searchRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
    color: "#1E293B",
  },
  clearButton: {
    padding: 4,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryRowContent: {
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: "#3498DB",
  },
  chipInactive: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  chipText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 120,
  },
  resultsCount: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
    fontWeight: "500",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailContainer: {
    marginRight: 16,
  },
  thumbnail: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    lineHeight: 24,
  },
  bookAuthor: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryLabel: {
    backgroundColor: "#ECF5FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: "#3498DB",
    fontWeight: "600",
    fontSize: 12,
  },
  publishedDate: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#EF4444",
    fontWeight: "600",
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#3498DB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    color: "#1E293B",
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
