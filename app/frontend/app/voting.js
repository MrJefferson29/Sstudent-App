import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { contestsAPI, votesAPI, API_URL } from "./utils/api";
import { LinearGradient } from "expo-linear-gradient";

export default function VotingScreen() {
  const [contests, setContests] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [currentContest, setCurrentContest] = useState(null);
  const [offlineDemo, setOfflineDemo] = useState(false);
  const [localVotes, setLocalVotes] = useState({});

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await contestsAPI.getAll();
      if (response.success) {
        setContests(response.data);
        const activeContest = response.data.find((c) => c.isActive);
        if (activeContest) {
          setCurrentContest(activeContest);
          fetchContestants(activeContest._id);
        }
      }
    } catch (error) {
      console.warn("Error fetching contests:", error);
      setOfflineDemo(true);
      const demoContests = [
        { _id: "demo-mr", name: "Mr. University of Bamenda", description: "Vote for the most outstanding male student", isActive: true },
        { _id: "demo-miss", name: "Miss University of Bamenda", description: "Vote for the most outstanding female student", isActive: true },
        { _id: "demo-style", name: "Best Dressed Student", description: "Vote for the best dressed student on campus", isActive: true },
        { _id: "demo-talent", name: "Most Talented Student", description: "Vote for the most talented student", isActive: true },
      ];
      setContests(demoContests);
      setCurrentContest(demoContests[0]);
      setContestants([
        { _id: "demo-c1", name: "John Doe", bio: "Computer Science student, passionate about technology", voteCount: 0 },
        { _id: "demo-c2", name: "Michael Smith", bio: "Engineering student with leadership qualities", voteCount: 0 },
        { _id: "demo-c3", name: "David Johnson", bio: "Business Administration student, entrepreneur at heart", voteCount: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleContestChange = (contest) => {
    setCurrentContest(contest);
    fetchContestants(contest._id);
  };

  const fetchContestants = async (contestId) => {
    try {
      if (offlineDemo) {
        const demoMap = {
          "demo-mr": [
            { _id: "demo-c1", name: "John Doe", bio: "Computer Science student", voteCount: 0 },
            { _id: "demo-c2", name: "Michael Smith", bio: "Engineering student", voteCount: 0 },
            { _id: "demo-c3", name: "David Johnson", bio: "Business Administration student", voteCount: 0 },
          ],
        };
        setContestants(demoMap[contestId] || []);
        return;
      }
      const response = await contestsAPI.getContestants(contestId);
      if (response.success) {
        setContestants(response.data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load contestants");
    }
  };

  const handleVote = async (contestant) => {
    if (!currentContest) return;
    try {
      if (offlineDemo) {
        if (localVotes[currentContest._id]) {
          Alert.alert("Already Voted", "You have already voted in this contest (demo)");
          return;
        }
        setLocalVotes((prev) => ({ ...prev, [currentContest._id]: contestant._id }));
        setContestants((prev) =>
          prev.map((c) =>
            c._id === contestant._id ? { ...c, voteCount: (c.voteCount || 0) + 1 } : c
          )
        );
        Alert.alert("Vote Submitted ✅", `You voted for ${contestant.name}`);
        return;
      }

      setVoting(true);
      const response = await votesAPI.castVote(currentContest._id, contestant._id);
      if (response.success) {
        Alert.alert("Vote Submitted ✅", `You voted for ${contestant.name}`);
        fetchContestants(currentContest._id);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={["#2563EB", "#1E3A8A"]} style={styles.header}>
        <Text style={styles.headerTitle}>Campus Voting</Text>
        <Text style={styles.headerSubtitle}>Cast your vote for top students</Text>
      </LinearGradient>

      {/* Contest Toggle Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toggleBar}>
        {contests.map((contest) => (
          <TouchableOpacity
            key={contest._id}
            style={[
              styles.contestChip,
              currentContest?._id === contest._id && styles.activeChip,
            ]}
            onPress={() => handleContestChange(contest)}
          >
            <Text
              style={[
                styles.chipText,
                currentContest?._id === contest._id && styles.activeChipText,
              ]}
            >
              {contest.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contestants */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 60 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>{currentContest?.name}</Text>
            <Text style={styles.sectionSubtitle}>{currentContest?.description}</Text>
            {contestants.map((c) => (
              <View key={c._id} style={styles.card}>
                <Image
                  source={{
                    uri:
                      c.image ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.image}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.bio}>{c.bio}</Text>
                  <Text style={styles.voteCount}>{c.voteCount || 0} votes</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    (voting || (offlineDemo && localVotes[currentContest?._id])) &&
                      styles.disabledButton,
                  ]}
                  onPress={() => handleVote(c)}
                  disabled={voting || (offlineDemo && localVotes[currentContest?._id])}
                >
                  <Text style={styles.voteText}>
                    {offlineDemo && localVotes[currentContest?._id] === c._id
                      ? "VOTED"
                      : "VOTE"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#E0E7FF",
    fontSize: 13,
    marginTop: 4,
  },
  toggleBar: {
    flexGrow: 0,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  contestChip: {
    paddingVertical: 11,
    height: 40,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 17,
  },
  activeChip: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  activeChipText: { color: "#fff" },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: 70, height: 70, borderRadius: 10, marginRight: 15 },
  name: { fontSize: 16, fontWeight: "600", color: "#111827" },
  bio: { fontSize: 13, color: "#6B7280", marginVertical: 2 },
  voteCount: { fontSize: 12, color: "#2563EB", fontWeight: "600" },
  voteButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  voteText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  disabledButton: { opacity: 0.6 },
});
