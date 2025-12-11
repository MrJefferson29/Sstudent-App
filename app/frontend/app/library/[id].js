import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { libraryAPI, resolveAssetUrl } from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BookDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = `book_${id}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        setBook(cachedData);
        setLoading(false);
      }

      const response = await libraryAPI.getById(id);
      if (response.success && response.data) {
        setBook(response.data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      } else {
        throw new Error("Book not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load book");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPDF = () => {
    if (!book?.pdfUrl) return;
    router.push({
      pathname: "/pdf-viewer",
      params: { pdfUrl: book.pdfUrl, title: book.title },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={fetchBookDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Book Details</Text>

        <View style={styles.headerIcon} />
      </View>

      {/* BOOK COVER */}
      <View style={styles.coverWrapper}>
        <View style={styles.coverCard}>
          {book.thumbnail?.url ? (
            <Image
              source={{ uri: resolveAssetUrl(book.thumbnail.url) }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book" size={70} color="#A7B1C5" />
            </View>
          )}
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.contentSection}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>By {book.author || "Unknown Author"}</Text>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="pricetag-outline" size={14} color="#3498DB" />
            <Text style={styles.tagText}>{book.category || "General"}</Text>
          </View>

          {book.publishedDate && (
            <View style={styles.tagLight}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={styles.tagLightText}>{book.publishedDate}</Text>
            </View>
          )}
        </View>

        {book.description && (
          <View style={styles.descriptionBlock}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{book.description}</Text>
          </View>
        )}

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleOpenPDF}>
            <Ionicons name="document-text-outline" size={22} color="#fff" />
            <Text style={styles.btnPrimaryText}>Read PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#64748B" />
            <Text style={styles.btnSecondaryText}>Back to Library</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

/* ======================= STYLES ========================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 55 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EAF1",
    elevation: 2,
  },
  headerIcon: {
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },

  /* COVER */
  coverWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
  coverCard: {
    width: '100%',
    height: 330,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  coverImage: {
    width: "100%",
    height: "100%",
    borderRadius: 1,
  },
  coverPlaceholder: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#E8EDF4",
    justifyContent: "center",
    alignItems: "center",
  },

  /* CONTENT */
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  bookTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  bookAuthor: {
    fontSize: 18,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 20,
  },

  /* TAGS */
  tagRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECF5FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    color: "#3498DB",
    fontSize: 14,
    fontWeight: "600",
  },
  tagLight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagLightText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },

  /* DESCRIPTION */
  descriptionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },

  /* ACTION BUTTONS */
  actionRow: {
    gap: 14,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498DB",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    elevation: 4,
    shadowColor: "#3498DB",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnPrimaryText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  btnSecondaryText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },

  /* STATES */
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    color: "#EF4444",
    marginVertical: 20,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#3498DB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  backButton: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
  },
});
