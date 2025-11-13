// SubjectSelect.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function SubjectSelect() {
  const { school, dept, level } = useLocalSearchParams();
  const router = useRouter();

  // Example subjects (replace with real data or fetch from API)
  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
    "History",
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Subject</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Choose your subject in {level}, {dept}
      </Text>

      {/* Subjects */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
        {subjects.map((subject, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/questions",
                params: { school, dept, level, subject },
              })
            }
          >
            <Ionicons name="book-outline" size={24} color="#16A34A" />
            <Text style={styles.cardText}>{subject}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  subtitle: {
    marginTop: 15,
    fontSize: 16,
    color: "#555",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
  },
});
