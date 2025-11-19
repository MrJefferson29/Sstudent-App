// LevelSelect.js
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

export default function LevelSelect() {
  const { schoolId, schoolName, departmentId, departmentName } = useLocalSearchParams();
  const router = useRouter();

  // Example levels
  const levels = ["Level 100", "Level 200", "Level 300", "Level 400"];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Level</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Choose your level in {departmentName || "Department"}, {schoolName || "School"}
      </Text>

      {/* Level Options */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
        {levels.map((level, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/subject-select",
                params: {
                  schoolId,
                  schoolName,
                  departmentId,
                  departmentName,
                  level,
                },
              })
            }
          >
            <Ionicons name="layers-outline" size={24} color="#2563EB" />
            <Text style={styles.cardText}>{level}</Text>
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
    backgroundColor: "#F1F5F9",
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
