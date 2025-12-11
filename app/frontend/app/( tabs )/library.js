import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { libraryAPI, resolveAssetUrl } from "../utils/api";
import { useOptimizedFetch } from "../utils/useOptimizedFetch";

export default function LibraryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // -- Fetch books from backend (defensive: default to empty array) --
  const {
    data: rawData,
    isLoading,
    refreshing,
    refresh,
    error,
  } = useOptimizedFetch(
    async (signal) => {
      const filters = {};
      if (category !== "All") filters.category = category;
      if (search.trim()) filters.query = search.trim();

      const resp = await libraryAPI.getAll(filters, signal);
      return resp.success ? resp.data : [];
    },
    [category, search],
    { cacheDuration: 10 * 60 * 1000 }
  );

  // Ensure books is always an array (guards against null)
  const books = Array.isArray(rawData) ? rawData : [];

  // -- Categories derived safely from books --
  const categories = useMemo(() => {
    const set = new Set((books || []).map((b) => b?.category || "General"));
    return ["All", ...Array.from(set).sort()];
  }, [books]);

  // -- Filter results safely --
  const results = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return (books || []).filter((b) => {
      const title = (b?.title || "").toLowerCase();
      const author = (b?.author || "").toLowerCase();
      const description = (b?.description || "").toLowerCase();

      const matchSearch =
        !q ||
        title.includes(q) ||
        author.includes(q) ||
        description.includes(q);

      const matchCategory = category === "All" || (b?.category || "General") === category;

      return matchSearch && matchCategory;
    });
  }, [books, search, category]);

  // -- Render a book card --
  const renderBook = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/library/${item._id}`)}
    >
      {item?.thumbnail?.url ? (
        <Image source={{ uri: resolveAssetUrl(item.thumbnail.url) }} style={styles.thumb} />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Ionicons name="book" size={36} color="#9AA7B2" />
        </View>
      )}

      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.title}>
          {item?.title || "Untitled"}
        </Text>

        <Text numberOfLines={1} style={styles.author}>
          {item?.author || "Unknown Author"}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.catBadge}>
            <Ionicons name="pricetag" size={12} color="#2563EB" />
            <Text style={styles.catText}>{item?.category || "General"}</Text>
          </View>

          {item?.publishedDate ? (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
              <Text style={styles.dateText}>{item.publishedDate}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#2563EB" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Library</Text>
      <Text style={styles.sub}>Discover books, articles and guides</Text>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          placeholder="Search by title, author or description..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* States: loading / error / empty / list */}
      {isLoading && books.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load books</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={64} color="#9AA7B2" />
          <Text style={styles.emptyText}>No books match your search</Text>
          <Text style={styles.emptySub}>Try a different keyword or category</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(b) => b?._id ?? Math.random().toString()}
          renderItem={renderBook}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#2563EB" />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? "book" : "books"} found
            </Text>
          }
        />
      )}
    </View>
  );
}

/* ======================= STYLES ======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },

  header: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
  },
  sub: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 14,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E6EEF6",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0F172A",
  },
  clearBtn: {
    marginLeft: 8,
  },

  chipsContainer: {
    paddingVertical: 10,
    paddingBottom: 6,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E6EEF6",
  },
  chipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#ffffff",
  },

  listContent: {
    paddingBottom: 120,
    paddingTop: 6,
  },
  resultsCount: {
    color: "#475569",
    marginBottom: 10,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6EEF6",
    marginBottom: 12,
  },
  thumb: {
    width: 72,
    height: 106,
    borderRadius: 8,
    backgroundColor: "#EDF2F7",
    marginRight: 12,
  },
  thumbPlaceholder: {
    width: 72,
    height: 106,
    borderRadius: 8,
    backgroundColor: "#EEF2F6",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  catText: {
    color: "#2563EB",
    fontSize: 12,
    marginLeft: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#94A3B8",
    fontSize: 12,
    marginLeft: 6,
  },

  center: {
    flex: 1,
    alignItems: "center",
    marginTop: 28,
  },
  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
  },
  emptySub: {
    marginTop: 6,
    color: "#6B7280",
  },
  errorText: {
    marginTop: 10,
    color: "#EF4444",
    fontSize: 16,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
});
