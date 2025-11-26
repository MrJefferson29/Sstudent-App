import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BOOKS = {
"1": {
title: "Engineering Mathematics",
author: "K. A. Stroud",
category: "Mathematics",
thumbnail: "[https://i.ibb.co/3B5pFjW/book1.png](https://i.ibb.co/3B5pFjW/book1.png)",
pdf: "[https://example.com/math.pdf](https://example.com/math.pdf)",
},
"2": {
title: "Data Structures & Algorithms",
author: "Norris W.",
category: "Computer Science",
thumbnail: "[https://i.ibb.co/4Tg3bxT/book2.png](https://i.ibb.co/4Tg3bxT/book2.png)",
pdf: "[https://example.com/dsa.pdf](https://example.com/dsa.pdf)",
},
"3": {
title: "Physics for Scientists",
author: "Serway",
category: "Physics",
thumbnail: "[https://i.ibb.co/h2qYZ7F/book3.png](https://i.ibb.co/h2qYZ7F/book3.png)",
pdf: "[https://example.com/physics.pdf](https://example.com/physics.pdf)",
},
};

export default function BookDetail() {
const { id } = useLocalSearchParams();
const router = useRouter();

const book = BOOKS[id];

if (!book) return <Text style={{ padding: 20 }}>Book not found</Text>;

return ( <ScrollView style={styles.container}>
<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}> <Ionicons name="arrow-back" size={24} color="#333" /> </TouchableOpacity>

```
  <Image source={{ uri: book.thumbnail }} style={styles.cover} />

  <Text style={styles.title}>{book.title}</Text>
  <Text style={styles.author}>{book.author}</Text>

  <Text style={styles.category}>{book.category}</Text>

  <Text style={styles.sectionHeader}>Description</Text>
  <Text style={styles.description}>
    This is one of the most widely used textbooks in {book.category}.  
    It provides detailed explanations, examples, exercises and advanced concepts.
  </Text>

  <Text style={styles.sectionHeader}>Actions</Text>

  {/* Open PDF */}
  <TouchableOpacity
    style={styles.openBtn}
    onPress={() => router.push(book.pdf)}
  >
    <Ionicons name="document-text" size={20} color="#fff" />
    <Text style={styles.openBtnText}>Open PDF</Text>
  </TouchableOpacity>

  {/* Go Back */}
  <TouchableOpacity
    style={[styles.openBtn, { backgroundColor: "#7f8c8d", marginTop: 8 }]}
    onPress={() => router.back()}
  >
    <Ionicons name="arrow-back-circle" size={20} color="#fff" />
    <Text style={styles.openBtnText}>Go Back</Text>
  </TouchableOpacity>
</ScrollView>

);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: "#f7f9fc", padding: 20 },
backBtn: {
marginBottom: 15,
padding: 5,
width: 40,
},
cover: {
width: "100%",
height: 250,
borderRadius: 12,
marginBottom: 15,
},
title: { fontSize: 24, fontWeight: "700", color: "#2c3e50" },
author: { fontSize: 16, color: "#555", marginTop: 5 },
category: {
backgroundColor: "#e8f3ff",
alignSelf: "flex-start",
paddingHorizontal: 10,
paddingVertical: 5,
borderRadius: 8,
color: "#3498DB",
fontWeight: "600",
marginTop: 10,
},
sectionHeader: {
marginTop: 25,
fontSize: 18,
fontWeight: "700",
color: "#2c3e50",
},
description: {
marginTop: 8,
fontSize: 15,
color: "#555",
lineHeight: 22,
},
openBtn: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#3498DB",
paddingVertical: 12,
borderRadius: 10,
marginTop: 12,
justifyContent: "center",
},
openBtnText: {
color: "#fff",
fontSize: 16,
fontWeight: "700",
marginLeft: 8,
},
});
